/**
 * Inbox — sahibe gelen tüm konuşmaların listesi.
 */
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { USE_CASE_LABELS } from "@tagora/shared";
import { formatRelativeTime } from "@/lib/utils";

export const metadata = { title: "Inbox" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InboxPage() {
  const supabase = await createSupabaseServerClient();

  // İki ayrı sorgu — RLS join recursion'ından kaçınmak için
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, sticker_id, status, last_message_at, unread_owner_count")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(50);

  const stickerIds = (conversations ?? [])
    .map((c) => c.sticker_id)
    .filter((v): v is string => !!v);

  const { data: stickers } = stickerIds.length
    ? await supabase
        .from("stickers")
        .select("id, token, label, use_case")
        .in("id", stickerIds)
    : { data: [] as { id: string; token: string; label: string | null; use_case: string | null }[] };

  const stickerMap = new Map(
    (stickers ?? []).map((s) => [s.id, s]),
  );

  type ConvRow = NonNullable<typeof conversations>[number];
  const list: (ConvRow & {
    sticker: { token: string; label: string | null; use_case: string | null } | null;
  })[] = (conversations ?? []).map((c) => {
    const s = c.sticker_id ? stickerMap.get(c.sticker_id) : undefined;
    return {
      ...c,
      sticker: s
        ? { token: s.token, label: s.label, use_case: s.use_case }
        : null,
    };
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-navy">Inbox</h1>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy/20 bg-navy/[0.02] p-8 text-center">
          <div className="mb-3 text-4xl" aria-hidden="true">📭</div>
          <p className="text-sm text-charcoal/70">
            Henüz mesaj yok. Birisi sticker&apos;ını tarayınca burada görürsün.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-navy/10 overflow-hidden rounded-2xl border border-navy/10 bg-white">
          {list.map((c) => {
            const sticker = c.sticker;
            const useCaseInfo =
              (sticker?.use_case &&
                USE_CASE_LABELS[
                  sticker.use_case as keyof typeof USE_CASE_LABELS
                ]) ??
              USE_CASE_LABELS.other;
            return (
              <li key={c.id}>
                <Link
                  href={`/dashboard/inbox/${c.id}` as never}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-navy/[0.03]"
                >
                  <span className="text-2xl" aria-hidden="true">
                    {useCaseInfo.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-navy">
                        {sticker?.label || useCaseInfo.tr}
                      </p>
                      <time className="shrink-0 text-xs text-charcoal/50">
                        {c.last_message_at
                          ? formatRelativeTime(c.last_message_at)
                          : "—"}
                      </time>
                    </div>
                    <p className="text-xs text-charcoal/60">
                      Anonim ziyaretçi
                    </p>
                  </div>
                  {(c.unread_owner_count ?? 0) > 0 && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-navy">
                      {c.unread_owner_count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
