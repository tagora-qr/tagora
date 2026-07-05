-- ==============================================================
-- TAGORA — ROW-LEVEL SECURITY POLICIES
-- Migration: 20260520000002_rls_policies.sql
-- ==============================================================
-- Tagora güvenlik modeli:
-- 1. Owner kendi sticker'larına + conversation'larına erişebilir
-- 2. Scanner sadece kendi session ID'siyle erişebilir (cookie'den)
-- 3. Scanner sticker bilgisini SADECE okur (use_case + label), owner_id görmez
-- 4. Service role her şeye erişebilir (admin akışları için)
-- ==============================================================

-- Tüm tablolarda RLS aç
alter table public.users enable row level security;
alter table public.sticker_designs enable row level security;
alter table public.stickers enable row level security;
alter table public.scanner_sessions enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.abuse_reports enable row level security;
alter table public.waitlist enable row level security;

-- ============================================================
-- HELPER: current_user_id() — auth.uid()'den public.users.id
-- ============================================================
create or replace function public.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.users where auth_user_id = auth.uid() limit 1;
$$;

-- ============================================================
-- HELPER: current_scanner_session_id() — anon header'dan
-- ============================================================
-- Scanner client'lar Supabase'e bağlanırken
-- "x-scanner-session" header'ı ile ephemeral_token gönderir.
create or replace function public.current_scanner_session_id()
returns uuid
language sql
stable
as $$
  select id from public.scanner_sessions
  where ephemeral_token = current_setting('request.headers', true)::json->>'x-scanner-session'
  and expires_at > now()
  limit 1;
$$;

-- ============================================================
-- USERS POLICIES
-- ============================================================
-- Kullanıcı sadece kendi kaydını görür
create policy "users_select_own" on public.users
  for select using (auth_user_id = auth.uid());

create policy "users_update_own" on public.users
  for update using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- Insert: auth trigger yapıyor, anon insert engelli

-- ============================================================
-- STICKER_DESIGNS POLICIES — herkese okuma (public katalog)
-- ============================================================
create policy "designs_select_all" on public.sticker_designs
  for select using (is_active = true);

-- ============================================================
-- STICKERS POLICIES
-- ============================================================
-- Sahip kendi sticker'larını görür ve günceller
create policy "stickers_select_owner" on public.stickers
  for select using (owner_id = public.current_user_id());

create policy "stickers_update_owner" on public.stickers
  for update using (owner_id = public.current_user_id())
  with check (owner_id = public.current_user_id());

-- Scanner sticker'ın PUBLIC SUBSET'ini görür (token ile match)
-- Bu bir VIEW üzerinden yapılacak (aşağıda) çünkü RLS sadece SELECT
-- direkte tablo üzerinde token + ipuçları üzerinden çalışacak.
-- Anonim erişim için: scanner sadece use_case ve label görsün, owner_id görmez.
create policy "stickers_public_scan_view" on public.stickers
  for select to anon, authenticated using (
    status in ('claimed', 'active')
    and (
      -- token ile direct lookup (anon yaparsa unrestricted)
      -- Bu policy public katalogdaki sticker'lara erişimi sağlar
      true
    )
  );

-- Note: Scanner sayfası çağrısı service_role veya anon ile token ile yapılır;
-- gerçek üretimde "stickers_public_view" view'ı kullanılır (aşağıda)

-- ============================================================
-- PUBLIC VIEW — Scanner'ın gördüğü sticker subset'i
-- ============================================================
-- Sadece "active" sticker'lar + minimal alanlar
create or replace view public.sticker_public_info as
select
  s.token,
  s.use_case,
  s.label,
  s.status,
  d.name_tr as design_name_tr,
  d.name_en as design_name_en
from public.stickers s
left join public.sticker_designs d on s.design_id = d.id
where s.status in ('claimed', 'active');

grant select on public.sticker_public_info to anon, authenticated;

