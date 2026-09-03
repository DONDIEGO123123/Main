-- ============================================================
-- מעקב עגלות מלא — שלב הנטישה
-- הרץ ב-SQL Editor. בטוח להרצה חוזרת.
-- ============================================================

-- באיזה שלב הלקוח עזב: העגלה עצמה או עמוד התשלום
alter table public.abandoned_carts
  add column if not exists stage text default 'cart';

alter table public.abandoned_carts
  add column if not exists alerted_at timestamptz;

create index if not exists carts_stage_idx
  on public.abandoned_carts (stage, updated_at desc)
  where recovered = false;

-- ---------- ודא שהרשאות הכתיבה פתוחות למבקרים אנונימיים -----
-- בלי אלה העגלה לא נשמרת כלל, וזה נכשל בשקט.
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
