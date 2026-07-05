-- ==============================================================
-- TAGORA — FULFILMENT: Part 2 - Fonksiyonlar + trigger
-- Migration: 20260706000009_fulfilment_functions.sql
-- ==============================================================
-- Bu migration 20260706000008'den SONRA çalışmalı, çünkü
-- 'allocated' enum değerini kullanan fonksiyonlar var.
-- ==============================================================

-- ============================================================
-- Yardımcı: siparişin toplam sticker ihtiyacı
-- ============================================================
create or replace function public.order_sticker_demand(_order_id uuid)
returns integer
language sql
stable
as $$
  select coalesce(sum(quantity * sticker_count), 0)::integer
    from public.order_items
   where order_id = _order_id;
$$;

-- ============================================================
-- Yardımcı: siparişe atanmış sticker sayısı
-- ============================================================
create or replace function public.order_sticker_allocated(_order_id uuid)
returns integer
language sql
stable
as $$
  select count(*)::integer
    from public.stickers
   where order_id = _order_id;
$$;

-- ============================================================
-- allocate_stickers_to_order: FIFO ile depodan sticker seç → ata
--
-- Dönüş: allocated sticker id array
--
-- Notlar:
--   • Sadece admin çağırmalı — API route auth koruma yapıyor.
--   • FIFO: en eski manufactured sticker'lar önce.
--   • Idempotent: eksik olan kadarını daha atar.
--   • Yeterli stok yoksa mümkün olanı atar, kalanı ikinci çağrıda.
-- ============================================================
create or replace function public.allocate_stickers_to_order(
  _order_id uuid,
  _admin_user_id uuid
)
returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  _need integer;
  _have integer;
  _to_alloc integer;
  _picked_ids uuid[];
begin
  _need := order_sticker_demand(_order_id);
  _have := order_sticker_allocated(_order_id);
  _to_alloc := greatest(_need - _have, 0);

  if _to_alloc = 0 then
    return array[]::uuid[];
  end if;

  -- FIFO — en eski manufactured stickerları seç ve lock'la
  with picked as (
    select id
      from public.stickers
     where status = 'manufactured'
       and order_id is null
     order by created_at asc
     limit _to_alloc
     for update skip locked
  ),
  updated as (
    update public.stickers s
       set status = 'allocated'::sticker_status,
           order_id = _order_id,
           allocated_at = now(),
           allocated_by = _admin_user_id,
           updated_at = now()
      from picked p
     where s.id = p.id
    returning s.id
  )
  select coalesce(array_agg(id), array[]::uuid[]) into _picked_ids from updated;

  return _picked_ids;
end;
$$;

-- ============================================================
-- release_stickers_from_order: iptal/iade sonrası geri bırak
-- ============================================================
create or replace function public.release_stickers_from_order(_order_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  _count integer;
begin
  update public.stickers
     set status = 'manufactured'::sticker_status,
         order_id = null,
         allocated_at = null,
         allocated_by = null,
         updated_at = now()
   where order_id = _order_id
     and status = 'allocated'::sticker_status;
  get diagnostics _count = row_count;
  return _count;
end;
$$;

-- ============================================================
-- Trigger: sipariş status değişince sticker'ları da güncelle
--   paid/preparing → sticker status'ünü değiştirme (sadece "ata" call gerekir)
--   shipped        → allocated → shipped
--   delivered      → allocated/shipped → delivered
--   cancelled/refunded → allocated → manufactured (geri depoya)
-- ============================================================
create or replace function public.orders_status_cascade_to_stickers()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'shipped' and old.status is distinct from 'shipped' then
    update public.stickers
       set status = 'shipped'::sticker_status, updated_at = now()
     where order_id = new.id and status = 'allocated'::sticker_status;
  elsif new.status = 'delivered' and old.status is distinct from 'delivered' then
    update public.stickers
       set status = 'delivered'::sticker_status, updated_at = now()
     where order_id = new.id
       and status in ('allocated'::sticker_status, 'shipped'::sticker_status);
  elsif new.status in ('cancelled', 'refunded') and old.status not in ('cancelled', 'refunded') then
    -- Allocated → depoya geri. Shipped/delivered'lara dokunma.
    update public.stickers
       set status = 'manufactured'::sticker_status,
           order_id = null,
           allocated_at = null,
           allocated_by = null,
           updated_at = now()
     where order_id = new.id
       and status = 'allocated'::sticker_status;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_status_cascade on public.orders;
create trigger trg_orders_status_cascade
  after update of status on public.orders
  for each row
  execute function public.orders_status_cascade_to_stickers();
