-- ============================================================
-- הגדרת סנכרון לגיליון — מזין את הכתובת שסופקה
-- הרץ ב-SQL Editor של Supabase.
-- ============================================================

insert into public.settings (key, value)
values (
  'sheet',
  '{"enabled": true, "url": "https://script.google.com/macros/s/AKfycbzSOkO-R5xplDS3c7VTJ-IjwD6tYn_slp25RKGc2llAyt8urMyYS_JpW3AoSF7BEqMSXQ/exec"}'::jsonb
)
on conflict (key) do update set value = excluded.value;
