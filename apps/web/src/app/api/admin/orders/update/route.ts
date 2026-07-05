/**
 * POST /api/admin/orders/update
 * Body: { orderId, patch: Partial<Order> }
 *
 * Admin sipariş güncelleme — status, kargo bilgisi, admin_note.
 * Whitelisted alanlar sadece.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

const ALLOWED_FIELDS = new Set([
  "status",
  "tracking_carrier",
  "tracking_number",
  "admin_note",
  "shipped_at",
  "delivered_at",
]);

const ALLOWED_STATUSES = new Set([
  "pending",
  "paid",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "failed",
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

  let payload: { orderId?: string; patch?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz JSON" }, { status: 400 });
  }

  const { orderId, patch } = payload;
  if (!orderId || !patch) {
    return NextResponse.json(
      { ok: false, error: "orderId + patch gerekli" },
      { status: 400 },
    );
  }

  // Whitelisted alanlar
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (ALLOWED_FIELDS.has(k)) clean[k] = v;
  }

  if (
    typeof clean.status === "string" &&
    !ALLOWED_STATUSES.has(clean.status as string)
  ) {
    return NextResponse.json({ ok: false, error: "Geçersiz status" }, { status: 400 });
  }

  if (Object.keys(clean).length === 0) {
    return NextResponse.json({ ok: false, error: "Değiştirilecek alan yok" }, { status: 400 });
  }

  clean.updated_at = new Date().toISOString();

  const service = createSupabaseServiceClient();
  const { error } = await service.from("orders").update(clean).eq("id", orderId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
