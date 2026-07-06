/**
 * POST /api/admin/business-leads/update
 * Body: { leadId, patch }
 *
 * Admin B2B lead güncelleme — status + admin_note whitelist.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

const ALLOWED_FIELDS = new Set(["status", "admin_note"]);
const ALLOWED_STATUSES = new Set(["new", "contacted", "quoted", "converted", "lost"]);

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

  let payload: { leadId?: string; patch?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz JSON" }, { status: 400 });
  }

  const { leadId, patch } = payload;
  if (!leadId || !patch) {
    return NextResponse.json({ ok: false, error: "leadId + patch gerekli" }, { status: 400 });
  }

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

  const service = createSupabaseServiceClient();
  const { error } = await service.from("business_leads").update(clean as never).eq("id", leadId);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
