/**
 * Transactional email helper — Resend HTTP API üzerinden.
 *
 * Neden fetch: SDK dependency istememek. Resend REST çok basit.
 * Doküman: https://resend.com/docs/api-reference/emails/send-email
 *
 * Env: RESEND_API_KEY (Vercel'de tanımlı olmalı)
 *
 * NOT: Fail-safe. Email gönderimi başarısız olursa hata FIRLATMAZ,
 * sadece console'a log basar — sipariş akışı email hatası yüzünden bozulmaz.
 */

/**
 * NOT: Şimdilik Tagora için ayrı bir Resend hesabı yok — mevcut Resend
 * hesabındaki verified domain `complify.io` kullanılıyor. From adres
 * "Tagora <bildirim@complify.io>" formatında: kullanıcı gelen kutusunda
 * "Tagora" markasını görür, teknik sender complify.io.
 *
 * Reply-to `destek@tagora.com.tr` — kullanıcı yanıt basarsa Tagora destek'e
 * gider (MX kurulumu sonrasında). Şimdilik bounce olabilir.
 *
 * Yeni Tagora Resend hesabı açılınca:
 *   Vercel'e RESEND_FROM env değişkeni ekle: "Tagora <bildirim@tagora.com.tr>"
 *   Kod değişmesin — env override eder.
 */
const FROM_ADDRESS = process.env.RESEND_FROM ?? "Tagora <bildirim@complify.io>";
const REPLY_TO = process.env.RESEND_REPLY_TO ?? "destek@tagora.com.tr";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  tags?: { name: string; value: string }[];
}

interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendTransactionalEmail(input: SendEmailInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY tanımlı değil, email gönderilmedi:", input.subject);
    return { ok: false, error: "RESEND_API_KEY missing" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: REPLY_TO,
        tags: input.tags,
      }),
    });

    const json = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };

    if (!res.ok) {
      console.error("[email] Resend error:", res.status, json);
      return { ok: false, error: json.message ?? `HTTP ${res.status}` };
    }
    return { ok: true, id: json.id };
  } catch (e) {
    console.error("[email] Fetch failed:", e);
    return { ok: false, error: (e as Error).message };
  }
}

// ============================================================
// TEMPLATE HELPERS
// ============================================================

const BASE_STYLES = `
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, "Segoe UI", Roboto, sans-serif; background: #f9fafb; color: #111827; }
    .wrap { max-width: 560px; margin: 0 auto; padding: 24px 16px; }
    .card { background: #ffffff; border-radius: 12px; padding: 32px 24px; border: 1px solid #e5e7eb; }
    .logo { font-size: 22px; font-weight: 800; color: #0c1e40; margin-bottom: 4px; letter-spacing: -0.02em; }
    .brand-tag { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px; }
    h1 { font-size: 20px; margin: 0 0 12px; color: #0c1e40; }
    p { line-height: 1.6; margin: 8px 0; color: #374151; }
    .btn { display: inline-block; background: #0c1e40; color: #f5b83c !important; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 16px 0; }
    .box { background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e5e7eb; }
    .box .label { font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; font-weight: 600; margin-bottom: 4px; }
    .box .value { font-size: 14px; color: #111827; font-weight: 500; }
    .order-no { font-family: "SF Mono", Menlo, monospace; font-size: 15px; font-weight: 700; color: #0c1e40; }
    .tracking { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .tracking .carrier { font-weight: 700; color: #3730a3; font-size: 15px; }
    .tracking .number { font-family: "SF Mono", Menlo, monospace; font-size: 14px; margin-top: 4px; }
    .footer { color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px; line-height: 1.5; }
    .footer a { color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    td { padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    td.right { text-align: right; color: #6b7280; }
    tr:last-child td { border-bottom: none; font-weight: 700; }
  </style>
`;

const wrap = (bodyHtml: string) => `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
${BASE_STYLES}
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="logo">Tagora</div>
      <div class="brand-tag">Gizlilik-önce QR sticker</div>
      ${bodyHtml}
    </div>
    <div class="footer">
      Tagora · <a href="https://tagora.com.tr">tagora.com.tr</a> · <a href="mailto:destek@tagora.com.tr">destek@tagora.com.tr</a><br />
      Bu mail siparişinle ilgili bir bildirim olduğu için gönderildi.
    </div>
  </div>
</body>
</html>`;

const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

