"use client";

/**
 * Stickers table filtreleri — use_case + status dropdown.
 * URL parametrelerine yazar, sayfa server-side yeniden render eder.
 */
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const USE_CASES = [
  { value: "all", label: "Tümü" },
  { value: "vehicle", label: "🚗 Araç" },
  { value: "door", label: "🚪 Kapı" },
  { value: "pet", label: "🐾 Pet" },
  { value: "luggage", label: "🧳 Bagaj" },
  { value: "bike", label: "🚲 Bisiklet" },
  { value: "other", label: "📌 Diğer" },
];

const STATUSES = [
  { value: "all", label: "Tümü" },
  { value: "manufactured", label: "Manufactured" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "claimed", label: "Claimed" },
  { value: "active", label: "Active" },
  { value: "blocked", label: "Blocked" },
  { value: "retired", label: "Retired" },
];

interface DesignOpt {
  slug: string;
  name: string;
}

export function StickersTableFilters({
  currentUseCase,
  currentStatus,
  currentDesign,
  designs,
}: {
  currentUseCase: string;
  currentStatus: string;
  currentDesign: string;
  designs: DesignOpt[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page"); // filter değişince page 1'e dön
    startTransition(() => {
      router.push(`/admin/stickers?${params.toString()}` as never);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <label htmlFor="use_case" className="text-xs font-semibold text-charcoal/60">
          USE CASE
        </label>
        <select
          id="use_case"
          value={currentUseCase}
          disabled={pending}
          onChange={(e) => update("use_case", e.target.value)}
          className="rounded-lg border border-navy/15 bg-white px-3 py-1.5 text-sm text-charcoal focus:border-navy focus:outline-none"
        >
          {USE_CASES.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="design" className="text-xs font-semibold text-charcoal/60">
          TASARIM
        </label>
        <select
          id="design"
          value={currentDesign}
          disabled={pending}
          onChange={(e) => update("design", e.target.value)}
          className="rounded-lg border border-navy/15 bg-white px-3 py-1.5 text-sm text-charcoal focus:border-navy focus:outline-none"
        >
          <option value="all">Tümü</option>
          {designs.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
          <option value="none">(tasarımsız)</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="status" className="text-xs font-semibold text-charcoal/60">
          STATUS
        </label>
        <select
          id="status"
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

      {pending && (
        <span className="text-xs text-charcoal/50">Yükleniyor…</span>
      )}

      <div className="ml-auto">
        <ExportButton
          status={currentStatus}
          useCase={currentUseCase}
          design={currentDesign}
        />
      </div>
    </div>
  );
}

function ExportButton({
  status,
  useCase,
  design,
}: {
  status: string;
  useCase: string;
  design: string;
}) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (useCase !== "all") params.set("use_case", useCase);
  if (design !== "all") params.set("design", design);
  const href = `/api/admin/stickers/export${params.toString() ? "?" + params.toString() : ""}`;
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-lg border border-navy/20 bg-navy px-3 py-1.5 text-xs font-semibold text-accent hover:bg-navy-800"
    >
      📥 CSV indir
    </a>
  );
}
