/**
 * Admin — Order detay + status update + kargo bilgisi.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { OrderActions } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ id: string }>;

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

const CARRIERS = ["Aras Kargo", "Yurtiçi Kargo", "MNG Kargo", "PTT Kargo", "Sürat Kargo"];

export default async function AdminOrderDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = createSupabaseServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();
  const o = order as OrderFull;

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id);

  // Tasarımlar (lookup için)
  const { data: designsData } = await supabase
    .from("sticker_designs")
    .select("id, slug, name")
    .order("sort_order", { ascending: true });
  const designs = (designsData ?? []) as Array<{
    id: string;
    slug: string;
    name: string;
  }>;
  const designById = new Map(designs.map((d) => [d.id, d]));

  // Karma paket allocations — talep edilen tasarım dağılımı
  const { data: allocationsData } = await supabase
    .from("order_design_allocations")
    .select("design_id, quantity")
    .eq("order_id", id);
  const designAllocations = (allocationsData ?? []) as Array<{
    design_id: string;
    quantity: number;
  }>;

  // Fulfilment — atanan sticker'lar (design_id ile beraber)
  const { data: assignedStickers } = await supabase
    .from("stickers")
    .select("id, token, status, allocated_at, design_id")
    .eq("order_id", id)
    .order("allocated_at", { ascending: true });

  // Design bazlı: talep vs. atanan
  const assignedByDesign = new Map<string, number>();
  ((assignedStickers ?? []) as Array<{ design_id: string | null }>).forEach((s) => {
    if (s.design_id) {
      assignedByDesign.set(s.design_id, (assignedByDesign.get(s.design_id) ?? 0) + 1);
    }
  });

  const [demandRes, allocatedRes] = await Promise.all([
    supabase.rpc("order_sticker_demand" as never, { _order_id: id } as never),
    supabase.rpc("order_sticker_allocated" as never, { _order_id: id } as never),
  ]);
  const demand = (demandRes.data as unknown as number | null) ?? 0;
  const allocated = (allocatedRes.data as unknown as number | null) ?? 0;

  return (
    <div className="space-y-6">
      <Link href={"/admin/orders" as never} className="text-sm text-charcoal/60 hover:text-navy">
        ← Siparişler
      </Link>

      {/* Hero */}
      <div className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-charcoal/60">
              Sipariş No
            </p>
            <h1 className="mt-1 font-mono text-2xl font-bold text-navy">
              {o.order_no}
            </h1>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  STATUS_COLORS[o.status] ?? "bg-navy/5 text-charcoal"
                }`}
              >
                {STATUS_LABEL[o.status] ?? o.status}
              </span>
              <span className="text-xs text-charcoal/50">
                {new Date(o.created_at).toLocaleString("tr-TR")}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-charcoal/60">
              Toplam
            </p>
            <p className="mt-1 text-3xl font-bold text-navy tabular-nums">
              {Number(o.total_try).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <OrderActions
        orderId={o.id}
        orderNo={o.order_no}
        currentStatus={o.status}
        trackingCarrier={o.tracking_carrier}
        trackingNumber={o.tracking_number}
        adminNote={o.admin_note}
        carriers={CARRIERS}
        demand={demand}
        allocated={allocated}
      />

      {/* Tasarım Dağılımı (karma paket) */}
      {designAllocations.length > 0 && (
        <div className="rounded-2xl border border-navy/10 bg-white shadow-sm">
          <div className="border-b border-navy/10 px-4 py-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal/60">
              🎨 Tasarım Dağılımı
            </h2>
            <p className="mt-0.5 text-xs text-charcoal/50">
              Müşterinin seçtiği karışım — her tasarımdan kaç adet talep + kaç atandı
            </p>
          </div>
          <div className="divide-y divide-navy/5">
            {designAllocations
              .sort((a, b) => {
                const da = designById.get(a.design_id);
                const db = designById.get(b.design_id);
                return (da?.slug ?? "").localeCompare(db?.slug ?? "");
              })
              .map((a) => {
                const design = designById.get(a.design_id);
                const assigned = assignedByDesign.get(a.design_id) ?? 0;
                const pct = a.quantity > 0 ? Math.round((assigned / a.quantity) * 100) : 0;
                const complete = assigned === a.quantity;
                return (
                  <div
                    key={a.design_id}
                    className="flex items-center gap-4 px-4 py-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <DesignDot slug={design?.slug ?? ""} />
                        <p className="text-sm font-semibold text-navy">
                          {design?.name ?? "Bilinmiyor"}
                        </p>
                        <span className="text-xs text-charcoal/50 font-mono">
                          {design?.slug ?? "—"}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy/[0.05]">
                        <div
                          className={
                            "h-full transition-all " +
                            (complete ? "bg-emerald-500" : "bg-amber-500")
                          }
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums text-sm font-bold text-navy">
                        {assigned} / {a.quantity}
                      </p>
                      <p className="text-[10px] text-charcoal/50">
                        {complete ? "✓ tamam" : `${pct}%`}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Atanan sticker'lar */}
      {(assignedStickers ?? []).length > 0 && (
        <div className="rounded-2xl border border-navy/10 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-navy/10 px-4 py-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal/60">
              Atanan Sticker'lar ({(assignedStickers ?? []).length}/{demand})
            </h2>
            <a
              href={`/api/admin/orders/${o.id}/packing-slip`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-navy hover:underline"
            >
              🖨️ Packing Slip →
            </a>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-navy/[0.02]">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-charcoal/60">Token</th>
                  <th className="px-4 py-2 text-left font-semibold text-charcoal/60">Tasarım</th>
                  <th className="px-4 py-2 text-left font-semibold text-charcoal/60">Status</th>
                  <th className="px-4 py-2 text-left font-semibold text-charcoal/60">Atandı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {((assignedStickers ?? []) as {
                  id: string;
                  token: string;
                  status: string;
                  allocated_at: string | null;
                  design_id: string | null;
                }[]).map((s) => {
                  const design = s.design_id ? designById.get(s.design_id) : null;
                  return (
                    <tr key={s.id}>
                      <td className="px-4 py-2 font-mono">{s.token}</td>
                      <td className="px-4 py-2">
                        {design ? (
                          <span className="inline-flex items-center gap-1.5">
                            <DesignDot slug={design.slug} />
                            <span className="text-charcoal">{design.name}</span>
                          </span>
                        ) : (
                          <span className="text-charcoal/30">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span className={
                          "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium " +
                          (s.status === "allocated" ? "bg-amber-50 text-amber-700"
                            : s.status === "shipped" ? "bg-indigo-50 text-indigo-700"
                            : s.status === "delivered" ? "bg-purple-50 text-purple-700"
                            : s.status === "claimed" || s.status === "active" ? "bg-emerald-50 text-emerald-700"
                            : "bg-navy/5 text-charcoal")
                        }>{s.status}</span>
                      </td>
                      <td className="px-4 py-2 text-charcoal/60 tabular-nums">
                        {s.allocated_at ? new Date(s.allocated_at).toLocaleString("tr-TR") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid: buyer + shipping + payment */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Alıcı">
          <DL rows={[
            ["Ad", o.buyer_name],
            ["E-posta", <a key="e" href={`mailto:${o.buyer_email}`} className="text-navy hover:underline">{o.buyer_email}</a>],
            ["Telefon", <a key="p" href={`tel:${o.buyer_phone}`} className="text-navy hover:underline">{o.buyer_phone}</a>],
            ["TC Kimlik", o.buyer_identity_number ?? "—"],
          ]} />
        </Card>

        <Card title="Kargo Adresi">
          <div className="space-y-1 text-sm">
            <p className="whitespace-pre-wrap text-charcoal">{o.shipping_address}</p>
            <p className="text-charcoal">
              {o.shipping_district ? `${o.shipping_district}, ` : ""}
              {o.shipping_city}
              {o.shipping_zip ? ` ${o.shipping_zip}` : ""}
            </p>
          </div>
          {o.tracking_number && (
            <div className="mt-4 border-t border-navy/10 pt-3 space-y-1 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                📦 Kargoda
              </p>
              <p className="text-charcoal">
                <strong>{o.tracking_carrier}</strong> · {o.tracking_number}
              </p>
            </div>
          )}
        </Card>

        <Card title="Ödeme">
          <DL rows={[
            ["Ara toplam", `${Number(o.subtotal_try).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`],
            ...(Number(o.discount_try ?? 0) > 0
              ? [
                  [
                    o.coupon_code ? `İndirim (${o.coupon_code})` : "İndirim",
                    <span key="d" className="text-emerald-700 tabular-nums">
                      −{Number(o.discount_try ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                    </span>,
                  ] as [string, React.ReactNode],
                ]
              : []),
            ["Kargo", `${Number(o.shipping_try).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`],
            ["Toplam", <strong key="t">{`${Number(o.total_try).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`}</strong>],
            ["iyzico Payment ID", o.iyzico_payment_id ? <span key="p" className="font-mono text-[10px]">{o.iyzico_payment_id}</span> : "—"],
            ["Ödeme Tarihi", o.paid_at ? new Date(o.paid_at).toLocaleString("tr-TR") : "—"],
          ]} />
        </Card>
      </div>

      {/* Order items */}
      <div className="rounded-2xl border border-navy/10 bg-white shadow-sm">
        <div className="border-b border-navy/10 px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal/60">
            Sipariş İçeriği
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-navy/[0.02]">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-charcoal/60">Paket</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-charcoal/60">Sticker</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-charcoal/60">Adet</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-charcoal/60">Birim</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-charcoal/60">Toplam</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {((items ?? []) as OrderItemRow[]).map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-navy">{item.package_name}</p>
                  <p className="text-xs text-charcoal/50 font-mono">{item.package_slug}</p>
                </td>
                <td className="px-4 py-3 text-sm text-charcoal">{item.sticker_count}</td>
                <td className="px-4 py-3 text-right tabular-nums">{item.quantity}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {Number(item.unit_price_try).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">
                  {Number(item.line_total_try).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes */}
      {o.customer_note && (
        <div className="rounded-2xl border border-navy/10 bg-amber-50/40 p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">
            📝 Müşteri Notu
          </p>
          <p className="text-sm text-charcoal">{o.customer_note}</p>
        </div>
      )}

      {o.admin_note && (
        <div className="rounded-2xl border border-navy/10 bg-navy/[0.03] p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-charcoal/60 mb-2">
            🔒 Admin Notu (private)
          </p>
          <p className="text-sm text-charcoal whitespace-pre-wrap">{o.admin_note}</p>
        </div>
      )}
    </div>
  );
}

interface OrderFull {
  id: string;
  order_no: string;
  user_id: string | null;
  status: string;
  subtotal_try: number;
  shipping_try: number;
  total_try: number;
  discount_try: number | null;
  coupon_id: string | null;
  coupon_code: string | null;
  iyzico_payment_id: string | null;
  iyzico_conversation_id: string | null;
  iyzico_token: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_identity_number: string | null;
  shipping_address: string;
  shipping_city: string;
  shipping_district: string | null;
  shipping_zip: string | null;
  tracking_carrier: string | null;
  tracking_number: string | null;
  customer_note: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}
interface OrderItemRow {
  id: string;
  package_name: string;
  package_slug: string;
  sticker_count: number;
  quantity: number;
  unit_price_try: number;
  line_total_try: number;
}

function DesignDot({ slug }: { slug: string }) {
  const colors: Record<string, string> = {
    split: "bg-emerald-500",
    fresh: "bg-lime-500",
    ocean: "bg-blue-500",
    classic: "bg-navy",
  };
  return (
    <span
      className={
        "inline-block h-2.5 w-2.5 rounded-full " +
        (colors[slug] ?? "bg-charcoal/30")
      }
      aria-hidden
    />
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-charcoal/60">
        {title}
      </h3>
      {children}
    </div>
  );
}
function DL({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-y divide-navy/5">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 py-2 text-sm">
          <dt className="text-charcoal/60">{k}</dt>
          <dd className="text-right text-charcoal font-medium">{v || <span className="text-charcoal/30">—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}
