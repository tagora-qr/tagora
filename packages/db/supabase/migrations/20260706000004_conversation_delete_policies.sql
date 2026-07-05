-- ==============================================================
-- TAGORA — CONVERSATION + MESSAGES DELETE POLICIES
-- Migration: 20260706000004_conversation_delete_policies.sql
-- ==============================================================
-- Sahip kendi conversation'ını ve içindeki mesajları silebilmeli.
-- Sprint 1'de SELECT/INSERT policy vardı ama DELETE yoktu.
-- Sonuç: mobile/web'de "Sil" butonu sessizce fail oluyordu.
-- ==============================================================

-- MESSAGES — sahip kendi conversation'ının mesajlarını silebilir
create policy "messages_delete_owner" on public.messages
  for delete to authenticated using (
    conversation_id in (
      select id from public.conversations
      where owner_id = public.current_user_id()
    )
  );

-- CONVERSATIONS — sahip kendi conversation'ını silebilir
create policy "conversations_delete_owner" on public.conversations
  for delete to authenticated using (
    owner_id = public.current_user_id()
  );
