-- ==============================================================
-- TAGORA — BUSINESS LEADS
-- Migration: 20260706000010_business_leads.sql
-- ==============================================================
-- B2B teklif taleplerini toplayan tablo. /business sayfasındaki
-- form buraya insert eder. Admin panelde takip edilir.
-- ==============================================================

create table if not exists public.business_leads (
  id uuid primary key default uuid_generate_v4(),

  -- İletişim
  contact_name text not null,
  email text not null,
  phone text,

  -- Şirket
  company_name text not null,
  company_size text,
  sector text,

  -- İhtiyaç
  estimated_quantity integer,
  custom_design boolean not null default false,
  message text,

  -- Kaynak / Attribution
  source text not null default 'website',
  utm_source text,
  utm_medium text,
  utm_campaign text,

  -- Süreç takibi
  status text not null default 'new',
  admin_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.business_leads is 'B2B teklif talepleri — /business sayfasından';
comment on column public.business_leads.status is 'new / contacted / quoted / converted / lost';
comment on column public.business_leads.sector is 'fleet, hotel, vet, ecommerce, bike, corp, other';
comment on column public.business_leads.company_size is '1-10, 11-50, 51-200, 200+';

create index if not exists idx_business_leads_status on public.business_leads (status, created_at desc);
create index if not exists idx_business_leads_email on public.business_leads (email);
create index if not exists idx_business_leads_created_at on public.business_leads (created_at desc);

-- ============================================================
-- RLS
-- ============================================================
alter table public.business_leads enable row level security;

-- Herkes insert edebilir (public form) — email zorunlu, valid format kontrol
create policy "business_leads_public_insert" on public.business_leads
  for insert
  to anon, authenticated
  with check (
    length(contact_name) > 1
    and length(company_name) > 1
    and email ~* '^[^@]+@[^@]+\.[^@]+$'
  );

-- Sadece admin okuyabilir
create policy "business_leads_admin_select" on public.business_leads
  for select
  to authenticated
  using (
    exists (select 1 from public.users where auth_user_id = auth.uid() and is_admin = true)
  );

-- Sadece admin update edebilir (status, admin_note)
create policy "business_leads_admin_update" on public.business_leads
  for update
  to authenticated
  using (
    exists (select 1 from public.users where auth_user_id = auth.uid() and is_admin = true)
  );

-- ============================================================
-- Trigger: updated_at otomatik güncelle
-- ============================================================
create or replace function public.business_leads_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_business_leads_touch on public.business_leads;
create trigger trg_business_leads_touch
  before update on public.business_leads
  for each row
  execute function public.business_leads_touch_updated_at();
