-- ============================================================
-- מודול 8: תרגומים, גיבויים מתוזמנים, השלמות אחרונות
-- הרץ ב-SQL Editor. בטוח להרצה חוזרת.
-- ============================================================

-- ---------- ארכיטקטורת תרגום (#58) --------------------------
-- כל טקסט במערכת יושב כאן, כך שאפשר להוסיף שפה בלי לגעת בקוד.
create table if not exists public.translations (
  id uuid primary key default gen_random_uuid(),
  namespace text not null default 'ui',
  key text not null,
  he text not null default '',
  ru text default '',
  en text default '',
  updated_at timestamptz not null default now(),
  unique (namespace, key)
);
create index if not exists trans_ns_idx on public.translations (namespace);

-- ---------- תרגום תוכן דינמי (מוצרים, קטגוריות) -------------
create table if not exists public.content_translations (
  id bigserial primary key,
  entity text not null,              -- products | categories | faq
  entity_id uuid not null,
  field text not null,               -- name | description
  lang text not null,                -- ru | en
  value text not null default '',
  unique (entity, entity_id, field, lang)
);
create index if not exists ctrans_idx on public.content_translations (entity, entity_id);

-- ---------- היסטוריית גיבויים (#60) -------------------------
create table if not exists public.backup_log (
  id bigserial primary key,
  kind text not null default 'manual',   -- manual | scheduled | pre_restore
  tables_count int not null default 0,
  rows_count int not null default 0,
  size_kb int not null default 0,
  actor text default '',
  created_at timestamptz not null default now()
);

-- ---------- הרשאות ------------------------------------------
alter table public.translations         enable row level security;
alter table public.content_translations enable row level security;
alter table public.backup_log           enable row level security;

do $$
declare t text;
begin
  foreach t in array array['translations','content_translations'] loop
    execute format('drop policy if exists "%s r" on public.%I', t, t);
    execute format('drop policy if exists "%s a" on public.%I', t, t);
    execute format('create policy "%s r" on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('create policy "%s a" on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

drop policy if exists "backup a" on public.backup_log;
drop policy if exists "backup i" on public.backup_log;
create policy "backup a" on public.backup_log for all to authenticated using (true) with check (true);
create policy "backup i" on public.backup_log for insert to anon, authenticated with check (true);

-- ---------- אינדקסים לביצועים (#62, #67) --------------------
create index if not exists products_active_idx  on public.products (is_active, created_at desc);
create index if not exists products_cat_idx     on public.products (category_id) where is_active = true;
create index if not exists products_feat_idx    on public.products (is_featured) where is_active = true;
create index if not exists orders_phone_created on public.orders (customer_phone, created_at desc);
create index if not exists members_level_idx    on public.members (level);
create index if not exists members_points_idx   on public.members (points desc);
create index if not exists reviews_approved_idx on public.reviews (is_approved, created_at desc);

-- ---------- ניקוי אירועים ישנים -----------------------------
-- מונע נפיחות של טבלת האירועים לאורך זמן.
create or replace function public.prune_events(p_days int default 180)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_count int;
begin
  delete from events where created_at < now() - (p_days || ' days')::interval;
  get diagnostics v_count = row_count;
  delete from product_views where created_at < now() - (p_days || ' days')::interval;
  delete from search_log    where created_at < now() - (p_days || ' days')::interval;
  return v_count;
end $$;

grant execute on function public.prune_events(int) to authenticated;
