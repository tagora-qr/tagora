-- ==============================================================
-- TAGORA — SCANNER SESSIONS BLOCK POLICY v2
-- Migration: 20260706000006_scanner_block_policy_v2.sql
-- ==============================================================
-- Sprint 1'de scanner_sessions_block_owner policy sadece
-- stickers.owner_id üzerinden kontrol yapıyordu. Bazı test/legacy
-- konuşmalarda sticker.owner_id NULL kaldığı için sahibi engelleyemiyor.
--
-- v2: conversation üzerinden fallback (conversations.owner_id) ekle
-- + sticker'lardaki NULL owner_id'leri backfill et.
-- ==============================================================

-- Eski policy'yi drop
drop policy if exists "scanner_sessions_block_owner" on public.scanner_sessions;

-- Yeni policy — iki yolla sahiplik kontrolü
create policy "scanner_sessions_block_owner" on public.scanner_sessions
  for update to authenticated using (
    -- Yol 1: sticker sahibi (ideal durum)
    sticker_id in (
      select id from public.stickers where owner_id = public.current_user_id()
    )
    -- Yol 2: bu session'a bağlı bir conversation'da owner sensen
    or exists (
      select 1
      from public.conversations c
      where c.scanner_session_id = scanner_sessions.id
        and c.owner_id = public.current_user_id()
    )
  )
  with check (true);

-- ============================================================
-- BACKFILL: sticker.owner_id NULL olan ama conversation üzerinden
-- sahibi belli olan sticker'ları güncelle
-- ============================================================
update public.stickers s
set
  owner_id = c.owner_id,
  status = case when s.status = 'manufactured' then 'active' else s.status end,
  claimed_at = coalesce(s.claimed_at, now())
from public.conversations c
where c.sticker_id = s.id
  and s.owner_id is null
  and c.owner_id is not null;
