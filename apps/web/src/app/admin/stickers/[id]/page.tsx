/**
 * Admin — Sticker Detay
 *
 * Bir sticker'ın tüm hikayesi: özet, sahip, konuşmalar, taranma geçmişi.
 * Service role client kullanır — RLS bypass.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { StickerActions } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ id: string }>;

const USE_CASE_EMOJI: Record<string, string> = {
  vehicle: "🚗",
  door: "🚪",
  pet: "🐾",
  luggage: "🧳",
  bike: "🚲",
  other: "📌",
};

const STATUS_COLORS: Record<string, string> = {
  manufactured: "bg-blue-50 text-blue-700",
  shipped: "bg-indigo-50 text-indigo-700",
  delivered: "bg-purple-50 text-purple-700",
  claimed: "bg-amber-50 text-amber-700",
  active: "bg-emerald-50 text-emerald-700",
  blocked: "bg-red-50 text-red-700",
  retired: "bg-navy/10 text-navy/50",
  recall: "bg-red-100 text-red-800",
};

export default async function AdminStickerDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const supabase = createSupabaseServiceClient();

  const { data: sticker } = await supabase
    .from("stickers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!sticker) notFound();
  const s = sticker as StickerFull;

  // Owner info
  let owner: { email: string; display_name: string | null; created_at: string } | null = null;
  if (s.owner_id) {
    const { data: user } = await supabase
      .from("users")
      .select("email, display_name, created_at")
      .eq("id", s.owner_id)
      .maybeSingle();
    owner = user as typeof owner;
  }

  // Konuşmalar
  const { data: convsRaw } = await supabase
    .from("conversations")
    .select("id, status, last_message_at, created_at, unread_owner_count, scanner_session_id")
    .eq("sticker_id", s.id)
    .order("created_at", { ascending: false });
  const convs = (convsRaw ?? []) as ConversationLite[];

  // Her konuşma için mesaj sayısı + scanner display_name
  const enrichedConvs = await Promise.all(
    convs.map(async (c) => {
      const [{ count: msgCount }, { data: session }] = await Promise.all([
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id),
        supabase
          .from("scanner_sessions")
          .select("display_name")
          .eq("id", c.scanner_session_id)
          .maybeSingle(),
      ]);
      return {
        ...c,
        message_count: msgCount ?? 0,
        scanner_name:
          (session as { display_name: string | null } | null)?.display_name ?? "Anonim",
      };
    }),
  );

  const scannerUrl = `https://tagora.link/s/${s.token}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/stickers"
          className="text-sm text-charcoal/60 hover:text-navy"
        >
          ← Stickerlar
        </Link>
      </div>

      {/* Hero */}
      <div className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="text-5xl" aria-hidden="true">
              {(s.use_case && USE_CASE_EMOJI[s.use_case]) || "📌"}
            </div>
            <div>
              <h1 className="font-mono text-2xl font-bold text-navy">{s.token}</h1>
              <p className="mt-1 text-sm text-charcoal/60">
                {s.label ? (
                  <>
                    {s.label} · <span className="text-charcoal/40">{s.use_case ?? "—"}</span>
                  </>
                ) : (
                  s.use_case ?? "Etiketsiz sticker"
                )}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    STATUS_COLORS[s.status] ?? "bg-navy/5 text-charcoal"
                  }`}
                >
                  {s.status}
                </span>
                <span className="text-xs text-charcoal/50">
                  {s.scan_count.toLocaleString("tr-TR")} taranma
                </span>
              </div>
            </div>
          </div>

          <StickerActions stickerId={s.id} currentStatus={s.status} />
        </div>
      </div>

      {/* Grid: Meta + Owner + Scanner URL */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Meta Data">
          <DL rows={[
            ["ID", <span key="id" className="font-mono text-xs">{s.id}</span>],
            ["Token", <span key="t" className="font-mono">{s.token}</span>],
            ["Use Case", s.use_case ?? "—"],
            ["Design ID", s.design_id ?? "—"],
            ["Oluşturulma", new Date(s.created_at).toLocaleString("tr-TR")],
            ["Üretim (manufactured_at)", new Date(s.manufactured_at).toLocaleString("tr-TR")],
            ["Claim tarihi", s.claimed_at ? new Date(s.claimed_at).toLocaleString("tr-TR") : "—"],
            ["Block tarihi", s.blocked_at ? new Date(s.blocked_at).toLocaleString("tr-TR") : "—"],
            ["Son güncelleme", new Date(s.updated_at).toLocaleString("tr-TR")],
            ["Son taranma", s.last_scanned_at ? new Date(s.last_scanned_at).toLocaleString("tr-TR") : "—"],
          ]} />
        </Card>

        <Card title="Sahip">
          {owner ? (
            <DL rows={[
              ["Email", owner.email],
              ["Ad", owner.display_name ?? "—"],
              ["Hesap tarihi", new Date(owner.created_at).toLocaleString("tr-TR")],
              ["Owner ID", <span key="oid" className="font-mono text-xs">{s.owner_id}</span>],
            ]} />
          ) : (
            <p className="text-sm text-charcoal/50 py-6 text-center">
              Bu sticker henüz claim edilmemiş.
            </p>
          )}
        </Card>
      </div>

      {/* Scanner URL */}
      <Card title="Scanner URL">
        <a
          href={scannerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg bg-navy/[0.03] px-3 py-2 font-mono text-sm text-navy hover:bg-navy/5"
        >
          {scannerUrl}
        </a>
        <p className="mt-2 text-xs text-charcoal/50">
          QR bu URL'e yönlendirir. Yeni sekmede aç, scanner deneyimini görebilirsin.
        </p>
      </Card>

      {/* Konuşmalar */}
      <Card title={`Konuşmalar (${enrichedConvs.length})`}>
        {enrichedConvs.length === 0 ? (
          <p className="py-6 text-center text-sm text-charcoal/50">
            Bu sticker'a henüz mesaj gönderilmemiş.
          </p>
        ) : (
          <ul className="divide-y divide-navy/5">
            {enrichedConvs.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-semibold text-navy">{c.scanner_name}</p>
                  <p className="text-xs text-charcoal/50">
                    {c.message_count} mesaj ·{" "}
                    {c.last_message_at
                      ? new Date(c.last_message_at).toLocaleString("tr-TR")
                      : "—"}{" "}
                    · durum: {c.status}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {c.unread_owner_count > 0 && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-navy">
                      {c.unread_owner_count} okunmadı
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-charcoal/40">
                    {c.id.slice(0, 8)}…
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ============================================================================
// UI Building Blocks
// ============================================================================

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-charcoal/60">
        {title}
      </h2>
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
          <dd className="text-right text-charcoal">{v || <span className="text-charcoal/30">—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

// ============================================================================
// Types
// ============================================================================

interface StickerFull {
  id: string;
  token: string;
  design_id: string | null;
  owner_id: string | null;
  status: string;
  use_case: string | null;
  label: string | null;
  scan_count: number;
  last_scanned_at: string | null;
  manufactured_at: string;
  claimed_at: string | null;
  blocked_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ConversationLite {
  id: string;
  status: string;
  last_message_at: string | null;
  created_at: string;
  unread_owner_count: number;
  scanner_session_id: string;
}
