/**
 * Kullanıcı sipariş geçmişi — /dashboard/orders
 *
 * RLS: users_own_orders policy sayesinde user sadece kendi siparişlerini görür.
 * Normal supabase server client kullanıyoruz (service değil).
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Siparişlerim · Tagora",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-50 text-blue-700 border-blue-100",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-100",
  preparing: "bg-amber-50 text-amber-700 border-amber-100",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-100",
  delivered: "bg-purple-50 text-purple-700 border-purple-100",
  cancelled: "bg-navy/5 text-charcoal/50 border-navy/10",
  refunded: "bg-navy/5 text-charcoal/50 border-navy/10",
  failed: "bg-red-50 text-red-700 border-red-100",
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

interface OrderRow {
  id: string;
  order_no: string;
  status: string;
  total_try: number;
  created_at: string;
  paid_at: string | null;
  shipping_city: string;
  tracking_number: string | null;
  tracking_carrier: string | null;
}

export default async function UserOrdersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/orders");

  // Kendi user_id'sini bul
  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const userId = (profile as { id?: string } | null)?.id;

  const { data: orders } = userId
    ? await supabase
        .from("orders")
        .select(
          "id, order_no, status, total_try, created_at, paid_at, shipping_city, tracking_number, tracking_carrier",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
    : { data: [] };

  const list = (orders ?? []) as OrderRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Siparişlerim</h1>
          <p className="mt-1 text-sm text-charcoal/60">
            Sticker siparişlerinin durumunu buradan takip edebilirsin.
          </p>
        </div>
        <Link href="/shop" className="btn-secondary text-sm">
          + Yeni Sipariş
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy/20 bg-white/60 p-12 text-center">
          <div className="mb-3 text-5xl">🛒</div>
          <h2 className="text-lg font-bold text-navy">Henüz siparişin yok</h2>
          <p className="mt-2 text-sm text-charcoal/60">
            Sticker'larını yenilemek için mağazamıza göz at.
          </p>
          <Link href="/shop" className="btn-primary mt-6 inline-block">
            Mağazaya Git →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((o) => (
            <Link
              key={o.id}
              href={`/dashboard/orders/${o.order_no}` as never}
              className="block rounded-2xl border border-navy/10 bg-white p-5 shadow-sm transition hover:border-navy/25 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-navy">
                      {o.order_no}
                    </span>
                    <span
                      className={
                        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium " +
                        (STATUS_COLORS[o.status] ?? "bg-navy/5 border-navy/10 text-charcoal")
                      }
                    >
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-charcoal/50">
                    {new Date(o.paid_at ?? o.created_at).toLocaleDateString("tr-TR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                    {" · "}
                    {o.shipping_city}
                  </p>
                  {o.tracking_number && (
                    <p className="mt-1.5 text-xs text-indigo-700">
                      📦 <strong>{o.tracking_carrier}</strong> — {o.tracking_number}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-navy tabular-nums">
                    {Number(o.total_try).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                  </p>
                  <p className="mt-1 text-xs text-accent">Detay →</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
