-- ==============================================================
-- TAGORA — SHOP: PACKAGES + ORDERS + ORDER_ITEMS
-- Migration: 20260706000007_shop_orders.sql
-- ==============================================================
-- iyzico entegrasyonu için sipariş modeli:
--   sticker_packages   → satılan paket katalog (5'li, 10'lu vs.)
--   orders             → her ödeme bir order kaydı
--   order_items        → order'ın içindeki paketler (multi-item ready)
-- ==============================================================

-- ============================================================
-- STICKER_PACKAGES — paket katalog
-- ============================================================
create table if not exists public.sticker_packages (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,          -- "single", "starter-5", "family-10", "business-25"
  name_tr text not null,
  name_en text not null,
  description_tr text,
  description_en text,

  sticker_count integer not null check (sticker_count > 0),
  price_try numeric(10, 2) not null,  -- KDV DAHİL
  price_usd numeric(10, 2),

  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 0,

  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_sticker_packages_active on public.sticker_packages (is_active, sort_order);

-- Herkes okuyabilir
alter table public.sticker_packages enable row level security;
create policy "packages_select_public" on public.sticker_packages
  for select using (is_active = true);

-- ============================================================
-- ORDERS — ana sipariş kaydı
-- ============================================================
create type public.order_status as enum (
  'pending',        -- iyzico checkout initialize edildi, ödeme bekleniyor
  'paid',           -- ödeme başarılı
  'preparing',      -- paketleniyor (üretim + kargo hazırlanıyor)
  'shipped',        -- kargoya verildi
  'delivered',      -- teslim edildi
  'cancelled',      -- iptal
  'refunded',       -- iade
  'failed'          -- ödeme başarısız
);

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  -- Kısa sipariş no (kullanıcıya gösterilecek): TAG-2026-000123
  order_no text unique not null,
  user_id uuid references public.users(id) on delete set null,

  status order_status not null default 'pending',

  -- Toplam tutar (KDV dahil, TL)
  subtotal_try numeric(10, 2) not null,     -- ürün toplamı
  shipping_try numeric(10, 2) not null default 0,
  total_try numeric(10, 2) not null,        -- ödenen tutar

  -- iyzico
  iyzico_payment_id text,        -- iyzico'nun payment id'si
  iyzico_conversation_id text,   -- bizim conversation id (bize özgü)
  iyzico_token text,             -- checkout form token
  iyzico_raw_response jsonb,     -- callback ham cevabı

  -- Alıcı bilgisi (KVKK: sipariş için gerekli, 5 yıl saklı — vergi mevzuatı)
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text not null,
  buyer_identity_number text,    -- opsiyonel (fatura için gerekebilir)

  -- Kargo adresi
  shipping_address text not null,
  shipping_city text not null,
  shipping_district text,
  shipping_zip text,

  -- Kargo takibi (sonradan doldurulur)
  tracking_carrier text,         -- "aras", "yurtiçi", "mng" vb.
  tracking_number text,

  -- Notlar
  customer_note text,             -- müşteri notu
  admin_note text,                -- admin notu (private)

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz
);

create index if not exists idx_orders_user_id on public.orders (user_id, created_at desc);
create index if not exists idx_orders_status on public.orders (status, created_at desc);
create index if not exists idx_orders_created_at on public.orders (created_at desc);

alter table public.orders enable row level security;

-- Kullanıcı kendi siparişlerini görür
create policy "orders_select_own" on public.orders
  for select to authenticated using (
    user_id = public.current_user_id()
  );

-- Kullanıcı kendi siparişini insert edebilir (checkout başlangıcı)
create policy "orders_insert_own" on public.orders
  for insert to authenticated with check (
    user_id = public.current_user_id()
  );

-- Admin tüm siparişleri görür
create policy "orders_select_admin" on public.orders
  for select to authenticated using (
    exists (select 1 from public.users where auth_user_id = auth.uid() and is_admin = true)
  );

create policy "orders_update_admin" on public.orders
  for update to authenticated using (
    exists (select 1 from public.users where auth_user_id = auth.uid() and is_admin = true)
  );

-- ============================================================
-- ORDER_ITEMS — sepet detayı
-- ============================================================
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  package_id uuid not null references public.sticker_packages(id),

  quantity integer not null check (quantity > 0),
  unit_price_try numeric(10, 2) not null,
  line_total_try numeric(10, 2) not null,

  -- Snapshot: fiyat değişse bile sipariş anındaki bilgi kalır
  package_name text not null,
  package_slug text not null,
  sticker_count integer not null,

  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order on public.order_items (order_id);

alter table public.order_items enable row level security;

-- order'a erişimi olan herkes item'lara da erişir (order üzerinden inherit)
create policy "order_items_select_via_order" on public.order_items
  for select to authenticated using (
    order_id in (
      select id from public.orders
      where user_id = public.current_user_id()
        or exists (select 1 from public.users where auth_user_id = auth.uid() and is_admin = true)
    )
  );

create policy "order_items_insert_via_order" on public.order_items
  for insert to authenticated with check (
    order_id in (
      select id from public.orders where user_id = public.current_user_id()
    )
  );

-- ============================================================
-- ORDER NO GENERATOR
-- ============================================================
create or replace function public.generate_order_no()
returns text language sql volatile as $$
  select 'TAG-' || to_char(now(), 'YYYY') || '-' ||
    lpad((floor(random() * 1000000))::text, 6, '0');
$$;

-- ============================================================
-- SEED — İlk paket katalog
-- ============================================================
insert into public.sticker_packages
  (slug, name_tr, name_en, description_tr, description_en,
   sticker_count, price_try, is_featured, sort_order)
values
  ('single', 'Tekli Sticker', 'Single Sticker',
   'İlk deneyim için, hediye için',
   'For first-time users, a great gift',
   1, 49.00, false, 10),
  ('starter-5', '5''li Başlangıç Paketi', 'Starter Pack of 5',
   'Aile için ideal: araç + kapı + pet + bagaj + bike',
   'Perfect for family: car + door + pet + luggage + bike',
   5, 149.00, true, 20),
  ('family-10', '10''lu Aile Paketi', 'Family Pack of 10',
   'Büyük aile — tüm objelerinize yeter',
   'Large family — enough for all your things',
   10, 249.00, false, 30),
  ('business-25', '25''li İş Paketi', 'Business Pack of 25',
   'Küçük işletme, filo başlangıç',
   'Small business, fleet starter',
   25, 499.00, false, 40)
on conflict (slug) do nothing;
