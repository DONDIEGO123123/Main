-- ============================================================
-- מודול 2: פרופיל, הישגים, Badges, Reputation, Streak, משימות
-- הרץ ב-SQL Editor. בטוח להרצה חוזרת.
-- ============================================================

-- ---------- הרחבת הפרופיל (#1) ------------------------------
alter table public.members add column if not exists avatar_url text;
alter table public.members add column if not exists bio text default '';
alter table public.members add column if not exists reputation int not null default 0;
alter table public.members add column if not exists rep_level text not null default 'new';
alter table public.members add column if not exists streak_days int not null default 0;
alter table public.members add column if not exists streak_best int not null default 0;
alter table public.members add column if not exists last_streak_date date;
alter table public.members add column if not exists last_visit_at timestamptz;
alter table public.members add column if not exists goal_level text;

-- ---------- שיוך ביקורות לחבר -------------------------------
-- בלי זה אי אפשר לספור ביקורות לכל חבר.
alter table public.reviews add column if not exists phone text;
alter table public.reviews add column if not exists member_id uuid;
create index if not exists reviews_phone_idx on public.reviews (phone);

-- ---------- הישגים (#6) -------------------------------------
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title text not null,
  description text default '',
  icon text default '🏆',
  metric text not null default 'orders',   -- orders | points | reviews | referrals | streak | level
  threshold int not null default 1,
  reward_points int not null default 0,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table if not exists public.member_achievements (
  id bigserial primary key,
  member_id uuid not null,
  achievement_key text not null,
  unlocked_at timestamptz not null default now(),
  unique (member_id, achievement_key)
);

-- ---------- Badges (#7) -------------------------------------
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  icon text default '⭐',
  color text default '#D4AF37',
  description text default '',
  auto_rule text,                          -- level:gold | reputation:trusted | manual
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table if not exists public.member_badges (
  id bigserial primary key,
  member_id uuid not null,
  badge_key text not null,
  granted_at timestamptz not null default now(),
  granted_by text default 'system',
  unique (member_id, badge_key)
);

-- ---------- Reputation (#8) ---------------------------------
create table if not exists public.reputation_levels (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  min_score int not null default 0,
  perks text default '',
  sort_order int not null default 0
);

create table if not exists public.reputation_rules (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  score int not null default 0,
  is_active boolean not null default true
);

-- ---------- משימות (#10) ------------------------------------
create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title text not null,
  description text default '',
  icon text default '🎯',
  metric text not null default 'orders',
  threshold int not null default 1,
  reward_points int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table if not exists public.member_missions (
  id bigserial primary key,
  member_id uuid not null,
  mission_key text not null,
  completed_at timestamptz not null default now(),
  unique (member_id, mission_key)
);

-- ---------- Milestones (#11) --------------------------------
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  spend_target numeric(10,2) not null default 0,
  reward_label text default '',
  reward_points int not null default 0,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table if not exists public.member_milestones (
  id bigserial primary key,
  member_id uuid not null,
  milestone_id uuid not null,
  reached_at timestamptz not null default now(),
  unique (member_id, milestone_id)
);

-- ---------- הרשאות ------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'achievements','member_achievements','badges','member_badges',
    'reputation_levels','reputation_rules','missions','member_missions',
    'milestones','member_milestones'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s r" on public.%I', t, t);
    execute format('drop policy if exists "%s i" on public.%I', t, t);
    execute format('drop policy if exists "%s a" on public.%I', t, t);
    execute format('create policy "%s r" on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('create policy "%s i" on public.%I for insert to anon, authenticated with check (true)', t, t);
    execute format('create policy "%s a" on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- ---------- נתוני התחלה -------------------------------------
insert into public.achievements (key,title,description,icon,metric,threshold,reward_points,sort_order) values
  ('first_order','ההזמנה הראשונה','ביצעת את ההזמנה הראשונה שלך','🎉','orders',1,50,1),
  ('orders_5','לקוח קבוע','5 הזמנות','🛍️','orders',5,150,2),
  ('orders_10','לקוח נאמן','10 הזמנות','💎','orders',10,300,3),
  ('first_review','ביקורת ראשונה','שיתפת את דעתך','✍️','reviews',1,30,4),
  ('reviews_10','מבקר מוביל','10 ביקורות','⭐','reviews',10,200,5),
  ('points_1000','אספן נקודות','צברת 1,000 נקודות','🪙','points',1000,100,6),
  ('first_referral','משפיען','חבר ראשון הצטרף דרכך','🤝','referrals',1,100,7),
  ('referrals_5','שגריר','5 חברים הצטרפו דרכך','👑','referrals',5,400,8),
  ('streak_7','שבוע ברצף','7 ימי פעילות רצופים','🔥','streak',7,80,9),
  ('level_gold','דרגת זהב','הגעת לרמת Gold','🥇','level',750,0,10)
on conflict (key) do nothing;

insert into public.badges (key,label,icon,description,auto_rule,sort_order) values
  ('vip','VIP','👑','חבר מועדון VIP','level:vip',1),
  ('top_member','Top Member','🏆','מהמובילים בקהילה','manual',2),
  ('active','Active','🔥','פעיל באופן קבוע','streak:7',3),
  ('loyal','Loyal','💎','לקוח נאמן','orders:10',4),
  ('reviewer','Reviewer','🎯','משתף ביקורות','reviews:5',5),
  ('elite','Elite','⭐','דרגת Elite','reputation:elite',6)
on conflict (key) do nothing;

insert into public.reputation_levels (key,name,min_score,perks,sort_order) values
  ('new','New',0,'ברוך הבא לקהילה',1),
  ('active','Active',100,'חבר פעיל',2),
  ('trusted','Trusted',300,'חבר מוערך',3),
  ('elite','Elite',700,'מובילי הקהילה',4)
on conflict (key) do nothing;

insert into public.reputation_rules (key,label,score) values
  ('review','כתיבת ביקורת',20),
  ('order','ביצוע הזמנה',10),
  ('referral','הפניית חבר',30),
  ('mission','השלמת משימה',15),
  ('streak_day','יום פעילות רצוף',2),
  ('survey','השתתפות בסקר',10)
on conflict (key) do nothing;

insert into public.missions (key,title,description,icon,metric,threshold,reward_points,sort_order) values
  ('complete_profile','השלמת פרופיל','הוסיפו שם ותמונה','👤','profile',1,40,1),
  ('first_purchase','הזמנה ראשונה','בצעו הזמנה ראשונה','🛒','orders',1,60,2),
  ('write_review','כתבו ביקורת','שתפו את החוויה שלכם','✍️','reviews',1,40,3),
  ('invite_friend','הזמינו חבר','שתפו את הקישור האישי','🤝','referrals',1,80,4),
  ('streak_3','3 ימים ברצף','היכנסו 3 ימים ברצף','🔥','streak',3,50,5)
on conflict (key) do nothing;

insert into public.milestones (title,spend_target,reward_label,reward_points,sort_order) values
  ('יעד ראשון',   500,  'קופון 5%',   100, 1),
  ('יעד שני',    1000,  'קופון 10%',  200, 2),
  ('יעד שלישי',  2500,  'דרגת VIP',   500, 3),
  ('יעד מיוחד',  5000,  'הטבה בלעדית',1000,4)
on conflict do nothing;

-- ---------- פונקציית Streak שרתית ---------------------------
-- נקראת פעם ביום. מונעת ניצול לרעה: תאריך אחד = יום אחד.
create or replace function public.touch_streak(p_member_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last date; v_days int; v_best int; v_today date := current_date;
begin
  select last_streak_date, streak_days, streak_best
    into v_last, v_days, v_best
    from members where id = p_member_id;
  if not found then return null; end if;

  if v_last = v_today then
    return v_days;                              -- כבר נספר היום
  elsif v_last = v_today - 1 then
    v_days := v_days + 1;                       -- המשך רצף
  else
    v_days := 1;                                -- רצף נשבר
  end if;

  v_best := greatest(coalesce(v_best,0), v_days);

  update members
     set streak_days = v_days,
         streak_best = v_best,
         last_streak_date = v_today,
         last_visit_at = now()
   where id = p_member_id;

  insert into events (name, member_id, metadata)
  values ('streak_day', p_member_id, jsonb_build_object('days', v_days));

  return v_days;
end $$;

grant execute on function public.touch_streak(uuid) to anon, authenticated;

-- ---------- פונקציית Reputation שרתית -----------------------
create or replace function public.add_reputation(
  p_member_id uuid, p_rule_key text, p_idem text default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_score int; v_active boolean; v_total int; v_level text;
begin
  select score, is_active into v_score, v_active
    from reputation_rules where key = p_rule_key;
  if not found or not v_active then return null; end if;

  if p_idem is not null and exists (
    select 1 from events where name = 'reputation_earned' and entity_id = p_idem
  ) then
    select reputation into v_total from members where id = p_member_id;
    return v_total;
  end if;

  update members set reputation = reputation + v_score
   where id = p_member_id returning reputation into v_total;
  if v_total is null then return null; end if;

  select key into v_level from reputation_levels
   where min_score <= v_total order by min_score desc limit 1;
  update members set rep_level = coalesce(v_level,'new') where id = p_member_id;

  insert into events (name, member_id, entity_type, entity_id, metadata)
  values ('reputation_earned', p_member_id, 'rule', coalesce(p_idem, p_rule_key),
          jsonb_build_object('score', v_score, 'total', v_total));

  return v_total;
end $$;

grant execute on function public.add_reputation(uuid, text, text) to anon, authenticated;
