-- ==============================================================
-- TAGORA — INITIAL SCHEMA
-- Migration: 20260520000001_initial_schema.sql
-- ==============================================================
-- Privacy-first QR sticker platform
-- - All PII (phone) encrypted at column level via pgcrypto
-- - Row-Level Security enabled on every table
-- - Scanner sessions are ephemeral (24h TTL)
-- - Messages auto-soft-delete after 90 days (cron)
-- ==============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ============================================================
-- ENUMS
-- ============================================================
create type user_tier as enum ('free', 'plus', 'business');
create type sticker_status as enum (
  'manufactured', 'shipped', 'delivered',
  'claimed', 'active', 'blocked', 'retired', 'recall'
);
create type sticker_use_case as enum (
  'vehicle', 'door', 'pet', 'luggage', 'bike', 'other'
);
create type message_sender as enum ('owner', 'scanner', 'system');
create type conversation_status as enum ('active', 'resolved', 'blocked');
create type abuse_reason as enum (
  'spam', 'harassment', 'threat', 'phishing',
  'sexual_content', 'hate_speech', 'other'
);
create type abuse_status as enum ('pending', 'reviewed', 'actioned', 'dismissed');

-- ============================================================
-- USERS — sticker sahipleri
-- ============================================================
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email citext unique not null,
  phone text,                       -- şifreli; pgp_sym_encrypt ile yaz
  display_name text,
  locale text not null default 'tr' check (locale in ('tr', 'en')),
  tier user_tier not null default 'free',
  kvkk_consent_at timestamptz not null default now(),
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz                  -- soft delete (KVKK)
);

create index idx_users_auth_user_id on public.users(auth_user_id);
create index idx_users_email on public.users(email);

