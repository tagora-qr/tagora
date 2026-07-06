"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUS_TRANSITIONS: Record<string, { next: string; label: string; danger?: boolean }[]> = {
  new: [
    { next: "contacted", label: "📞 İletişime geç" },
    { next: "lost", label: "❌ Kaybedildi", danger: true },
  ],
  contacted: [
    { next: "quoted", label: "💼 Teklif verildi" },
    { next: "lost", label: "❌ Kaybedildi", danger: true },
  ],
  quoted: [
    { next: "converted", label: "🎯 Kazanıldı" },
    { next: "contacted", label: "🔄 Görüşme sürüyor" },
    { next: "lost", label: "❌ Kaybedildi", danger: true },
  ],
  converted: [
    { next: "contacted", label: "🔄 Statüyü geri al" },
  ],
  lost: [
    { next: "contacted", label: "🔄 Yeniden aç" },
  ],
};

interface Props {
  leadId: string;
  currentStatus: string;
  adminNote: string | null;
}

export function LeadActions({ leadId, currentStatus, adminNote }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState(adminNote ?? "");
  const [showNote, setShowNote] = useState(false);

  const call = async (patch: Record<string, unknown>, key: string) => {
    setBusy(key);
    try {
      const res = await fetch("/api/admin/business-leads/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, patch }),
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

  const transitions = STATUS_TRANSITIONS[currentStatus] ?? [];

  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm space-y-5">
      <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal/60">
        Yönetim
      </h2>

      {/* Status transitions */}
      {transitions.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-charcoal/60">STATUS DEĞİŞTİR</p>
          <div className="flex flex-wrap gap-2">
            {transitions.map((t) => (
              <button
                key={t.next}
                onClick={() => {
                  if (!window.confirm(`Statü "${t.label}" yapılsın mı?`)) return;
                  call({ status: t.next }, "status-" + t.next);
                }}
                disabled={busy !== null}
                className={
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 " +
                  (t.danger
                    ? "border border-red-200 text-red-600 hover:bg-red-50"
                    : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50")
                }
              >
                {busy === "status-" + t.next ? "…" : t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Admin note */}
      <div>
        <button
          onClick={() => setShowNote((s) => !s)}
          className="text-xs font-semibold text-navy hover:underline"
        >
          {showNote ? "▾" : "▸"} Admin Notu {adminNote ? "(Yazıldı)" : ""}
        </button>
        {showNote && (
          <div className="mt-3 space-y-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="İç not — kullanıcı görmez. Görüşme özeti, ihtiyaç netliği, sonraki adım..."
              rows={4}
              className="w-full resize-none rounded-lg border border-navy/15 px-3 py-2 text-sm"
            />
            <button
              onClick={() => call({ admin_note: note || null }, "note")}
              disabled={busy !== null}
              className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-accent disabled:opacity-40"
            >
              {busy === "note" ? "…" : "Notu Kaydet"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
