/**
 * Admin — B2B Lead listesi
 * Filter (status + search) + pagination + son 30 gün pipeline widget'ı.
 */
import Link from "next/link";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { LeadFilters } from "./filters";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-100",
  contacted: "bg-amber-50 text-amber-700 border-amber-100",
  quoted: "bg-indigo-50 text-indigo-700 border-indigo-100",
  converted: "bg-emerald-50 text-emerald-700 border-emerald-100",
  lost: "bg-red-50 text-red-700 border-red-100",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Yeni",
  contacted: "İletişimde",
  quoted: "Teklif verildi",
  converted: "Kazanıldı",
  lost: "Kaybedildi",
};

const SECTOR_LABELS: Record<string, string> = {
  fleet: "🚚 Filo",
  hotel: "🏨 Otel",
  vet: "🐾 Veteriner",
  ecommerce: "📦 E-ticaret",
  bike: "🚲 Bike",
  corp: "🎁 Kurumsal",
  other: "Diğer",
};

type Params = Promise<{
  status?: string;
  q?: string;
  page?: string;
}>;

const PAGE_SIZE = 30;

interface LeadRow {
  id: string;
  contact_name: string;
  email: string;
  phone: string | null;
  company_name: string;
  sector: string | null;
  estimated_quantity: number | null;
  custom_design: boolean;
  status: string;
  created_at: string;
}

export default async function AdminBusinessLeadsPage({
  searchParams,
}: {
  searchParams: Params;
}) {
  const { status, q, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const supabase = createSupabaseServiceClient();

  // --- Liste ---
  let listQuery = supabase
    .from("business_leads")
    .select(
      "id, contact_name, email, phone, company_name, sector, estimated_quantity, custom_design, status, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);

  if (status && status !== "all") {
    listQuery = listQuery.eq("status", status);
  }
  if (q) {
    // basit ILIKE arama (email, contact_name, company_name)
    const escaped = q.replace(/[%_]/g, (m) => `\\${m}`);
    listQuery = listQuery.or(
      `email.ilike.%${escaped}%,contact_name.ilike.%${escaped}%,company_name.ilike.%${escaped}%`,
    );
  }

  const { data: leads, count } = await listQuery;
  const list = (leads ?? []) as LeadRow[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  // --- Pipeline widget (last 30d) ---
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [
    { count: total30 },
    { count: newCount },
    { count: contactedCount },
    { count: quotedCount },
    { count: convertedCount },
    { count: lostCount },
  ] = await Promise.all([
    supabase.from("business_leads").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    supabase.from("business_leads").select("id", { count: "exact", head: true }).eq("status", "new").gte("created_at", thirtyDaysAgo),
    supabase.from("business_leads").select("id", { count: "exact", head: true }).eq("status", "contacted").gte("created_at", thirtyDaysAgo),
    supabase.from("business_leads").select("id", { count: "exact", head: true }).eq("status", "quoted").gte("created_at", thirtyDaysAgo),
    supabase.from("business_leads").select("id", { count: "exact", head: true }).eq("status", "converted").gte("created_at", thirtyDaysAgo),
    supabase.from("business_leads").select("id", { count: "exact", head: true }).eq("status", "lost").gte("created_at", thirtyDaysAgo),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">B2B Talepler</h1>
          <p className="mt-1 text-sm text-charcoal/60">
            /business sayfasından gelen kurumsal teklif talepleri
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-charcoal/50">
          <span>Toplam: <strong className="tabular-nums text-charcoal">{count ?? 0}</strong></span>
        </div>
      </div>

      {/* Pipeline (last 30 days) */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-charcoal/60">
          Son 30 Gün Pipeline
        </h2>
        <div className="grid gap-3 sm:grid-cols-6">
          <PipelineCard label="Toplam" value={total30 ?? 0} color="bg-navy/[0.03]" href="/admin/business-leads" />
          <PipelineCard label="Yeni" value={newCount ?? 0} color="bg-blue-50" href="/admin/business-leads?status=new" />
          <PipelineCard label="İletişimde" value={contactedCount ?? 0} color="bg-amber-50" href="/admin/business-leads?status=contacted" />
          <PipelineCard label="Teklif verildi" value={quotedCount ?? 0} color="bg-indigo-50" href="/admin/business-leads?status=quoted" />
          <PipelineCard label="Kazanıldı" value={convertedCount ?? 0} color="bg-emerald-50" href="/admin/business-leads?status=converted" />
          <PipelineCard label="Kaybedildi" value={lostCount ?? 0} color="bg-red-50" href="/admin/business-leads?status=lost" />
        </div>
      </section>

      {/* Filters */}
      <LeadFilters currentStatus={status ?? "all"} currentQuery={q ?? ""} />

      {/* Table */}
      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy/15 bg-navy/[0.02] p-16 text-center text-sm text-charcoal/60">
          <div className="mb-3 text-4xl">📥</div>
          <p>Kriterlere uyan talep bulunamadı.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-navy/10 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-navy/[0.02] border-b border-navy/10">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-charcoal/60">
                <th className="px-4 py-3">Şirket / Kişi</th>
                <th className="px-4 py-3">Sektör</th>
                <th className="px-4 py-3 text-right">Adet</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {list.map((l) => (
                <tr key={l.id} className="transition hover:bg-navy/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-navy">{l.company_name}</p>
                    <p className="text-xs text-charcoal/60">
                      {l.contact_name} · {l.email}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-charcoal">
                    {l.sector ? SECTOR_LABELS[l.sector] ?? l.sector : "—"}
                    {l.custom_design && (
                      <span className="ml-1 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-navy">
                        Özel
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-charcoal">
                    {l.estimated_quantity ? l.estimated_quantity.toLocaleString("tr-TR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium " +
                        (STATUS_COLORS[l.status] ?? "bg-navy/5 border-navy/10 text-charcoal")
                      }
                    >
                      {STATUS_LABELS[l.status] ?? l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-charcoal/60 tabular-nums">
                    {new Date(l.created_at).toLocaleDateString("tr-TR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/business-leads/${l.id}` as never}
                      className="text-xs font-semibold text-navy hover:text-accent"
                    >
                      Aç →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-charcoal/60">
          <span>
            Sayfa <strong className="tabular-nums text-charcoal">{currentPage}</strong> / {totalPages}
          </span>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/admin/business-leads?page=${currentPage - 1}${status ? `&status=${status}` : ""}${q ? `&q=${q}` : ""}` as never}
                className="rounded-lg border border-navy/15 px-3 py-1 hover:bg-navy/5"
              >
                ← Önceki
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/admin/business-leads?page=${currentPage + 1}${status ? `&status=${status}` : ""}${q ? `&q=${q}` : ""}` as never}
                className="rounded-lg border border-navy/15 px-3 py-1 hover:bg-navy/5"
              >
                Sonraki →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* CSV export */}
      <div className="pt-4">
        <a
          href={`/api/admin/business-leads/export${status && status !== "all" ? `?status=${status}` : ""}`}
          className="inline-flex items-center gap-2 rounded-lg border border-navy/15 px-4 py-2 text-xs font-medium text-navy hover:bg-navy/5"
        >
          📥 CSV Export (tümü)
        </a>
      </div>
    </div>
  );
}

function PipelineCard({
  label,
  value,
  color,
  href,
}: {
  label: string;
  value: number;
  color: string;
  href: string;
}) {
  return (
    <Link
      href={href as never}
      className={`block rounded-2xl border border-navy/10 ${color} p-4 shadow-sm transition hover:border-navy/25 hover:shadow-md`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal/60">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-navy">{value}</p>
    </Link>
  );
}
