"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function UsersFilters({
  currentQ,
  currentTier,
  currentRole,
  showDeleted,
}: {
  currentQ: string;
  currentTier: string;
  currentRole: string;
  showDeleted: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(currentQ);

  const updateURL = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "" || v === "all" || v === "false") {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    }
    params.delete("page"); // filter değişince page 1'e dön
    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateURL({ q });
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
          placeholder="email veya ad"
          className="w-64 rounded-lg border border-navy/15 bg-white px-3 py-1.5 text-sm text-charcoal focus:border-navy focus:outline-none"
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
        <label htmlFor="role" className="text-xs font-semibold text-charcoal/60">
          ROLE
        </label>
        <select
          id="role"
          value={currentRole}
          disabled={pending}
          onChange={(e) => updateURL({ role: e.target.value })}
          className="rounded-lg border border-navy/15 bg-white px-3 py-1.5 text-sm text-charcoal focus:border-navy focus:outline-none"
        >
          <option value="all">Tümü</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="tier" className="text-xs font-semibold text-charcoal/60">
          TIER
        </label>
        <select
          id="tier"
          value={currentTier}
          disabled={pending}
          onChange={(e) => updateURL({ tier: e.target.value })}
          className="rounded-lg border border-navy/15 bg-white px-3 py-1.5 text-sm text-charcoal focus:border-navy focus:outline-none"
        >
          <option value="all">Tümü</option>
          <option value="free">Free</option>
          <option value="plus">Plus</option>
          <option value="business">Business</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-xs text-charcoal/60">
        <input
          type="checkbox"
          checked={showDeleted}
          onChange={(e) => updateURL({ deleted: e.target.checked ? "true" : null })}
          disabled={pending}
        />
        Silinmiş kullanıcıları göster
      </label>

      {pending && <span className="text-xs text-charcoal/50">Yükleniyor…</span>}
    </div>
  );
}
