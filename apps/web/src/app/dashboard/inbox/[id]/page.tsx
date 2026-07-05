/**
 * Sahip-tarafı chat ekranı (conversation detay).
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OwnerChat } from "./owner-chat";

type Params = Promise<{ id: string }>;

export const metadata = { title: "Konuşma" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ConversationPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: conv } = await supabase
    .from("conversations")
    .select(`
      id,
      status,
      sticker_id,
      stickers!inner ( token, label, use_case )
    `)
    .eq("id", id)
    .maybeSingle();

  if (!conv) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender, body, sent_at")
    .eq("conversation_id", id)
    .is("deleted_at", null)
    .order("sent_at", { ascending: true });

  // Okunmamış sayacı sıfırla
  await supabase
    .from("conversations")
    .update({ unread_owner_count: 0 })
    .eq("id", id);

  const sticker = (conv as unknown as { stickers: { token: string; label: string | null; use_case: string | null } }).stickers;

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col">
      <header className="mb-3 flex items-center justify-between">
        <Link href="/dashboard/inbox" className="btn-ghost">
          ← Inbox
        </Link>
        <div className="text-right">
          <p className="text-sm font-semibold text-navy">
            {sticker.label || "Anonim ziyaretçi"}
          </p>
          <p className="text-xs text-charcoal/50">/s/{sticker.token}</p>
        </div>
      </header>

      <OwnerChat conversationId={id} initialMessages={messages ?? []} />
    </div>
  );
}
