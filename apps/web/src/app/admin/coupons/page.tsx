/**
 * Admin — Kuponlar liste + form.
 */
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { CouponForm } from "./form";
import { CouponActions } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCouponsPage() {
  const supabase = createSupabaseServiceClient();

  const { data: coupons } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (coupons ?? []) as Coupon[];
  const activeCount = list.filter((c) => c.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Kuponlar</h1>
          <p className="mt-1 text-sm text-charcoal/60">
            {list.length} toplam · {activeCount} aktif
          </p>
        </div>
      </div>

      {/* Yeni kupon formu */}
      <div className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-charcoal/60">
          Yeni Kupon Oluştur
        </h2>
        <CouponForm />
      </div>

      {/* Liste */}
      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-navy/10 bg-navy/[0.02]">
            <tr>
              <Th>Kod</Th>
              <Th>Tür</Th>
              <Th align="right">Değer</Th>
              <Th align="right">Min. Sipariş</Th>
              <Th align="right">Kullanım</Th>
              <Th>Geçerlilik</Th>
              <Th>Durum</Th>
              <Th align="right">İşlem</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {list.length > 0 ? (
              list.map((c) => (
                <tr key={c.id} className="transition hover:bg-navy/[0.02]">
                  <td className="px-3 py-2.5">
                    <div>
                      <p className="font-mono text-sm font-bold text-navy">{c.code}</p>
                      {c.description && (
                        <p className="text-[10px] text-charcoal/50">{c.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium " +
                        (c.type === "percentage"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700")
                      }
                    >
                      {c.type === "percentage" ? "Yüzde" : "Tutar"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-navy">
                    {c.type === "percentage"
                      ? `%${Number(c.value).toFixed(0)}`
                      : `${Number(c.value).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs text-charcoal/60 tabular-nums">
                    {c.min_order_try
                      ? `${Number(c.min_order_try).toLocaleString("tr-TR")} ₺`
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs tabular-nums">
                    <span className="font-medium text-navy">{c.used_count}</span>
                    <span className="text-charcoal/40">
                      {" / "}
                      {c.max_uses ?? "∞"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {c.valid_until ? (
                      <span className="text-charcoal">
                        Son:{" "}
                        {new Date(c.valid_until).toLocaleDateString("tr-TR")}
                      </span>
                    ) : (
                      <span className="text-charcoal/40">Süresiz</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge coupon={c} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <CouponActions couponId={c.id} isActive={c.is_active} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center text-charcoal/50">
                  Henüz kupon yok. Yukarıdan yeni ekle.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_order_try: number | null;
  max_uses: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  description: string | null;
}

function StatusBadge({ coupon }: { coupon: Coupon }) {
  const now = new Date();
  const notStarted =
    coupon.valid_from && new Date(coupon.valid_from) > now;
  const expired =
    coupon.valid_until && new Date(coupon.valid_until) < now;
  const usedUp =
    coupon.max_uses !== null && coupon.used_count >= coupon.max_uses;

  if (!coupon.is_active) {
    return (
      <span className="inline-flex rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-medium text-charcoal/50">
        Pasif
      </span>
    );
  }
  if (notStarted) {
    return (
      <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
        Beklemede
      </span>
    );
  }
  if (expired) {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
        Süresi doldu
      </span>
    );
  }
  if (usedUp) {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
        Tükendi
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
      Aktif
    </span>
  );
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
