/**
 * POST /api/account/update
 *
 * Body: { display_name?, phone?, email? }
 *
 * Kullanıcı kendi hesap bilgilerini günceller.
 *  - display_name / phone → users tablosu
 *  - email → Supabase Auth updateUser (doğrulama email'i gönderir)
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface Body {
  display_name?: string;
  phone?: string;
  email?: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let payload: Body;
  try {
    payload = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz JSON" }, { status: 400 });
  }

  // Trim + normalize
  const display_name = payload.display_name?.trim() || null;
  const phone = payload.phone?.trim() || null;
  const newEmail = payload.email?.trim().toLowerCase() || null;

  // Validasyon
  if (display_name && display_name.length > 80) {
    return NextResponse.json(
      { ok: false, error: "İsim çok uzun (max 80 karakter)" },
      { status: 400 },
    );
  }
  if (phone && !/^\+?[0-9\s\-()]{7,20}$/.test(phone)) {
    return NextResponse.json(
      { ok: false, error: "Geçersiz telefon formatı" },
      { status: 400 },
    );
  }
  if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return NextResponse.json(
      { ok: false, error: "Geçersiz email" },
      { status: 400 },
    );
  }

  // 1) users tablosunu güncelle (display_name + phone)
  const service = createSupabaseServiceClient();
  const updates: Record<string, unknown> = {};
  if (display_name !== undefined) updates.display_name = display_name;
  if (phone !== undefined) updates.phone = phone;

  if (Object.keys(updates).length > 0) {
    const { error } = await service
      .from("users")
      .update(updates as never)
      .eq("auth_user_id", user.id);
    if (error) {
      console.error("[account/update] users update hatası:", error.message);
      return NextResponse.json(
        { ok: false, error: "Profil güncellenemedi" },
        { status: 500 },
      );
    }
  }

  // 2) Email değişikliği → Supabase Auth updateUser
  //    Kullanıcıya YENİ email adresine bir doğrulama link'i gönderir.
  //    Kullanıcı bu link'e tıklayana kadar email değişmez.
  let emailChangeStatus: "unchanged" | "confirmation_sent" | "failed" =
    "unchanged";
  if (newEmail && newEmail !== user.email?.toLowerCase()) {
    const { error: authErr } = await supabase.auth.updateUser({
      email: newEmail,
    });
    if (authErr) {
      console.error("[account/update] auth email update hatası:", authErr.message);
      // Email değişikliği başarısız olsa da display_name/phone başarılı olabilir
      emailChangeStatus = "failed";
      return NextResponse.json(
        { ok: false, error: authErr.message, partial: true },
        { status: 400 },
      );
    }
    emailChangeStatus = "confirmation_sent";
    // NOT: users.email'i şimdi güncellemiyoruz — kullanıcı doğrulama link'ine
    // tıklayınca Supabase Auth email'i değiştirir. auth_state_change ile
    // yakalayıp users.email'i senkronize etmek daha güvenli. Bu iş sonra.
  }

  return NextResponse.json({
    ok: true,
    email_change: emailChangeStatus,
  });
}
