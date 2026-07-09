/**
 * Subscription — kullanıcı abonelik durumu + yenileme.
 */
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RenewButton } from "./renew-button";

export const metadata = { title: "Aboneliğim" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const YEARLY_FEE_TRY = 99;

type SearchParams = Promise<{ success?: string; error?: string }>;

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { success, error: paymentError } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/subscription");

  const { data: profileRaw } = await supabase
    .from("users")
    .select(
      "id, email, display_name, subscription_started_at, subscription_expires_at",
    )
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const profile = profileRaw as {
    id: string;
    email: string | null;
    display_name: string | null;
    subscription_started_at: string | null;
    subscription_expires_at: string | null;
  } | null;

  if (!profile) redirect("/dashboard");

  const { data: paymentsRaw } = await supabase
    .from("subscription_payments")
    .select("id, amount_try, period_start, period_end, paid_at, status")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const payments = (paymentsRaw ?? []) as Array<{
    id: string;
    amount_try: number;
    period_start: string;
    period_end: string;
    paid_at: string | null;
    status: string;
  }>;

  const now = new Date();
  const expires = profile.subscription_expires_at
    ? new Date(profile.subscription_expires_at)
    : null;
  const started = profile.subscription_started_at
    ? new Date(profile.subscription_started_at)
    : null;
  const graceEnd = expires
    ? new Date(expires.getTime() + 30 * 24 * 60 * 60 * 1000)
    : null;

  const isActive = expires && now < expires;
  const isGrace = expires && graceEnd && now >= expires && now < graceEnd;
  const isReadonly = expires && graceEnd && now >= graceEnd;
  const isTrial =
    expires &&
    started &&
    expires.getTime() - started.getTime() >
      364 * 24 * 60 * 60 * 1000;

  const remainingMs = expires ? expires.getTime() - now.getTime() : 0;
  const remainingDays = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60 * 24)));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-charcoal/60 hover:text-navy"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy">Aboneliğim</h1>
        <p className="mt-1 text-sm text-charcoal/60">
          Sistem kullanım abonelik durumu ve yenileme geçmişi.
        </p>
      </div>

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">
            ✓ Ödemen alındı — aboneliğin 1 yıl uzatıldı.
          </p>
        </div>
      )}
      {paymentError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-900">
            ⚠️ Ödeme başarısız oldu: {paymentError}
          </p>
        </div>
      )}

      {/* Ana kart */}
      {!profile.subscription_started_at ? (
        <NotStartedCard />
      ) : (
        <StatusCard
          isActive={!!isActive}
          isGrace={!!isGrace}
          isReadonly={!!isReadonly}
          isTrial={!!isTrial}
          expires={expires}
          remainingDays={remainingDays}
        />
      )}

      {/* Yenileme */}
      {profile.subscription_started_at && (
        <div className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-navy">Yenileme</h2>
              <p className="mt-1 text-sm text-charcoal/70">
                Aboneliğini {YEARLY_FEE_TRY} TL karşılığında 1 yıl uzat.
                Bitiş tarihine eklenir — vaktinden önce yeniden ödesen bile
                gün kaybı yok.
              </p>
            </div>
            <p className="whitespace-nowrap text-3xl font-bold text-navy tabular-nums">
              {YEARLY_FEE_TRY} ₺
              <span className="ml-1 text-sm font-normal text-charcoal/50">
                / yıl
              </span>
            </p>
          </div>
          <RenewButton className="mt-4 w-full sm:w-auto" />
          <p className="mt-2 text-[10px] text-charcoal/50">
            KDV dahil · iyzico güvenli ödeme
          </p>
        </div>
      )}

      {/* Ödeme geçmişi */}
      {payments.length > 0 && (
        <div className="rounded-2xl border border-navy/10 bg-white shadow-sm">
          <div className="border-b border-navy/10 px-6 py-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal/60">
              Ödeme Geçmişi
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-navy/[0.02]">
              <tr>
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-charcoal/60">
                  Dönem
                </th>
                <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-charcoal/60">
                  Tutar
                </th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-charcoal/60">
                  Durum
                </th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-charcoal/60">
                  Ödendi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-xs text-charcoal">
                    {new Date(p.period_start).toLocaleDateString("tr-TR")} →{" "}
                    {new Date(p.period_end).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-charcoal">
                    {Number(p.amount_try).toLocaleString("tr-TR", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    ₺
                  </td>
                  <td className="px-4 py-3">
                    <PaymentStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-charcoal/60">
                    {p.paid_at
                      ? new Date(p.paid_at).toLocaleDateString("tr-TR")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusCard({
  isActive,
  isGrace,
  isReadonly,
  isTrial,
  expires,
  remainingDays,
}: {
  isActive: boolean;
  isGrace: boolean;
  isReadonly: boolean;
  isTrial: boolean;
  expires: Date | null;
  remainingDays: number;
}) {
  let color = "emerald";
  let icon = "🎉";
  let title = isTrial ? "İlk Yıl Ücretsiz" : "Aktif";
  let subtitle = expires
    ? `${expires.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} tarihine kadar geçerli`
    : "";

  if (!isActive && isGrace) {
    color = "orange";
    icon = "🟠";
    title = "Ek Süre";
    subtitle = "30 günlük ek süre — sistem normal çalışıyor";
  } else if (isReadonly) {
    color = "red";
    icon = "🔒";
    title = "Cevap Yazma Kapalı";
    subtitle = "Aboneliğini yenile ki tekrar cevap yazabilesin";
  }

  const colors: Record<string, string> = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    orange: "border-orange-300 bg-orange-50 text-orange-900",
    red: "border-red-300 bg-red-50 text-red-900",
  };

  return (
    <div className={`rounded-2xl border p-6 ${colors[color]}`}>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="text-lg font-bold">{title}</p>
          <p className="text-sm opacity-80">{subtitle}</p>
        </div>
      </div>
      {isActive && (
        <div className="mt-4 border-t border-current/10 pt-4">
          <p className="text-xs opacity-70">
            <strong className="text-lg font-bold tabular-nums">
              {remainingDays}
            </strong>{" "}
            gün kaldı
          </p>
        </div>
      )}
    </div>
  );
}

function NotStartedCard() {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">📦</span>
        <div>
          <p className="text-lg font-bold text-navy">Henüz Aboneliğin Yok</p>
          <p className="text-sm text-charcoal/70">
            İlk sticker'ını aktive ettiğinde 1 yıl ücretsiz abonelik başlar.
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <Link
          href={"/shop" as never}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-accent hover:bg-navy-800"
        >
          Sticker Al
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-navy/15 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
        >
          Elimde Var, Ekleyeceğim
        </Link>
      </div>
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    paid: { label: "Ödendi", className: "bg-emerald-50 text-emerald-700" },
    pending: { label: "Beklemede", className: "bg-blue-50 text-blue-700" },
    failed: { label: "Başarısız", className: "bg-red-50 text-red-700" },
    refunded: { label: "İade", className: "bg-navy/10 text-charcoal/60" },
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
