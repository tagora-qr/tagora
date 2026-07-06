/**
 * POST /api/admin/users/soft-delete
 * Body: { userId }
 *
 * Kullanıcıyı soft-delete — hem public.users hem auth.users email'ini
 * anonimleştirir (deleted-{uuid}@deleted.tagora.com.tr formatı).
 * Sticker'ları owner_id=null yapıp status=retired olur.
 * Sadece admin çağırabilir.
 *
 * NEDEN AUTH.USERS EMAIL DE OBFUSCATE:
 * Eğer sadece public.users obfuscate edersek, aynı email ile yeniden
 * signup deneyen kişi auth.users'ta eski kaydı bulur ve magic link ile
 * o eski deleted user'a giriş yapabilir. Bu güvenlik açığı.
 * Auth.users email'ini de obfuscate ederek bu vektörü kapatıyoruz.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: caller } = await supabase
    .from("users")
    .select("id, is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!(caller as { is_admin?: boolean } | null)?.is_admin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const callerId = (caller as { id: string }).id;

  let payload: { userId?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz JSON" }, { status: 400 });
  }

  const targetId = payload.userId;
  if (!targetId) {
    return NextResponse.json({ ok: false, error: "userId gerekli" }, { status: 400 });
  }

  if (targetId === callerId) {
    return NextResponse.json(
      { ok: false, error: "Kendini silemezsin." },
      { status: 400 },
    );
  }

  const service = createSupabaseServiceClient();

  // 1) Hedef kullanıcının auth_user_id'sini fetch et
  const { data: target } = await service
    .from("users")
    .select("id, auth_user_id, deleted_at")
    .eq("id", targetId)
    .maybeSingle();

  const targetRow = target as {
    id?: string;
    auth_user_id?: string | null;
    deleted_at?: string | null;
  } | null;

  if (!targetRow?.id) {
    return NextResponse.json({ ok: false, error: "Kullanıcı bulunamadı" }, { status: 404 });
  }
  if (targetRow.deleted_at) {
    return NextResponse.json(
      { ok: false, error: "Kullanıcı zaten silinmiş" },
      { status: 400 },
    );
  }

  const obfuscatedEmail = `deleted-${targetId}@deleted.tagora.com.tr`;

  // 2) auth.users.email'i obfuscate et (Supabase Admin API)
  // Auth kaydı yoksa sessiz geç — sadece public.users'ta olabilir
  if (targetRow.auth_user_id) {
    const { error: authErr } = await service.auth.admin.updateUserById(
      targetRow.auth_user_id,
      {
        email: obfuscatedEmail,
        email_confirm: true, // yeni email'i onaylı işaretle (magic link tetiklemez)
        // Cache olduğunda phone, user_metadata'yı da temizle
        phone: undefined,
        user_metadata: {},
      },
    );
    if (authErr) {
      // Log ama devam et — public.users'ı yine soft-delete edelim
      console.error("[soft-delete] auth.users update failed:", authErr.message);
    }
  }

  // 3) public.users.email'i obfuscate et + deleted_at set et
  const { error: userErr } = await service
    .from("users")
    .update({
      email: obfuscatedEmail,
      phone: null,
      display_name: null,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", targetId);

  if (userErr) {
    return NextResponse.json({ ok: false, error: userErr.message }, { status: 500 });
  }

  // 4) Sticker'ları retire — owner'la bağını kopar
  await service
    .from("stickers")
    .update({ owner_id: null, status: "retired", label: null })
    .eq("owner_id", targetId);

  return NextResponse.json({ ok: true });
}
