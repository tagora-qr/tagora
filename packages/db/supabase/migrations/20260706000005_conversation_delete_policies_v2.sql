-- ==============================================================
-- TAGORA — CONVERSATION + MESSAGES DELETE POLICIES v2
-- Migration: 20260706000005_conversation_delete_policies_v2.sql
-- ==============================================================
-- v1 (000004) sadece conversation.owner_id ile eşleştirme yapıyordu.
-- Ancak bazı konuşmalarda owner_id NULL olabildiği için silme fail ediyordu.
-- v2: sticker sahibi olma durumu da fallback olarak eklendi.
--
-- Kural:
--   Sahip sayılır → conversation.owner_id = kullanıcı
--                   VEYA conversation.sticker_id, kullanıcının sticker'ı
-- ==============================================================

-- Eski policy'leri temizle
drop policy if exists "conversations_delete_owner" on public.conversations;
drop policy if exists "messages_delete_owner" on public.messages;

-- CONVERSATIONS delete — owner_id eşleşse VEYA sticker sahibi
create policy "conversations_delete_owner" on public.conversations
  for delete to authenticated using (
    owner_id = public.current_user_id()
    or sticker_id in (
      select id from public.stickers where owner_id = public.current_user_id()
    )
  );

-- MESSAGES delete — parent conversation'ı sahip olduğun conversation ise
create policy "messages_delete_owner" on public.messages
  for delete to authenticated using (
    conversation_id in (
      select c.id
      from public.conversations c
      where c.owner_id = public.current_user_id()
         or c.sticker_id in (
           select id from public.stickers where owner_id = public.current_user_id()
         )
    )
  );

-- ============================================================
-- BONUS: Eski konuşmalarda owner_id NULL ise doldur (backfill)
-- ============================================================
update public.conversations c
set owner_id = s.owner_id
from public.stickers s
where c.sticker_id = s.id
  and c.owner_id is null
  and s.owner_id is not null;
