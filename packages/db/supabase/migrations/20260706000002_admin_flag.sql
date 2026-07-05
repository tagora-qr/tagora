-- ==============================================================
-- TAGORA — ADMIN ROLE FLAG
-- Migration: 20260706000002_admin_flag.sql
-- ==============================================================
-- users.is_admin bool kolonu → admin paneli erişim kontrolü için.
-- ==============================================================

alter table public.users add column if not exists is_admin boolean not null default false;

create index if not exists idx_users_is_admin
  on public.users (is_admin)
  where is_admin = true;

-- Kurucu hesap admin — omer@complify.io
update public.users
  set is_admin = true
  where email = 'omer@complify.io';

-- ============================================================
-- ADMIN RLS: aggregate query'ler için service_role kullanılacak
-- ============================================================
-- Not: /admin sayfaları backend'de service_role client kullanır
-- (RLS bypass ile aggregate + full read). Buradaki policy sadece
-- self-check için.

-- Kullanıcı kendi is_admin flag'ini görebilir (frontend guard için)
-- Zaten "users_select_own" policy'si tüm kolonlara erişim veriyor.
-- Ekstra policy gerekmez.
