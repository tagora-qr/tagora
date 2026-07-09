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

interface RequestBody {
  package_slug: string;
  package_id: string;
  design_id: string;
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

  // 2b) Design — geçerli mi, aktif mi, stokta yeterli var mı?
  if (!body.design_id) {
    return NextResponse.json(
      { ok: false, error: "Tasarım seçilmedi" },
      { status: 400 },
    );
  }

  const { data: designRaw } = await service
    .from("sticker_designs")
    .select("id, slug, name, is_active")
    .eq("id", body.design_id)
    .maybeSingle();

  const design = designRaw as {
    id: string;
    slug: string;
    name: string;
    is_active: boolean;
  } | null;

  if (!design || !design.is_active) {
    return NextResponse.json(
      { ok: false, error: "Seçilen tasarım artık mevcut değil" },
      { status: 400 },
    );
  }

  // Stok kontrolü: seçilen design'da yeterli manufactured + owner_id NULL sticker var mı?
  const { count: availableCount, error: stockErr } = await service
    .from("stickers")
    .select("id", { count: "exact", head: true })
    .eq("design_id", design.id)
    .eq("status", "manufactured")
    .is("owner_id", null);

  if (stockErr) {
    return NextResponse.json(
      { ok: false, error: "Stok sorgusu başarısız: " + stockErr.message },
      { status: 500 },
    );
  }

  if ((availableCount ?? 0) < pkg.sticker_count) {
    return NextResponse.json(
      {
        ok: false,
        error: `"${design.name}" tasarımında yeterli stok yok (${availableCount ?? 0} kaldı, ${pkg.sticker_count} gerekli). Lütfen başka bir tasarım seç.`,
      },
      { status: 409 },
    );
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

  // 5) Order kaydı
  const subtotal = Number(pkg.price_try);
  const total = subtotal + SHIPPING_TRY;

  // Kısa order no: TAG-2026-000123 (retry ile unique)
  let orderNo = generateOrderNo();
  const { data: orderRaw, error: orderErr } = await service
    .from("orders")
    .insert({
      order_no: orderNo,
      user_id: tagoraUserId,
      status: "pending",
      subtotal_try: subtotal,
      shipping_try: SHIPPING_TRY,
      total_try: total,
      design_id: design.id,
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

  // 6) iyzico Checkout Form Initialize
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
