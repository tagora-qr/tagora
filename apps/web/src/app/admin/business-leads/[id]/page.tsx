/**
 * Admin — B2B Lead detay
 * Tüm form + UTM + status update + admin note + email/tel shortcuts.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { LeadActions } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-50 text-blue-700",
  contacted: "bg-amber-50 text-amber-700",
  quoted: "bg-indigo-50 text-indigo-700",
  converted: "bg-emerald-50 text-emerald-700",
  lost: "bg-red-50 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Yeni",
  contacted: "İletişimde",
  quoted: "Teklif verildi",
  converted: "Kazanıldı",
  lost: "Kaybedildi",
};

const SECTOR_LABELS: Record<string, string> = {
  fleet: "Filo & Kargo",
  hotel: "Otel & AirBnB",
  vet: "Veteriner Klinikleri",
  ecommerce: "E-ticaret & Lojistik",
  bike: "Kiralık Bike / Scooter",
  corp: "Kurumsal Hediyelik",
  other: "Diğer",
};

interface LeadFull {
  id: string;
  contact_name: string;
  email: string;
  phone: string | null;
  company_name: string;
  company_size: string | null;
  sector: string | null;
  estimated_quantity: number | null;
  custom_design: boolean;
  message: string | null;
  source: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export default async function AdminBusinessLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createSupabaseServiceClient();
  const { data: lead } = await supabase
    .from("business_leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!lead) notFound();
  const l = lead as LeadFull;

  return (
    <div className="space-y-6">
      <Link href={"/admin/business-leads" as never} className="text-sm text-charcoal/60 hover:text-navy">
        ← B2B Talepler
      </Link>

      {/* Hero */}
      <div className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-charcoal/60">
              Şirket
            </p>
            <h1 className="mt-1 text-2xl font-bold text-navy">{l.company_name}</h1>
            <p className="mt-1 text-sm text-charcoal/70">
              <strong>{l.contact_name}</strong>
              {l.company_size ? ` · ${l.company_size} kişilik` : ""}
              {l.sector ? ` · ${SECTOR_LABELS[l.sector] ?? l.sector}` : ""}
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span
                className={
                  "inline-flex rounded-full px-2.5 py-0.5 font-medium " +
                  (STATUS_COLORS[l.status] ?? "bg-navy/5 text-charcoal")
                }
              >
                {STATUS_LABELS[l.status] ?? l.status}
              </span>
              <span className="text-charcoal/50">
                {new Date(l.created_at).toLocaleString("tr-TR")}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <a
              href={`mailto:${l.email}?subject=Re:%20Tagora%20Business%20teklifi%20%E2%80%94%20${encodeURIComponent(l.company_name)}`}
              className="rounded-lg bg-navy px-4 py-2 text-xs font-semibold text-accent hover:bg-navy/90"
            >
              📧 Email Yanıt
            </a>
            {l.phone && (
              <a
                href={`tel:${l.phone}`}
                className="rounded-lg border border-navy/15 px-4 py-2 text-xs font-medium text-navy hover:bg-navy/5"
              >
                📞 Ara
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <LeadActions
        leadId={l.id}
        currentStatus={l.status}
        adminNote={l.admin_note}
      />

      {/* Grid: kişi + şirket + ihtiyaç */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Kişi">
          <DL rows={[
            ["Ad Soyad", l.contact_name],
            ["Email", <a key="e" href={`mailto:${l.email}`} className="text-navy hover:underline">{l.email}</a>],
            ["Telefon", l.phone ? <a key="p" href={`tel:${l.phone}`} className="text-navy hover:underline">{l.phone}</a> : "—"],
          ]} />
        </Card>

        <Card title="Şirket">
          <DL rows={[
            ["Şirket", l.company_name],
            ["Boyut", l.company_size ?? "—"],
            ["Sektör", l.sector ? SECTOR_LABELS[l.sector] ?? l.sector : "—"],
          ]} />
        </Card>

        <Card title="İhtiyaç">
          <DL rows={[
            ["Tahmini adet", l.estimated_quantity ? l.estimated_quantity.toLocaleString("tr-TR") : "Belirtilmedi"],
            ["Özel tasarım", l.custom_design ? "Evet ✓" : "Hayır"],
          ]} />
        </Card>
      </div>

      {/* Mesaj */}
      {l.message && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-800">
            💬 Kullanıcının Mesajı
          </p>
          <p className="text-sm text-charcoal whitespace-pre-wrap leading-relaxed">
            {l.message}
          </p>
        </div>
      )}

      {/* Admin note */}
      {l.admin_note && (
        <div className="rounded-2xl border border-navy/10 bg-navy/[0.03] p-5 shadow-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-charcoal/60">
            🔒 Admin Notu (dahili)
          </p>
          <p className="text-sm text-charcoal whitespace-pre-wrap leading-relaxed">
            {l.admin_note}
          </p>
        </div>
      )}

      {/* Attribution */}
      {(l.utm_source || l.utm_medium || l.utm_campaign || l.source) && (
        <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-charcoal/60">
            📊 Attribution
          </p>
          <DL rows={[
            ["Source", l.source],
            ["UTM Source", l.utm_source ?? "—"],
            ["UTM Medium", l.utm_medium ?? "—"],
            ["UTM Campaign", l.utm_campaign ?? "—"],
          ]} />
        </div>
      )}

      {/* Meta */}
      <div className="text-xs text-charcoal/50">
        Oluşturuldu: {new Date(l.created_at).toLocaleString("tr-TR")} ·
        Son güncelleme: {new Date(l.updated_at).toLocaleString("tr-TR")} ·
        ID: <span className="font-mono">{l.id}</span>
      </div>
    </div>
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
          <dd className="text-right text-charcoal font-medium">
            {v || <span className="text-charcoal/30">—</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
