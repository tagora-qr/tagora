/**
 * POST /api/mobile/handoff
 *
 * Mobil session'ı web'e taşımak için magic-link üretir.
 *
 * Akış:
 *  1. Mobil app'te kullanıcı bir web sayfasına gitmek istiyor (checkout, dashboard vs)
 *  2. Mobil'den Bearer <mobile_access_token> ile bu endpoint'e { redirect } POST'lanır
 *  3. Server tarafta service_role ile Supabase Admin `generateLink({ magiclink })` çağrılır
 *  4. Response'ta { action_link } döner
 *  5. Mobil WebBrowser bu link'i açar → user otomatik login olur → istediği yere gider
 *
 * Güvenlik:
 *  - Bearer token doğrulaması: mobile'de zaten geçerli olan Supabase access_token
 *  - Redirect path allowlist: sadece kendi origin'imize, external URL'ye izin yok
 *  - Magic link Supabase'in kendi mekanizması — kısa ömürlü + tek kullanımlık
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Sadece bu path prefix'lerine handoff izni ver — external URL'ye asla izin yok
// Not: /dashboard prefix'i tüm dashboard alt yollarını kapsar (settings, subscription vs)
const ALLOWED_REDIRECTS = [
  "/shop",
  "/dashboard",
  "/business",
  "/rehber",
  "/kullanim",
  "/privacy",
  "/kvkk",
  "/terms",
  "/cookies",
  "/",
] as const;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://tagora.com.tr";

interface Body {
  redirect?: string;
}

export async function POST(req: NextRequest) {
  // 1) Bearer token'ı çıkar + doğrula (kullanıcı zaten mobile'de authenticated)
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Bearer token gerekli" },
      { status: 401 },
    );
  }

  const service = createSupabaseServiceClient();
  const { data: userData, error: userErr } = await service.auth.getUser(token);
  if (userErr || !userData?.user?.email) {
    return NextResponse.json(
      { ok: false, error: "Geçersiz oturum" },
      { status: 401 },
    );
  }

  // 2) Body: redirect path'i al ve allowlist ile doğrula
  let payload: Body;
  try {
    payload = (await req.json()) as Body;
  } catch {
    payload = {};
  }

  const requestedPath = (payload.redirect ?? "/dashboard").trim();
  // Sadece "/" ile başlayan, "//" olmayan (protocol-relative URL değil)
  const isSafeLocal =
    requestedPath.startsWith("/") && !requestedPath.startsWith("//");
  const isAllowed =
    isSafeLocal &&
    ALLOWED_REDIRECTS.some(
      (p) => requestedPath === p || requestedPath.startsWith(p + "/") || requestedPath.startsWith(p + "?"),
    );

  const safePath = isAllowed ? requestedPath : "/dashboard";

  // 3) Magic link üret (email verified user için — genelde Supabase Auth kullanıcısı)
  const redirectTo = new URL(safePath, APP_URL).toString();

  const { data: linkData, error: linkErr } = await service.auth.admin.generateLink({
    type: "magiclink",
    email: userData.user.email,
    options: {
      redirectTo,
    },
  });

  if (linkErr || !linkData?.properties?.action_link) {
    console.error("[mobile/handoff] generateLink hatası:", linkErr?.message);
    return NextResponse.json(
      { ok: false, error: "Handoff link üretilemedi" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    action_link: linkData.properties.action_link,
    redirect_to: redirectTo,
  });
}
