-- ============================================================
-- אבחון 2 — התוצאה מוצגת כטבלה, לא כהודעה
-- הרץ הכל ושלח צילום של הטבלה בתחתית.
-- ============================================================

create or replace function public.diag_order_insert()
returns table (step text, result text)
language plpgsql
as $$
declare
  v_id uuid;
  v_err text;
  v_state text;
begin
  -- מי אנחנו ואיפה
  step := 'פרויקט';
  result := current_database();
  return next;

  step := 'מדיניות INSERT ל-anon';
  select count(*)::text into result
    from pg_policies
   where schemaname = 'public' and tablename = 'orders'
     and cmd = 'INSERT' and 'anon' = any(roles);
  return next;

  step := 'RLS פעיל על orders';
  select relrowsecurity::text into result
    from pg_class where relname = 'orders' and relnamespace = 'public'::regnamespace;
  return next;

  -- הבדיקה עצמה: הכנסה בתור לקוח אנונימי
  begin
    set local role anon;

    insert into public.orders (
      customer_name, customer_phone, customer_address,
      city, region, notes, items, subtotal, delivery_fee, total
    ) values (
      'בדיקת אבחון', '0500000000', 'רחוב הבדיקה 1',
      'תל אביב', 'מרכז', 'שורה זמנית', '[]'::jsonb, 100, 0, 100
    ) returning id into v_id;

    reset role;

    step := 'הכנסה בתור anon';
    result := 'הצליחה ✓';
    return next;

    delete from public.orders where id = v_id;

  exception when others then
    get stacked diagnostics
      v_err = message_text,
      v_state = returned_sqlstate;
    reset role;

    step := 'הכנסה בתור anon';
    result := 'נכשלה ✗';
    return next;

    step := 'קוד שגיאה';
    result := v_state;
    return next;

    step := 'הודעת שגיאה';
    result := v_err;
    return next;
  end;
end $$;

-- התוצאה מופיעה כטבלה למטה
select * from public.diag_order_insert();
