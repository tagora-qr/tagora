/**
 * POST /api/admin/orders/update
 * Body: { orderId, patch: Partial<Order> }
 *
 * Admin sipariş güncelleme — status, kargo bilgisi, admin_note.
 * Whitelisted alanlar sadece.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { renderOrderShippedEmail, sendTransactionalEmail } from "@/lib/email";
import { trackServerEvent } from "@/lib/analytics";

const TRACKING_URLS: Record<string, (no: string) => string> = {
  "Aras Kargo": (no) => `https://www.araskargo.com.tr/mainpage/cargo-tracking?code=${no}`,
  "Yurtiçi Kargo": (no) => `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${no}`,
  "MNG Kargo": (no) => `https://kargotakip.mngkargo.com.tr/?takipNo=${no}`,
  "PTT Kargo": (no) => `https://gonderitakip.ptt.gov.tr/Track/Verify?q=${no}`,
  "Sürat Kargo": (no) => `https://www.suratkargo.com.tr/KargoTakip/?kod=${no}`,
};

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

  // Mevcut order — email tetikleyicileri için önceki durumu bil
  const { data: existing } = await service
    .from("orders")
    .select("status, tracking_carrier, tracking_number, buyer_email, buyer_name, order_no")
    .eq("id", orderId)
    .maybeSingle();
  const prev = existing as {
    status?: string;
    tracking_carrier?: string | null;
    tracking_number?: string | null;
    buyer_email?: string;
    buyer_name?: string;
    order_no?: string;
  } | null;

  const { error } = await service.from("orders").update(clean).eq("id", orderId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Shipped email tetikleyicisi: status shipped OLDU + kargo bilgisi mevcut
  // İki case: (a) status "shipped" değişti, (b) shipped'ken kargo bilgisi eklendi
  const nextStatus = (clean.status as string | undefined) ?? prev?.status;
  const nextCarrier = (clean.tracking_carrier as string | null | undefined) ?? prev?.tracking_carrier;
  const nextTrackNo = (clean.tracking_number as string | null | undefined) ?? prev?.tracking_number;

  const justShipped = clean.status === "shipped" && prev?.status !== "shipped";
  const trackingJustSet =
    prev?.status === "shipped" &&
    ((clean.tracking_number && clean.tracking_number !== prev.tracking_number) ||
      (clean.tracking_carrier && clean.tracking_carrier !== prev.tracking_carrier));

  if (
    (justShipped || trackingJustSet) &&
    nextStatus === "shipped" &&
    nextCarrier &&
    nextTrackNo &&
    prev?.buyer_email &&
    prev?.order_no
  ) {
    // Sticker sayısı
    const { count: stickerCount } = await service
      .from("stickers")
      .select("id", { count: "exact", head: true })
      .eq("order_id", orderId);

    const origin = new URL(req.url).origin;
    const carrierUrl = TRACKING_URLS[nextCarrier]?.(nextTrackNo) ?? null;

    const email = renderOrderShippedEmail({
      orderNo: prev.order_no,
      buyerName: prev.buyer_name ?? "",
      carrier: nextCarrier,
      trackingNumber: nextTrackNo,
      carrierTrackUrl: carrierUrl,
      trackUrl: `${origin}/dashboard/orders/${prev.order_no}`,
      stickerCount: stickerCount ?? 0,
    });
    const emailRes = await sendTransactionalEmail({
      to: prev.buyer_email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      tags: [{ name: "type", value: "order_shipped" }, { name: "order_no", value: prev.order_no }],
    });
    if (!emailRes.ok) {
      console.error("[orders/update] Shipped email failed:", emailRes.error);
    }

    // Analytics: order shipped
    await trackServerEvent({
      event: "order:shipped",
      distinctId: prev.buyer_email,
      properties: {
        order_no: prev.order_no,
        carrier: nextCarrier,
        tracking_number: nextTrackNo,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
