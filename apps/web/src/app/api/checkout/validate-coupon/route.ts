/**
 * POST /api/checkout/validate-coupon
 *
 * Kupon kodunu apply etmeden validasyon + discount preview.
 * Frontend "Uygula" butonuna basınca bu çağrılır, discount preview edilir.
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import type { StickerPackage } from "@tagora/db";

interface Body {
  code: string;
  package_id: string;
}

export async function POST(req: NextRequest) {
  // Auth
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Giriş yapmalısın" }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
  }

  const code = body.code?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ ok: false, error: "Kod gerekli" }, { status: 400 });
  }

  const service = createSupabaseServiceClient();

  // Paketi bul (subtotal için)
  const { data: pkgRaw } = await service
    .from("sticker_packages")
    .select("*")
    .eq("id", body.package_id)
    .eq("is_active", true)
    .maybeSingle();
  if (!pkgRaw) {
    return NextResponse.json({ ok: false, error: "Paket bulunamadı" }, { status: 404 });
  }
  const pkg = pkgRaw as StickerPackage;
  const subtotal = Number(pkg.price_try);

  // tagora user id (per-user limit check için)
  const { data: profile } = await service
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  const tagoraUserId = (profile as { id?: string } | null)?.id;

  // Kupon bul
  const { data: couponRaw } = await service
    .from("coupons")
    .select(
      "id, code, type, value, min_order_try, max_uses, max_uses_per_user, used_count, valid_from, valid_until, is_active, description",
    )
    .eq("code", code)
    .maybeSingle();

  const coupon = couponRaw as {
    id: string;
    code: string;
    type: "percentage" | "fixed";
    value: number;
    min_order_try: number | null;
    max_uses: number | null;
    max_uses_per_user: number | null;
    used_count: number;
    valid_from: string | null;
    valid_until: string | null;
    is_active: boolean;
    description: string | null;
  } | null;

  if (!coupon) {
    return NextResponse.json(
      { ok: false, error: "Kupon bulunamadı" },
      { status: 404 },
    );
  }
  if (!coupon.is_active) {
    return NextResponse.json({ ok: false, error: "Kupon aktif değil" }, { status: 400 });
  }

  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return NextResponse.json({ ok: false, error: "Kupon henüz geçerli değil" }, { status: 400 });
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return NextResponse.json({ ok: false, error: "Kuponun süresi dolmuş" }, { status: 400 });
  }
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return NextResponse.json({ ok: false, error: "Kupon kullanım limiti dolmuş" }, { status: 400 });
  }
  if (coupon.min_order_try !== null && subtotal < Number(coupon.min_order_try)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Bu kupon için en az ${Number(coupon.min_order_try).toLocaleString("tr-TR")} ₺ sipariş gerekli`,
      },
      { status: 400 },
    );
  }
  if (coupon.max_uses_per_user !== null && tagoraUserId) {
    const { count: userUses } = await service
      .from("coupon_uses")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", coupon.id)
      .eq("user_id", tagoraUserId);
    if ((userUses ?? 0) >= coupon.max_uses_per_user) {
      return NextResponse.json(
        { ok: false, error: "Bu kuponu zaten kullandın" },
        { status: 400 },
      );
    }
  }

  // Discount hesap
  let discount = 0;
  if (coupon.type === "percentage") {
    discount = Math.round(((subtotal * Number(coupon.value)) / 100) * 100) / 100;
  } else {
    discount = Math.min(Number(coupon.value), subtotal);
  }
  if (discount > subtotal) discount = subtotal;

  return NextResponse.json({
    ok: true,
    coupon: {
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      description: coupon.description,
    },
    subtotal,
    discount,
  });
}
