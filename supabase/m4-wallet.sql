-- ============================================================
-- מודול 4: ארנק, תגמול יומי, Mystery, VIP Dashboard, נעילות
-- הרץ ב-SQL Editor. בטוח להרצה חוזרת.
-- ============================================================

-- ---------- מוצרים נעולים ו-Early Access (#18, #19) ---------
alter table public.products add column if not exists min_level text default 'all';
alter table public.products add column if not exists early_access_until timestamptz;

-- ---------- תגמול יומי (#13) --------------------------------
create table if not exists public.daily_rewards (
  id uuid primary key default gen_random_uuid(),
  day_index int not null,                 -- 1..7 מחזור שבועי
  label text not null,
  points int not null default 0,
  icon text default '🎁',
  unique (day_index)
);

create table if not exists public.daily_claims (
  id bigserial primary key,
  member_id uuid not null,
  claim_date date not null default current_date,
  day_index int not null default 1,
  points int not null default 0,
  created_at timestamptz not null default now(),
  unique (member_id, claim_date)          -- פעם ביום, נאכף במסד
);

-- ---------- פרסים מסתוריים (#12) ----------------------------
create table if not exists public.mystery_rewards (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  kind text not null default 'points',    -- points | coupon
  points int not null default 0,
  coupon_percent int not null default 0,
  weight int not null default 1,          -- סיכוי יחסי
  is_active boolean not null default true
);

create table if not exists public.mystery_claims (
  id bigserial primary key,
  member_id uuid not null,
  reward_id uuid,
  label text default '',
  code text,
  trigger_key text,                       -- מה פתח את התיבה
  created_at timestamptz not null default now(),
  unique (member_id, trigger_key)
);

-- ---------- הרשאות ------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'daily_rewards','daily_claims','mystery_rewards','mystery_claims'
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
insert into public.daily_rewards (day_index,label,points,icon) values
  (1,'יום 1',  10,'🎁'),
  (2,'יום 2',  15,'🎁'),
  (3,'יום 3',  20,'✨'),
  (4,'יום 4',  25,'✨'),
  (5,'יום 5',  35,'💎'),
  (6,'יום 6',  50,'💎'),
  (7,'יום 7', 100,'👑')
on conflict (day_index) do nothing;

insert into public.mystery_rewards (label,kind,points,coupon_percent,weight) values
  ('25 נקודות',    'points', 25, 0, 40),
  ('50 נקודות',    'points', 50, 0, 25),
  ('100 נקודות',   'points',100, 0, 15),
  ('קופון 5%',     'coupon',  0, 5, 12),
  ('קופון 10%',    'coupon',  0,10,  6),
  ('250 נקודות',   'points',250, 0,  2)
on conflict do nothing;

-- ---------- תגמול יומי שרתי, מוגן ניצול (#66) ---------------
create or replace function public.claim_daily(p_member_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_streak int; v_day int; v_label text; v_points int; v_icon text; v_balance int;
begin
  -- כבר נוצל היום?
  if exists (select 1 from daily_claims
             where member_id = p_member_id and claim_date = current_date) then
    return jsonb_build_object('ok', false, 'reason', 'claimed');
  end if;

  perform touch_streak(p_member_id);
  select streak_days into v_streak from members where id = p_member_id;
  if v_streak is null then return jsonb_build_object('ok', false, 'reason', 'no_member'); end if;

  v_day := ((greatest(v_streak,1) - 1) % 7) + 1;

  select label, points, icon into v_label, v_points, v_icon
    from daily_rewards where day_index = v_day;
  if not found then return jsonb_build_object('ok', false, 'reason', 'no_reward'); end if;

  insert into daily_claims (member_id, claim_date, day_index, points)
  values (p_member_id, current_date, v_day, v_points);

  select award_points(p_member_id, 'challenge', 'תגמול יומי — ' || v_label,
                      v_points, 'daily-' || p_member_id || '-' || current_date)
    into v_balance;

  return jsonb_build_object(
    'ok', true, 'day', v_day, 'label', v_label,
    'points', v_points, 'icon', v_icon, 'balance', v_balance
  );
end $$;

grant execute on function public.claim_daily(uuid) to anon, authenticated;

-- ---------- פתיחת פרס מסתורי, פעם אחת לכל טריגר -------------
create or replace function public.open_mystery(
  p_member_id uuid, p_trigger text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int; v_roll int; v_acc int := 0;
  r record; v_code text; v_balance int;
begin
  if exists (select 1 from mystery_claims
             where member_id = p_member_id and trigger_key = p_trigger) then
    return jsonb_build_object('ok', false, 'reason', 'claimed');
  end if;

  select coalesce(sum(weight),0) into v_total from mystery_rewards where is_active;
  if v_total = 0 then return jsonb_build_object('ok', false, 'reason', 'empty'); end if;

  v_roll := floor(random() * v_total) + 1;

  for r in select * from mystery_rewards where is_active order by id loop
    v_acc := v_acc + r.weight;
    if v_roll <= v_acc then
      if r.kind = 'coupon' then
        v_code := 'MY' || upper(substr(md5(random()::text), 1, 6));
        insert into coupons (code, kind, value, max_uses)
        values (v_code, 'percent', r.coupon_percent, 1);

        insert into rewards_ledger (member_id, kind, ref_id, label, idempotency_key)
        values (p_member_id, 'coupon', v_code, r.label,
                'my-' || p_member_id || '-' || p_trigger);
      else
        select award_points(p_member_id, 'challenge', 'פרס מסתורי — ' || r.label,
                            r.points, 'my-' || p_member_id || '-' || p_trigger)
          into v_balance;
      end if;

      insert into mystery_claims (member_id, reward_id, label, code, trigger_key)
      values (p_member_id, r.id, r.label, v_code, p_trigger);

      return jsonb_build_object(
        'ok', true, 'label', r.label, 'kind', r.kind,
        'points', r.points, 'code', v_code, 'balance', v_balance
      );
    end if;
  end loop;

  return jsonb_build_object('ok', false, 'reason', 'no_pick');
end $$;

grant execute on function public.open_mystery(uuid, text) to anon, authenticated;
