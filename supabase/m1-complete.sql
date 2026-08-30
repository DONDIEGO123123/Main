-- ============================================================
-- מודול 1 מלא — בסיס החברים + Event System + Ledgers
-- הרץ ב-SQL Editor פעם אחת. בטוח להרצה חוזרת.
-- ============================================================

-- ============ חלק א: טבלאות בסיס ===========================

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
  birthday date,
  birthday_reward_year int,
  last_order_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists members_phone_idx on public.members (phone);
create index if not exists members_ref_idx   on public.members (referral_code);

create table if not exists public.member_events (
  id bigserial primary key,
  member_id uuid references public.members(id) on delete cascade,
  kind text not null,
  label text default '',
  points_delta int default 0,
  created_at timestamptz not null default now()
);
create index if not exists member_events_idx on public.member_events (member_id, created_at desc);

create table if not exists public.levels (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  min_points int not null default 0,
  discount_percent int not null default 0,
  perks text default '',
  sort_order int not null default 0
);

create table if not exists public.point_rules (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  points int not null default 0,
  is_active boolean not null default true
);

create table if not exists public.abandoned_carts (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  phone text,
  member_id uuid,
  items jsonb not null default '[]'::jsonb,
  total numeric(10,2) not null default 0,
  recovered boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.customer_photos (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text default '',
  product_id uuid,
  is_approved boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.channel_hits (
  id bigserial primary key,
  channel text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.status_messages (
  id uuid primary key default gen_random_uuid(),
  status text unique not null,
  template text not null default '',
  is_active boolean not null default true
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null default 'viewer',
  created_at timestamptz not null default now()
);

create table if not exists public.bundles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  image_url text,
  product_ids uuid[] default '{}',
  price numeric(10,2) not null default 0,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- עמודות משלימות בטבלאות קיימות
alter table public.orders   add column if not exists member_id uuid;
alter table public.orders   add column if not exists tracking_number text;
alter table public.orders   add column if not exists courier text;
alter table public.orders   add column if not exists admin_notes text default '';
alter table public.orders   add column if not exists channel text;
alter table public.orders   add column if not exists review_requested boolean default false;
alter table public.products add column if not exists cost_price numeric(10,2) default 0;
alter table public.products add column if not exists supplier text default '';
alter table public.products add column if not exists low_stock_at int default 3;

-- ============ חלק ב: Event System ו-Ledgers =================

create table if not exists public.events (
  id bigserial primary key,
  name text not null,
  member_id uuid,
  session_id text,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists events_name_idx    on public.events (name, created_at desc);
create index if not exists events_member_idx  on public.events (member_id, created_at desc);
create index if not exists events_entity_idx  on public.events (entity_type, entity_id);

create table if not exists public.points_ledger (
  id bigserial primary key,
  member_id uuid not null,
  delta int not null,
  balance_after int not null,
  reason text not null,
  source text,
  idempotency_key text unique,
  created_at timestamptz not null default now()
);
create index if not exists ledger_member_idx on public.points_ledger (member_id, created_at desc);

create table if not exists public.rewards_ledger (
  id bigserial primary key,
  member_id uuid not null,
  kind text not null,
  ref_id text,
  label text default '',
  amount numeric(10,2) default 0,
  expires_at timestamptz,
  consumed_at timestamptz,
  idempotency_key text unique,
  created_at timestamptz not null default now()
);
create index if not exists rewards_ledger_member_idx on public.rewards_ledger (member_id, created_at desc);

-- ============ חלק ג: הרשאות ================================

do $$
declare t text;
begin
  foreach t in array array[
    'members','member_events','levels','point_rules','abandoned_carts',
    'customer_photos','channel_hits','status_messages','staff','bundles',
    'events','points_ledger','rewards_ledger'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s r" on public.%I', t, t);
    execute format('drop policy if exists "%s i" on public.%I', t, t);
    execute format('drop policy if exists "%s u" on public.%I', t, t);
    execute format('drop policy if exists "%s a" on public.%I', t, t);
    execute format('create policy "%s r" on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('create policy "%s i" on public.%I for insert to anon, authenticated with check (true)', t, t);
    execute format('create policy "%s u" on public.%I for update to anon, authenticated using (true) with check (true)', t, t);
    execute format('create policy "%s a" on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- ============ חלק ד: נתוני התחלה ===========================

insert into public.levels (key,name,min_points,discount_percent,perks,sort_order) values
  ('member','Member',0,0,'גישה לקהילה',1),
  ('silver','Silver',250,3,'הנחה 3% + מבצעים לפני כולם',2),
  ('gold','Gold',750,5,'הנחה 5% + גישה מוקדמת',3),
  ('platinum','Platinum',1500,8,'הנחה 8% + הטבות בלעדיות',4),
  ('vip','VIP',3000,12,'הנחה 12% + שירות אישי',5)
on conflict (key) do nothing;

insert into public.point_rules (key,label,points) values
  ('registration','הצטרפות לקהילה',100),
  ('order','ביצוע הזמנה',50),
  ('order_per_100','על כל 100₪',10),
  ('referral_join','חבר שהצטרף',150),
  ('referral_order','חבר שהזמין',250),
  ('review','כתיבת ביקורת',30),
  ('challenge','השלמת אתגר',1)
on conflict (key) do nothing;

insert into public.status_messages (status,template) values
  ('confirmed','היי {name}! ההזמנה שלך #{order} אושרה ואנחנו מכינים אותה 📦'),
  ('shipped','היי {name}! ההזמנה #{order} יצאה אליך 🚚 {tracking}'),
  ('delivered','היי {name}! ההזמנה #{order} נמסרה. מקווים שתיהנה! 🖤')
on conflict (status) do nothing;

-- ============ חלק ה: פונקציות שרת מאובטחות =================

create or replace function public.award_points(
  p_member_id uuid,
  p_rule_key  text,
  p_label     text default null,
  p_multiplier numeric default 1,
  p_idem      text default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points int; v_active boolean; v_rule_label text;
  v_delta int; v_balance int; v_level text;
begin
  select points, is_active, label into v_points, v_active, v_rule_label
    from point_rules where key = p_rule_key;
  if not found or not v_active then return null; end if;

  v_delta := round(v_points * p_multiplier);
  if v_delta = 0 then return null; end if;

  if p_idem is not null and exists (select 1 from points_ledger where idempotency_key = p_idem) then
    select points into v_balance from members where id = p_member_id;
    return v_balance;
  end if;

  update members set points = points + v_delta
   where id = p_member_id returning points into v_balance;
  if v_balance is null then return null; end if;

  select key into v_level from levels
   where min_points <= v_balance order by min_points desc limit 1;
  update members set level = coalesce(v_level,'member') where id = p_member_id;

  insert into points_ledger (member_id, delta, balance_after, reason, source, idempotency_key)
  values (p_member_id, v_delta, v_balance, coalesce(p_label, v_rule_label), p_rule_key, p_idem);

  insert into events (name, member_id, entity_type, entity_id, metadata)
  values ('points_earned', p_member_id, 'rule', p_rule_key,
          jsonb_build_object('delta', v_delta, 'balance', v_balance));

  return v_balance;
end $$;

create or replace function public.spend_points(
  p_member_id uuid, p_amount int, p_reason text,
  p_source text default null, p_idem text default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_balance int;
begin
  if p_amount <= 0 then return null; end if;

  if p_idem is not null and exists (select 1 from points_ledger where idempotency_key = p_idem) then
    select points into v_balance from members where id = p_member_id;
    return v_balance;
  end if;

  update members set points = points - p_amount
   where id = p_member_id and points >= p_amount
  returning points into v_balance;
  if v_balance is null then return null; end if;

  insert into points_ledger (member_id, delta, balance_after, reason, source, idempotency_key)
  values (p_member_id, -p_amount, v_balance, p_reason, p_source, p_idem);

  insert into events (name, member_id, entity_type, entity_id, metadata)
  values ('points_spent', p_member_id, 'reward', p_source,
          jsonb_build_object('amount', p_amount, 'balance', v_balance));

  return v_balance;
end $$;

grant execute on function public.award_points(uuid, text, text, numeric, text) to anon, authenticated;
grant execute on function public.spend_points(uuid, int, text, text, text)     to anon, authenticated;

-- ============ חלק ו: יתרות פתיחה ===========================

insert into points_ledger (member_id, delta, balance_after, reason, source)
select m.id, m.points, m.points, 'יתרת פתיחה', 'migration'
  from members m
 where m.points > 0
   and not exists (select 1 from points_ledger l where l.member_id = m.id);
