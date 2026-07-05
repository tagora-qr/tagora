"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const ACTIONS: { label: string; nextStatus: string; confirmMsg: string; danger?: boolean }[] = [
  {
    label: "Block",
    nextStatus: "blocked",
    confirmMsg: "Bu sticker'ı bloke et — mesaj alamaz, tarayınca 'aktif değil' hatası döner.",
    danger: true,
  },
  {
    label: "Retire",
    nextStatus: "retired",
    confirmMsg: "Bu sticker'ı emekliye ayır — kalıcı devre dışı bırakır.",
    danger: true,
  },
  {
    label: "Recall",
    nextStatus: "recall",
    confirmMsg: "Recall — kritik güvenlik/kalite geri çağırma flag'i.",
    danger: true,
  },
  {
    label: "Active'e al",
    nextStatus: "active",
    confirmMsg: "Sticker'ı yeniden aktif et.",
  },
];

export function StickerActions({
  stickerId,
  currentStatus,
}: {
  stickerId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const changeStatus = async (nextStatus: string, confirmMsg: string) => {
    if (!window.confirm(confirmMsg + "\n\nEmin misin?")) return;
    setBusy(nextStatus);

    const supabase = createSupabaseBrowserClient();
    const patch: Record<string, unknown> = { status: nextStatus };
    if (nextStatus === "blocked") patch.blocked_at = new Date().toISOString();

    const { error } = await supabase
      .from("stickers")
      .update(patch)
      .eq("id", stickerId);

    setBusy(null);
    if (error) {
      alert("Değişiklik başarısız: " + error.message);
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.filter((a) => a.nextStatus !== currentStatus).map((a) => (
        <button
          key={a.nextStatus}
          onClick={() => changeStatus(a.nextStatus, a.confirmMsg)}
          disabled={busy !== null}
          className={
            "rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 " +
            (a.danger
              ? "border border-red-200 text-red-600 hover:bg-red-50"
              : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50")
          }
        >
          {busy === a.nextStatus ? "…" : a.label}
        </button>
      ))}
    </div>
  );
}
