/**
 * Sipariş başarılı sayfası.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Sipariş Alındı · Tagora",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Params = Promise<{ orderNo: string }>;

export default async function OrderSuccessPage({ params }: { params: Params }) {
  const { orderNo } = await params;
  const supabase = createSupabaseServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_no, status, total_try, buyer_name, buyer_email, shipping_address, shipping_city, created_at, paid_at",
    )
    .eq("order_no", orderNo)
    .maybeSingle();

  if (!order) notFound();
  const o = order as {
    id: string;
    order_no: string;
    status: string;
    total_try: number;
    buyer_name: string;
    buyer_email: string;
    shipping_address: string;
    shipping_city: string;
    created_at: string;
    paid_at: string | null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-50 via-white to-white">
      <header className="border-b border-navy/5 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-10 text-center shadow-sm">
          <div className="mb-4 text-6xl">✓</div>
          <h1 className="mb-2 text-3xl font-bold text-navy">
            Siparişin alındı!
          </h1>
          <p className="text-charcoal/70">
            Ödemen başarıyla tamamlandı. Kısa sürede kargoya vereceğiz.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-charcoal/60">
            Sipariş Detayları
          </h2>
          <dl className="space-y-2 text-sm">
            <Row label="Sipariş No" value={<span className="font-mono">{o.order_no}</span>} />
            <Row label="Toplam" value={`${Number(o.total_try).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`} />
            <Row label="Alıcı" value={o.buyer_name} />
            <Row
              label="Kargo Adresi"
              value={
                <span className="text-right">
                  {o.shipping_address}
                  <br />
                  {o.shipping_city}
                </span>
              }
            />
            <Row
              label="Sipariş Tarihi"
              value={new Date(o.paid_at ?? o.created_at).toLocaleString("tr-TR")}
            />
          </dl>
        </div>

        <div className="mt-8 rounded-2xl bg-navy p-6 text-white shadow">
          <h3 className="mb-2 font-bold">📧 E-posta kontrol et</h3>
          <p className="text-sm text-white/80">
            <strong>{o.buyer_email}</strong> adresine sipariş onayı gönderdik.
            Kargoya verildiğinde de takip numarası gelecek.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={`/dashboard/orders/${o.order_no}` as never} className="btn-primary">
            Siparişimi Takip Et →
          </Link>
          <Link href={"/dashboard/orders" as never} className="btn-secondary">
            Tüm Siparişlerim
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-charcoal/50">
          Sonradan tekrar bakmak için:{" "}
          <Link href={"/dashboard/orders" as never} className="font-medium text-navy underline">
            tagora.com.tr/dashboard/orders
          </Link>
        </p>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-navy/5 py-2 last:border-0">
      <dt className="text-charcoal/60">{label}</dt>
      <dd className="text-charcoal font-medium">{value}</dd>
    </div>
  );
}
