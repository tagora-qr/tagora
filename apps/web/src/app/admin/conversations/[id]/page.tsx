/**
 * Admin — Konuşma detay (moderation view).
 *
 * PRIVACY-FIRST: Normal mesajlar GÖSTERİLMEZ. Sadece flagged mesajlar admin
 * tarafından gözden geçirilebilir. Bu ürünün temel privacy vaadinin bir parçası.
 *
 * Actions:
 * - Scanner session block
 * - Sticker retire/recall
 * - Konuşmayı resolved yap
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { ModerationActions } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ id: string }>;

const REASON_LABEL: Record<string, { text: string; color: string }> = {
  threat: { text: "Tehdit", color: "bg-red-100 text-red-800" },
  phishing: { text: "Phishing", color: "bg-red-100 text-red-800" },
  profanity: { text: "Küfür", color: "bg-orange-100 text-orange-800" },
  spam: { text: "Spam", color: "bg-yellow-100 text-yellow-800" },
};

export default async function AdminConversationDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const supabase = createSupabaseServiceClient();

  const { data: conv } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!conv) notFound();
  const c = conv as ConversationFull;

  // Sticker, session, owner, mesaj sayıları, flagged mesajlar paralel
  const [stickerRes, sessionRes, ownerRes, totalMsgs, flaggedMsgsRes] = await Promise.all([
    supabase.from("stickers").select("token, use_case, label, status").eq("id", c.sticker_id).maybeSingle(),
    supabase
      .from("scanner_sessions")
      .select("id, display_name, is_blocked, message_count, expires_at, created_at, device_fingerprint_hash")
      .eq("id", c.scanner_session_id)
      .maybeSingle(),
    c.owner_id
      ? supabase.from("users").select("email, display_name").eq("id", c.owner_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", c.id),
    // Sadece flagged olan mesajları çek — normal olanlara admin de erişemez
    supabase
      .from("messages")
      .select("id, sender, body, sent_at, flag_reason, flagged")
      .eq("conversation_id", c.id)
      .eq("flagged", true)
      .order("sent_at", { ascending: false }),
  ]);

  const sticker = stickerRes.data as StickerLite | null;
  const session = sessionRes.data as SessionLite | null;
  const owner = ownerRes.data as { email: string; display_name: string | null } | null;
  const totalMessages = totalMsgs.count ?? 0;
  const flagged = ((flaggedMsgsRes.data ?? []) as FlaggedMessage[]);

  return (
    <div className="space-y-6">
      <Link href="/admin/conversations" className="text-sm text-charcoal/60 hover:text-navy">
        ← Konuşmalar
      </Link>

      {/* Hero */}
      <div className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  STATUS_COLORS[c.status] ?? "bg-navy/5 text-charcoal"
                }`}
              >
                {c.status}
              </span>
              {flagged.length > 0 && (
                <span className="inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700">
                  ⚠️ {flagged.length} flagged
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-navy">
              {session?.display_name || "Anonim ziyaretçi"}
            </h1>
            <p className="mt-1 text-sm text-charcoal/60">
              {totalMessages} toplam mesaj · Başlangıç:{" "}
              {new Date(c.created_at).toLocaleString("tr-TR")}
            </p>
          </div>

          <ModerationActions
            conversationId={c.id}
            scannerSessionId={c.scanner_session_id}
            stickerId={c.sticker_id}
            scannerBlocked={session?.is_blocked ?? false}
            conversationStatus={c.status}
          />
        </div>
      </div>

      {/* Grid: Sticker + Scanner + Owner */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Sticker">
          {sticker ? (
            <div className="space-y-2">
              <Link
                href={`/admin/stickers/${c.sticker_id}` as never}
                className="block font-mono text-lg font-semibold text-navy hover:underline"
              >
                {sticker.token}
              </Link>
              <p className="text-sm text-charcoal/70">
                {sticker.use_case ?? "—"} · <span className="text-xs">{sticker.status}</span>
              </p>
              {sticker.label && (
                <p className="text-xs text-charcoal/60">"{sticker.label}"</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-charcoal/50">Sticker silinmiş</p>
          )}
        </Card>

        <Card title="Scanner Session">
          {session ? (
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-charcoal/60">Ad</span>
                <span className="font-medium">
                  {session.display_name || "Anonim"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal/60">Durum</span>
                {session.is_blocked ? (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                    Bloklu
                  </span>
                ) : (
                  <span className="text-xs text-emerald-700">Aktif</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal/60">Mesaj sayısı</span>
                <span className="tabular-nums">{session.message_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal/60">Son geçerli</span>
                <span className="text-xs">
                  {new Date(session.expires_at).toLocaleDateString("tr-TR")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal/60">Cihaz FP</span>
                <span className="font-mono text-[10px]">
                  {session.device_fingerprint_hash
                    ? session.device_fingerprint_hash.slice(0, 12) + "…"
                    : "—"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-charcoal/50">Session yok</p>
          )}
        </Card>

        <Card title="Sahip (Owner)">
          {owner ? (
            <div className="space-y-1.5 text-sm">
              <p className="font-medium text-navy">{owner.email}</p>
              {owner.display_name && (
                <p className="text-xs text-charcoal/60">{owner.display_name}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-charcoal/50">Owner yok</p>
          )}
        </Card>
      </div>

      {/* Flagged mesajlar */}
      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-charcoal/60">
          Flagged Mesajlar ({flagged.length})
        </h2>

        {flagged.length === 0 ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 text-center">
            <p className="text-3xl">✓</p>
            <p className="mt-2 font-semibold text-emerald-700">Temiz konuşma</p>
            <p className="mt-1 text-xs text-emerald-700/70">
              Otomatik moderation herhangi bir problem yakalamadı.
              <br />
              Normal mesajlar privacy nedeniyle gösterilmez.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-xs text-navy">
              <strong>🔒 Privacy Not:</strong> Bu mesajlar sistem tarafından{" "}
              <strong>otomatik olarak şüpheli işaretlendiği</strong> için admin gözden geçirmesine
              açılmıştır. Normal (flagged olmayan) mesajlar HERHANGİ BİR koşulda gösterilmez.
            </div>

            <ul className="space-y-2">
              {flagged.map((m) => (
                <li
                  key={m.id}
                  className="rounded-xl border border-red-100 bg-red-50/40 p-4 shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs font-medium text-charcoal">
                        {m.sender === "scanner" ? "Scanner" : m.sender === "owner" ? "Sahip" : "Sistem"}
                      </span>
                      {m.flag_reason && REASON_LABEL[m.flag_reason] && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            REASON_LABEL[m.flag_reason].color
                          }`}
                        >
                          {REASON_LABEL[m.flag_reason].text}
                        </span>
                      )}
                    </div>
                    <time className="text-xs text-charcoal/50">
                      {new Date(m.sent_at).toLocaleString("tr-TR")}
                    </time>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm text-charcoal">
                    {m.body}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  resolved: "bg-navy/10 text-charcoal/60",
  blocked: "bg-red-50 text-red-700",
};

interface ConversationFull {
  id: string;
  sticker_id: string;
  scanner_session_id: string;
  owner_id: string | null;
  status: string;
  last_message_at: string | null;
  unread_owner_count: number;
  unread_scanner_count: number;
  created_at: string;
  updated_at: string;
}
interface StickerLite {
  token: string;
  use_case: string | null;
  label: string | null;
  status: string;
}
interface SessionLite {
  id: string;
  display_name: string | null;
  is_blocked: boolean;
  message_count: number;
  expires_at: string;
  created_at: string;
  device_fingerprint_hash: string | null;
}
interface FlaggedMessage {
  id: string;
  sender: string;
  body: string;
  sent_at: string;
  flag_reason: string | null;
  flagged: boolean;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-charcoal/60">
        {title}
      </h3>
      {children}
    </div>
  );
}
