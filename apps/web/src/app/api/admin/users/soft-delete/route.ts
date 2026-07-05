/**
 * POST /api/admin/users/soft-delete
 * Body: { userId }
 *
 * Kullanıcıyı soft-delete — deleted_at set eder, email anonimleştirir,
 * sticker'ları owner_id=null yapıp status=retired olur.
 * Sadece admin çağırabilir.
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

  // Kullanıcıyı anonimleştir
  const { error: userErr } = await service
    .from("users")
    .update({
      email: `deleted-${targetId}@deleted.tagora.com.tr`,
      phone: null,
      display_name: null,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", targetId);

  if (userErr) {
    return NextResponse.json({ ok: false, error: userErr.message }, { status: 500 });
  }

  // Sticker'ları da retire
  await service
    .from("stickers")
    .update({ owner_id: null, status: "retired", label: null })
    .eq("owner_id", targetId);

  return NextResponse.json({ ok: true });
}
