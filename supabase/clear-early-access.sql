-- ============================================================
-- ניקוי תאריכי גישה מוקדמת
-- הרץ בפרויקט bbjqmbmuabhmtihuvomo.
-- ============================================================

-- מוצר עם תאריך שנשאר יישאר נעול ללקוחות, ואין יותר שדה
-- באדמין לשחרר אותו. השורה הזו מנקה את כולם.
update public.products
   set early_access_until = null
 where early_access_until is not null;

-- בדיקה: אמור להחזיר 0
select count(*) as still_locked
  from public.products
 where early_access_until is not null;
