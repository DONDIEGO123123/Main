-- ============================================================
-- עגלות נטושות — הכל במקום אחד
-- הרץ בפרויקט bbjqmbmuabhmtihuvomo (זה שהאתר מדבר איתו)
-- בטוח להרצה חוזרת.
-- ============================================================

-- ---------- הטבלה ------------------------------------------
create table if not exists public.abandoned_carts (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  phone text,
  member_id uuid,
  items jsonb not null default '[]'::jsonb,
  total numeric(10,2) not null default 0,
  recovered boolean not null default false,
  stage text default 'cart',
  alerted_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- אם הטבלה כבר קיימת בלי העמודות החדשות
alter table public.abandoned_carts add column if not exists stage text default 'cart';
alter table public.abandoned_carts add column if not exists alerted_at timestamptz;
alter table public.abandoned_carts add column if not exists member_id uuid;

create index if not exists carts_stage_idx
  on public.abandoned_carts (stage, updated_at desc) where recovered = false;

-- ---------- הרשאות ------------------------------------------
-- מוחק כל מדיניות קיימת לפי שמה האמיתי, כדי שלא תישאר ישנה שחוסמת
do $$
declare r record;
begin
  for r in select policyname from pg_policies
            where schemaname = 'public' and tablename = 'abandoned_carts'
  loop
    execute format('drop policy if exists %I on public.abandoned_carts', r.policyname);
  end loop;
end $$;

alter table public.abandoned_carts enable row level security;

create policy "carts_insert_public" on public.abandoned_carts
  for insert to anon, authenticated with check (true);
create policy "carts_select_public" on public.abandoned_carts
  for select to anon, authenticated using (true);
create policy "carts_update_public" on public.abandoned_carts
  for update to anon, authenticated using (true) with check (true);
create policy "carts_delete_public" on public.abandoned_carts
  for delete to anon, authenticated using (true);

-- ---------- הגדרת ההודעה ללקוח ------------------------------
insert into public.settings (key, value)
values ('site', '{}'::jsonb)
on conflict (key) do nothing;

update public.settings
   set value = value || jsonb_build_object(
     'cart_message', coalesce(value->>'cart_message',
       'היי! ראינו שהשארת מוצרים בעגלה 🛍️
רוצה שנשלים את ההזמנה?')
   )
 where key = 'site';

-- ---------- בדיקה -------------------------------------------
select
  (select count(*) from information_schema.columns
    where table_name='abandoned_carts' and column_name='stage')      as has_stage,
  (select count(*) from information_schema.columns
    where table_name='abandoned_carts' and column_name='alerted_at') as has_alerted,
  (select count(*) from pg_policies
    where tablename='abandoned_carts' and cmd='INSERT'
      and 'anon' = any(roles))                                       as can_insert,
  (select count(*) from public.abandoned_carts)                      as carts_now;
