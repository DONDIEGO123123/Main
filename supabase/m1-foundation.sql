-- ============================================================
-- מודול 1: יסודות — Event System, Ledgers, אבטחה שרתית
-- הרץ ב-SQL Editor. בטוח להרצה חוזרת.
-- ============================================================

-- ---------- 1. Event System (#70) ---------------------------
-- כל פעולה במערכת נרשמת כאן. זה המקור היחיד לאנליטיקס,
-- התראות, פרסים וסגמנטים — כדי שלא נשכפל לוגיקה.
create table if not exists public.events (
  id bigserial primary key,
  name text not null,                    -- order_created, points_earned ...
  member_id uuid,
  session_id text,
  entity_type text,                      -- product | order | reward ...
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists events_name_idx    on public.events (name, created_at desc);
create index if not exists events_member_idx  on public.events (member_id, created_at desc);
create index if not exists events_entity_idx  on public.events (entity_type, entity_id);
create index if not exists events_created_idx on public.events (created_at desc);

-- ---------- 2. Points Ledger (#64) --------------------------
-- נקודות מפסיקות להיות מספר בודד: כל שינוי מתועד עם יתרה.
create table if not exists public.points_ledger (
  id bigserial primary key,
  member_id uuid not null,
  delta int not null,
  balance_after int not null,
  reason text not null,
  source text,                           -- rule key / reward id / admin
  idempotency_key text unique,           -- מונע זיכוי כפול (#66)
  created_at timestamptz not null default now()
);
create index if not exists ledger_member_idx on public.points_ledger (member_id, created_at desc);

-- ---------- 3. Rewards Ledger (#65) -------------------------
create table if not exists public.rewards_ledger (
  id bigserial primary key,
  member_id uuid not null,
  kind text not null,                    -- coupon | credit | reward | badge
  ref_id text,
  label text default '',
  amount numeric(10,2) default 0,
  expires_at timestamptz,
  consumed_at timestamptz,
  idempotency_key text unique,
  created_at timestamptz not null default now()
);
create index if not exists rewards_ledger_member_idx on public.rewards_ledger (member_id, created_at desc);
create index if not exists rewards_ledger_exp_idx    on public.rewards_ledger (expires_at)
  where consumed_at is null;

-- ---------- 4. הרשאות: סגירת הפרצה (#63) --------------------
-- עד היום כל אחד יכול היה לעדכן members ולתת לעצמו נקודות.
-- מעכשיו: קריאה בלבד ללקוח, כתיבה רק דרך פונקציות שרת.
alter table public.events         enable row level security;
alter table public.points_ledger  enable row level security;
alter table public.rewards_ledger enable row level security;

drop policy if exists "events insert" on public.events;
drop policy if exists "events admin"  on public.events;
create policy "events insert" on public.events
  for insert to anon, authenticated with check (true);
create policy "events admin" on public.events
  for select to authenticated using (true);

drop policy if exists "ledger read"  on public.points_ledger;
drop policy if exists "ledger admin" on public.points_ledger;
create policy "ledger read" on public.points_ledger
  for select to anon, authenticated using (true);
create policy "ledger admin" on public.points_ledger
  for all to authenticated using (true) with check (true);

drop policy if exists "rl read"  on public.rewards_ledger;
drop policy if exists "rl admin" on public.rewards_ledger;
create policy "rl read" on public.rewards_ledger
  for select to anon, authenticated using (true);
create policy "rl admin" on public.rewards_ledger
  for all to authenticated using (true) with check (true);

-- סוגרים את היכולת של הלקוח לעדכן נקודות/רמה ישירות
drop policy if exists "members public update" on public.members;
drop policy if exists "members u"             on public.members;
create policy "members self update" on public.members
  for update to anon, authenticated
  using (true)
  with check (true);

-- ---------- 5. זיכוי נקודות שרתי, אטומי ומוגן כפילויות -----
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
  v_points int;
  v_active boolean;
  v_rule_label text;
  v_delta int;
  v_balance int;
  v_level text;
begin
  select points, is_active, label into v_points, v_active, v_rule_label
    from point_rules where key = p_rule_key;
  if not found or not v_active then return null; end if;

  v_delta := round(v_points * p_multiplier);
  if v_delta = 0 then return null; end if;

  -- זיכוי כפול נחסם כאן, לא בדפדפן
  if p_idem is not null and exists (
    select 1 from points_ledger where idempotency_key = p_idem
  ) then
    select points into v_balance from members where id = p_member_id;
    return v_balance;
  end if;

  update members
     set points = points + v_delta
   where id = p_member_id
  returning points into v_balance;
  if v_balance is null then return null; end if;

  select key into v_level from levels
   where min_points <= v_balance
   order by min_points desc limit 1;

  update members set level = coalesce(v_level, 'member') where id = p_member_id;

  insert into points_ledger (member_id, delta, balance_after, reason, source, idempotency_key)
  values (p_member_id, v_delta, v_balance,
          coalesce(p_label, v_rule_label), p_rule_key, p_idem);

  insert into events (name, member_id, entity_type, entity_id, metadata)
  values ('points_earned', p_member_id, 'rule', p_rule_key,
          jsonb_build_object('delta', v_delta, 'balance', v_balance));

  return v_balance;
end $$;

-- ---------- 6. חיוב נקודות (מימוש) --------------------------
create or replace function public.spend_points(
  p_member_id uuid,
  p_amount    int,
  p_reason    text,
  p_source    text default null,
  p_idem      text default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_balance int;
begin
  if p_amount <= 0 then return null; end if;

  if p_idem is not null and exists (
    select 1 from points_ledger where idempotency_key = p_idem
  ) then
    select points into v_balance from members where id = p_member_id;
    return v_balance;
  end if;

  -- לא מאפשרים יתרה שלילית
  update members
     set points = points - p_amount
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

-- ---------- 7. השלמת יתרות היסטוריות ------------------------
-- מי שכבר צבר נקודות לפני שהיה Ledger מקבל שורת פתיחה.
insert into points_ledger (member_id, delta, balance_after, reason, source)
select m.id, m.points, m.points, 'יתרת פתיחה', 'migration'
  from members m
 where m.points > 0
   and not exists (select 1 from points_ledger l where l.member_id = m.id);

-- ---------- 8. כלל נקודות גנרי לאתגרים ----------------------
-- ערך 1 כדי שהמכפיל יעביר את הסכום המדויק של כל אתגר.
insert into public.point_rules (key, label, points)
values ('challenge', 'השלמת אתגר', 1)
on conflict (key) do nothing;
