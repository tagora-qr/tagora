-- ==============================================================
-- TAGORA — FULFILMENT: Part 1 - Sadece enum + kolon değişiklikleri
-- Migration: 20260706000008_sticker_order_fulfilment.sql
-- ==============================================================
-- NOT: Postgres'te ALTER TYPE ... ADD VALUE, aynı transaction içinde
-- yeni değeri kullanamaz. Bu yüzden enum değişikliği burada,
-- fonksiyon/trigger bir sonraki migration'da (20260706000009).
-- ==============================================================

-- ============================================================
-- Enum: 'allocated' değeri ekle
-- ============================================================
alter type sticker_status add value if not exists 'allocated' before 'shipped';

-- ============================================================
-- stickers tablosuna order tracking kolonları
-- ============================================================
alter table public.stickers
  add column if not exists order_id uuid references public.orders(id) on delete set null,
  add column if not exists allocated_at timestamptz,
  add column if not exists allocated_by uuid references public.users(id);

create index if not exists idx_stickers_order_id on public.stickers (order_id);
create index if not exists idx_stickers_status_created on public.stickers (status, created_at);
