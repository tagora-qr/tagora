"use client";

/**
 * Konuşma silme butonu — chat header'da.
 * Confirm dialog → messages + conversation delete → /dashboard/inbox'a dön.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface Props {
  conversationId: string;
  scannerName: string;
}

export function DeleteConversationButton({ conversationId, scannerName }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    const ok = window.confirm(
      `${scannerName} ile olan tüm mesajlar ve konuşma kalıcı olarak silinecek.\n\nEmin misin?`,
    );
    if (!ok) return;

    setBusy(true);
    const supabase = createSupabaseBrowserClient();

    const { error: msgErr } = await supabase
      .from("messages")
      .delete()
      .eq("conversation_id", conversationId);
    if (msgErr) {
      setBusy(false);
      alert("Mesaj silme hatası: " + msgErr.message);
      return;
    }

    // Konuşmayı sil — silme başarısını doğrulamak için select() ile
    const { data: deleted, error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId)
      .select("id");

    setBusy(false);
    if (error) {
      alert("Silme hatası: " + error.message);
      return;
    }
    if (!deleted || deleted.length === 0) {
      alert(
        "Silinemedi — yetkin yok görünüyor. Sayfayı yenile veya yönetici ile iletişime geç.",
      );
      return;
    }
    router.push("/dashboard/inbox");
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      title="Konuşmayı sil"
    >
      {busy ? "Siliniyor…" : "Sil"}
    </button>
  );
}
