/**
 * Admin — Orders liste + filter + pagination.
 */
import Link from "next/link";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { OrdersFilters } from "./filters";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 25;

type SearchParams = Promise<{
  status?: string;
  q?: string;
  page?: string;
}>;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-50 text-blue-700",
  paid: "bg-emerald-50 text-emerald-700",
  preparing: "bg-amber-50 text-amber-700",
  shipped: "bg-indigo-50 text-indigo-700",
  delivered: "bg-purple-50 text-purple-700",
  cancelled: "bg-navy/10 text-charcoal/50",
  refunded: "bg-navy/10 text-charcoal/50",
  failed: "bg-red-50 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Bekliyor",
  paid: "Ödendi",
  preparing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim edildi",
  cancelled: "İptal",
  refunded: "İade",
  failed: "Başarısız",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status = params.status && params.status !== "all" ? params.status : null;
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const supabase = createSupabaseServiceClient();

  let query = supabase
    .from("orders")
    .select(
      "id, order_no, status, total_try, discount_try, coupon_code, buyer_name, buyer_email, shipping_city, created_at, paid_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (q) {
    query = query.or(
      `order_no.ilike.%${q}%,buyer_email.ilike.%${q}%,buyer_name.ilike.%${q}%`,
    );
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: orders, count } = await query;
  const rows = (orders ?? []) as OrderRow[];

  // Aggregate: son 30 gün ciro
  const now = new Date();
  const thirtyAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const { data: paidOrders } = await supabase
    .from("orders")
    .select("total_try, paid_at")
    .eq("status", "paid")
    .gte("paid_at", thirtyAgo.toISOString());

  const revenue30d = (paidOrders ?? []).reduce(
    (sum, o) => sum + Number((o as { total_try: number }).total_try),
    0,
  );

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Siparişler</h1>
          <p className="mt-1 text-sm text-charcoal/60">
            {(count ?? 0).toLocaleString("tr-TR")} sipariş · Sayfa {page}/{totalPages}
          </p>
        </div>
        <div className="rounded-2xl border border-navy/10 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal/60">
            Son 30 gün ciro
          </p>
          <p className="text-xl font-bold text-navy tabular-nums">
            {revenue30d.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
          </p>
        </div>
      </div>

      <OrdersFilters currentStatus={status ?? "all"} currentQ={q} />

      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-navy/10 bg-navy/[0.02]">
            <tr>
              <Th>Sipariş No</Th>
              <Th>Durum</Th>
              <Th>Alıcı</Th>
              <Th>Şehir</Th>
              <Th>Kupon</Th>
              <Th align="right">Tutar</Th>
              <Th>Sipariş</Th>
              <Th>Ödeme</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-charcoal/50">
                  Filtreye uyan sipariş yok.
                </td>
              </tr>
            ) : (
              rows.map((o) => (
                <tr key={o.id} className="transition hover:bg-navy/[0.02]">
                  <Td>
                    <Link
                      href={`/admin/orders/${o.id}` as never}
                      className="font-mono text-xs text-navy hover:underline"
                    >
                      {o.order_no}
                    </Link>
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[o.status] ?? "bg-navy/5 text-charcoal"
                      }`}
                    >
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </Td>
                  <Td>
                    <div>
                      <p className="font-medium text-navy">{o.buyer_name}</p>
                      <p className="text-xs text-charcoal/60">{o.buyer_email}</p>
                    </div>
                  </Td>
                  <Td>{o.shipping_city}</Td>
                  <Td>
                    {o.coupon_code ? (
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
                          🎟️ {o.coupon_code}
                        </span>
                        <span className="tabular-nums text-[10px] text-emerald-700">
                          −{Number(o.discount_try ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                        </span>
                      </div>
                    ) : (
                      <span className="text-charcoal/30">—</span>
                    )}
                  </Td>
                  <Td align="right">
                    <span className="tabular-nums font-medium">
                      {Number(o.total_try).toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      ₺
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs">
                      {new Date(o.created_at).toLocaleDateString("tr-TR")}
                    </span>
                  </Td>
                  <Td>
                    {o.paid_at ? (
                      <span className="text-xs">
                        {new Date(o.paid_at).toLocaleDateString("tr-TR")}
                      </span>
                    ) : (
                      <span className="text-charcoal/30">—</span>
                    )}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} params={params} />
      )}
    </div>
  );
}

interface OrderRow {
  id: string;
  order_no: string;
  status: string;
  total_try: number;
  discount_try: number | null;
  coupon_code: string | null;
  buyer_name: string;
  buyer_email: string;
  shipping_city: string;
  created_at: string;
  paid_at: string | null;
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
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
function Td({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <td className={`px-3 py-2.5 text-charcoal ${align === "right" ? "text-right" : ""}`}>
      {children}
    </td>
  );
}

function Pagination({
  page,
  totalPages,
  params,
}: {
  page: number;
  totalPages: number;
  params: Record<string, string | undefined>;
}) {
  const build = (p: number) => {
    const usp = new URLSearchParams();
    if (params.q) usp.set("q", params.q);
    if (params.status) usp.set("status", params.status);
    usp.set("page", String(p));
    return `/admin/orders?${usp.toString()}`;
  };
  return (
    <div className="flex items-center justify-center gap-2">
      {page > 1 ? (
        <a
          href={build(page - 1)}
          className="rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-sm text-charcoal hover:bg-navy/[0.02]"
        >
          ← Önceki
        </a>
      ) : (
        <span className="rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-sm text-charcoal/30">
          ← Önceki
        </span>
      )}
      <span className="px-3 text-sm text-charcoal/60">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <a
          href={build(page + 1)}
          className="rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-sm text-charcoal hover:bg-navy/[0.02]"
        >
          Sonraki →
        </a>
      ) : (
        <span className="rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-sm text-charcoal/30">
          Sonraki →
        </span>
      )}
    </div>
  );
}
