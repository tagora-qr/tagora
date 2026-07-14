/**
 * POST /api/messages/report
 *
 * Owner bir mesajı flag/report eder.
 * Apple guideline 1.2 UGC — kullanıcı objectionable content'i işaretleyebilmeli.
 *
 * Body: { message_id: uuid, reason?: string, details?: string }
 *
 * Yapar:
 *  1. messages.flagged = true (owner UI'da gizler)
 *  2. abuse_reports tablosuna kayıt (admin inbox için)
 *  3. Admin email bildirimi (Brevo)
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

interface Body {
  message_id?: string;
  reason?: "harassment" | "spam" | "hate_speech" | "sexual_content" | "other";
  details?: string;
}

export async function POST(req: NextRequest) {
  // 1) Owner authenticated mi
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ownership check için Bearer token'ı mobil'den de alabiliriz
  let userId: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    userId = (profile as { id?: string } | null)?.id ?? null;
  } else {
    // Mobile Bearer token fallback
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";
    if (token) {
      const service = createSupabaseServiceClient();
      const { data: userData } = await service.auth.getUser(token);
      if (userData?.user) {
        const { data: profile } = await service
          .from("users")
          .select("id")
          .eq("auth_user_id", userData.user.id)
          .maybeSingle();
        userId = (profile as { id?: string } | null)?.id ?? null;
      }
    }
  }

  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // 2) Body parse
  let payload: Body;
  try {
    payload = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz JSON" }, { status: 400 });
  }

  const messageId = payload.message_id;
  if (!messageId || !/^[a-f0-9-]{36}$/i.test(messageId)) {
    return NextResponse.json(
      { ok: false, error: "Geçerli message_id gerekli" },
      { status: 400 },
    );
  }

  const reason = payload.reason ?? "other";
  const details = (payload.details ?? "").slice(0, 500);

  // 3) Message + conversation + sticker ownership check (service client ile)
  const service = createSupabaseServiceClient();
  const { data: msgRaw } = await service
    .from("messages")
    .select("id, conversation_id, sender, body")
    .eq("id", messageId)
    .maybeSingle();

  const msg = msgRaw as {
    id: string;
    conversation_id: string;
    sender: string;
    body: string;
  } | null;

  if (!msg) {
    return NextResponse.json({ ok: false, error: "Mesaj bulunamadı" }, { status: 404 });
  }

  const { data: convRaw } = await service
    .from("conversations")
    .select("id, sticker_id, scanner_session_id")
    .eq("id", msg.conversation_id)
    .maybeSingle();

  const conv = convRaw as {
    id: string;
    sticker_id: string;
    scanner_session_id: string | null;
  } | null;

  if (!conv) {
    return NextResponse.json({ ok: false, error: "Konuşma bulunamadı" }, { status: 404 });
  }

  const { data: stickerRaw } = await service
    .from("stickers")
    .select("id, owner_id, token")
    .eq("id", conv.sticker_id)
    .maybeSingle();

  const sticker = stickerRaw as {
    id: string;
    owner_id: string | null;
    token: string;
  } | null;

  if (sticker?.owner_id !== userId) {
    return NextResponse.json(
      { ok: false, error: "Bu mesajı flag etme yetkin yok" },
      { status: 403 },
    );
  }

  // 4) messages.flagged = true (owner tarafında gizle)
  await service
    .from("messages")
    .update({ flagged: true } as never)
    .eq("id", messageId);

  // 5) abuse_reports'a kayıt
  await service.from("abuse_reports").insert({
    sticker_id: sticker.id,
    scanner_session_id: conv.scanner_session_id,
    conversation_id: conv.id,
    reported_by_user_id: userId,
    reason,
    details: details || `Mesaj içeriği: "${msg.body.slice(0, 200)}"`,
    status: "pending",
  } as never);

  // 6) Admin bildirimi (best-effort, hata bloklamaz)
  try {
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL ?? "destek@tagora.com.tr";
    await sendEmail({
      to: adminEmail,
      subject: `🚨 Yeni mesaj şikayeti — Sticker ${sticker.token}`,
      html: `<!doctype html><html><body style="font-family:sans-serif;padding:24px;">
<h2>Yeni mesaj şikayeti</h2>
<p><strong>Sebep:</strong> ${reason}</p>
<p><strong>Sticker token:</strong> ${sticker.token}</p>
<p><strong>Mesaj (kısaltılmış):</strong></p>
<blockquote style="border-left:3px solid #DC2626;padding:8px 16px;background:#FEE2E2;color:#7F1D1D;">
${msg.body.slice(0, 500).replace(/</g, "&lt;")}
</blockquote>
${details ? `<p><strong>Şikayet notu:</strong> ${details.replace(/</g, "&lt;")}</p>` : ""}
<p style="margin-top:24px;">
  <a href="https://tagora.com.tr/admin/business-leads" style="background:#0F1B3D;color:#D4F36A;padding:10px 20px;border-radius:8px;text-decoration:none;">
    Admin panelinde incele →
  </a>
</p>
<p style="color:#6B7280;font-size:12px;margin-top:16px;">Bu bildirim 24 saat içinde işleme alınmalıdır (Apple guideline 1.2).</p>
</body></html>`,
    });
  } catch (e) {
    console.error("[messages/report] Admin email hata:", (e as Error).message);
  }

  return NextResponse.json({ ok: true });
}
