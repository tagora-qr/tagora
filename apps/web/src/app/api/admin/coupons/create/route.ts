/**
 * POST /api/admin/coupons/create
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

interface Body {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_order_try: number | null;
  max_uses: number | null;
  max_uses_per_user: number | null;
  valid_from: string | null;
  valid_until: string | null;
  description: string | null;
}

export async function POST(req: NextRequest) {
  // Admin check
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
  if (!callerRow?.is_admin || !callerRow.id) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz JSON" }, { status: 400 });
  }

  // Validate
  if (!body.code || body.code.length < 3) {
    return NextResponse.json(
      { ok: false, error: "Kod en az 3 karakter olmalı" },
      { status: 400 },
    );
  }
  if (!["percentage", "fixed"].includes(body.type)) {
    return NextResponse.json({ ok: false, error: "Geçersiz tür" }, { status: 400 });
  }
  if (!Number.isFinite(body.value) || body.value <= 0) {
    return NextResponse.json({ ok: false, error: "Değer pozitif olmalı" }, { status: 400 });
  }
  if (body.type === "percentage" && (body.value < 1 || body.value > 100)) {
    return NextResponse.json(
      { ok: false, error: "Yüzde değeri 1-100 arası olmalı" },
      { status: 400 },
    );
  }

  const service = createSupabaseServiceClient();
  const { data, error } = await service
    .from("coupons")
    .insert({
      code: body.code.toUpperCase().trim(),
      type: body.type,
      value: body.value,
      min_order_try: body.min_order_try,
      max_uses: body.max_uses,
      max_uses_per_user: body.max_uses_per_user ?? 1,
      valid_from: body.valid_from,
      valid_until: body.valid_until,
      description: body.description,
      is_active: true,
      created_by: callerRow.id,
    })
    .select("id, code")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { ok: false, error: `Bu kod zaten kullanımda: ${body.code.toUpperCase()}` },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, coupon: data });
}
