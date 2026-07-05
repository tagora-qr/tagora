-- ==============================================================
-- TAGORA — PUSH NOTIFICATIONS
-- Migration: 20260706000001_push_notifications.sql
-- ==============================================================
-- Owner mesaj aldığında Expo Push API'ye HTTP çağrı yapan trigger.
-- pg_net extension kullanır (Supabase'de varsayılan yüklü).
--
-- Nasıl çalışır:
-- 1. Mobile app açılınca expo-notifications permission alır, Expo Push Token üretir
-- 2. Token users.push_token'a yazılır (upsert)
-- 3. Scanner mesaj INSERT ederse trigger owner'ın push_token'ına Expo API'ye POST
-- 4. iOS/Android'de bildirim düşer
-- ==============================================================

-- pg_net extension (async HTTP)
create extension if not exists pg_net;

-- ============================================================
-- users.push_token kolonu
-- ============================================================
alter table public.users add column if not exists push_token text;

create index if not exists idx_users_push_token
  on public.users (push_token)
  where push_token is not null and deleted_at is null;

-- ============================================================
-- FUNCTION: notify_new_message
-- ============================================================
-- Scanner → Owner yönünde push tetikler.
-- Owner → Scanner yönünde push YOK (scanner anonim, push_token'ı yok).
create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_push_token text;
  v_owner_locale text;
  v_body text;
  v_title text;
begin
  -- Sadece scanner mesajlarında bildirim (owner reply'da scanner'a push atmıyoruz)
  if new.sender <> 'scanner' then
    return new;
  end if;

  -- Owner ID + push token bul
  select c.owner_id into v_owner_id
  from public.conversations c
  where c.id = new.conversation_id;

  if v_owner_id is null then
    return new;
  end if;

  select push_token, coalesce(locale, 'tr')
  into v_push_token, v_owner_locale
  from public.users
  where id = v_owner_id and deleted_at is null;

  if v_push_token is null then
    return new;
  end if;

  -- Locale'e göre mesaj (message preview değil — privacy: sadece "yeni mesaj var")
  if v_owner_locale = 'en' then
    v_title := 'Tagora';
    v_body := 'Someone scanned your sticker and sent a message.';
  else
    v_title := 'Tagora';
    v_body := 'Sticker''ından biri sana mesaj yolladı.';
  end if;

  -- Expo Push API — async, DB insert'i bloklamaz
  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Accept', 'application/json',
      'Accept-Encoding', 'gzip, deflate'
    ),
    body := jsonb_build_object(
      'to', v_push_token,
      'title', v_title,
      'body', v_body,
      'sound', 'default',
      'priority', 'high',
      'data', jsonb_build_object(
        'type', 'new_message',
        'conversation_id', new.conversation_id
      )
    )
  );

  return new;
exception when others then
  -- Push fail'i mesaj insert'ini engellememeli
  raise warning '[notify_new_message] push failed: %', sqlerrm;
  return new;
end;
$$;

-- ============================================================
-- TRIGGER: messages INSERT sonrası
-- ============================================================
drop trigger if exists trg_notify_new_message on public.messages;
create trigger trg_notify_new_message
  after insert on public.messages
  for each row execute function public.notify_new_message();

-- ============================================================
-- RLS: users kendi push_token'ını update edebilir
-- ============================================================
-- Zaten "users_update_own" policy vardı, update aynı auth_user_id için OK.
-- Ayrıca insert değil update yapılacak (kayıt zaten var, sadece token yazılıyor).
