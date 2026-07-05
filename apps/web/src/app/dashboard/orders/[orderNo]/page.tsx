/**
 * Kullanıcı sipariş detay + kargo takip.
 * URL: /dashboard/orders/{order_no}  (order_no ile route — kullanıcı dostu)
 *
 * RLS: kullanıcı sadece kendi siparişini görür.
 * Admin note gösterilmez (private).
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Sipariş · Tagora",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ orderNo: string }>;

// Kargo firması takip URL şablonları
const TRACKING_URLS: Record<string, (no: string) => string> = {
  "Aras Kargo": (no) => `https://www.araskargo.com.tr/mainpage/cargo-tracking?code=${no}`,
  "Yurtiçi Kargo": (no) => `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${no}`,
  "MNG Kargo": (no) => `https://kargotakip.mngkargo.com.tr/?takipNo=${no}`,
  "PTT Kargo": (no) => `https://gonderitakip.ptt.gov.tr/Track/Verify?q=${no}`,
  "Sürat Kargo": (no) => `https://www.suratkargo.com.tr/KargoTakip/?kod=${no}`,
};

// Timeline aşamaları
const TIMELINE_STEPS = [
  { key: "pending", label: "Sipariş Alındı", icon: "🛒" },
  { key: "paid", label: "Ödeme Alındı", icon: "💳" },
  { key: "preparing", label: "Hazırlanıyor", icon: "📦" },
  { key: "shipped", label: "Kargoya Verildi", icon: "🚚" },
  { key: "delivered", label: "Teslim Edildi", icon: "✓" },
];

// Bir sonraki step için hangi status "tamamlandı" sayılır?
const STATUS_ORDER = ["pending", "paid", "preparing", "shipped", "delivered"];

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

interface OrderFull {
  id: string;
  order_no: string;
  status: string;
  subtotal_try: number;
  shipping_try: number;
  total_try: number;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_district: string | null;
  shipping_zip: string | null;
  tracking_carrier: string | null;
  tracking_number: string | null;
  customer_note: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

interface OrderItemRow {
  id: string;
  package_name: string;
  sticker_count: number;
  quantity: number;
  unit_price_try: number;
  line_total_try: number;
}

export default async function UserOrderDetailPage({ params }: { params: Params }) {
  const { orderNo } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/orders/${orderNo}`);

  // NOT: admin_note dahil edilmedi — kullanıcı görmemeli
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_no, status, subtotal_try, shipping_try, total_try, buyer_name, buyer_email, buyer_phone, shipping_address, shipping_city, shipping_district, shipping_zip, tracking_carrier, tracking_number, customer_note, created_at, paid_at, shipped_at, delivered_at",
    )
    .eq("order_no", orderNo)
    .maybeSingle();

  if (!order) notFound();
  const o = order as OrderFull;

  const { data: items } = await supabase
    .from("order_items")
    .select("id, package_name, sticker_count, quantity, unit_price_try, line_total_try")
    .eq("order_id", o.id);

  const currentIdx = STATUS_ORDER.indexOf(o.status);
  const isTerminated = ["cancelled", "refunded", "failed"].includes(o.status);
  const trackingUrl = o.tracking_carrier && o.tracking_number
    ? TRACKING_URLS[o.tracking_carrier]?.(o.tracking_number)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href={"/dashboard/orders" as never} className="text-sm text-charcoal/60 hover:text-navy">
          ← Siparişlerim
        </Link>
      </div>

      {/* Hero */}
      <div className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-charcoal/60">
              Sipariş No
            </p>
            <h1 className="mt-1 font-mono text-2xl font-bold text-navy">
              {o.order_no}
            </h1>
            <p className="mt-1 text-xs text-charcoal/50">
              {new Date(o.created_at).toLocaleString("tr-TR")}
            </p>
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

      {/* Timeline */}
      {!isTerminated ? (
        <div className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-charcoal/60">
            Sipariş Durumu
          </h2>
          <ol className="space-y-4">
            {TIMELINE_STEPS.map((step, idx) => {
              const done = idx <= currentIdx;
              const active = idx === currentIdx;
              const stepDate =
                step.key === "paid" && o.paid_at
                  ? o.paid_at
                  : step.key === "shipped" && o.shipped_at
                    ? o.shipped_at
                    : step.key === "delivered" && o.delivered_at
                      ? o.delivered_at
                      : step.key === "pending"
                        ? o.created_at
                        : null;
              return (
                <li key={step.key} className="flex items-start gap-3">
                  <div
                    className={
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg " +
                      (done
                        ? active
                          ? "bg-emerald-500 text-white ring-4 ring-emerald-100"
                          : "bg-emerald-500 text-white"
                        : "bg-navy/5 text-charcoal/30")
                    }
                  >
                    {done ? step.icon : "○"}
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5">
                    <p
                      className={
                        "text-sm font-semibold " +
                        (done ? "text-navy" : "text-charcoal/40")
                      }
                    >
                      {step.label}
                    </p>
                    {stepDate && done && (
                      <p className="mt-0.5 text-xs text-charcoal/50">
                        {new Date(stepDate).toLocaleString("tr-TR")}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <div className="rounded-2xl border border-navy/10 bg-navy/[0.03] p-6 shadow-sm text-center">
          <p className="text-2xl">😞</p>
          <p className="mt-2 font-semibold text-charcoal">
            Sipariş {STATUS_LABEL[o.status]?.toLowerCase()}
          </p>
          <p className="mt-1 text-sm text-charcoal/60">
            Sorun için: <a href="mailto:destek@tagora.com.tr" className="text-navy underline">destek@tagora.com.tr</a>
          </p>
        </div>
      )}

      {/* Kargo takip */}
      {o.tracking_number && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📦</span>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                Kargo Takibi
              </p>
              <p className="mt-1 text-sm text-charcoal">
                <strong>{o.tracking_carrier}</strong>
              </p>
              <p className="mt-0.5 font-mono text-sm text-navy">
                {o.tracking_number}
              </p>
              {trackingUrl && (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Kargomu Takip Et →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sipariş içeriği */}
      <div className="rounded-2xl border border-navy/10 bg-white shadow-sm">
        <div className="border-b border-navy/10 px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal/60">
            Sipariş İçeriği
          </h2>
        </div>
        <div className="divide-y divide-navy/5">
          {((items ?? []) as OrderItemRow[]).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-semibold text-navy">{item.package_name}</p>
                <p className="text-xs text-charcoal/50">
                  {item.sticker_count} sticker × {item.quantity} adet
                </p>
              </div>
              <p className="tabular-nums text-sm font-medium text-charcoal">
                {Number(item.line_total_try).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
              </p>
            </div>
          ))}
        </div>
        <div className="border-t border-navy/10 bg-navy/[0.02] px-4 py-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-charcoal/60">
            <span>Ara toplam</span>
            <span className="tabular-nums">{Number(o.subtotal_try).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
          </div>
          <div className="flex justify-between text-charcoal/60">
            <span>Kargo</span>
            <span className="tabular-nums">{Number(o.shipping_try).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
          </div>
          <div className="flex justify-between border-t border-navy/10 pt-2 text-navy font-bold">
            <span>Toplam</span>
            <span className="tabular-nums">{Number(o.total_try).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
          </div>
        </div>
      </div>

      {/* Kargo adresi */}
      <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-charcoal/60">
          Teslim Adresi
        </h2>
        <p className="text-sm font-semibold text-navy">{o.buyer_name}</p>
        <p className="mt-1 text-sm text-charcoal/70">{o.buyer_phone}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-charcoal">
          {o.shipping_address}
        </p>
        <p className="text-sm text-charcoal">
          {o.shipping_district ? `${o.shipping_district}, ` : ""}
          {o.shipping_city}
          {o.shipping_zip ? ` ${o.shipping_zip}` : ""}
        </p>
      </div>

      {/* Müşteri notu */}
      {o.customer_note && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">
            📝 Notunuz
          </p>
          <p className="text-sm text-charcoal">{o.customer_note}</p>
        </div>
      )}

      {/* Yardım */}
      <div className="rounded-2xl border border-dashed border-navy/15 bg-white/60 p-4 text-center text-sm text-charcoal/60">
        Sipariş hakkında sorunuz mu var?{" "}
        <a href="mailto:destek@tagora.com.tr" className="font-medium text-navy underline">
          destek@tagora.com.tr
        </a>
      </div>
    </div>
  );
}
