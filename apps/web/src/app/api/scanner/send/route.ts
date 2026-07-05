/**
 * POST /api/scanner/send
 *
 * Scanner sayfasından gelen mesajı işler. Akış:
 * 1. Sticker token'ı doğrula (var mı, claimed/active mi?)
 * 2. Scanner session yoksa yarat, varsa devam et
 * 3. Conversation yoksa yarat (sticker_id + scanner_session_id unique)
 * 4. Server-side moderation
 * 5. Message insert
 * 6. Cookie set + response
 *
 * Bu endpoint service_role kullanır (sticker pre-claim bilgilerine erişim için)
 * ama her adımda manuel auth check yapar.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  generateScannerSessionToken,
  hashFingerprint,
  isValidStickerToken,
  moderateMessage,
  RATE_LIMITS,
} from "@tagora/shared";

interface RequestBody {
  sticker_token: string;
  scanner_session_token: string | null;
  display_name: string | null;
  body: string;
}

const SESSION_COOKIE_KEY = "tagora_scanner_session";
const SESSION_STICKER_KEY = "tagora_scanner_sticker";

export async function POST(req: NextRequest) {
  let payload: RequestBody;
  try {
    payload = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const { sticker_token, body } = payload;

  // 1) Validasyon
  if (!sticker_token || !isValidStickerToken(sticker_token)) {
    return NextResponse.json(
      { ok: false, error: "Geçersiz sticker kodu." },
      { status: 400 },
    );
  }
  if (!body || typeof body !== "string") {
    return NextResponse.json(
      { ok: false, error: "Mesaj boş olamaz." },
      { status: 400 },
    );
  }
  if (body.length > 2000) {
    return NextResponse.json(
      { ok: false, error: "Mesaj çok uzun (max 2000)." },
      { status: 400 },
    );
  }

  // 2) Moderation
  const verdict = moderateMessage(body);
  if (!verdict.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error:
          verdict.reason === "threat"
            ? "Tehdit içerikli mesajlara izin verilmiyor."
            : "Mesaj kurallarımızla uyumlu değil.",
      },
      { status: 422 },
    );
  }

  const supabase = createSupabaseServiceClient();

  // 3) Sticker doğrula
  const { data: sticker, error: stickerErr } = await supabase
    .from("stickers")
    .select("id, owner_id, status, use_case, label")
    .eq("token", sticker_token)
    .maybeSingle();

  if (stickerErr || !sticker) {
    return NextResponse.json(
      { ok: false, error: "Bu sticker bulunamadı." },
      { status: 404 },
    );
  }
  if (!["claimed", "active"].includes(sticker.status ?? "")) {
    return NextResponse.json(
      { ok: false, error: "Bu sticker şu an aktif değil." },
      { status: 410 },
    );
  }
  if (!sticker.owner_id) {
    return NextResponse.json(
      { ok: false, error: "Bu sticker henüz sahibine eşlenmemiş." },
      { status: 410 },
    );
  }

  // 4) Fingerprint hash (KVKK: 24sa sonra silinir)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0";
  const userAgent = req.headers.get("user-agent") ?? "";
  const fingerprintHash = await hashFingerprint(`${ip}|${userAgent}|${sticker_token}`);

  // 5) Scanner session bul/yarat
  let sessionId: string;
  let sessionToken: string;

  const existingToken = payload.scanner_session_token ?? null;
  if (existingToken) {
    const { data: existing } = await supabase
      .from("scanner_sessions")
      .select("id, ephemeral_token, is_blocked, message_count")
      .eq("ephemeral_token", existingToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (existing) {
      if (existing.is_blocked) {
        return NextResponse.json(
          { ok: false, error: "Bu sticker'a mesaj atamazsın." },
          { status: 403 },
        );
      }
      // Rate limit kontrolü
      if ((existing.message_count ?? 0) >= RATE_LIMITS.SCANNER_MESSAGES_PER_DAY) {
        return NextResponse.json(
          { ok: false, error: "Bu sticker'a günlük mesaj limitin doldu." },
          { status: 429 },
        );
      }
      sessionId = existing.id!;
      sessionToken = existing.ephemeral_token!;
    } else {
      // Cookie var ama DB'de yok (expired veya silinmiş) → yeni session aç
      const result = await createNewSession(supabase, sticker.id!, payload.display_name, fingerprintHash);
      if ("error" in result) return result.error;
      sessionId = result.id;
      sessionToken = result.token;
    }
  } else {
    const result = await createNewSession(supabase, sticker.id!, payload.display_name, fingerprintHash);
    if ("error" in result) return result.error;
    sessionId = result.id;
    sessionToken = result.token;
  }

  // 6) Conversation bul/yarat
  let conversationId: string;
  const { data: existingConv } = await supabase
    .from("conversations")
    .select("id")
    .eq("sticker_id", sticker.id!)
    .eq("scanner_session_id", sessionId)
    .maybeSingle();

  if (existingConv) {
    conversationId = existingConv.id!;
  } else {
    const { data: newConv, error: convErr } = await supabase
      .from("conversations")
      .insert({
        sticker_id: sticker.id!,
        scanner_session_id: sessionId,
        owner_id: sticker.owner_id,
        status: "active",
      })
      .select("id")
      .single();
    if (convErr || !newConv) {
      return NextResponse.json(
        { ok: false, error: "Konuşma açılamadı." },
        { status: 500 },
      );
    }
    conversationId = newConv.id!;
  }

  // 7) Message insert
  const { data: msg, error: msgErr } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender: "scanner",
      body,
      flagged: verdict.flagged,
      flag_reason: verdict.reason ?? null,
    })
    .select("id, conversation_id, sender, body, sent_at")
    .single();

  if (msgErr || !msg) {
    return NextResponse.json(
      { ok: false, error: "Mesaj gönderilemedi." },
      { status: 500 },
    );
  }

  // 8) Scanner session message_count++
  await supabase.rpc as unknown; // no-op — message_count'u tetikleyiciden artırmak daha temiz olurdu;
  // basitlik için burada manuel artır:
  await supabase
    .from("scanner_sessions")
    .update({ message_count: 1, display_name: payload.display_name })
    .eq("id", sessionId);

  // 9) Cookie set
  const res = NextResponse.json({
    ok: true,
    session_token: sessionToken,
    conversation_id: conversationId,
    message: msg,
  });
  const maxAge = 60 * 60 * 24 * 7;
  res.cookies.set(SESSION_COOKIE_KEY, sessionToken, {
    maxAge,
    path: "/",
    sameSite: "lax",
    httpOnly: false, // client JS okuyacak (scanner-client)
    secure: process.env.NODE_ENV === "production",
  });
  res.cookies.set(SESSION_STICKER_KEY, sticker_token, {
    maxAge,
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}

// =========================================================================
async function createNewSession(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  stickerId: string,
  displayName: string | null,
  fingerprintHash: string,
): Promise<{ id: string; token: string } | { error: NextResponse }> {
  const token = generateScannerSessionToken();
  const { data, error } = await supabase
    .from("scanner_sessions")
    .insert({
      sticker_id: stickerId,
      ephemeral_token: token,
      display_name: displayName,
      device_fingerprint_hash: fingerprintHash,
    })
    .select("id, ephemeral_token")
    .single();

  if (error || !data) {
    return {
      error: NextResponse.json(
        { ok: false, error: "Oturum açılamadı." },
        { status: 500 },
      ),
    };
  }
  return { id: data.id!, token: data.ephemeral_token! };
}
