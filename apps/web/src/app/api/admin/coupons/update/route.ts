/**
 * POST /api/admin/coupons/update
 * Body: { id, is_active?, ... }
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

const ALLOWED_PATCH_KEYS = [
  "is_active",
  "description",
  "valid_from",
  "valid_until",
  "max_uses",
  "max_uses_per_user",
  "min_order_try",
];

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
  const callerRow = caller as { id?: string; is_admin?: boolean } | null;
  if (!callerRow?.is_admin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz JSON" }, { status: 400 });
  }

  const id = body.id as string;
  if (!id) {
    return NextResponse.json({ ok: false, error: "id gerekli" }, { status: 400 });
  }

  // Whitelist patch keys
  const patch: Record<string, unknown> = {};
  for (const key of ALLOWED_PATCH_KEYS) {
    if (key in body) patch[key] = body[key];
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, error: "Değişiklik yok" }, { status: 400 });
  }

  const service = createSupabaseServiceClient();
  const { error } = await service.from("coupons").update(patch).eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
