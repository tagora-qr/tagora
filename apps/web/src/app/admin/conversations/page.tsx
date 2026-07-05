/**
 * Admin — Conversations panel (privacy-safe).
 *
 * Konuşma listesi + meta. İçerik varsayılan olarak GİZLİ.
 * Sadece "flagged" mesajlar admin tarafından gözden geçirilebilir (moderation).
 * Bu MVP'de sadece list + counts; mesaj görüntüleme Sprint 7'de.
 */
import Link from "next/link";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 25;

type SearchParams = Promise<{
  status?: string;
  flagged?: string;
  page?: string;
}>;

export default async function AdminConversationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status = params.status && params.status !== "all" ? params.status : null;
  const onlyFlagged = params.flagged === "true";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const supabase = createSupabaseServiceClient();

  let query = supabase
    .from("conversations")
    .select(
      "id, sticker_id, scanner_session_id, owner_id, status, last_message_at, unread_owner_count, unread_scanner_count, created_at",
      { count: "exact" },
    )
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (status) query = query.eq("status", status);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: convs, count } = await query;
  const conversations = (convs ?? []) as ConversationRow[];

  // Her konuşma için: mesaj sayısı, flagged sayısı, sticker token, scanner name
  const enriched = await Promise.all(
    conversations.map(async (c) => {
      const [
        { count: msgCount },
        { count: flaggedCount },
        { data: sticker },
        { data: session },
      ] = await Promise.all([
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id),
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .eq("flagged", true),
        supabase
          .from("stickers")
          .select("token, use_case")
          .eq("id", c.sticker_id)
          .maybeSingle(),
        supabase
          .from("scanner_sessions")
          .select("display_name")
          .eq("id", c.scanner_session_id)
          .maybeSingle(),
      ]);
      return {
        ...c,
        message_count: msgCount ?? 0,
        flagged_count: flaggedCount ?? 0,
        sticker_token: (sticker as { token?: string } | null)?.token ?? null,
        sticker_use_case: (sticker as { use_case?: string } | null)?.use_case ?? null,
        scanner_name:
          (session as { display_name: string | null } | null)?.display_name ?? "Anonim",
      };
    }),
  );

  const filtered = onlyFlagged ? enriched.filter((c) => c.flagged_count > 0) : enriched;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Konuşmalar</h1>
        <p className="mt-1 text-sm text-charcoal/60">
          {(count ?? 0).toLocaleString("tr-TR")} konuşma · Sayfa {page}/{totalPages}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <label htmlFor="status" className="text-xs font-semibold text-charcoal/60">
            STATUS
          </label>
          <FilterLink
            currentStatus={status ?? "all"}
            currentFlagged={onlyFlagged}
          />
        </div>
      </div>

      {/* Privacy notice */}
      <div className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-xs text-navy">
        <strong>🔒 Privacy-first:</strong> Mesaj içerikleri bu panelde GÖSTERİLMEZ. Sadece
        meta bilgi (adet, tarih, taraflar). Flagged mesaj varsa Sprint 7'de moderation
        akışı ile detaya erişilebilir.
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-navy/10 bg-navy/[0.02]">
            <tr>
              <Th>Sticker</Th>
              <Th>Scanner</Th>
              <Th>Status</Th>
              <Th align="right">Mesaj</Th>
              <Th align="right">Flagged</Th>
              <Th>Son Mesaj</Th>
              <Th>Başlangıç</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-charcoal/50">
                  {onlyFlagged
                    ? "Flagged mesaj içeren konuşma yok. 👍"
                    : "Filtreye uyan konuşma yok."}
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="transition hover:bg-navy/[0.02]">
                  <Td>
                    <Link
                      href={`/admin/stickers/${c.sticker_id}` as never}
                      className="text-navy hover:underline"
                    >
                      <span className="mr-1">
                        {USE_CASE_EMOJI[c.sticker_use_case ?? "other"] ?? "📌"}
                      </span>
                      <span className="font-mono text-xs">
                        {c.sticker_token ?? "—"}
                      </span>
                    </Link>
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/conversations/${c.id}` as never}
                      className="font-medium text-navy hover:underline"
                    >
                      {c.scanner_name} →
                    </Link>
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[c.status] ?? "bg-navy/5 text-charcoal"
                      }`}
                    >
                      {c.status}
                    </span>
                  </Td>
                  <Td align="right">
                    <span className="tabular-nums">{c.message_count}</span>
                  </Td>
                  <Td align="right">
                    {c.flagged_count > 0 ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">
                        ⚠️ {c.flagged_count}
                      </span>
                    ) : (
                      <span className="text-charcoal/30">—</span>
                    )}
                  </Td>
                  <Td>
                    <span className="text-xs text-charcoal/70">
                      {c.last_message_at
                        ? new Date(c.last_message_at).toLocaleString("tr-TR")
                        : "—"}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs text-charcoal/50">
                      {new Date(c.created_at).toLocaleDateString("tr-TR")}
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

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  resolved: "bg-navy/10 text-charcoal/60",
  blocked: "bg-red-50 text-red-700",
};

const USE_CASE_EMOJI: Record<string, string> = {
  vehicle: "🚗",
  door: "🚪",
  pet: "🐾",
  luggage: "🧳",
  bike: "🚲",
  other: "📌",
};

interface ConversationRow {
  id: string;
  sticker_id: string;
  scanner_session_id: string;
  owner_id: string | null;
  status: string;
  last_message_at: string | null;
  unread_owner_count: number;
  unread_scanner_count: number;
  created_at: string;
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
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
function Td({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <td className={`px-3 py-2.5 text-charcoal ${align === "right" ? "text-right" : ""}`}>
      {children}
    </td>
  );
}

function FilterLink({
  currentStatus,
  currentFlagged,
}: {
  currentStatus: string;
  currentFlagged: boolean;
}) {
  const build = (updates: Record<string, string | null>) => {
    const p = new URLSearchParams();
    if (currentStatus !== "all") p.set("status", currentStatus);
    if (currentFlagged) p.set("flagged", "true");
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "all" || v === "false") p.delete(k);
      else p.set(k, v);
    }
    return `/admin/conversations${p.toString() ? "?" + p.toString() : ""}`;
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {[
        { v: "all", label: "Tümü" },
        { v: "active", label: "Aktif" },
        { v: "resolved", label: "Çözülmüş" },
        { v: "blocked", label: "Bloke" },
      ].map((s) => (
        <Link
          key={s.v}
          href={build({ status: s.v }) as never}
          className={
            "rounded-lg border px-3 py-1 text-xs font-medium transition " +
            (currentStatus === s.v
              ? "border-navy bg-navy text-accent"
              : "border-navy/15 bg-white text-charcoal hover:bg-navy/[0.03]")
          }
        >
          {s.label}
        </Link>
      ))}
      <span className="mx-1 text-charcoal/30">|</span>
      <Link
        href={build({ flagged: currentFlagged ? "false" : "true" }) as never}
        className={
          "rounded-lg border px-3 py-1 text-xs font-medium transition " +
          (currentFlagged
            ? "border-red-300 bg-red-50 text-red-700"
            : "border-navy/15 bg-white text-charcoal hover:bg-navy/[0.03]")
        }
      >
        ⚠️ Sadece flagged
      </Link>
    </div>
  );
}
