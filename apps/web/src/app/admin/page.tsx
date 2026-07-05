/**
 * Admin Overview — üst düzey metrikler.
 *
 * Service role client kullanır (RLS bypass) — çünkü aggregate query'ler
 * ve full read gerekli.
 */
import Link from "next/link";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { TrendsChart } from "./trends-chart";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getTrends() {
  const supabase = createSupabaseServiceClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [stickers, users, messages] = await Promise.all([
    supabase
      .from("stickers")
      .select("claimed_at")
      .not("claimed_at", "is", null)
      .gte("claimed_at", thirtyDaysAgo.toISOString()),
    supabase
      .from("users")
      .select("created_at")
      .is("deleted_at", null)
      .gte("created_at", thirtyDaysAgo.toISOString()),
    supabase
      .from("messages")
      .select("sent_at")
      .gte("sent_at", thirtyDaysAgo.toISOString()),
  ]);

  // Günlük bucket'a düşür
  const buckets: Record<
    string,
    { stickersClaimed: number; newUsers: number; newMessages: number }
  > = {};

  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    buckets[key] = { stickersClaimed: 0, newUsers: 0, newMessages: 0 };
  }

  const bucketize = (ts: string) => {
    const d = new Date(ts);
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  for (const s of (stickers.data ?? []) as { claimed_at: string }[]) {
    const k = bucketize(s.claimed_at);
    if (buckets[k]) buckets[k].stickersClaimed++;
  }
  for (const u of (users.data ?? []) as { created_at: string }[]) {
    const k = bucketize(u.created_at);
    if (buckets[k]) buckets[k].newUsers++;
  }
  for (const m of (messages.data ?? []) as { sent_at: string }[]) {
    const k = bucketize(m.sent_at);
    if (buckets[k]) buckets[k].newMessages++;
  }

  // Sırayla dizi haline getir (eski → yeni)
  return Object.entries(buckets)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({ date, ...v }));
}

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
  const [m, trends] = await Promise.all([getMetrics(), getTrends()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Overview</h1>
        <p className="mt-1 text-sm text-charcoal/60">
          Tagora ürün ve iş metrikleri — canlı veri, cache yok.
        </p>
      </div>

      {/* Trend charts */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-charcoal/60">
          Son 30 Gün Trend
        </h2>
        <TrendsChart data={trends} />
      </section>

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
          <Metric label="Toplam Kullanıcı" value={m.users.total} href="/admin/users" />
          <Metric label="Bu Ay Yeni" value={m.users.newThisMonth} />
          <Metric label="Bekleme Listesi" value={m.waitlist} href="/admin/waitlist" />
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: number;
  hint?: string;
  href?: string;
}) {
  const inner = (
    <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm transition hover:border-navy/30 hover:shadow-md">
      <p className="text-xs font-medium text-charcoal/60">
        {label}
        {href && <span className="ml-1 text-accent">→</span>}
      </p>
      <p className="mt-1 text-3xl font-bold text-navy tabular-nums">
        {value.toLocaleString("tr-TR")}
      </p>
      {hint && <p className="mt-1 text-xs text-accent/80 font-medium">{hint}</p>}
    </div>
  );
  return href ? <Link href={href as never} className="block">{inner}</Link> : inner;
}
