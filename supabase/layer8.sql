-- ============================================================
-- מסירה א': תפעול — מעקב משלוח, סטטוסים, הרשאות, דוחות
-- הרץ ב-SQL Editor של Supabase. בטוח להרצה חוזרת.
-- ============================================================

-- מעקב משלוח ---------------------------------------------------
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists courier text;
alter table public.orders add column if not exists review_requested boolean default false;

-- צוות והרשאות -------------------------------------------------
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null default 'viewer' check (role in ('owner','manager','viewer')),
  created_at timestamptz not null default now()
);

-- הודעות אוטומטיות לפי סטטוס ------------------------------------
create table if not exists public.status_messages (
  id uuid primary key default gen_random_uuid(),
  status text unique not null,
  template text not null default '',
  is_active boolean not null default true
);

insert into public.status_messages (status, template) values
  ('confirmed', 'היי {name}! ההזמנה שלך #{order} אושרה ואנחנו מכינים אותה 📦'),
  ('shipped',   'היי {name}! ההזמנה #{order} יצאה אליך 🚚 {tracking}'),
  ('delivered', 'היי {name}! ההזמנה #{order} נמסרה. מקווים שתיהנה! 🖤')
on conflict (status) do nothing;

-- מעקב ערוצי הגעה ----------------------------------------------
create table if not exists public.channel_hits (
  id bigserial primary key,
  channel text not null,
  created_at timestamptz not null default now()
);
create index if not exists channel_idx on public.channel_hits (channel, created_at desc);

alter table public.orders add column if not exists channel text;

-- הרשאות --------------------------------------------------------
alter table public.staff enable row level security;
alter table public.status_messages enable row level security;
alter table public.channel_hits enable row level security;

drop policy if exists "staff admin" on public.staff;
create policy "staff admin" on public.staff for all to authenticated using (true) with check (true);

drop policy if exists "status read" on public.status_messages;
drop policy if exists "status admin" on public.status_messages;
create policy "status read" on public.status_messages for select to anon, authenticated using (true);
create policy "status admin" on public.status_messages for all to authenticated using (true) with check (true);

drop policy if exists "channel insert" on public.channel_hits;
drop policy if exists "channel admin" on public.channel_hits;
create policy "channel insert" on public.channel_hits for insert to anon, authenticated with check (true);
create policy "channel admin" on public.channel_hits for all to authenticated using (true) with check (true);
