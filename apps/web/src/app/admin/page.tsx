/**
 * Admin Overview — üst düzey metrikler.
 *
 * Service role client kullanır (RLS bypass) — çünkü aggregate query'ler
 * ve full read gerekli.
 */
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getMetrics() {
  const supabase = createSupabaseServiceClient();

  // Basit count sorguları
  const [
    { count: totalStickers },
    { count: manufactured },
    { count: claimed },
    { count: active },
    { count: totalConvs },
    { count: activeConvs },
    { count: totalUsers },
    { count: newUsersThisMonth },
    { count: waitlistCount },
  ] = await Promise.all([
    supabase.from("stickers").select("id", { count: "exact", head: true }),
    supabase.from("stickers").select("id", { count: "exact", head: true }).eq("status", "manufactured"),
    supabase.from("stickers").select("id", { count: "exact", head: true }).eq("status", "claimed"),
    supabase.from("stickers").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("conversations").select("id", { count: "exact", head: true }),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("users").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", new Date(new Date().setDate(1)).toISOString()),
    supabase.from("waitlist").select("id", { count: "exact", head: true }),
  ]);

  return {
    stickers: {
      total: totalStickers ?? 0,
      manufactured: manufactured ?? 0,
      claimed: claimed ?? 0,
      active: active ?? 0,
      claimRate:
        totalStickers && totalStickers > 0
          ? Math.round((((claimed ?? 0) + (active ?? 0)) / totalStickers) * 100)
          : 0,
    },
    conversations: {
      total: totalConvs ?? 0,
      active: activeConvs ?? 0,
    },
    users: {
      total: totalUsers ?? 0,
      newThisMonth: newUsersThisMonth ?? 0,
    },
    waitlist: waitlistCount ?? 0,
  };
}

export default async function AdminOverviewPage() {
  const m = await getMetrics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Overview</h1>
        <p className="mt-1 text-sm text-charcoal/60">
          Tagora ürün ve iş metrikleri — canlı veri, cache yok.
        </p>
      </div>

      {/* Sticker metrikleri */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-charcoal/60">
          Sticker Üretim & Kullanım
        </h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <Metric label="Toplam Basılmış" value={m.stickers.total} />
          <Metric label="Depoda (manufactured)" value={m.stickers.manufactured} />
          <Metric
            label="Claim Edilmiş"
            value={m.stickers.claimed + m.stickers.active}
            hint={`%${m.stickers.claimRate} claim oranı`}
          />
          <Metric label="Aktif (kullanılıyor)" value={m.stickers.active} />
        </div>
      </section>

      {/* Konuşma metrikleri */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-charcoal/60">
          İletişim
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="Toplam Konuşma" value={m.conversations.total} />
          <Metric label="Aktif Konuşma" value={m.conversations.active} />
        </div>
      </section>

      {/* Kullanıcı metrikleri */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-charcoal/60">
          Kullanıcılar
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Toplam Kullanıcı" value={m.users.total} />
          <Metric label="Bu Ay Yeni" value={m.users.newThisMonth} />
          <Metric label="Bekleme Listesi" value={m.waitlist} />
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-charcoal/60">{label}</p>
      <p className="mt-1 text-3xl font-bold text-navy tabular-nums">
        {value.toLocaleString("tr-TR")}
      </p>
      {hint && <p className="mt-1 text-xs text-accent/80 font-medium">{hint}</p>}
    </div>
  );
}
