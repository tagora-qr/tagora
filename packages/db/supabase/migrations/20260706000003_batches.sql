-- ==============================================================
-- TAGORA — PRINT BATCHES
-- Migration: 20260706000003_batches.sql
-- ==============================================================
-- Üretim batch'leri kaydı — hangi tarihte hangi use_case için kaç sticker
-- basıldı, hangi output dizinine yazıldı, kim tarafından tetiklendi.
-- ==============================================================

create table if not exists public.print_batches (
  id uuid primary key default uuid_generate_v4(),
  -- Batch adı — script tarafından üretilir (2026-07-05-vehicle-100 gibi)
  name text unique not null,

  use_case text not null,
  sku text not null,
  size text not null,          -- '5x5' veya '3x3'
  count integer not null check (count > 0),

  -- Nereye üretildi (local disk yolu, kayıt için)
  output_dir text,

  -- Notlar (üretici gönderim, kargo takip vb.)
  notes text,

  -- Hangi admin tarafından tetiklendi (opsiyonel — script CLI'dan çalıştığında NULL)
  created_by uuid references public.users(id) on delete set null,

  created_at timestamptz not null default now()
);

create index if not exists idx_print_batches_use_case on public.print_batches (use_case, created_at desc);
create index if not exists idx_print_batches_created_at on public.print_batches (created_at desc);

-- RLS: sadece admin'ler görebilir/insert edebilir
alter table public.print_batches enable row level security;

create policy "batches_admin_select" on public.print_batches
  for select to authenticated using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.is_admin = true
    )
  );

-- Script service_role kullanır — RLS bypass, ekstra policy gerekmez.
-- Manuel insert admin panelden yapılacaksa policy eklenir Sprint 7'de.
