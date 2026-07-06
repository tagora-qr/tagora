"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const STATUS_OPTIONS = [
  { value: "all", label: "Tümü" },
  { value: "new", label: "Yeni" },
  { value: "contacted", label: "İletişimde" },
  { value: "quoted", label: "Teklif verildi" },
  { value: "converted", label: "Kazanıldı" },
  { value: "lost", label: "Kaybedildi" },
];

export function LeadFilters({
  currentStatus,
  currentQuery,
}: {
  currentStatus: string;
  currentQuery: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [query, setQuery] = useState(currentQuery);

  useEffect(() => {
    setStatus(currentStatus);
    setQuery(currentQuery);
  }, [currentStatus, currentQuery]);

  const apply = (newStatus: string, newQuery: string) => {
    const params = new URLSearchParams();
    if (newStatus && newStatus !== "all") params.set("status", newStatus);
    if (newQuery) params.set("q", newQuery);
    const search = params.toString();
    router.push(`/admin/business-leads${search ? `?${search}` : ""}` as never);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-1">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => apply(opt.value, query)}
            className={
              "rounded-lg px-3 py-1.5 text-xs font-medium transition " +
              (status === opt.value
                ? "bg-navy text-accent"
                : "border border-navy/15 text-charcoal hover:bg-navy/5")
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply(status, query);
        }}
        className="flex flex-1 gap-2 sm:max-w-md"
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Şirket / kişi / email ara..."
          className="flex-1 rounded-lg border border-navy/15 bg-white px-3 py-1.5 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
        />
        <button
          type="submit"
          className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-accent hover:bg-navy/90"
        >
          Ara
        </button>
      </form>
    </div>
  );
}
