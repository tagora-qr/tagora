-- ==============================================================
-- TAGORA — KVKK CLEANUP JOBS
-- Migration: 20260520000003_cron_cleanup.sql
-- ==============================================================
-- KVKK gereği:
-- - Scanner session device_fingerprint_hash: 24 saat sonra null
-- - Scanner session: 7 gün sonra silinir
-- - Messages: 90 gün sonra soft-delete (deleted_at set)
-- - Audit log: 1 yıl sonra silinir
-- ==============================================================
-- Bu fonksiyonlar pg_cron veya Supabase scheduled function ile çalıştırılır.
-- Lokal geliştirme için: manuel olarak `select run_kvkk_cleanup();` ile test
-- ==============================================================

create or replace function public.purge_expired_fingerprints()
returns integer
language plpgsql
security definer
as $$
declare
  cnt integer;
begin
  update public.scanner_sessions
  set device_fingerprint_hash = null
  where device_fingerprint_hash is not null
    and created_at < now() - interval '24 hours';
  get diagnostics cnt = row_count;
  return cnt;
end;
$$;

create or replace function public.purge_expired_sessions()
returns integer
language plpgsql
security definer
as $$
declare
  cnt integer;
begin
  delete from public.scanner_sessions
  where expires_at < now();
  get diagnostics cnt = row_count;
  return cnt;
end;
$$;

create or replace function public.soft_delete_old_messages()
returns integer
language plpgsql
security definer
as $$
declare
  cnt integer;
begin
  update public.messages
  set deleted_at = now(), body = ''
  where deleted_at is null
    and sent_at < now() - interval '90 days';
  get diagnostics cnt = row_count;
  return cnt;
end;
$$;

create or replace function public.run_kvkk_cleanup()
returns table (job text, affected integer)
language plpgsql
security definer
as $$
begin
  return query
    select 'purge_expired_fingerprints' as job, public.purge_expired_fingerprints() as affected
  union all
    select 'purge_expired_sessions', public.purge_expired_sessions()
  union all
    select 'soft_delete_old_messages', public.soft_delete_old_messages();
end;
$$;

-- ============================================================
-- KVKK Md.11 — Kullanıcı kendi verilerini silmek isterse
-- ============================================================
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
as $$
declare
  uid uuid;
begin
  uid := public.current_user_id();
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Soft delete + anonimleştir
  update public.users
  set
    email = 'deleted-' || id::text || '@deleted.tagora.app',
    phone = null,
    display_name = null,
    deleted_at = now()
  where id = uid;

  -- Tüm sticker'ları "retired" yap
  update public.stickers
  set status = 'retired', owner_id = null
  where owner_id = uid;

  -- Konuşmaları kapat
  update public.conversations
  set status = 'blocked'
  where owner_id = uid;

  -- auth.users'ı sil (cascade ile public.users.auth_user_id = null olur)
  delete from auth.users where id = auth.uid();
end;
$$;

-- ============================================================
-- KVKK Md.11 — Kullanıcı verisini export et
-- ============================================================
create or replace function public.export_my_data()
returns jsonb
language plpgsql
security definer
as $$
declare
  uid uuid;
  result jsonb;
begin
  uid := public.current_user_id();
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select jsonb_build_object(
    'user', row_to_json(u.*),
    'stickers', (
      select jsonb_agg(row_to_json(s.*))
      from public.stickers s
      where s.owner_id = uid
    ),
    'conversations', (
      select jsonb_agg(jsonb_build_object(
        'conversation', row_to_json(c.*),
        'messages', (
          select jsonb_agg(row_to_json(m.*))
          from public.messages m
          where m.conversation_id = c.id and m.deleted_at is null
        )
      ))
      from public.conversations c
      where c.owner_id = uid
    ),
    'exported_at', now()
  ) into result
  from public.users u
  where u.id = uid;

  return result;
end;
$$;
