/**
 * POST /api/admin/users/toggle-admin
 * Body: { userId }
 *
 * Admin flag'i toggle eder. Sadece admin çağırabilir.
 * Kendi kendini admin'den çıkaramaz (safety).
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

  const callerRow = caller as { id: string; is_admin: boolean } | null;
  if (!callerRow?.is_admin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

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

  // Kendi kendini admin'den çıkaramaz — safety
  if (targetId === callerRow.id) {
    return NextResponse.json(
      { ok: false, error: "Kendi admin flag'ini kendi değiştiremezsin. Başka bir admin yapmalı." },
      { status: 400 },
    );
  }

  const service = createSupabaseServiceClient();

  // Mevcut değeri al
  const { data: target } = await service
    .from("users")
    .select("is_admin")
    .eq("id", targetId)
    .maybeSingle();

  if (!target) {
    return NextResponse.json({ ok: false, error: "Kullanıcı yok" }, { status: 404 });
  }

  const newValue = !((target as { is_admin: boolean }).is_admin);
  const { error } = await service
    .from("users")
    .update({ is_admin: newValue })
    .eq("id", targetId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, is_admin: newValue });
}