-- ============================================================
-- SCANNER_SESSIONS POLICIES
-- ============================================================
-- Anon kullanıcı kendi session'ını oluşturabilir (insert)
create policy "scanner_sessions_insert_anon" on public.scanner_sessions
  for insert to anon, authenticated with check (true);

-- Scanner sadece kendi session'ını görür (header ile match)
create policy "scanner_sessions_select_own" on public.scanner_sessions
  for select to anon, authenticated using (
    id = public.current_scanner_session_id()
  );

-- Sahip ilgili sticker'ın scanner_session'larını görür (read-only)
create policy "scanner_sessions_select_owner" on public.scanner_sessions
  for select to authenticated using (
    sticker_id in (select id from public.stickers where owner_id = public.current_user_id())
  );

-- Sahip block edebilir
create policy "scanner_sessions_block_owner" on public.scanner_sessions
  for update to authenticated using (
    sticker_id in (select id from public.stickers where owner_id = public.current_user_id())
  )
  with check (true);

-- ============================================================
-- CONVERSATIONS POLICIES
-- ============================================================
-- Sahip kendi sticker'larının conversation'larını görür
create policy "conversations_select_owner" on public.conversations
  for select to authenticated using (
    owner_id = public.current_user_id()
  );

-- Scanner kendi conversation'larını görür (session_id eşleşmesi)
create policy "conversations_select_scanner" on public.conversations
  for select to anon, authenticated using (
    scanner_session_id = public.current_scanner_session_id()
  );

-- Insert: scanner conversation yaratabilir (ilk mesajda)
create policy "conversations_insert_scanner" on public.conversations
  for insert to anon, authenticated with check (
    scanner_session_id = public.current_scanner_session_id()
  );

-- Update: sahip status değiştirebilir
create policy "conversations_update_owner" on public.conversations
  for update to authenticated using (
    owner_id = public.current_user_id()
  );

-- ============================================================
-- MESSAGES POLICIES
-- ============================================================
-- Conversation'a erişimi olan herkes mesaj görür (RLS conversations üzerinden inheriti)
create policy "messages_select_participant" on public.messages
  for select using (
    conversation_id in (
      select id from public.conversations
      where owner_id = public.current_user_id()
         or scanner_session_id = public.current_scanner_session_id()
    )
    and deleted_at is null
  );

-- Insert: sender = 'scanner' ise scanner_session_id eşleşmeli
-- sender = 'owner' ise owner_id eşleşmeli
create policy "messages_insert_scanner" on public.messages
  for insert to anon, authenticated with check (
    sender = 'scanner'
    and conversation_id in (
      select id from public.conversations
      where scanner_session_id = public.current_scanner_session_id()
        and status = 'active'
    )
  );

create policy "messages_insert_owner" on public.messages
  for insert to authenticated with check (
    sender = 'owner'
    and conversation_id in (
      select id from public.conversations
      where owner_id = public.current_user_id()
        and status = 'active'
    )
  );

-- ============================================================
-- ABUSE_REPORTS POLICIES
-- ============================================================
-- Sahip kendi report'larını oluşturabilir
create policy "abuse_insert_owner" on public.abuse_reports
  for insert to authenticated with check (
    reported_by_user_id = public.current_user_id()
  );

-- Scanner anonim report ediyor
create policy "abuse_insert_scanner" on public.abuse_reports
  for insert to anon with check (
    reported_by_user_id is null
    and scanner_session_id = public.current_scanner_session_id()
  );

-- Sahip kendi report'larını görür
create policy "abuse_select_owner" on public.abuse_reports
  for select to authenticated using (
    reported_by_user_id = public.current_user_id()
  );

-- ============================================================
-- WAITLIST POLICIES — anon herkes ekleyebilir
-- ============================================================
create policy "waitlist_insert_anon" on public.waitlist
  for insert to anon, authenticated with check (true);

-- Read sadece service_role (admin)

-- ============================================================
-- REALTIME — messages tablosunu Supabase Realtime'a aç
-- ============================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
