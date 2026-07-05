"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const STATUSES = [
  { v: "all", label: "Tümü" },
  { v: "pending", label: "Bekliyor" },
  { v: "paid", label: "Ödendi" },
  { v: "preparing", label: "Hazırlanıyor" },
  { v: "shipped", label: "Kargoda" },
  { v: "delivered", label: "Teslim edildi" },
  { v: "cancelled", label: "İptal" },
  { v: "refunded", label: "İade" },
  { v: "failed", label: "Başarısız" },
];

export function OrdersFilters({
  currentStatus,
  currentQ,
}: {
  currentStatus: string;
  currentQ: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(currentQ);

  const update = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "" || v === "all") params.delete(k);
      else params.set(k, v);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`/admin/orders?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ q });
        }}
        className="flex items-center gap-2"
      >
        <label htmlFor="q" className="text-xs font-semibold text-charcoal/60">
          ARAMA
        </label>
        <input
          id="q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Sipariş no, email veya ad"
          className="w-72 rounded-lg border border-navy/15 bg-white px-3 py-1.5 text-sm text-charcoal focus:border-navy focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-navy/15 bg-white px-3 py-1.5 text-xs font-medium text-charcoal hover:bg-navy/[0.03]"
        >
          Ara
        </button>
      </form>

      <div className="flex items-center gap-2">
        <label htmlFor="status" className="text-xs font-semibold text-charcoal/60">
          DURUM
        </label>
        <select
          id="status"
          value={currentStatus}
          disabled={pending}
          onChange={(e) => update({ status: e.target.value })}
          className="rounded-lg border border-navy/15 bg-white px-3 py-1.5 text-sm text-charcoal focus:border-navy focus:outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s.v} value={s.v}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {pending && <span className="text-xs text-charcoal/50">Yükleniyor…</span>}
    </div>
  );
}
