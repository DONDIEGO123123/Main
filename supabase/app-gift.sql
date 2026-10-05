-- ============================================================
-- מתנת התקנה — ₪50 למי שמתקין את האפליקציה ומאשר התראות
-- הרץ בפרויקט bbjqmbmuabhmtihuvomo. בטוח להרצה חוזרת.
-- ============================================================

create table if not exists public.app_gift_claims (
  id uuid primary key default gen_random_uuid(),
  phone text not null,                  -- העוגן נגד ניצול חוזר
  member_id uuid,
  endpoint text,                        -- מזהה המכשיר שנרשם להתראות
  code text not null,
  amount numeric(10,2) not null default 50,
  created_at timestamptz not null default now()
);

-- מספר טלפון אחד = מתנה אחת. זה מה שמונע גלישה בסתר חוזרת.
create unique index if not exists gift_phone_unique
  on public.app_gift_claims (phone);
create unique index if not exists gift_endpoint_unique
  on public.app_gift_claims (endpoint) where endpoint is not null;

-- ---------- הרשאות ------------------------------------------
do $$
declare r record;
begin
  for r in select policyname from pg_policies
            where schemaname='public' and tablename='app_gift_claims' loop
    execute format('drop policy if exists %I on public.app_gift_claims', r.policyname);
  end loop;
end $$;

alter table public.app_gift_claims enable row level security;

create policy "gift_select" on public.app_gift_claims
  for select to anon, authenticated using (true);
create policy "gift_admin" on public.app_gift_claims
  for all to authenticated using (true) with check (true);
-- אין מדיניות INSERT לאנונימי בכוונה: רק הפונקציה למטה יוצרת מתנה

-- ---------- הגדרות המתנה -----------------------------------
insert into public.settings (key, value)
values ('site', '{}'::jsonb)
on conflict (key) do nothing;

update public.settings
   set value = value
     || jsonb_build_object(
          'app_gift_enabled', coalesce(value->'app_gift_enabled', 'true'::jsonb),
          'app_gift_amount',  coalesce(value->'app_gift_amount',  '50'::jsonb),
          'app_gift_min',     coalesce(value->'app_gift_min',     '200'::jsonb)
        )
 where key = 'site';

-- ---------- הנפקת המתנה, בשרת בלבד --------------------------
-- כל הבדיקות כאן ולא בדפדפן, כדי שלא ניתן יהיה לזייף.
create or replace function public.claim_app_gift(
  p_phone text,
  p_endpoint text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_digits text;
  v_member uuid;
  v_amount numeric;
  v_min numeric;
  v_enabled boolean;
  v_code text;
  v_existing text;
begin
  -- ההגדרות נקראות מהמסד, כך שניתן לכבות או לשנות סכום בלי פריסה
  select coalesce((value->>'app_gift_enabled')::boolean, true),
         coalesce((value->>'app_gift_amount')::numeric, 50),
         coalesce((value->>'app_gift_min')::numeric, 200)
    into v_enabled, v_amount, v_min
    from settings where key = 'site';

  if not coalesce(v_enabled, true) then
    return jsonb_build_object('ok', false, 'reason', 'disabled');
  end if;

  v_digits := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  if length(v_digits) < 9 then
    return jsonb_build_object('ok', false, 'reason', 'bad_phone');
  end if;

  -- כבר קיבל? מחזירים את אותו קוד במקום להנפיק חדש
  select code into v_existing from app_gift_claims where phone = v_digits;
  if v_existing is not null then
    return jsonb_build_object('ok', true, 'code', v_existing,
                              'amount', v_amount, 'min', v_min, 'repeat', true);
  end if;

  -- המכשיר הזה כבר נוצל עם מספר אחר
  if p_endpoint is not null
     and exists (select 1 from app_gift_claims where endpoint = p_endpoint) then
    return jsonb_build_object('ok', false, 'reason', 'device_used');
  end if;

  -- חייב להיות רשום להתראות — זו הדרישה שעליה המתנה ניתנת
  if p_endpoint is not null
     and not exists (select 1 from push_subscriptions where endpoint = p_endpoint) then
    return jsonb_build_object('ok', false, 'reason', 'not_subscribed');
  end if;

  select id into v_member from members where phone = p_phone limit 1;

  v_code := 'APP' || upper(substr(md5(random()::text || v_digits), 1, 6));

  insert into coupons (code, kind, value, min_order, max_uses, is_active)
  values (v_code, 'amount', v_amount, v_min, 1, true);

  insert into app_gift_claims (phone, member_id, endpoint, code, amount)
  values (v_digits, v_member, p_endpoint, v_code, v_amount);

  if v_member is not null then
    insert into rewards_ledger (member_id, kind, ref_id, label, amount, idempotency_key)
    values (v_member, 'coupon', v_code, 'מתנת התקנת האפליקציה', v_amount,
            'appgift-' || v_member)
    on conflict do nothing;
  end if;

  insert into events (name, member_id, entity_type, entity_id, metadata)
  values ('app_gift_claimed', v_member, 'coupon', v_code,
          jsonb_build_object('amount', v_amount));

  return jsonb_build_object('ok', true, 'code', v_code,
                            'amount', v_amount, 'min', v_min, 'repeat', false);
end $$;

grant execute on function public.claim_app_gift(text, text) to anon, authenticated;

-- ---------- בדיקה -------------------------------------------
select
  (select count(*) from app_gift_claims) as claims,
  (select value->>'app_gift_amount' from settings where key='site') as amount,
  (select value->>'app_gift_min' from settings where key='site') as min_order;
