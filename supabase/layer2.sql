-- ============================================================
-- שכבה 2: קופונים, Flash Sale, פרסים, מעקב צפיות
-- הרץ ב-SQL Editor של Supabase. בטוח להרצה חוזרת.
-- ============================================================

-- קופונים -----------------------------------------------------
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  kind text not null default 'percent' check (kind in ('percent','amount')),
  value numeric(10,2) not null default 0,
  min_order numeric(10,2) not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses int,
  used_count int not null default 0,
  vip_only boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Flash Sale --------------------------------------------------
create table if not exists public.flash_sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid,
  sale_price numeric(10,2) not null default 0,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- פרסים למימוש בנקודות ----------------------------------------
create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  points_cost int not null default 0,
  coupon_code text,
  min_level text default 'member',
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table if not exists public.reward_redemptions (
  id bigserial primary key,
  member_id uuid,
  reward_id uuid,
  points_spent int not null default 0,
  code text,
  created_at timestamptz not null default now()
);

-- מעקב צפיות במוצרים (לצורך Best Sellers והמלצות) -------------
create table if not exists public.product_views (
  id bigserial primary key,
  product_id uuid not null,
  session_id text,
  created_at timestamptz not null default now()
);
create index if not exists product_views_idx on public.product_views (product_id, created_at desc);

-- שאלות נפוצות לכל מוצר ---------------------------------------
create table if not exists public.product_faq (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  question text not null,
  answer text not null,
  sort_order int not null default 0
);

-- התראה כשמוצר חוזר למלאי -------------------------------------
create table if not exists public.stock_alerts (
  id bigserial primary key,
  product_id uuid not null,
  phone text not null,
  notified boolean not null default false,
  created_at timestamptz not null default now()
);

-- תגיות ותגי מוצר ---------------------------------------------
alter table public.products add column if not exists tags text[] default '{}';
alter table public.products add column if not exists badge text;

-- קופון שנוצל בהזמנה ------------------------------------------
alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists discount numeric(10,2) default 0;

-- הרשאות ------------------------------------------------------
alter table public.coupons enable row level security;
alter table public.flash_sales enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.product_views enable row level security;
alter table public.product_faq enable row level security;
alter table public.stock_alerts enable row level security;

do $$
declare t text;
begin
  foreach t in array array['coupons','flash_sales','rewards','product_faq'] loop
    execute format('drop policy if exists "%s read" on public.%I', t, t);
    execute format('drop policy if exists "%s admin" on public.%I', t, t);
    execute format('create policy "%s read" on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('create policy "%s admin" on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;

  foreach t in array array['reward_redemptions','product_views','stock_alerts'] loop
    execute format('drop policy if exists "%s read" on public.%I', t, t);
    execute format('drop policy if exists "%s insert" on public.%I', t, t);
    execute format('drop policy if exists "%s admin" on public.%I', t, t);
    execute format('create policy "%s read" on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('create policy "%s insert" on public.%I for insert to anon, authenticated with check (true)', t, t);
    execute format('create policy "%s admin" on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- פרסים לדוגמה (ניתן לערוך/למחוק מהאדמין) ---------------------
insert into public.rewards (title, description, points_cost, sort_order) values
  ('5% הנחה להזמנה הבאה',  'קופון חד-פעמי',           500,  1),
  ('10% הנחה להזמנה הבאה', 'קופון חד-פעמי',           1000, 2),
  ('משלוח חינם',           'על ההזמנה הבאה שלך',      750,  3)
on conflict do nothing;
