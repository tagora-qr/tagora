/**
 * POST /api/admin/orders/resend-email
 * Body: { orderId, type: "confirmation" | "shipped" }
 *
 * Manuel email tekrar gönderme — spam'e düşmüşse veya
 * email trigger'ı fail etmişse admin elden tetikler.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  renderOrderConfirmationEmail,
  renderOrderShippedEmail,
  sendTransactionalEmail,
} from "@/lib/email";

const TRACKING_URLS: Record<string, (no: string) => string> = {
  "Aras Kargo": (no) => `https://www.araskargo.com.tr/mainpage/cargo-tracking?code=${no}`,
  "Yurtiçi Kargo": (no) => `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${no}`,
  "MNG Kargo": (no) => `https://kargotakip.mngkargo.com.tr/?takipNo=${no}`,
  "PTT Kargo": (no) => `https://gonderitakip.ptt.gov.tr/Track/Verify?q=${no}`,
  "Sürat Kargo": (no) => `https://www.suratkargo.com.tr/KargoTakip/?kod=${no}`,
};

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

  const payload = (await req.json().catch(() => ({}))) as {
    orderId?: string;
    type?: "confirmation" | "shipped";
  };
  const { orderId, type } = payload;
  if (!orderId || !type) {
    return NextResponse.json({ ok: false, error: "orderId + type gerekli" }, { status: 400 });
  }

  const service = createSupabaseServiceClient();
  const { data: order } = await service.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) {
    return NextResponse.json({ ok: false, error: "Sipariş bulunamadı" }, { status: 404 });
  }
  const o = order as {
    order_no: string;
    buyer_name: string;
    buyer_email: string;
    total_try: number;
    shipping_address: string;
    shipping_city: string;
    tracking_carrier: string | null;
    tracking_number: string | null;
  };

  const origin = new URL(req.url).origin;
  const trackUrl = `${origin}/dashboard/orders/${o.order_no}`;

  if (type === "confirmation") {
    const { data: items } = await service
      .from("order_items")
      .select("package_name, quantity, line_total_try")
      .eq("order_id", orderId);
    const itemsList = ((items ?? []) as { package_name: string; quantity: number; line_total_try: number }[])
      .map((i) => ({ name: i.package_name, quantity: i.quantity, lineTotal: Number(i.line_total_try) }));

    const email = renderOrderConfirmationEmail({
      orderNo: o.order_no,
      buyerName: o.buyer_name,
      totalTry: Number(o.total_try),
      shippingAddress: o.shipping_address,
      shippingCity: o.shipping_city,
      trackUrl,
      items: itemsList,
    });
    const res = await sendTransactionalEmail({
      to: o.buyer_email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      tags: [
        { name: "type", value: "order_confirmation_resend" },
        { name: "order_no", value: o.order_no },
      ],
    });
    return NextResponse.json(res);
  }

  if (type === "shipped") {
    if (!o.tracking_carrier || !o.tracking_number) {
      return NextResponse.json(
        { ok: false, error: "Kargo bilgisi eksik — önce takip no gir" },
        { status: 400 },
      );
    }
    const { count: stickerCount } = await service
      .from("stickers")
      .select("id", { count: "exact", head: true })
      .eq("order_id", orderId);

    const carrierUrl = TRACKING_URLS[o.tracking_carrier]?.(o.tracking_number) ?? null;
    const email = renderOrderShippedEmail({
      orderNo: o.order_no,
      buyerName: o.buyer_name,
      carrier: o.tracking_carrier,
      trackingNumber: o.tracking_number,
      carrierTrackUrl: carrierUrl,
      trackUrl,
      stickerCount: stickerCount ?? 0,
    });
    const res = await sendTransactionalEmail({
      to: o.buyer_email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      tags: [
        { name: "type", value: "order_shipped_resend" },
        { name: "order_no", value: o.order_no },
      ],
    });
    return NextResponse.json(res);
  }

  return NextResponse.json({ ok: false, error: "Geçersiz type" }, { status: 400 });
}
