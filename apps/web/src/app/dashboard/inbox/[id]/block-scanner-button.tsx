"use client";

/**
 * Scanner block butonu — sticker sahibi kendi konuşmasında karşı tarafı engelleyebilir.
 * RLS'de scanner_sessions_block_owner policy zaten var, HTTP request'te otomatik enforced.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface Props {
  scannerSessionId: string;
  scannerName: string;
  isBlocked: boolean;
}

export function BlockScannerButton({
  scannerSessionId,
  scannerName,
  isBlocked,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleToggle = async () => {
    const nextValue = !isBlocked;
    const msg = nextValue
      ? `${scannerName}'ı engelle — bu kişiden yeni mesaj alamazsın.`
      : `${scannerName}'ın engelini kaldır — tekrar mesaj gönderebilir.`;
    if (!window.confirm(msg + "\n\nEmin misin?")) return;

    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { data: updated, error } = await supabase
      .from("scanner_sessions")
      .update({ is_blocked: nextValue })
      .eq("id", scannerSessionId)
      .select("id");
    setBusy(false);

    if (error) {
      alert("Hata: " + error.message);
      return;
    }
    if (!updated || updated.length === 0) {
      alert(
        "Değiştirilemedi — yetkin olmayabilir. Sayfayı yenile ve tekrar dene.",
      );
      return;
    }
    router.refresh();
  };

  return (
    <button
      onClick={handleToggle}
      disabled={busy}
      className={
        "rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50 " +
        (isBlocked
          ? "text-emerald-700 hover:bg-emerald-50"
          : "text-red-600 hover:bg-red-50")
      }
      title={isBlocked ? "Engeli kaldır" : "Kişiyi engelle"}
    >
      {busy
        ? "…"
        : isBlocked
          ? "🔓 Engeli Kaldır"
          : "🚫 Engelle"}
    </button>
  );
}
