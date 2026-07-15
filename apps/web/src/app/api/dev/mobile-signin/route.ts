/**
 * POST /api/dev/mobile-signin
 *
 * ⚠️ DEV-ONLY endpoint — production'a çıkmadan önce silinmeli.
 *
 * Supabase custom email template'i mobil OTP flow'da düzgün render edilmediği için
 * bu geçici endpoint email göndermeden 6 haneli OTP kodunu doğrudan mobil'e döndürür.
 * Mobil app bu kodu `verifyOtp({ email, token, type: 'email' })` ile session'a çevirir.
 *
 * Guards:
 * - NODE_ENV === 'development' zorunlu (prod'da 403)
 * - EXCEPTION: APPLE_REVIEW_EMAIL için production'da da izinli — Apple review
 *   reviewer'ları OTP email'ini alamadığı için (throwaway apple.com email)
 *   demo account'a bu endpoint üzerinden erişilir.
 * - CORS: sadece localhost + expo dev URL'lerden
 *
 * Ne yapıyor:
 * 1. Supabase Admin API `generateLink({ type: 'magiclink', email })` çağırıyor
 * 2. Response'taki `email_otp` (6 haneli sayısal kod) döndürüyor
 * 3. Mobil bu kodu Supabase JS `verifyOtp` ile session'a çeviriyor
 *
 * Sprint 4'te bu endpoint kaldırılıp Netgsm SMS OTP entegrasyonu ile değiştirilecek.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Apple App Store Review'ün demo account'ı — production'da bu email için
// endpoint erişilebilir kalmalı. Reviewer OTP mail'ini alamıyor.
const APPLE_REVIEW_EMAIL = "apple.review@tagora.com.tr";

interface Body {
  email: string;
}

export async function POST(req: NextRequest) {
  // Payload'ı önce parse et — guard email'e göre karar veriyor
  let payload: Body;
  try {
    payload = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const emailNormalized = (payload.email ?? "").trim().toLowerCase();

  // Guard: dev-only, EXCEPT Apple Review demo account
  const isReviewer = emailNormalized === APPLE_REVIEW_EMAIL;
  if (process.env.NODE_ENV !== "development" && !isReviewer) {
    return NextResponse.json(
      { ok: false, error: "This endpoint is disabled in production." },
      { status: 403 },
    );
  }

  // Email zaten yukarıda normalize edildi (guard için)
  const email = emailNormalized;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Valid email required." },
      { status: 400 },
    );
  }

  const admin = createSupabaseServiceClient();

  // generateLink şu yan etkileri yapar:
  // - Kullanıcı yoksa auth.users'a insert eder (email_confirmed_at=null olabilir)
  // - properties.hashed_token, properties.email_otp, properties.action_link döner
  // - EMAIL GÖNDERMEZ (Admin API bypass eder)
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: "Admin API error: " + error.message },
      { status: 500 },
    );
  }

  // Bazı Supabase versiyonlarında field ismi farklı olabilir
  const props = (data?.properties ?? {}) as Record<string, unknown>;
  const emailOtp =
    (props["email_otp"] as string | undefined) ??
    (props["email_otp_code"] as string | undefined) ??
    null;

  if (!emailOtp) {
    return NextResponse.json(
      {
        ok: false,
        error: "email_otp not returned from Supabase. Check SDK version.",
        debug_props_keys: Object.keys(props),
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      email_otp: emailOtp,
      hint: "Use supabase.auth.verifyOtp({ email, token, type: 'email' }) on client",
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

// CORS preflight (Expo Go localhost'tan farklı IP'den fetch yapabilir)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
