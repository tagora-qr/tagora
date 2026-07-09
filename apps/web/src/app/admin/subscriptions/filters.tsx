"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

const STATUSES = [
  { value: "all", label: "Tümü" },
  { value: "active", label: "Aktif" },
  { value: "trial", label: "Trial" },
  { value: "grace", label: "Grace" },
  { value: "readonly", label: "Read-only" },
  { value: "none", label: "Başlamamış" },
];

export function SubscriptionFilters({
  currentStatus,
  currentQ,
}: {
  currentStatus: string;
  currentQ: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    startTransition(() => {
      router.push(`/admin/subscriptions?${params.toString()}` as never);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-charcoal/60">DURUM</label>
        <select
          value={currentStatus}
          disabled={pending}
          onChange={(e) => update("status", e.target.value)}
          className="rounded-lg border border-navy/15 bg-white px-3 py-1.5 text-sm text-charcoal focus:border-navy focus:outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-charcoal/60">ARA</label>
        <input
          type="search"
          defaultValue={currentQ}
          placeholder="e-posta veya isim"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              update("q", (e.target as HTMLInputElement).value);
            }
          }}
          className="w-64 rounded-lg border border-navy/15 bg-white px-3 py-1.5 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-navy focus:outline-none"
        />
      </div>

      {pending && <span className="text-xs text-charcoal/50">Yükleniyor…</span>}
    </div>
  );
}
