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

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="text-sm text-charcoal/60 hover:text-navy">
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
        currentStatus={o.status}
        trackingCarrier={o.tracking_carrier}
        trackingNumber={o.tracking_number}
        adminNote={o.admin_note}
        carriers={CARRIERS}
      />

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
            ["Kargo", `${Number(o.shipping_try).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`],
            ["Toplam", `${Number(o.total_try).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`],
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
