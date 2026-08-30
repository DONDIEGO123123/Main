-- ============================================================
-- שכבה 7: תעודת משלוח, ימי הולדת, מצב תחזוקה, יומן פעולות
-- הרץ ב-SQL Editor של Supabase. בטוח להרצה חוזרת.
-- ============================================================

-- יום הולדת לחבר (אופציונלי, החבר מזין בעצמו) ------------------
alter table public.members add column if not exists birthday date;
alter table public.members add column if not exists birthday_reward_year int;

-- מעקב פעילות אחרונה --------------------------------------------
alter table public.members add column if not exists last_order_at timestamptz;

-- הערות פנימיות להזמנה ------------------------------------------
alter table public.orders add column if not exists admin_notes text default '';
