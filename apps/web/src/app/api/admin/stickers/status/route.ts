/**
 * POST /api/admin/stickers/status
 * Body: { stickerId, status }
 *
 * Sticker status'unu değiştirir (recall, block, retire, active vb).
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

const ALLOWED_STATUSES = new Set([
  "manufactured",
  "shipped",
  "delivered",
  "claimed",
  "active",
  "blocked",
  "retired",
  "recall",
]);

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: caller } = await supabase
    .from("users")
    .select("is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!(caller as { is_admin?: boolean } | null)?.is_admin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  let payload: { stickerId?: string; status?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz JSON" }, { status: 400 });
  }

  const { stickerId, status } = payload;
  if (!stickerId || !status) {
    return NextResponse.json({ ok: false, error: "stickerId ve status gerekli" }, { status: 400 });
  }
  if (!ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ ok: false, error: "Geçersiz status" }, { status: 400 });
  }

  const service = createSupabaseServiceClient();
  const patch: Record<string, unknown> = { status };
  if (status === "blocked") patch.blocked_at = new Date().toISOString();

  const { error } = await service.from("stickers").update(patch).eq("id", stickerId);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
