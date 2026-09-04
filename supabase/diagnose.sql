-- ============================================================
-- אבחון: מה בדיוק חוסם את יצירת ההזמנה
-- הרץ הכל, ושלח צילום של התוצאות ושל לשונית Messages/Notices.
-- ============================================================

-- 0) באיזה פרויקט אנחנו? השווה למה שמופיע בכתובת ה-URL של האתר.
select current_database() as db,
       current_setting('request.jwt.claim.role', true) as role_now;

-- 1) האם יש מדיניות RESTRICTIVE שחוסמת? (permissive=false = חוסם הכל)
select tablename, policyname, cmd, permissive, roles
  from pg_policies
 where schemaname = 'public' and tablename = 'orders';

-- 2) אילו טריגרים רצים כשנוצרת הזמנה?
select trigger_name, event_manipulation, action_timing
  from information_schema.triggers
 where event_object_table = 'orders'
 order by action_timing, trigger_name;

-- 3) הבדיקה החשובה: ניסיון הכנסה בתור לקוח אנונימי אמיתי
--    זה ישחזר בדיוק את מה שקורה באתר ויציג את השגיאה המלאה.
do $$
declare v_id uuid;
begin
  set local role anon;

  insert into public.orders (
    customer_name, customer_phone, customer_address,
    city, region, notes, items, subtotal, delivery_fee, total
  ) values (
    'בדיקה', '0500000000', 'רחוב הבדיקה 1',
    'תל אביב', 'מרכז', 'שורת אבחון', '[]'::jsonb, 100, 0, 100
  ) returning id into v_id;

  reset role;
  raise notice 'ההכנסה הצליחה. מוחק את שורת הבדיקה.';
  delete from public.orders where id = v_id;

exception when others then
  reset role;
  raise notice '--- נכשל ---';
  raise notice 'שגיאה: %', sqlerrm;
  raise notice 'קוד: %', sqlstate;
end $$;
