"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUS_TRANSITIONS: Record<string, { next: string; label: string; danger?: boolean }[]> = {
  pending: [
    { next: "cancelled", label: "❌ İptal Et", danger: true },
  ],
  paid: [
    { next: "preparing", label: "📦 Hazırlanıyor" },
    { next: "cancelled", label: "❌ İptal Et", danger: true },
    { next: "refunded", label: "↩️ İade", danger: true },
  ],
  preparing: [
    { next: "shipped", label: "🚚 Kargoya Ver" },
    { next: "cancelled", label: "❌ İptal Et", danger: true },
  ],
  shipped: [
    { next: "delivered", label: "✓ Teslim Edildi" },
  ],
  delivered: [
    { next: "refunded", label: "↩️ İade", danger: true },
  ],
  cancelled: [],
  refunded: [],
  failed: [
    { next: "cancelled", label: "❌ İptal Olarak İşaretle", danger: true },
  ],
};

interface Props {
  orderId: string;
  currentStatus: string;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  adminNote: string | null;
  carriers: string[];
}

export function OrderActions({
  orderId,
  currentStatus,
  trackingCarrier,
  trackingNumber,
  adminNote,
  carriers,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [showShipping, setShowShipping] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [carrier, setCarrier] = useState(trackingCarrier ?? "");
  const [trackNo, setTrackNo] = useState(trackingNumber ?? "");
  const [note, setNote] = useState(adminNote ?? "");

  const call = async (patch: Record<string, unknown>, key: string, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg + "\n\nEmin misin?")) return;
    setBusy(key);
    try {
      const res = await fetch("/api/admin/orders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, patch }),
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
    <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-charcoal/60">
        Yönetim
      </h2>

      {/* Status transitions */}
      {transitions.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold text-charcoal/60">DURUM DEĞİŞTİR</p>
          <div className="flex flex-wrap gap-2">
            {transitions.map((t) => (
              <button
                key={t.next}
                onClick={() => {
                  const patch: Record<string, unknown> = { status: t.next };
                  if (t.next === "shipped") patch.shipped_at = new Date().toISOString();
                  if (t.next === "delivered") patch.delivered_at = new Date().toISOString();
                  call(
                    patch,
                    "status-" + t.next,
                    `Durumu "${t.label}" yap`,
                  );
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

      {/* Shipping / kargo bilgisi */}
      <div className="mb-4">
        <button
          onClick={() => setShowShipping((s) => !s)}
          className="text-xs font-semibold text-navy hover:underline"
        >
          {showShipping ? "▾" : "▸"} Kargo Bilgisi {trackingNumber ? "(Girildi)" : ""}
        </button>
        {showShipping && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-charcoal">Kargo Firması</span>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full rounded-lg border border-navy/15 px-3 py-1.5 text-sm"
              >
                <option value="">Seç…</option>
                {carriers.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-charcoal">Takip No</span>
              <input
                value={trackNo}
                onChange={(e) => setTrackNo(e.target.value)}
                placeholder="123456789"
                className="w-full rounded-lg border border-navy/15 px-3 py-1.5 text-sm"
              />
            </label>
            <button
              onClick={() =>
                call(
                  { tracking_carrier: carrier || null, tracking_number: trackNo || null },
                  "tracking",
                )
              }
              disabled={busy !== null || !trackNo}
              className="col-span-full rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-accent disabled:opacity-40"
            >
              {busy === "tracking" ? "…" : "Kargo Bilgisini Kaydet"}
            </button>
          </div>
        )}
      </div>

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
              placeholder="İç not — müşteri görmez"
              rows={3}
              className="w-full resize-none rounded-lg border border-navy/15 px-3 py-2 text-sm"
            />
            <button
              onClick={() =>
                call({ admin_note: note || null }, "note")
              }
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
