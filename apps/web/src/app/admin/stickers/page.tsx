/**
 * Admin Stickers — full table view + filter + pagination + CSV export.
 */
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StickersTableFilters } from "./filters";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 25;

type SearchParams = Promise<{
  status?: string;
  use_case?: string;
  page?: string;
}>;

export default async function AdminStickersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status = params.status && params.status !== "all" ? params.status : null;
  const useCase = params.use_case && params.use_case !== "all" ? params.use_case : null;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const supabase = createSupabaseServiceClient();

  let query = supabase
    .from("stickers")
    .select("id, token, status, use_case, label, owner_id, scan_count, created_at, claimed_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (useCase) query = query.eq("use_case", useCase);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: stickers, count } = await query;

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Stickerlar</h1>
          <p className="mt-1 text-sm text-charcoal/60">
            {(count ?? 0).toLocaleString("tr-TR")} sticker · Sayfa {page}/{totalPages}
          </p>
        </div>
      </div>

      <StickersTableFilters
        currentStatus={status ?? "all"}
        currentUseCase={useCase ?? "all"}
      />

      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-navy/10 bg-navy/[0.02]">
            <tr>
              <Th>Token</Th>
              <Th>Use Case</Th>
              <Th>Status</Th>
              <Th>Label</Th>
              <Th>Owner</Th>
              <Th align="right">Scan</Th>
              <Th>Oluşturulma</Th>
              <Th>Claimed</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {stickers && stickers.length > 0 ? (
              (stickers as unknown as StickerRow[]).map((s) => (
                <tr key={s.id} className="transition hover:bg-navy/[0.02]">
                  <Td>
                    <span className="font-mono text-xs">{s.token}</span>
                  </Td>
                  <Td>
                    <UseCaseBadge value={s.use_case} />
                  </Td>
                  <Td>
                    <StatusBadge value={s.status} />
                  </Td>
                  <Td>{s.label || <span className="text-charcoal/30">—</span>}</Td>
                  <Td>
                    {s.owner_id ? (
                      <span className="font-mono text-[10px] text-charcoal/60">
                        {s.owner_id.slice(0, 8)}…
                      </span>
                    ) : (
                      <span className="text-charcoal/30">—</span>
                    )}
                  </Td>
                  <Td align="right">
                    <span className="tabular-nums">{s.scan_count.toLocaleString("tr-TR")}</span>
                  </Td>
                  <Td>
                    <span className="text-xs">
                      {new Date(s.created_at).toLocaleDateString("tr-TR")}
                    </span>
                  </Td>
                  <Td>
                    {s.claimed_at ? (
                      <span className="text-xs">
                        {new Date(s.claimed_at).toLocaleDateString("tr-TR")}
                      </span>
                    ) : (
                      <span className="text-charcoal/30">—</span>
                    )}
                  </Td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center text-charcoal/50">
                  Filtreye uyan sticker yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <PageLink
            page={page - 1}
            disabled={page === 1}
            status={status}
            useCase={useCase}
          >
            ← Önceki
          </PageLink>
          <span className="px-3 text-sm text-charcoal/60">
            {page} / {totalPages}
          </span>
          <PageLink
            page={page + 1}
            disabled={page >= totalPages}
            status={status}
            useCase={useCase}
          >
            Sonraki →
          </PageLink>
        </div>
      )}
    </div>
  );
}

interface StickerRow {
  id: string;
  token: string;
  status: string;
  use_case: string | null;
  label: string | null;
  owner_id: string | null;
  scan_count: number;
  created_at: string;
  claimed_at: string | null;
}

function Th({ children, align }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-charcoal/60 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
function Td({ children, align }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <td className={`px-3 py-2.5 text-charcoal ${align === "right" ? "text-right" : ""}`}>
      {children}
    </td>
  );
}

const STATUS_COLORS: Record<string, string> = {
  manufactured: "bg-blue-50 text-blue-700",
  shipped: "bg-indigo-50 text-indigo-700",
  delivered: "bg-purple-50 text-purple-700",
  claimed: "bg-amber-50 text-amber-700",
  active: "bg-emerald-50 text-emerald-700",
  blocked: "bg-red-50 text-red-700",
  retired: "bg-navy/10 text-navy/50",
  recall: "bg-red-100 text-red-800",
};

function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        STATUS_COLORS[value] ?? "bg-navy/5 text-charcoal"
      }`}
    >
      {value}
    </span>
  );
}

const USE_CASE_EMOJI: Record<string, string> = {
  vehicle: "🚗",
  door: "🚪",
  pet: "🐾",
  luggage: "🧳",
  bike: "🚲",
  other: "📌",
};

function UseCaseBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-charcoal/30">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span>{USE_CASE_EMOJI[value] ?? "📌"}</span>
      <span className="text-charcoal/70">{value}</span>
    </span>
  );
}

function PageLink({
  page,
  disabled,
  children,
  status,
  useCase,
}: {
  page: number;
  disabled: boolean;
  children: React.ReactNode;
  status: string | null;
  useCase: string | null;
}) {
  if (disabled) {
    return (
      <span className="rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-sm text-charcoal/30">
        {children}
      </span>
    );
  }
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (status) params.set("status", status);
  if (useCase) params.set("use_case", useCase);
  return (
    <Link
      href={`/admin/stickers?${params.toString()}` as never}
      className="rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-sm text-charcoal hover:border-navy/30 hover:bg-navy/[0.02]"
    >
      {children}
    </Link>
  );
}
