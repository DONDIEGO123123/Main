-- ============================================================
-- תיקון קריטי — עמודות חסרות בטבלת ההזמנות
-- בלי אלה אף הזמנה לא נשמרת.
-- הרץ ב-SQL Editor. בטוח להרצה חוזרת.
-- ============================================================

alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists discount numeric(10,2) default 0;
alter table public.orders add column if not exists channel text;
alter table public.orders add column if not exists member_id uuid;
alter table public.orders add column if not exists admin_notes text default '';
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists courier text;
alter table public.orders add column if not exists review_requested boolean default false;

-- עגלות: העמודות שהמעקב החדש כותב
alter table public.abandoned_carts add column if not exists stage text default 'cart';
alter table public.abandoned_carts add column if not exists alerted_at timestamptz;

-- ---------- הרשאות כתיבה להזמנות ----------------------------
-- לקוח אנונימי חייב להיות מסוגל ליצור הזמנה.
alter table public.orders enable row level security;

drop policy if exists "orders insert" on public.orders;
drop policy if exists "orders read" on public.orders;
drop policy if exists "orders admin" on public.orders;
drop policy if exists "public insert orders" on public.orders;
drop policy if exists "public read orders" on public.orders;
drop policy if exists "admin all orders" on public.orders;

create policy "orders insert" on public.orders
  for insert to anon, authenticated with check (true);
create policy "orders read" on public.orders
  for select to anon, authenticated using (true);
create policy "orders admin" on public.orders
  for all to authenticated using (true) with check (true);

-- ---------- הרשאות לעגלות נטושות ----------------------------
alter table public.abandoned_carts enable row level security;

drop policy if exists "abandoned_carts r" on public.abandoned_carts;
drop policy if exists "abandoned_carts i" on public.abandoned_carts;
drop policy if exists "abandoned_carts u" on public.abandoned_carts;
drop policy if exists "abandoned_carts d" on public.abandoned_carts;
drop policy if exists "abandoned_carts a" on public.abandoned_carts;

create policy "abandoned_carts r" on public.abandoned_carts
  for select to anon, authenticated using (true);
create policy "abandoned_carts i" on public.abandoned_carts
  for insert to anon, authenticated with check (true);
create policy "abandoned_carts u" on public.abandoned_carts
  for update to anon, authenticated using (true) with check (true);
create policy "abandoned_carts d" on public.abandoned_carts
  for delete to anon, authenticated using (true);
create policy "abandoned_carts a" on public.abandoned_carts
  for all to authenticated using (true) with check (true);

-- ---------- בדיקה: כל העמודות קיימות? ----------------------
select
  count(*) filter (where column_name = 'coupon_code') as coupon_code,
  count(*) filter (where column_name = 'discount')    as discount,
  count(*) filter (where column_name = 'channel')     as channel,
  count(*) filter (where column_name = 'member_id')   as member_id
from information_schema.columns
where table_name = 'orders';