// ============================================================
// ORDER CONFIRMATION EMAIL
// ============================================================
export function renderOrderConfirmationEmail(input: {
  orderNo: string;
  buyerName: string;
  totalTry: number;
  shippingAddress: string;
  shippingCity: string;
  trackUrl: string;
  items: { name: string; quantity: number; lineTotal: number }[];
}): { subject: string; html: string; text: string } {
  const itemsRows = input.items
    .map(
      (i) => `<tr>
        <td>${esc(i.name)} × ${i.quantity}</td>
        <td class="right">${i.lineTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</td>
      </tr>`,
    )
    .join("");

  const html = wrap(`
    <h1>✓ Siparişin alındı, ${esc(input.buyerName.split(" ")[0])}!</h1>
    <p>Ödemeni aldık, sipariş hazırlığına başlıyoruz. Kargoya verildiğinde takip numarasıyla tekrar yazacağız.</p>

    <div class="box">
      <div class="label">Sipariş No</div>
      <div class="value order-no">${esc(input.orderNo)}</div>
    </div>

    <table>
      ${itemsRows}
      <tr>
        <td>Toplam (KDV dahil, kargo dahil)</td>
        <td class="right">${input.totalTry.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</td>
      </tr>
    </table>

    <div class="box">
      <div class="label">Kargo Adresi</div>
      <div class="value">${esc(input.shippingAddress)}, ${esc(input.shippingCity)}</div>
    </div>

    <p style="text-align: center;">
      <a href="${esc(input.trackUrl)}" class="btn">Siparişimi Takip Et →</a>
    </p>

    <p style="font-size: 13px; color: #6b7280;">
      Sorun mu var? Şu e-postaya cevap ver: <a href="mailto:destek@tagora.com.tr">destek@tagora.com.tr</a>
    </p>
  `);

  const text = `Merhaba ${input.buyerName},

Siparişin alındı — teşekkürler!

Sipariş No: ${input.orderNo}
Toplam: ${input.totalTry.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
Kargo: ${input.shippingAddress}, ${input.shippingCity}

Siparişini takip et: ${input.trackUrl}

Sorunun için: destek@tagora.com.tr
— Tagora`;

  return {
    subject: `✓ Siparişin alındı — ${input.orderNo}`,
    html,
    text,
  };
}

// ============================================================
// ORDER SHIPPED EMAIL
// ============================================================
export function renderOrderShippedEmail(input: {
  orderNo: string;
  buyerName: string;
  carrier: string;
  trackingNumber: string;
  carrierTrackUrl: string | null;
  trackUrl: string;
  stickerCount: number;
}): { subject: string; html: string; text: string } {
  const carrierBtn = input.carrierTrackUrl
    ? `<a href="${esc(input.carrierTrackUrl)}" class="btn" style="background: #3730a3;">Kargomu Takip Et →</a>`
    : "";

  const html = wrap(`
    <h1>🚚 Siparişin kargoya verildi!</h1>
    <p>${esc(input.buyerName.split(" ")[0])}, siparişin şu an kargoda. ${input.stickerCount} sticker paketinde yola çıktı.</p>

    <div class="tracking">
      <div class="label" style="font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; margin-bottom: 6px;">Kargo</div>
      <div class="carrier">${esc(input.carrier)}</div>
      <div class="number">Takip: <strong>${esc(input.trackingNumber)}</strong></div>
    </div>

    <p style="text-align: center;">${carrierBtn}</p>

    <div class="box">
      <div class="label">Sipariş No</div>
      <div class="value order-no">${esc(input.orderNo)}</div>
    </div>

    <p style="text-align: center;">
      <a href="${esc(input.trackUrl)}" class="btn">Sipariş Detayı →</a>
    </p>

    <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
      <strong>Teslim aldıktan sonra:</strong> Tagora uygulamasında sticker QR'ını tara → hesabına bağla → objelerine yapıştır.
    </p>
  `);

  const text = `Merhaba ${input.buyerName},

Sipariş ${input.orderNo} kargoya verildi.

Kargo: ${input.carrier}
Takip No: ${input.trackingNumber}
${input.carrierTrackUrl ? `Takip: ${input.carrierTrackUrl}` : ""}

Sipariş detayı: ${input.trackUrl}

— Tagora`;

  return {
    subject: `🚚 Siparişin kargoda — ${input.orderNo}`,
    html,
    text,
  };
}
