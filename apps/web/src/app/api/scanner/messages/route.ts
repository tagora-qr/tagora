/**
 * POST /api/scanner/messages
 *
 * Scanner tarafı polling endpoint'i — owner cevaplarını çekmek için.
 *
 * Neden ayrı endpoint? Supabase Realtime WebSocket'te x-scanner-session
 * header'ı iletemiyor (Sprint 1 bug), scanner tarafında RLS SELECT hydrate
 * bazen fail ediyor. Service-role client + manuel session validation en
 * garantili yol.
 *
 * Güvenlik: session_token doğrulaması sunucuda yapılıyor.
 *   1. session_token → scanner_sessions kaydı bul (ephemeral_token match + expires_at)
 *   2. session sahibi = conversation.scanner_session_id
 *   3. Match ise messages return
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

interface RequestBody {
  session_token: string;
  conversation_id: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender: "owner" | "scanner" | "system";
  body: string;
  sent_at: string;
}

export async function POST(req: NextRequest) {
  let payload: RequestBody;
  try {
    payload = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Geçersiz istek." },
      { status: 400 },
    );
  }

  const { session_token, conversation_id } = payload;

  if (!session_token || !conversation_id) {
    return NextResponse.json(
      { ok: false, error: "session_token ve conversation_id zorunlu." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServiceClient();

  // 1) Session token geçerli mi?
  const { data: session, error: sessionErr } = await supabase
    .from("scanner_sessions")
    .select("id, is_blocked")
    .eq("ephemeral_token", session_token)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (sessionErr || !session) {
    return NextResponse.json(
      { ok: false, error: "Session yok veya süresi dolmuş." },
      { status: 403 },
    );
  }

  const sessionRow = session as { id: string; is_blocked: boolean };
  if (sessionRow.is_blocked) {
    return NextResponse.json(
      { ok: false, error: "Bu session bloklanmış." },
      { status: 403 },
    );
  }

  // 2) Conversation bu session'a mı ait?
  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversation_id)
    .eq("scanner_session_id", sessionRow.id)
    .maybeSingle();

  if (!conv) {
    return NextResponse.json(
      { ok: false, error: "Konuşma bu session'a ait değil." },
      { status: 403 },
    );
  }

  // 3) Mesajları çek (silinmemiş)
  const { data: messages } = await supabase
    .from("messages")
    .select("id, conversation_id, sender, body, sent_at")
    .eq("conversation_id", conversation_id)
    .is("deleted_at", null)
    .order("sent_at", { ascending: true });

  return NextResponse.json({
    ok: true,
    messages: (messages ?? []) as MessageRow[],
  });
}
