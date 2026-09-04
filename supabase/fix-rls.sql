-- ============================================================
-- תיקון הרשאות — לקוחות לא הצליחו ליצור הזמנה
-- הרץ ב-SQL Editor. בטוח להרצה חוזרת.
-- ============================================================

-- מוחק כל מדיניות קיימת על הטבלאות, לפי שם אמיתי מהמסד.
-- הניסיון הקודם מחק לפי שמות שניחשנו, ולכן מדיניות ישנה שרדה.
do $$
declare
  r record;
  t text;
begin
  foreach t in array array['orders','abandoned_carts'] loop
    for r in
      select policyname from pg_policies
       where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy if exists %I on public.%I', r.policyname, t);
    end loop;
  end loop;
end $$;

-- ---------- הזמנות ------------------------------------------
alter table public.orders enable row level security;

-- לקוח אנונימי חייב להיות מסוגל ליצור הזמנה
create policy "orders_insert_public" on public.orders
  for insert to anon, authenticated with check (true);

create policy "orders_select_public" on public.orders
  for select to anon, authenticated using (true);

create policy "orders_update_admin" on public.orders
  for update to authenticated using (true) with check (true);

create policy "orders_delete_admin" on public.orders
  for delete to authenticated using (true);

-- ---------- עגלות נטושות ------------------------------------
alter table public.abandoned_carts enable row level security;

create policy "carts_insert_public" on public.abandoned_carts
  for insert to anon, authenticated with check (true);

create policy "carts_select_public" on public.abandoned_carts
  for select to anon, authenticated using (true);

create policy "carts_update_public" on public.abandoned_carts
  for update to anon, authenticated using (true) with check (true);

create policy "carts_delete_public" on public.abandoned_carts
  for delete to anon, authenticated using (true);

-- ---------- בדיקה -------------------------------------------
-- אמור להחזיר מדיניות insert עבור anon בשתי הטבלאות
select tablename, policyname, cmd, roles
  from pg_policies
 where schemaname = 'public'
   and tablename in ('orders','abandoned_carts')
 order by tablename, cmd;
