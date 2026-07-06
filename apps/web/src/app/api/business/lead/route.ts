/**
 * POST /api/business/lead
 *
 * B2B teklif talep formu — /business sayfasından çağrılır.
 * Rate limit: aynı email için 5 dakikada 1 talep (spam koruma).
 *
 * Yan etkiler:
 *   1) business_leads tablosuna insert
 *   2) is@tagora.com.tr'e admin bildirim email'i
 *   3) Kullanıcıya onay email'i
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/email";
import { trackServerEvent } from "@/lib/analytics";

const ADMIN_EMAIL = "is@tagora.com.tr";

const VALID_SECTORS = new Set([
  "fleet",
  "hotel",
  "vet",
  "ecommerce",
  "bike",
  "corp",
  "other",
]);
const VALID_SIZES = new Set(["1-10", "11-50", "51-200", "200+"]);

const SECTOR_LABELS: Record<string, string> = {
  fleet: "Filo & Kargo",
  hotel: "Otel & AirBnB",
  vet: "Veteriner Klinikleri",
  ecommerce: "E-ticaret & Lojistik",
  bike: "Kiralık Bisiklet & Scooter",
  corp: "Kurumsal Hediyelik",
  other: "Diğer",
};

const escape = (s: string | null | undefined) =>
  (s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

export async function POST(req: NextRequest) {
  let payload: {
    contact_name?: string;
    email?: string;
    phone?: string;
    company_name?: string;
    company_size?: string;
    sector?: string;
    estimated_quantity?: number | string;
    custom_design?: boolean;
    message?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz JSON" }, { status: 400 });
  }

  // --- Validation ---
  const contact_name = (payload.contact_name ?? "").trim();
  const email = (payload.email ?? "").trim().toLowerCase();
  const phone = (payload.phone ?? "").trim() || null;
  const company_name = (payload.company_name ?? "").trim();
  const company_size = payload.company_size && VALID_SIZES.has(payload.company_size) ? payload.company_size : null;
  const sector = payload.sector && VALID_SECTORS.has(payload.sector) ? payload.sector : null;
  const estimated_quantity =
    typeof payload.estimated_quantity === "number"
      ? payload.estimated_quantity
      : payload.estimated_quantity
        ? parseInt(String(payload.estimated_quantity), 10) || null
        : null;
  const custom_design = payload.custom_design === true;
  const message = (payload.message ?? "").trim() || null;

  if (!contact_name || contact_name.length < 2) {
    return NextResponse.json({ ok: false, error: "Ad soyad gerekli" }, { status: 400 });
  }
  if (!company_name || company_name.length < 2) {
    return NextResponse.json({ ok: false, error: "Şirket adı gerekli" }, { status: 400 });
  }
  if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Geçerli e-posta gerekli" }, { status: 400 });
  }

  const service = createSupabaseServiceClient();

  // --- Rate limit: aynı email 5 dakika içinde tekrar gönderirse reddet ---
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { count: recentCount } = await service
    .from("business_leads")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", fiveMinAgo);

  if ((recentCount ?? 0) >= 1) {
    return NextResponse.json(
      { ok: false, error: "Bu e-posta için az önce talep aldık. Birkaç dakika sonra tekrar dene." },
      { status: 429 },
    );
  }

  // --- Insert ---
  const { data: inserted, error: insertErr } = await service
    .from("business_leads")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({
      contact_name,
      email,
      phone,
      company_name,
      company_size,
      sector,
      estimated_quantity,
      custom_design,
      message,
      source: "website",
      utm_source: payload.utm_source ?? null,
      utm_medium: payload.utm_medium ?? null,
      utm_campaign: payload.utm_campaign ?? null,
    } as never)
    .select("id")
    .single();

  if (insertErr) {
    console.error("[business/lead] insert failed:", insertErr.message);
    return NextResponse.json(
      { ok: false, error: "Kayıt yapılamadı, tekrar dene" },
      { status: 500 },
    );
  }

  const leadId = (inserted as { id?: string } | null)?.id ?? null;
  const sectorLabel = sector ? SECTOR_LABELS[sector] : "Belirtilmedi";
  const origin = new URL(req.url).origin;

  // --- Admin bildirimi ---
  const adminHtml = `
    <h2>🎯 Yeni B2B talep</h2>
    <p><strong>${escape(contact_name)}</strong> — ${escape(company_name)}</p>
    <table style="border-collapse:collapse;font-family:-apple-system,sans-serif;">
      <tr><td style="padding:6px 12px;background:#f5f5f5;"><strong>Email</strong></td><td style="padding:6px 12px;"><a href="mailto:${escape(email)}">${escape(email)}</a></td></tr>
      ${phone ? `<tr><td style="padding:6px 12px;background:#f5f5f5;"><strong>Telefon</strong></td><td style="padding:6px 12px;"><a href="tel:${escape(phone)}">${escape(phone)}</a></td></tr>` : ""}
      <tr><td style="padding:6px 12px;background:#f5f5f5;"><strong>Sektör</strong></td><td style="padding:6px 12px;">${escape(sectorLabel)}</td></tr>
      ${company_size ? `<tr><td style="padding:6px 12px;background:#f5f5f5;"><strong>Şirket boyutu</strong></td><td style="padding:6px 12px;">${escape(company_size)}</td></tr>` : ""}
      ${estimated_quantity ? `<tr><td style="padding:6px 12px;background:#f5f5f5;"><strong>Tahmini adet</strong></td><td style="padding:6px 12px;">${estimated_quantity}</td></tr>` : ""}
      <tr><td style="padding:6px 12px;background:#f5f5f5;"><strong>Özel tasarım</strong></td><td style="padding:6px 12px;">${custom_design ? "Evet" : "Hayır"}</td></tr>
    </table>
    ${message ? `<p><strong>Mesaj:</strong></p><p style="background:#f9fafb;padding:12px;border-left:3px solid #F5B83C;white-space:pre-wrap;">${escape(message)}</p>` : ""}
    <p style="color:#666;font-size:12px;">Lead ID: ${leadId ?? "-"} · Kaynak: website</p>
    <p><a href="mailto:${escape(email)}?subject=Re:%20Tagora%20Business%20teklifi" style="background:#0F1B3D;color:#F5B83C;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600;">Cevap Ver</a></p>
  `;

  const adminRes = await sendTransactionalEmail({
    to: ADMIN_EMAIL,
    subject: `🎯 B2B: ${company_name} — ${sectorLabel}`,
    html: adminHtml,
    text: `${contact_name} (${company_name}) — ${email}\nSektör: ${sectorLabel}\nAdet: ${estimated_quantity ?? "belirtilmedi"}\nÖzel tasarım: ${custom_design ? "Evet" : "Hayır"}\n\n${message ?? ""}`,
    tags: [
      { name: "type", value: "b2b_lead_admin" },
      { name: "sector", value: sector ?? "unknown" },
    ],
  });
  if (!adminRes.ok) {
    console.error("[business/lead] Admin email failed:", adminRes.error);
  }

  // --- Kullanıcıya onay ---
  const userHtml = `
    <div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:-apple-system,sans-serif;">
      <div style="background:#fff;border-radius:12px;padding:32px 24px;border:1px solid #e5e7eb;">
        <h1 style="font-size:22px;color:#0F1B3D;margin:0 0 12px;">Merhaba ${escape(contact_name.split(" ")[0])},</h1>
        <p style="color:#374151;line-height:1.6;">Tagora Business için teklif talebini aldık. Ekip bugün-yarın içinde detaylı teklifle sana döner.</p>
        <div style="background:#F9FAFB;border-left:3px solid #F5B83C;padding:12px 16px;margin:20px 0;font-size:13px;color:#374151;">
          <strong>Özet:</strong><br>
          ${escape(company_name)} · ${escape(sectorLabel)}${estimated_quantity ? ` · Tahmini ${estimated_quantity} adet` : ""}${custom_design ? " · Özel tasarım" : ""}
        </div>
        <p style="color:#6B7280;font-size:13px;">Bu arada içeriklere göz atmak istersen: <a href="${origin}/business" style="color:#0F1B3D;">tagora.com.tr/business</a></p>
        <p style="color:#9CA3AF;font-size:12px;margin-top:24px;">Acil bir konu varsa: <a href="mailto:${ADMIN_EMAIL}" style="color:#6B7280;">${ADMIN_EMAIL}</a></p>
      </div>
      <p style="text-align:center;color:#9CA3AF;font-size:12px;margin-top:16px;">Tagora · tagora.com.tr</p>
    </div>
  `;

  await sendTransactionalEmail({
    to: email,
    subject: "Tagora Business — teklif talebini aldık ✓",
    html: userHtml,
    text: `Merhaba ${contact_name},\n\nTagora Business için teklif talebini aldık. Ekip 24 saat içinde detaylı teklifle sana döner.\n\nÖzet: ${company_name} · ${sectorLabel}\n\nAcil bir konu için: ${ADMIN_EMAIL}\n\n— Tagora`,
    tags: [
      { name: "type", value: "b2b_lead_confirmation" },
    ],
  });

  // --- Analytics ---
  await trackServerEvent({
    event: "business:lead_submitted",
    distinctId: email,
    properties: {
      sector,
      company_size,
      estimated_quantity,
      custom_design,
      lead_id: leadId,
    },
  });

  return NextResponse.json({ ok: true, leadId });
}
