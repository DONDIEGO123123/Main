-- ============================================================
-- התראות דחיפה לטלפון
-- הרץ בפרויקט bbjqmbmuabhmtihuvomo. בטוח להרצה חוזרת.
-- ============================================================

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text unique not null,        -- מזהה ייחודי של המכשיר
  p256dh text not null,                 -- מפתחות הצפנה של הדפדפן
  auth text not null,
  member_id uuid,
  user_agent text default '',
  failed_count int not null default 0,  -- מכשיר שנכשל שוב ושוב מוסר
  last_sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists push_member_idx on public.push_subscriptions (member_id);

-- היסטוריית שליחות, כדי לדעת מה נשלח ולמי
create table if not exists public.push_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text default '',
  link text,
  sent_count int not null default 0,
  failed_count int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- הרשאות ------------------------------------------
do $$
declare r record; t text;
begin
  foreach t in array array['push_subscriptions','push_campaigns'] loop
    for r in select policyname from pg_policies
              where schemaname='public' and tablename=t loop
      execute format('drop policy if exists %I on public.%I', r.policyname, t);
    end loop;
  end loop;
end $$;

alter table public.push_subscriptions enable row level security;
alter table public.push_campaigns     enable row level security;

-- מבקר אנונימי צריך להירשם להתראות בעצמו
create policy "push_sub_insert" on public.push_subscriptions
  for insert to anon, authenticated with check (true);
create policy "push_sub_select" on public.push_subscriptions
  for select to anon, authenticated using (true);
create policy "push_sub_update" on public.push_subscriptions
  for update to anon, authenticated using (true) with check (true);
create policy "push_sub_delete" on public.push_subscriptions
  for delete to anon, authenticated using (true);

create policy "push_camp_all" on public.push_campaigns
  for all to anon, authenticated using (true) with check (true);

-- ---------- בדיקה -------------------------------------------
select
  (select count(*) from public.push_subscriptions) as devices,
  (select count(*) from pg_policies
    where tablename='push_subscriptions' and cmd='INSERT') as can_subscribe;
