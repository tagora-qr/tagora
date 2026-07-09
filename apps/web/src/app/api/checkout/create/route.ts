/**
 * POST /api/checkout/create
 *
 * 1) Kullanıcı authenticated mi kontrol et
 * 2) Paket geçerli mi, aktif mi bul
 * 3) Order kaydı oluştur (status=pending)
 * 4) iyzico Checkout Form Initialize çağır
 * 5) paymentPageUrl'i client'a döndür — client redirect eder
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { createCheckoutForm } from "@/lib/iyzico";
import type { StickerPackage } from "@tagora/db";

const SHIPPING_TRY = 15;

interface DesignAllocation {
  design_id: string;
  quantity: number;
}

interface RequestBody {
  package_slug: string;
  package_id: string;
  allocations: DesignAllocation[];
  coupon_code: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_identity_number: string | null;
  shipping_address: string;
  shipping_city: string;
  shipping_district: string | null;
  shipping_zip: string | null;
  customer_note: string | null;
}

export async function POST(req: NextRequest) {
  // 1) Auth
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Giriş yapmalısın" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
  }

  // 2) Paket
  const service = createSupabaseServiceClient();
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

  // 2b) Karma tasarım dağılımı — validate + stok kontrolü
  const allocations = Array.isArray(body.allocations) ? body.allocations : [];
  if (allocations.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Tasarım seçilmedi" },
      { status: 400 },
    );
  }

  // Her allocation için: geçerli quantity, unique design_id
  const seenDesigns = new Set<string>();
  let totalRequested = 0;
  for (const a of allocations) {
    if (!a.design_id || typeof a.quantity !== "number" || a.quantity < 1) {
      return NextResponse.json(
        { ok: false, error: "Geçersiz tasarım dağılımı" },
        { status: 400 },
      );
    }
    if (seenDesigns.has(a.design_id)) {
      return NextResponse.json(
        { ok: false, error: "Aynı tasarım birden fazla kez gönderildi" },
        { status: 400 },
      );
    }
    seenDesigns.add(a.design_id);
    totalRequested += a.quantity;
  }

  // Toplam paket boyutuna eşit mi?
  if (totalRequested !== pkg.sticker_count) {
    return NextResponse.json(
      {
        ok: false,
        error: `Tasarım dağılımı toplamı hatalı: ${totalRequested} seçildi, ${pkg.sticker_count} olmalı`,
      },
      { status: 400 },
    );
  }

  // Design'ları çek (adı + aktifliği için)
  const { data: designsRaw } = await service
    .from("sticker_designs")
    .select("id, slug, name, is_active")
    .in("id", allocations.map((a) => a.design_id));
  const designs = (designsRaw ?? []) as Array<{
    id: string;
    slug: string;
    name: string;
    is_active: boolean;
  }>;

  // Tüm design'lar bulundu ve aktif mi?
  if (designs.length !== allocations.length) {
    return NextResponse.json(
      { ok: false, error: "Bazı tasarımlar bulunamadı" },
      { status: 400 },
    );
  }
  const inactive = designs.find((d) => !d.is_active);
  if (inactive) {
    return NextResponse.json(
      { ok: false, error: `"${inactive.name}" tasarımı artık mevcut değil` },
      { status: 400 },
    );
  }

  // Her design için stok kontrolü
  for (const a of allocations) {
    const design = designs.find((d) => d.id === a.design_id)!;
    const { count: available, error: stockErr } = await service
      .from("stickers")
      .select("id", { count: "exact", head: true })
      .eq("design_id", a.design_id)
      .eq("status", "manufactured")
      .is("owner_id", null);

    if (stockErr) {
      return NextResponse.json(
        { ok: false, error: "Stok sorgusu başarısız: " + stockErr.message },
        { status: 500 },
      );
    }

    if ((available ?? 0) < a.quantity) {
      return NextResponse.json(
        {
          ok: false,
          error: `"${design.name}" tasarımında yeterli stok yok (${available ?? 0} kaldı, ${a.quantity} gerekli).`,
        },
        { status: 409 },
      );
    }
  }

  // 3) Basic validation
  const name = body.buyer_name?.trim();
  const email = body.buyer_email?.trim();
  const phone = body.buyer_phone?.trim();
  const address = body.shipping_address?.trim();
  const city = body.shipping_city?.trim();
  if (!name || !email || !phone || !address || !city) {
    return NextResponse.json({ ok: false, error: "Zorunlu alanlar eksik" }, { status: 400 });
  }

  // 4) tagora user id
  const { data: profile } = await service
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  const tagoraUserId = (profile as { id?: string } | null)?.id;
  if (!tagoraUserId) {
    return NextResponse.json({ ok: false, error: "Profil yok" }, { status: 500 });
  }

  // 5) Kupon (opsiyonel) — validate + discount hesap
  const subtotal = Number(pkg.price_try);
  let discount = 0;
  let coupon: {
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
  } | null = null;

  const couponCodeRaw = body.coupon_code?.trim().toUpperCase();
  if (couponCodeRaw) {
    const { data: couponRaw } = await service
      .from("coupons")
      .select(
        "id, code, type, value, min_order_try, max_uses, max_uses_per_user, used_count, valid_from, valid_until, is_active",
      )
      .eq("code", couponCodeRaw)
      .maybeSingle();

    coupon = couponRaw as typeof coupon;

    if (!coupon) {
      return NextResponse.json(
        { ok: false, error: "Kupon bulunamadı" },
        { status: 400 },
      );
    }
    if (!coupon.is_active) {
      return NextResponse.json(
        { ok: false, error: "Kupon aktif değil" },
        { status: 400 },
      );
    }

    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return NextResponse.json(
        { ok: false, error: "Kupon henüz geçerli değil" },
        { status: 400 },
      );
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return NextResponse.json(
        { ok: false, error: "Kuponun süresi dolmuş" },
        { status: 400 },
      );
    }
    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json(
        { ok: false, error: "Kupon kullanım limiti dolmuş" },
        { status: 400 },
      );
    }
    if (
      coupon.min_order_try !== null &&
      subtotal < Number(coupon.min_order_try)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: `Bu kupon için en az ${Number(coupon.min_order_try).toLocaleString("tr-TR")} ₺ tutarında sipariş gerekli`,
        },
        { status: 400 },
      );
    }

    // Kullanıcı başı limit
    if (coupon.max_uses_per_user !== null) {
      const { count: userUses } = await service
        .from("coupon_uses")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id)
        .eq("user_id", tagoraUserId);

      if ((userUses ?? 0) >= coupon.max_uses_per_user) {
        return NextResponse.json(
          {
            ok: false,
            error: "Bu kuponu zaten kullandın",
          },
          { status: 400 },
        );
      }
    }

    // Discount hesap
    if (coupon.type === "percentage") {
      discount = Math.round((subtotal * Number(coupon.value)) / 100 * 100) / 100;
    } else {
      // fixed
      discount = Math.min(Number(coupon.value), subtotal);
    }
    // Guarantee: discount subtotal'ı geçmesin
    if (discount > subtotal) discount = subtotal;
  }

  // 6) Order kaydı — total = subtotal + shipping - discount
  const total = Math.max(0, subtotal + SHIPPING_TRY - discount);
  const isFullDiscount = total === 0; // %100 kupon + kargo ücretsiz senaryosu

  // Kısa order no: TAG-2026-000123 (retry ile unique)
  let orderNo = generateOrderNo();
  // Karma paket olsa da orders.design_id'ye ilk tasarımı (baskın olanı) yaz.
  // Bu backward compat + genel raporlama için (admin liste bir tasarım gösterebilsin).
  const primaryDesign = allocations.reduce((a, b) => (b.quantity > a.quantity ? b : a));

  const { data: orderRaw, error: orderErr } = await service
    .from("orders")
    .insert({
      order_no: orderNo,
      user_id: tagoraUserId,
      status: isFullDiscount ? "paid" : "pending",
      subtotal_try: subtotal,
      shipping_try: SHIPPING_TRY,
      discount_try: discount,
      total_try: total,
      coupon_id: coupon?.id ?? null,
      coupon_code: coupon?.code ?? null,
      design_id: primaryDesign.design_id,
      buyer_name: name,
      buyer_email: email,
      buyer_phone: phone,
      buyer_identity_number: body.buyer_identity_number,
      shipping_address: address,
      shipping_city: city,
      shipping_district: body.shipping_district,
      shipping_zip: body.shipping_zip,
      customer_note: body.customer_note,
    })
    .select("id, order_no")
    .single();

  if (orderErr || !orderRaw) {
    return NextResponse.json(
      { ok: false, error: "Sipariş oluşturulamadı: " + (orderErr?.message ?? "unknown") },
      { status: 500 },
    );
  }

  const order = orderRaw as { id: string; order_no: string };
  orderNo = order.order_no;

  // order_items — 1 paket, quantity=1
  await service.from("order_items").insert({
    order_id: order.id,
    package_id: pkg.id,
    quantity: 1,
    unit_price_try: pkg.price_try,
    line_total_try: pkg.price_try,
    package_name: pkg.name_tr,
    package_slug: pkg.slug,
    sticker_count: pkg.sticker_count,
  });

  // order_design_allocations — karma tasarım dağılımı
  const allocationRows = allocations.map((a) => ({
    order_id: order.id,
    design_id: a.design_id,
    quantity: a.quantity,
  }));
  const { error: allocErr } = await service
    .from("order_design_allocations")
    .insert(allocationRows);
  if (allocErr) {
    // Fatal değil, sadece log — order yine de kaydedildi.
    console.error("[checkout] order_design_allocations insert hatası:", allocErr.message);
  }

  // Coupon kullanım kaydı (varsa)
  if (coupon) {
    const { error: couponUseErr } = await service.from("coupon_uses").insert({
      coupon_id: coupon.id,
      order_id: order.id,
      user_id: tagoraUserId,
      discount_try: discount,
    });
    if (couponUseErr) {
      console.error("[checkout] coupon_uses insert hatası:", couponUseErr.message);
    }
  }

  // 6a) Full discount senaryosu (total=0): iyzico'yu skip et, sipariş zaten "paid"
  if (isFullDiscount) {
    // paid_at set et — audit için
    await service
      .from("orders")
      .update({ paid_at: new Date().toISOString() })
      .eq("id", order.id);

    return NextResponse.json({
      ok: true,
      order_no: orderNo,
      // Client bunu görünce "ödeme yapıldı" sayfasına yönlendirir
      payment_page_url: `/dashboard/orders/${orderNo}?free=1`,
      free: true,
    });
  }

  // 6b) iyzico Checkout Form Initialize (normal ödemeli sipariş)
  const origin = new URL(req.url).origin;
  const [firstName, ...rest] = name.split(" ");
  const surname = rest.length > 0 ? rest.join(" ") : firstName;
  const conversationId = order.id;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1";

  try {
    const iyzicoResult = await createCheckoutForm({
      price: subtotal.toFixed(2),
      paidPrice: total.toFixed(2),
      currency: "TRY",
      basketId: order.id,
      conversationId,
      callbackUrl: `${origin}/api/checkout/callback`,
      buyer: {
        id: tagoraUserId,
        name: firstName ?? name,
        surname,
        email,
        identityNumber: body.buyer_identity_number || "11111111111",
        registrationAddress: address,
        ip,
        city,
        country: "Turkey",
        gsmNumber: phone,
        zipCode: body.shipping_zip ?? undefined,
      },
      shippingAddress: {
        contactName: name,
        city,
        country: "Turkey",
        address,
        zipCode: body.shipping_zip ?? undefined,
      },
      billingAddress: {
        contactName: name,
        city,
        country: "Turkey",
        address,
        zipCode: body.shipping_zip ?? undefined,
      },
      basketItems: [
        {
          id: pkg.id,
          name: pkg.name_tr,
          category1: "Sticker",
          itemType: "PHYSICAL",
          price: subtotal.toFixed(2),
        },
      ],
    });

    if (iyzicoResult.status !== "success" || !iyzicoResult.paymentPageUrl) {
      // Order'ı failed olarak işaretle
      await service
        .from("orders")
        .update({
          status: "failed",
          iyzico_raw_response: iyzicoResult as unknown,
        })
        .eq("id", order.id);
      return NextResponse.json(
        {
          ok: false,
          error: iyzicoResult.errorMessage ?? "iyzico başlatılamadı",
        },
        { status: 500 },
      );
    }

    // iyzico token'ı order'a yaz
    await service
      .from("orders")
      .update({
        iyzico_token: iyzicoResult.token,
        iyzico_conversation_id: conversationId,
      })
      .eq("id", order.id);

    return NextResponse.json({
      ok: true,
      order_no: orderNo,
      payment_page_url: iyzicoResult.paymentPageUrl,
    });
  } catch (e) {
    await service
      .from("orders")
      .update({ status: "failed" })
      .eq("id", order.id);
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}

function generateOrderNo() {
  const year = new Date().getFullYear();
  const rnd = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  return `TAG-${year}-${rnd}`;
}
