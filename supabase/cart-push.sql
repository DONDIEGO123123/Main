-- ============================================================
-- התראות על עגלות נטושות — כולל עגלות מהעבר
-- הרץ בפרויקט bbjqmbmuabhmtihuvomo. בטוח להרצה חוזרת.
-- ============================================================

-- ---------- חיבור המכשיר לעגלה -----------------------------
-- בלי זה אפשר היה להגיע רק לחברים רשומים. מזהה העגלה יושב
-- באותו דפדפן, ולכן הוא מחבר גם אורחים — וגם עגלות ישנות.
alter table public.push_subscriptions
  add column if not exists cart_sid text;

create index if not exists push_cart_sid_idx
  on public.push_subscriptions (cart_sid) where cart_sid is not null;

-- ---------- מתי נשלחה התראה אחרונה על העגלה -----------------
alter table public.abandoned_carts
  add column if not exists pushed_at timestamptz;

create index if not exists carts_pushed_idx
  on public.abandoned_carts (pushed_at) where recovered = false;

-- ---------- תצוגה: עגלות שניתן להתריע עליהן -----------------
-- מחברת כל עגלה פתוחה למכשירים שאפשר להגיע אליהם, בשתי דרכים:
-- דרך החבר הרשום, או דרך אותו דפדפן שבו נפתחה העגלה.
create or replace view public.cart_push_targets as
select
  c.id            as cart_id,
  c.session_id,
  c.phone,
  c.member_id,
  c.items,
  c.total,
  c.stage,
  c.updated_at,
  c.pushed_at,
  s.endpoint,
  s.p256dh,
  s.auth
from public.abandoned_carts c
join public.push_subscriptions s
  on  s.failed_count < 5
  and (
        (c.member_id is not null and s.member_id = c.member_id)
     or (s.cart_sid is not null and s.cart_sid = c.session_id)
      )
where c.recovered = false
  and jsonb_array_length(coalesce(c.items, '[]'::jsonb)) > 0;

grant select on public.cart_push_targets to anon, authenticated;

-- ---------- בדיקה -------------------------------------------
select
  (select count(*) from public.abandoned_carts where recovered = false) as open_carts,
  (select count(*) from public.push_subscriptions)                     as devices,
  (select count(distinct cart_id) from public.cart_push_targets)       as reachable_carts;
