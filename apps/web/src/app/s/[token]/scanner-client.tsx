"use client";

/**
 * ScannerClient — anonim ziyaretçinin etkileşimli kısmı.
 *
 * State akışı:
 *   FORM    → kullanıcı şablonu seçer / yazar / "Gönder"
 *      ↓
 *   SENDING → API route'a POST (/api/scanner/send)
 *      ↓
 *   CHAT    → conversation_id alındı, Supabase Realtime'a subscribe
 *      ↓
 *   sahip cevap verince mesajlar canlı akar
 *
 * Scanner session token cookie'de tutulur (15 char Base62, 7 gün TTL).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseScannerClient } from "@/lib/supabase/scanner";
import { getQuickTemplates, moderateMessage, type StickerUseCase } from "@tagora/shared";
import { formatRelativeTime } from "@/lib/utils";
import { clsx } from "clsx";

interface ScannerClientProps {
  token: string;
  useCase: StickerUseCase | null;
  stickerLabel: string | null;
}

type Phase = "form" | "sending" | "chat" | "error";

interface ChatMessage {
  id: string;
  sender: "owner" | "scanner" | "system";
  body: string;
  sent_at: string;
}

const SESSION_COOKIE_KEY = "tagora_scanner_session";
const SESSION_STICKER_KEY = "tagora_scanner_sticker"; // hangi sticker için bu session

function readSessionCookie(): { token: string; sticker: string } | null {
  if (typeof document === "undefined") return null;
  const map = new Map(
    document.cookie
      .split(";")
      .map((c) => c.trim().split("="))
      .filter((kv): kv is [string, string] => kv.length === 2),
  );
  const t = map.get(SESSION_COOKIE_KEY);
  const s = map.get(SESSION_STICKER_KEY);
  return t && s ? { token: t, sticker: s } : null;
}

function writeSessionCookie(sessionToken: string, stickerToken: string) {
  const maxAge = 60 * 60 * 24 * 7; // 7 gün
  document.cookie = `${SESSION_COOKIE_KEY}=${sessionToken}; max-age=${maxAge}; path=/; SameSite=Lax`;
  document.cookie = `${SESSION_STICKER_KEY}=${stickerToken}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

export function ScannerClient({ token, useCase, stickerLabel }: ScannerClientProps) {
  const [phase, setPhase] = useState<Phase>("form");
  const [displayName, setDisplayName] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const templates = useMemo(() => getQuickTemplates(useCase, "tr"), [useCase]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mevcut session varsa otomatik chat'e geçiş yap
  useEffect(() => {
    const existing = readSessionCookie();
    if (existing && existing.sticker === token) {
      setSessionToken(existing.token);
      // Conversation'ı bul
      void hydrateConversation(existing.token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Realtime subscription
  useEffect(() => {
    if (!sessionToken || !conversationId) return;

    const supabase = createSupabaseScannerClient(sessionToken);

    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m],
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionToken, conversationId]);

  // Otomatik scroll en alta
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  const hydrateConversation = useCallback(
    async (sToken: string) => {
      try {
        const supabase = createSupabaseScannerClient(sToken);
        // Bu session'a ait conversation'ı bul
        const { data: convs } = await supabase
          .from("conversations")
          .select("*, messages(*)")
          .order("created_at", { ascending: false })
          .limit(1);

        if (convs && convs.length > 0) {
          const conv = convs[0]!;
          setConversationId(conv.id);
          const msgs = (conv as unknown as { messages?: ChatMessage[] }).messages ?? [];
          setMessages(msgs.sort((a, b) => a.sent_at.localeCompare(b.sent_at)));
          setPhase("chat");
        }
      } catch (e) {
        console.error("Hydrate failed", e);
      }
    },
    [],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // Client-side moderation pre-check (UX)
      const verdict = moderateMessage(trimmed);
      if (!verdict.allowed) {
        setError(
          verdict.reason === "threat"
            ? "Tehdit içerikli mesajlara izin verilmiyor."
            : verdict.reason === "phishing"
              ? "Phishing veya kişisel bilgi taşıyan mesajlar bloke edilir."
              : "Mesaj kurallarımızla uyumlu değil.",
        );
        return;
      }

      setError(null);
      setPhase("sending");

      try {
        const res = await fetch("/api/scanner/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sticker_token: token,
            scanner_session_token: sessionToken,
            display_name: displayName.trim() || null,
            body: trimmed,
          }),
        });

        const json = (await res.json()) as
          | {
              ok: true;
              session_token: string;
              conversation_id: string;
              message: ChatMessage;
            }
          | { ok: false; error: string };

        if (!json.ok) {
          setError(json.error);
          setPhase("form");
          return;
        }

        // Session token cookie'ye yaz (server zaten yapıyor ama belt-and-suspenders)
        writeSessionCookie(json.session_token, token);
        setSessionToken(json.session_token);
        setConversationId(json.conversation_id);
        setMessages((prev) => [...prev, json.message]);
        setBody("");
        setPhase("chat");
      } catch (e) {
        console.error(e);
        setError("Bağlantı hatası. Tekrar dene.");
        setPhase("form");
      }
    },
    [token, sessionToken, displayName],
  );

  // ====================== UI ======================

  if (phase === "chat") {
    return <ChatView
      messages={messages}
      onSend={send}
      ownerLabel={stickerLabel || "Sahip"}
    />;
  }

  return (
    <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
      {/* Hızlı şablonlar */}
      <div className="mb-4">
        <h2 className="mb-2 text-sm font-semibold text-charcoal">
          Hızlı şablon seç
        </h2>
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setBody(t.body)}
              className="rounded-full border border-navy/15 bg-navy/[0.02] px-3 py-1.5 text-sm text-navy transition hover:border-navy/30 hover:bg-navy/5"
            >
              {t.emoji} {t.body.length > 32 ? t.body.slice(0, 32) + "…" : t.body}
            </button>
          ))}
        </div>
      </div>

      <hr className="my-4 border-navy/10" />

      {/* Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(body);
        }}
        className="space-y-3"
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-charcoal">
            Mesajın
          </span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Sahibine ne demek istersin?"
            rows={4}
            maxLength={2000}
            className="w-full resize-none rounded-xl border border-navy/15 bg-white px-3.5 py-2.5 text-base text-charcoal placeholder:text-charcoal/40 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
            required
          />
          <div className="mt-1 text-right text-xs text-charcoal/40">
            {body.length}/2000
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-charcoal">
            Adın (opsiyonel)
          </span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Geçici takma ad — boş bırakabilirsin"
            maxLength={40}
            className="w-full rounded-xl border border-navy/15 bg-white px-3.5 py-2.5 text-base text-charcoal placeholder:text-charcoal/40 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            ⚠️ {error}
          </p>
        )}

        <button
          type="submit"
          disabled={phase === "sending" || body.trim().length === 0}
          className="btn-primary w-full"
        >
          {phase === "sending" ? "Gönderiliyor…" : "Anonim Olarak Gönder"}
        </button>

        <p className="text-center text-xs text-charcoal/50">
          Gönderdikten sonra sahibi cevaplayınca bu sayfada görürsün.
          <br />
          Telefon ve kimliğin gizli kalır.
        </p>
      </form>
    </section>
  );
}

// =========================================================================
// CHAT VIEW
// =========================================================================

function ChatView({
  messages,
  onSend,
  ownerLabel,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  ownerLabel: string;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft);
    setDraft("");
  };

  return (
    <section className="rounded-2xl border border-navy/10 bg-white shadow-sm">
      {/* Chat header */}
      <header className="flex items-center justify-between border-b border-navy/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full bg-emerald-500"
            aria-label="Aktif konuşma"
          />
          <span className="text-sm font-semibold text-charcoal">
            {ownerLabel} ile konuşma
          </span>
        </div>
        <span className="text-xs text-charcoal/50">Anonim</span>
      </header>

      {/* Mesaj listesi */}
      <div
        ref={scrollRef}
        className="flex max-h-[400px] flex-col gap-3 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-charcoal/50">
            Henüz mesaj yok…
          </p>
        ) : (
          messages.map((m) => (
            <MessageBubble key={m.id} message={m} myRole="scanner" />
          ))
        )}
      </div>

      {/* Compose */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-navy/10 p-3"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Cevap yaz…"
          rows={1}
          maxLength={2000}
          className="min-h-[40px] flex-1 resize-none rounded-xl border border-navy/15 bg-white px-3 py-2 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="btn-primary px-4 py-2 text-sm"
        >
          Gönder
        </button>
      </form>
    </section>
  );
}

function MessageBubble({
  message,
  myRole,
}: {
  message: ChatMessage;
  myRole: "owner" | "scanner";
}) {
  const isMine = message.sender === myRole;
  const isSystem = message.sender === "system";

  if (isSystem) {
    return (
      <div className="self-center rounded-full bg-navy/5 px-3 py-1 text-xs text-charcoal/60">
        {message.body}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
        isMine
          ? "self-end bg-navy text-white"
          : "self-start bg-navy/5 text-charcoal",
      )}
    >
      <p className="whitespace-pre-wrap break-words">{message.body}</p>
      <p
        className={clsx(
          "mt-1 text-[10px]",
          isMine ? "text-white/60" : "text-charcoal/50",
        )}
      >
        {formatRelativeTime(message.sent_at)}
      </p>
    </div>
  );
}
