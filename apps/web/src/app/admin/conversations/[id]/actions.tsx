"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function ModerationActions({
  conversationId,
  scannerSessionId,
  stickerId,
  scannerBlocked,
  conversationStatus,
}: {
  conversationId: string;
  scannerSessionId: string;
  stickerId: string;
  scannerBlocked: boolean;
  conversationStatus: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const call = async (endpoint: string, body: object, key: string, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg + "\n\nEmin misin?")) return;
    setBusy(key);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        alert("Hata: " + (json.error ?? "unknown"));
        return;
      }
      router.refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const changeStatus = async (nextStatus: string, confirmMsg: string) => {
    if (!window.confirm(confirmMsg + "\n\nEmin misin?")) return;
    setBusy("status");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("conversations")
      .update({ status: nextStatus })
      .eq("id", conversationId);
    setBusy(null);
    if (error) {
      alert("Değişiklik başarısız: " + error.message);
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Scanner block */}
      <button
        onClick={() =>
          call(
            "/api/admin/scanner-sessions/toggle-block",
            { sessionId: scannerSessionId },
            "block",
            scannerBlocked
              ? "Scanner block'u kaldır — bu session yeniden mesaj gönderebilir."
              : "Scanner'ı bloke et — bu session'dan gelen mesajlar reddedilir.",
          )
        }
        disabled={busy !== null}
        className={
          "rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 " +
          (scannerBlocked
            ? "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            : "border border-red-200 text-red-600 hover:bg-red-50")
        }
      >
        {busy === "block"
          ? "…"
          : scannerBlocked
            ? "🔓 Block Kaldır"
            : "🚫 Scanner'ı Bloke Et"}
      </button>

      {/* Sticker recall */}
      <button
        onClick={() =>
          call(
            "/api/admin/stickers/status",
            { stickerId, status: "recall" },
            "recall",
            "Sticker'ı RECALL et — kritik güvenlik/kalite geri çağırma. QR taranırsa 'aktif değil' döner.",
          )
        }
        disabled={busy !== null}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
      >
        {busy === "recall" ? "…" : "🔄 Sticker Recall"}
      </button>

      {/* Conversation resolve */}
      {conversationStatus !== "resolved" && (
        <button
          onClick={() =>
            changeStatus(
              "resolved",
              "Konuşmayı 'Resolved' olarak işaretle — moderation ihtiyacı yok.",
            )
          }
          disabled={busy !== null}
          className="rounded-lg border border-navy/20 px-3 py-1.5 text-xs font-medium text-navy hover:bg-navy/[0.03] disabled:opacity-40"
        >
          {busy === "status" ? "…" : "✓ Resolved işaretle"}
        </button>
      )}

      {conversationStatus !== "active" && (
        <button
          onClick={() =>
            changeStatus("active", "Konuşmayı yeniden aktif et.")
          }
          disabled={busy !== null}
          className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
        >
          {busy === "status" ? "…" : "↩ Aktif et"}
        </button>
      )}
    </div>
  );
}