-- ============================================================
-- STICKER_DESIGNS — satılan tasarımlar
-- ============================================================
create table public.sticker_designs (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,        -- "classic", "mat-premium", "pet-id", "luggage"
  name_tr text not null,
  name_en text not null,
  description_tr text,
  description_en text,
  price_try numeric(10,2) not null,
  price_usd numeric(10,2),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- STICKERS — tekil sticker'lar (token bazlı)
-- ============================================================
create table public.stickers (
  id uuid primary key default uuid_generate_v4(),
  -- Public scanner URL: tagora.app/s/<token>
  -- 10 char Base62 cryptographic random → 62^10 ≈ 8.4×10^17 kombinasyon
  token text unique not null check (length(token) = 10),

  design_id uuid references public.sticker_designs(id),
  owner_id uuid references public.users(id) on delete set null,

  status sticker_status not null default 'manufactured',
  use_case sticker_use_case,
  label text,                        -- "Mavi Skoda", "Apt zili" gibi sahip-belirli isim

  scan_count integer not null default 0,
  last_scanned_at timestamptz,

  manufactured_at timestamptz not null default now(),
  claimed_at timestamptz,
  blocked_at timestamptz,

  -- v1 acil durum profili (premium kullanıcılar için, şifreli)
  encrypted_emergency_info text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_stickers_token on public.stickers(token);
create index idx_stickers_owner_id on public.stickers(owner_id);
create index idx_stickers_status on public.stickers(status);

-- ============================================================
-- SCANNER_SESSIONS — anonim ziyaretçi oturumu
-- ============================================================
-- Bir scanner QR'ı taradığında oluşur. App gerektirmez.
-- TTL: 7 gün (sonra sessions silinir, mesajlar conversation'da kalır)
create table public.scanner_sessions (
  id uuid primary key default uuid_generate_v4(),
  sticker_id uuid not null references public.stickers(id) on delete cascade,

  -- Browser cookie ile eşleşen ephemeral token (10-15 char)
  ephemeral_token text unique not null,

  -- Anonim isim (kullanıcı kendi verir)
  display_name text,

  -- Spam koruması: cihaz fingerprint (hash'lenmiş, 24sa sonra silinir)
  device_fingerprint_hash text,

  -- Rate limit için sayaç
  message_count integer not null default 0,

  -- Sahip bu session'ı engelledi mi?
  is_blocked boolean not null default false,

  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create index idx_scanner_sessions_sticker on public.scanner_sessions(sticker_id);
create index idx_scanner_sessions_token on public.scanner_sessions(ephemeral_token);
create index idx_scanner_sessions_expires on public.scanner_sessions(expires_at);

-- ============================================================
-- CONVERSATIONS — sahip ↔ scanner konuşması
-- ============================================================
create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  sticker_id uuid not null references public.stickers(id) on delete cascade,
  scanner_session_id uuid not null references public.scanner_sessions(id) on delete cascade,
  owner_id uuid references public.users(id) on delete cascade,

  status conversation_status not null default 'active',

  last_message_at timestamptz,
  unread_owner_count integer not null default 0,
  unread_scanner_count integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (sticker_id, scanner_session_id)
);

create index idx_conversations_sticker on public.conversations(sticker_id);
create index idx_conversations_owner on public.conversations(owner_id);
create index idx_conversations_session on public.conversations(scanner_session_id);
create index idx_conversations_last_msg on public.conversations(last_message_at desc);

-- ============================================================
-- MESSAGES — chat mesajları
-- ============================================================
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender message_sender not null,
  body text not null check (length(body) between 1 and 2000),
  -- v1 E2E için: body yerine encrypted_body kullanılacak (signal protocol bindings)

  sent_at timestamptz not null default now(),
  read_at timestamptz,

  -- Spam/abuse review
  flagged boolean not null default false,
  flag_reason text,

  -- KVKK soft delete (90 gün)
  deleted_at timestamptz
);

create index idx_messages_conversation on public.messages(conversation_id, sent_at desc);
create index idx_messages_sent_at on public.messages(sent_at);

-- ============================================================
-- ABUSE_REPORTS — şikayet kuyruğu
-- ============================================================
create table public.abuse_reports (
  id uuid primary key default uuid_generate_v4(),
  sticker_id uuid references public.stickers(id) on delete set null,
  scanner_session_id uuid references public.scanner_sessions(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  reported_by_user_id uuid references public.users(id) on delete set null,
  reason abuse_reason not null,
  details text,
  status abuse_status not null default 'pending',
  reviewed_at timestamptz,
  reviewer_notes text,
  created_at timestamptz not null default now()
);

create index idx_abuse_status on public.abuse_reports(status);
create index idx_abuse_sticker on public.abuse_reports(sticker_id);

-- ============================================================
-- WAITLIST — pre-launch e-mail toplama
-- ============================================================
create table public.waitlist (
  id uuid primary key default uuid_generate_v4(),
  email citext unique not null,
  locale text not null default 'tr',
  referral_source text,
  created_at timestamptz not null default now()
);

create index idx_waitlist_email on public.waitlist(email);

-- ============================================================
-- TRIGGERS — updated_at otomatik
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_users_updated_at before update on public.users
  for each row execute function set_updated_at();
create trigger trg_stickers_updated_at before update on public.stickers
  for each row execute function set_updated_at();
create trigger trg_conversations_updated_at before update on public.conversations
  for each row execute function set_updated_at();

-- ============================================================
-- TRIGGER — message gelince conversation güncelle
-- ============================================================
create or replace function update_conversation_on_message()
returns trigger as $$
begin
  update public.conversations
  set
    last_message_at = new.sent_at,
    unread_owner_count = case when new.sender = 'scanner' then unread_owner_count + 1 else unread_owner_count end,
    unread_scanner_count = case when new.sender = 'owner' then unread_scanner_count + 1 else unread_scanner_count end,
    updated_at = now()
  where id = new.conversation_id;

  -- Sticker scan_count'u sadece ilk mesajda artır (yeni session = yeni scan)
  if new.sender = 'scanner' and not exists (
    select 1 from public.messages
    where conversation_id = new.conversation_id
    and sender = 'scanner'
    and id <> new.id
  ) then
    update public.stickers
    set
      scan_count = scan_count + 1,
      last_scanned_at = new.sent_at
    where id = (
      select sticker_id from public.conversations where id = new.conversation_id
    );
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_message_updates_conv after insert on public.messages
  for each row execute function update_conversation_on_message();

-- ============================================================
-- TRIGGER — auth.users → public.users sync
-- ============================================================
-- Supabase Auth ile signup olunca otomatik public.users yarat
create or replace function handle_new_auth_user()
returns trigger as $$
begin
  insert into public.users (auth_user_id, email, locale)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'locale', 'tr')
  )
  on conflict (email) do update
    set auth_user_id = new.id;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ============================================================
-- SEED DATA — sticker tasarımları
-- ============================================================
insert into public.sticker_designs (slug, name_tr, name_en, description_tr, description_en, price_try, price_usd) values
  ('classic', 'Klasik', 'Classic',
   'Beyaz zemin + lacivert QR. Standart cam içine optimize edilmiş.',
   'White background + navy QR. Optimized for car window interior.',
   89.00, 7.99),
  ('mat-premium', 'Mat Premium', 'Mat Premium',
   'Mat siyah + altın detay. Lüks segment.',
   'Matte black + gold accent. Premium segment.',
   119.00, 10.99),
  ('pet-id', 'Pet ID', 'Pet ID',
   'Mini, parlak, kemik şekilli. Köpek tasması için.',
   'Mini, glossy, bone-shaped. For pet collars.',
   49.00, 4.49),
  ('luggage', 'Bagaj Etiketi', 'Luggage Tag',
   'Şeffaf zemin + reflektif. Seyahat için.',
   'Transparent + reflective. For travel.',
   39.00, 3.49);
