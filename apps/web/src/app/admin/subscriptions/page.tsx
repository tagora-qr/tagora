/**
 * Admin — Subscription overview + manuel uzatma.
 */
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { SubscriptionFilters } from "./filters";
import { SubscriptionActions } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<{
  status?: string;
  q?: string;
}>;

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const statusFilter = params.status && params.status !== "all" ? params.status : null;
  const q = params.q?.trim() ?? "";

  const supabase = createSupabaseServiceClient();

  let query = supabase
    .from("subscription_overview")
    .select("*")
    .order("subscription_expires_at", { ascending: true, nullsFirst: false });

  if (statusFilter) {
    query = query.eq("current_status", statusFilter);
  }
  if (q) {
    query = query.or(`email.ilike.%${q}%,display_name.ilike.%${q}%`);
  }

  const { data: rows } = await query;
  const list = (rows ?? []) as OverviewRow[];

  // Aggregate: durum bazlı sayaçlar (filtresiz)
  const { data: allRows } = await supabase
    .from("subscription_overview")
    .select("current_status");
  const all = (allRows ?? []) as { current_status: string }[];
  const counts = {
    active: all.filter((r) => r.current_status === "active").length,
    grace: all.filter((r) => r.current_status === "grace").length,
    readonly: all.filter((r) => r.current_status === "readonly").length,
    total: all.length,
  };

  // Revenue: paid subscription_payments toplam
  const { data: paymentsSum } = await supabase
    .from("subscription_payments")
    .select("amount_try")
    .eq("status", "paid");
  const revenue = (paymentsSum ?? []).reduce(
    (sum, p) => sum + Number((p as { amount_try: number }).amount_try),
    0,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Abonelikler</h1>
          <p className="mt-1 text-sm text-charcoal/60">
            {counts.total.toLocaleString("tr-TR")} kullanıcı ·{" "}
            {counts.active} aktif · {counts.grace} grace · {counts.readonly} kapalı
          </p>
        </div>
        <div className="rounded-2xl border border-navy/10 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal/60">
            Toplam Abonelik Geliri
          </p>
          <p className="text-xl font-bold text-navy tabular-nums">
            {revenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
          </p>
        </div>
      </div>

      <SubscriptionFilters currentStatus={statusFilter ?? "all"} currentQ={q} />

      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-navy/10 bg-navy/[0.02]">
            <tr>
              <Th>Kullanıcı</Th>
              <Th>Status</Th>
              <Th>Bitiş</Th>
              <Th align="right">Aktif Sticker</Th>
              <Th align="right">Ödeme</Th>
              <Th>Son Ödeme</Th>
              <Th align="right">İşlem</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {list.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-charcoal/50">
                  Filtreye uyan abonelik yok.
                </td>
              </tr>
            ) : (
              list.map((r) => {
                const expires = r.subscription_expires_at
                  ? new Date(r.subscription_expires_at)
                  : null;
                const now = new Date();
                const remainingDays = expires
                  ? Math.floor(
                      (expires.getTime() - now.getTime()) /
                        (1000 * 60 * 60 * 24),
                    )
                  : null;
                return (
                  <tr key={r.user_id} className="transition hover:bg-navy/[0.02]">
                    <td className="px-3 py-2.5">
                      <div>
                        <p className="font-medium text-navy">
                          {r.display_name || "—"}
                        </p>
                        <p className="text-xs text-charcoal/60">{r.email}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={r.current_status} />
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {expires ? (
                        <div>
                          <p className="text-charcoal">
                            {expires.toLocaleDateString("tr-TR")}
                          </p>
                          {remainingDays !== null && (
                            <p
                              className={
                                "text-[10px] tabular-nums " +
                                (remainingDays > 30
                                  ? "text-charcoal/50"
                                  : remainingDays > 0
                                    ? "text-amber-600"
                                    : "text-red-600")
                              }
                            >
                              {remainingDays > 0
                                ? `${remainingDays} gün kaldı`
                                : `${Math.abs(remainingDays)} gün geçti`}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-charcoal/30">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {r.active_stickers}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {r.paid_count}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-charcoal/60">
                      {r.last_paid_at
                        ? new Date(r.last_paid_at).toLocaleDateString("tr-TR")
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <SubscriptionActions userId={r.user_id} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface OverviewRow {
  user_id: string;
  email: string | null;
  display_name: string | null;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  current_status: string;
  stored_status: string;
  active_stickers: number;
  paid_count: number;
  last_paid_at: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: "Aktif", className: "bg-emerald-50 text-emerald-700" },
    trial: { label: "Trial", className: "bg-blue-50 text-blue-700" },
    grace: { label: "Grace", className: "bg-orange-50 text-orange-700" },
    readonly: { label: "Read-only", className: "bg-red-50 text-red-700" },
    none: { label: "Yok", className: "bg-navy/10 text-charcoal/50" },
    cancelled: { label: "İptal", className: "bg-navy/10 text-charcoal/50" },
  };
  const entry = map[status] ?? {
    label: status,
    className: "bg-navy/5 text-charcoal",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${entry.className}`}
    >
      {entry.label}
    </span>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
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
