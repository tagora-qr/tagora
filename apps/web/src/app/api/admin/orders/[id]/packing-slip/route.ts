/**
 * GET /api/admin/orders/{id}/packing-slip
 *
 * Kargo paketine konacak yazdırılabilir sayfa döner (HTML, print CSS ile).
 * İçerik:
 *   - Sipariş no + tarih
 *   - Alıcı adı + tel
 *   - Kargo adresi (etiket için)
 *   - Sipariş içeriği tablosu
 *   - Atanan sticker token listesi (kontrol için)
 *
 * NOT: browser'da açıp Cmd+P ile yazdırılır. PDF'e gerek yok (basit).
 */
import { type NextRequest } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

const escape = (s: string | null | undefined) =>
  (s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: caller } = await supabase
    .from("users")
    .select("is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!(caller as { is_admin?: boolean } | null)?.is_admin) {
    return new Response("Forbidden", { status: 403 });
  }

  const service = createSupabaseServiceClient();
  const { data: order } = await service.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) return new Response("Order not found", { status: 404 });
  const o = order as {
    order_no: string;
    buyer_name: string;
    buyer_phone: string;
    buyer_email: string;
    shipping_address: string;
    shipping_city: string;
    shipping_district: string | null;
    shipping_zip: string | null;
    created_at: string;
    total_try: number;
    customer_note: string | null;
  };

  const { data: items } = await service
    .from("order_items")
    .select("package_name, sticker_count, quantity")
    .eq("order_id", id);

  const { data: stickers } = await service
    .from("stickers")
    .select("token")
    .eq("order_id", id)
    .order("allocated_at", { ascending: true });

  const itemsRows = ((items ?? []) as { package_name: string; sticker_count: number; quantity: number }[])
    .map(
      (i) => `<tr>
        <td>${escape(i.package_name)}</td>
        <td class="right">${i.quantity}</td>
        <td class="right">${i.sticker_count} adet</td>
        <td class="right">${i.quantity * i.sticker_count}</td>
      </tr>`,
    )
    .join("");

  const stickerTokens = ((stickers ?? []) as { token: string }[])
    .map((s) => `<code>${escape(s.token)}</code>`)
    .join(" · ");

  const totalStickers = ((stickers ?? []) as unknown[]).length;

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Packing Slip · ${escape(o.order_no)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", sans-serif; max-width: 210mm; margin: 0 auto; padding: 20mm; color: #111; }
  h1 { margin: 0; font-size: 20px; }
  .brand { color: #6b7280; font-size: 12px; margin-bottom: 24px; }
  .row { display: flex; gap: 24px; margin-bottom: 24px; }
  .col { flex: 1; }
  .label { font-size: 10px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; font-weight: 600; margin-bottom: 4px; }
  .value { font-size: 14px; }
  .address-box { border: 2px solid #111; padding: 16px; border-radius: 8px; }
  .address-box .name { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
  .address-box .addr { white-space: pre-wrap; margin: 4px 0; }
  .address-box .phone { color: #374151; margin-top: 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
  th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
  th { background: #f9fafb; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; color: #6b7280; }
  .right { text-align: right; }
  .tokens { font-size: 10px; line-height: 1.9; color: #374151; background: #f9fafb; padding: 12px; border-radius: 6px; }
  .tokens code { background: white; padding: 2px 6px; border-radius: 3px; border: 1px solid #e5e7eb; font-family: "SF Mono", Menlo, monospace; }
  .note { background: #fef3c7; border-left: 3px solid #f59e0b; padding: 12px; margin: 16px 0; font-size: 12px; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; text-align: center; }
  .stats { display: flex; gap: 24px; margin-bottom: 16px; padding: 12px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; }
  .stats .stat { font-size: 13px; }
  .stats strong { font-size: 16px; color: #059669; display: block; }
  @media print {
    body { padding: 10mm; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <h1>Tagora — Packing Slip</h1>
  <p class="brand">Kargo hazırlık formu · ${new Date().toLocaleString("tr-TR")}</p>

  <div class="row">
    <div class="col">
      <div class="label">Sipariş No</div>
      <div class="value" style="font-family: monospace; font-size: 18px; font-weight: 700;">${escape(o.order_no)}</div>
    </div>
    <div class="col">
      <div class="label">Sipariş Tarihi</div>
      <div class="value">${new Date(o.created_at).toLocaleString("tr-TR")}</div>
    </div>
    <div class="col">
      <div class="label">Toplam</div>
      <div class="value">${Number(o.total_try).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</div>
    </div>
  </div>

  <div class="label">Teslim Adresi (Etiket)</div>
  <div class="address-box">
    <div class="name">${escape(o.buyer_name)}</div>
    <div class="addr">${escape(o.shipping_address)}</div>
    <div class="addr">${escape(o.shipping_district ? o.shipping_district + ", " : "")}${escape(o.shipping_city)}${escape(o.shipping_zip ? " " + o.shipping_zip : "")}</div>
    <div class="phone">📞 ${escape(o.buyer_phone)}</div>
  </div>

  <br />

  <div class="stats">
    <div class="stat">Toplam Sticker: <strong>${totalStickers}</strong></div>
    <div class="stat">İçerik: <strong>${(items ?? []).length} paket</strong></div>
  </div>

  <div class="label">Sipariş İçeriği</div>
  <table>
    <thead>
      <tr>
        <th>Paket</th>
        <th class="right">Adet</th>
        <th class="right">Paket İçi</th>
        <th class="right">Toplam Sticker</th>
      </tr>
    </thead>
    <tbody>${itemsRows}</tbody>
  </table>

  ${o.customer_note ? `<div class="note"><strong>Müşteri notu:</strong> ${escape(o.customer_note)}</div>` : ""}

  <div class="label">Kargolanacak Sticker Token'ları (${totalStickers} adet)</div>
  <div class="tokens">${stickerTokens || "<em>Henüz sticker atanmamış!</em>"}</div>

  <div class="note">
    <strong>✓ Kontrol listesi:</strong><br />
    □ ${totalStickers} sticker QR üstünde token'lar yukarıdaki listeyle eşleşiyor<br />
    □ Kargo etiketi yazıldı<br />
    □ Paket kapatıldı ve sisteme kargo takip no girildi
  </div>

  <div class="footer">
    Tagora · tagora.com.tr · destek@tagora.com.tr
  </div>

  <div class="no-print" style="margin-top: 24px; text-align: center;">
    <button onclick="window.print()" style="padding: 12px 24px; font-size: 14px; background: #111; color: white; border: none; border-radius: 6px; cursor: pointer;">
      🖨️ Yazdır
    </button>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
