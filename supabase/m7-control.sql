-- ============================================================
-- מודול 7: מרכז בקרה — יומן פעולות, סל מיחזור, Feature Flags
-- הרץ ב-SQL Editor. בטוח להרצה חוזרת.
-- ============================================================

-- ---------- יומן פעולות אדמין (#46) -------------------------
create table if not exists public.admin_log (
  id bigserial primary key,
  actor text default '',
  action text not null,                 -- create | update | delete | restore | login
  entity text not null,                 -- products | coupons | members ...
  entity_id text,
  summary text default '',
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_log_idx    on public.admin_log (created_at desc);
create index if not exists admin_log_ent_idx on public.admin_log (entity, entity_id);

-- ---------- סל מיחזור (#47) ---------------------------------
create table if not exists public.trash (
  id bigserial primary key,
  entity text not null,
  entity_id text not null,
  payload jsonb not null,
  deleted_by text default '',
  deleted_at timestamptz not null default now()
);
create index if not exists trash_idx on public.trash (deleted_at desc);

-- ---------- Feature Flags (#49) -----------------------------
create table if not exists public.feature_flags (
  key text primary key,
  label text not null,
  enabled boolean not null default true,
  description text default '',
  sort_order int not null default 0
);

insert into public.feature_flags (key,label,description,sort_order) values
  ('rewards',       'מרכז הטבות',      'מימוש נקודות בקופונים',        1),
  ('referral',      'חבר מביא חבר',    'קישורי הפניה ותגמול',          2),
  ('challenges',    'אתגרים והישגים',  'משימות, הישגים ותגים',         3),
  ('daily_reward',  'תגמול יומי',      'פרס יומי מצטבר',               4),
  ('mystery',       'פרסים מסתוריים',  'תיבות הפתעה',                  5),
  ('polls',         'הצבעות וסקרים',   'הצבעות קהילה',                 6),
  ('feed',          'עדכוני קהילה',    'פיד אירועים',                  7),
  ('notifications', 'מרכז התראות',     'פעמון והתראות אישיות',         8),
  ('compare',       'השוואת מוצרים',   'מגש השוואה',                   9),
  ('support',       'מרכז תמיכה',      'פתיחת פניות',                 10),
  ('music',         'מוזיקת רקע',      'נגן ברקע',                    11),
  ('exit_offer',    'פופאפ נטישה',     'הצעה לפני יציאה',             12)
on conflict (key) do nothing;

-- ---------- הרשאות ------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['admin_log','trash','feature_flags'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s r" on public.%I', t, t);
    execute format('drop policy if exists "%s i" on public.%I', t, t);
    execute format('drop policy if exists "%s a" on public.%I', t, t);
    execute format('create policy "%s a" on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- דגלים נקראים גם ע"י מבקרים אנונימיים
drop policy if exists "flags public read" on public.feature_flags;
create policy "flags public read" on public.feature_flags
  for select to anon, authenticated using (true);

-- יומן: כתיבה מותרת גם מהאתר כדי לתעד פעולות
drop policy if exists "log insert" on public.admin_log;
create policy "log insert" on public.admin_log
  for insert to anon, authenticated with check (true);

-- ---------- מחיקה רכה: העברה לסל במקום איבוד מידע -----------
create or replace function public.soft_delete(
  p_entity text, p_id text, p_actor text default ''
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_row jsonb;
begin
  -- רק טבלאות מאושרות, כדי שלא ניתן יהיה למחוק כל דבר
  if p_entity not in ('products','categories','coupons','rewards','bundles',
                      'promotions','banners','reviews','challenges',
                      'achievements','missions','badges','milestones') then
    return false;
  end if;

  execute format('select to_jsonb(t) from public.%I t where t.id = $1', p_entity)
    into v_row using p_id::uuid;
  if v_row is null then return false; end if;

  insert into trash (entity, entity_id, payload, deleted_by)
  values (p_entity, p_id, v_row, p_actor);

  insert into admin_log (actor, action, entity, entity_id, summary, before_data)
  values (p_actor, 'delete', p_entity, p_id, 'הועבר לסל המיחזור', v_row);

  execute format('delete from public.%I where id = $1', p_entity) using p_id::uuid;
  return true;
end $$;

-- ---------- שחזור מהסל --------------------------------------
create or replace function public.restore_trash(
  p_trash_id bigint, p_actor text default ''
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare r record;
begin
  select * into r from trash where id = p_trash_id;
  if not found then return false; end if;

  execute format('insert into public.%I select * from jsonb_populate_record(null::public.%I, $1)',
                 r.entity, r.entity) using r.payload;

  insert into admin_log (actor, action, entity, entity_id, summary, after_data)
  values (p_actor, 'restore', r.entity, r.entity_id, 'שוחזר מסל המיחזור', r.payload);

  delete from trash where id = p_trash_id;
  return true;
end $$;

grant execute on function public.soft_delete(text, text, text)   to authenticated;
grant execute on function public.restore_trash(bigint, text)     to authenticated;
