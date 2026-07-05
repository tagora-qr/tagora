"use client";

/**
 * Sahip-tarafı chat — Supabase Realtime ile canlı.
 *
 * Scanner-side ile aynı mantık ama:
 * - Mesaj göndermek için sender = 'owner'
 * - Auth session zaten kuruldu (cookie'den)
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatRelativeTime } from "@/lib/utils";
import { clsx } from "clsx";

interface ChatMessage {
  id: string;
  sender: "owner" | "scanner" | "system";
  body: string;
  sent_at: string;
}

interface Props {
  conversationId: string;
  initialMessages: ChatMessage[];
  scannerName: string;
}

export function OwnerChat({ conversationId, initialMessages, scannerName }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`owner-conv-${conversationId}`)
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
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text) return;
    setSending(true);

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender: "owner",
        body: text,
      })
      .select("id, sender, body, sent_at")
      .single();

    setSending(false);
    if (error || !data) {
      alert("Mesaj gönderilemedi: " + (error?.message ?? "unknown"));
      return;
    }
    setDraft("");
    // Optimistic — realtime echo da gelecek ama hızlı görünmesi için ekle
    setMessages((prev) =>
      prev.some((x) => x.id === data.id) ? prev : [...prev, data as ChatMessage],
    );
  }, [draft, conversationId]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white">
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
      >
        {messages.length === 0 ? (
          <p className="self-center py-12 text-sm text-charcoal/50">
            Henüz mesaj yok.
          </p>
        ) : (
          messages.map((m) => <Bubble key={m.id} m={m} scannerName={scannerName} />)
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="flex items-end gap-2 border-t border-navy/10 p-3"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={1}
          maxLength={2000}
          placeholder="Cevap yaz…"
          className="min-h-[40px] flex-1 resize-none rounded-xl border border-navy/15 px-3 py-2 text-sm placeholder:text-charcoal/40 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="btn-primary px-4 py-2 text-sm"
        >
          Gönder
        </button>
      </form>
    </div>
  );
}

function Bubble({ m, scannerName }: { m: ChatMessage; scannerName: string }) {
  const isMine = m.sender === "owner";
  const isSystem = m.sender === "system";
  if (isSystem) {
    return (
      <div className="self-center rounded-full bg-navy/5 px-3 py-1 text-xs text-charcoal/60">
        {m.body}
      </div>
    );
  }
  return (
    <div
      className={clsx(
        "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
        isMine ? "self-end bg-navy text-white" : "self-start bg-navy/5 text-charcoal",
      )}
    >
      <p
        className={clsx(
          "mb-0.5 text-[10px] font-semibold uppercase tracking-wide",
          isMine ? "text-accent" : "text-navy/70",
        )}
      >
        {isMine ? "Sen" : scannerName}
      </p>
      <p className="whitespace-pre-wrap break-words">{m.body}</p>
      <p
        className={clsx(
          "mt-1 text-[10px]",
          isMine ? "text-white/60" : "text-charcoal/50",
        )}
      >
        {formatRelativeTime(m.sent_at)}
      </p>
    </div>
  );
}
