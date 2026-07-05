/**
 * Sahip-tarafı chat ekranı (conversation detay).
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OwnerChat } from "./owner-chat";
import { DeleteConversationButton } from "./delete-conversation-button";
import { BlockScannerButton } from "./block-scanner-button";

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
      scanner_session_id,
      stickers!inner ( token, label, use_case ),
      scanner_sessions!inner ( display_name, is_blocked )
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

  const convData = conv as unknown as {
    scanner_session_id: string;
    stickers: { token: string; label: string | null; use_case: string | null };
    scanner_sessions: { display_name: string | null; is_blocked: boolean };
  };
  const sticker = convData.stickers;
  const scannerName = convData.scanner_sessions?.display_name?.trim() || "Anonim ziyaretçi";
  const scannerBlocked = convData.scanner_sessions?.is_blocked ?? false;
  const scannerSessionId = convData.scanner_session_id;

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col">
      <header className="mb-3 flex items-center justify-between gap-3">
        <Link href="/dashboard/inbox" className="btn-ghost">
          ← Inbox
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-semibold text-navy">{scannerName}</p>
          <p className="truncate text-xs text-charcoal/50">
            {scannerBlocked ? "🚫 Engelli · " : ""}
            {sticker.label ? `${sticker.label} · ` : ""}/s/{sticker.token}
          </p>
        </div>
        <BlockScannerButton
          scannerSessionId={scannerSessionId}
          scannerName={scannerName}
          isBlocked={scannerBlocked}
        />
        <DeleteConversationButton conversationId={id} scannerName={scannerName} />
      </header>

      <OwnerChat
        conversationId={id}
        initialMessages={messages ?? []}
        scannerName={scannerName}
      />
    </div>
  );
}
