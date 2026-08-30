-- ============================================================
-- שכבה 1: מערכת חברים, נקודות, רמות VIP, הפניות
-- הרץ ב-SQL Editor של Supabase. בטוח להרצה חוזרת.
-- ============================================================

-- חברים -------------------------------------------------------
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  display_name text not null,
  pin_hash text not null,
  points int not null default 0,
  level text not null default 'member',
  referral_code text unique not null,
  referred_by text,
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists members_phone_idx on public.members (phone);
create index if not exists members_ref_idx on public.members (referral_code);

-- יומן פעילות (Timeline) --------------------------------------
create table if not exists public.member_events (
  id bigserial primary key,
  member_id uuid references public.members(id) on delete cascade,
  kind text not null,           -- joined | view | wishlist | order | points | referral
  label text default '',
  points_delta int default 0,
  created_at timestamptz not null default now()
);
create index if not exists member_events_idx on public.member_events (member_id, created_at desc);

-- רמות VIP (ניתן לעריכה מהאדמין) ------------------------------
create table if not exists public.levels (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  min_points int not null default 0,
  discount_percent int not null default 0,
  perks text default '',
  sort_order int not null default 0
);

insert into public.levels (key, name, min_points, discount_percent, perks, sort_order) values
  ('member',   'Member',   0,    0,  'גישה לקהילה', 1),
  ('silver',   'Silver',   250,  3,  'הנחה קבועה 3% + מבצעים לפני כולם', 2),
  ('gold',     'Gold',     750,  5,  'הנחה 5% + גישה מוקדמת למוצרים חדשים', 3),
  ('platinum', 'Platinum', 1500, 8,  'הנחה 8% + הטבות בלעדיות', 4),
  ('vip',      'VIP',      3000, 12, 'הנחה 12% + שירות אישי + מתנות', 5)
on conflict (key) do nothing;

-- כללי צבירת נקודות (ניתן לעריכה מהאדמין) ---------------------
create table if not exists public.point_rules (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  points int not null default 0,
  is_active boolean not null default true
);

insert into public.point_rules (key, label, points) values
  ('registration',    'הצטרפות לקהילה', 100),
  ('order',           'ביצוע הזמנה', 50),
  ('order_per_100',   'על כל 100₪ בהזמנה', 10),
  ('referral_join',   'חבר שהצטרף דרכך', 150),
  ('referral_order',  'חבר שהזמין דרכך', 250),
  ('review',          'כתיבת ביקורת', 30)
on conflict (key) do nothing;

-- קישור הזמנה לחבר --------------------------------------------
alter table public.orders add column if not exists member_id uuid;

-- הרשאות ------------------------------------------------------
alter table public.members enable row level security;
alter table public.member_events enable row level security;
alter table public.levels enable row level security;
alter table public.point_rules enable row level security;

drop policy if exists "members public read" on public.members;
drop policy if exists "members public insert" on public.members;
drop policy if exists "members public update" on public.members;
create policy "members public read" on public.members for select to anon, authenticated using (true);
create policy "members public insert" on public.members for insert to anon, authenticated with check (true);
create policy "members public update" on public.members for update to anon, authenticated using (true) with check (true);

drop policy if exists "events read" on public.member_events;
drop policy if exists "events insert" on public.member_events;
create policy "events read" on public.member_events for select to anon, authenticated using (true);
create policy "events insert" on public.member_events for insert to anon, authenticated with check (true);

drop policy if exists "levels read" on public.levels;
drop policy if exists "levels admin" on public.levels;
create policy "levels read" on public.levels for select to anon, authenticated using (true);
create policy "levels admin" on public.levels for all to authenticated using (true) with check (true);

drop policy if exists "rules read" on public.point_rules;
drop policy if exists "rules admin" on public.point_rules;
create policy "rules read" on public.point_rules for select to anon, authenticated using (true);
create policy "rules admin" on public.point_rules for all to authenticated using (true) with check (true);
