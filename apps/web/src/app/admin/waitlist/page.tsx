/**
 * Admin — Waitlist detay.
 *
 * Bekleme listesi kayıtları — email, locale, referral, tarih.
 * CSV export ile lansman e-postası dağıtımı için kullanılabilir.
 */
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminWaitlistPage() {
  const supabase = createSupabaseServiceClient();

  const { data: rows, count } = await supabase
    .from("waitlist")
    .select("id, email, locale, referral_source, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  const entries = (rows ?? []) as WaitlistRow[];

  // Referral kaynağına göre gruplandır
  const byReferral = entries.reduce<Record<string, number>>((acc, r) => {
    const key = r.referral_source || "direct";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Bekleme Listesi</h1>
          <p className="mt-1 text-sm text-charcoal/60">
            {(count ?? 0).toLocaleString("tr-TR")} kayıt · Landing sayfasından toplanır
          </p>
        </div>
        <a
          href="/api/admin/waitlist/export"
          className="inline-flex items-center gap-2 rounded-lg border border-navy/20 bg-navy px-3 py-1.5 text-xs font-semibold text-accent hover:bg-navy-800"
        >
          📥 CSV indir
        </a>
      </div>

      {/* Referral breakdown */}
      {Object.keys(byReferral).length > 0 && (
        <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-charcoal/60">
            Referral Kaynağı
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byReferral)
              .sort((a, b) => b[1] - a[1])
              .map(([source, count]) => (
                <span
                  key={source}
                  className="inline-flex items-center gap-2 rounded-lg border border-navy/10 bg-navy/[0.03] px-3 py-1 text-xs"
                >
                  <span className="font-medium text-charcoal/70">{source}</span>
                  <span className="rounded-full bg-navy px-1.5 py-0.5 font-bold text-accent tabular-nums">
                    {count}
                  </span>
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-navy/10 bg-navy/[0.02]">
            <tr>
              <Th>Email</Th>
              <Th>Dil</Th>
              <Th>Referral</Th>
              <Th>Kayıt Tarihi</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-charcoal/50">
                  Henüz bekleme listesinde kimse yok.
                </td>
              </tr>
            ) : (
              entries.map((r) => (
                <tr key={r.id} className="transition hover:bg-navy/[0.02]">
                  <Td>
                    <a
                      href={`mailto:${r.email}`}
                      className="text-navy hover:underline"
                    >
                      {r.email}
                    </a>
                  </Td>
                  <Td>{r.locale.toUpperCase()}</Td>
                  <Td>{r.referral_source || <span className="text-charcoal/30">direct</span>}</Td>
                  <Td>
                    <span className="text-xs">
                      {new Date(r.created_at).toLocaleString("tr-TR")}
                    </span>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface WaitlistRow {
  id: string;
  email: string;
  locale: string;
  referral_source: string | null;
  created_at: string;
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-charcoal/60">
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2.5 text-charcoal">{children}</td>;
}
