-- ============================================================
-- חבילת אמינות — תגי אמון, מדיניות, עמוד "מי אנחנו"
-- הרץ ב-SQL Editor. בטוח להרצה חוזרת.
-- ============================================================

-- ---------- תגי אמון ----------------------------------------
create table if not exists public.trust_badges (
  id uuid primary key default gen_random_uuid(),
  icon text not null default '✓',
  title text not null,
  body text default '',
  sort_order int not null default 0,
  is_active boolean not null default true
);

-- ---------- מדיניות (החזרות, אחריות, פרטיות) ----------------
create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  body text not null default '',
  icon text default '📄',
  sort_order int not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---------- הרשאות ------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['trust_badges','policies'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s r" on public.%I', t, t);
    execute format('drop policy if exists "%s a" on public.%I', t, t);
    execute format('create policy "%s r" on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('create policy "%s a" on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- ---------- ברירות מחדל -------------------------------------
-- אלה עובדות על העסק שלך, לא הבטחות שאי אפשר לקיים.
-- ערוך אותן באדמין כך שיתאימו למה שאתה באמת נותן.
insert into public.trust_badges (icon,title,body,sort_order) values
  ('🇮🇱','עסק ישראלי','מענה בעברית, אנשים אמיתיים מאחורי החנות',1),
  ('🚚','משלוח לכל הארץ','זמני האספקה והעלות מוצגים לפי אזור לפני התשלום',2),
  ('💬','שירות אישי','מענה בוואטסאפ ובטלגרם, לפני ואחרי הרכישה',3),
  ('🔒','פרטיות','הפרטים משמשים לביצוע ההזמנה בלבד ואינם מועברים לאף גורם',4)
on conflict do nothing;

insert into public.policies (slug,title,icon,body,sort_order) values
  ('returns','החזרות והחלפות','↩️',
   'ניתן להחזיר או להחליף מוצר תוך 14 יום מקבלתו, כל עוד הוא במצב חדש ובאריזתו המקורית.

כדי לפתוח בקשה, פנו אלינו בוואטסאפ עם מספר ההזמנה ונסביר את השלבים.

בהתאם לחוק הגנת הצרכן, זכות הביטול אינה חלה על מוצרים מסוימים — נעדכן אתכם מראש אם זה רלוונטי להזמנה שלכם.', 1),

  ('shipping','משלוחים','🚚',
   'אנחנו שולחים לכל הארץ. עלות המשלוח וזמן האספקה מחושבים לפי אזור ומוצגים לכם בעמוד התשלום לפני האישור הסופי.

לאחר שההזמנה יוצאת, תקבלו עדכון עם פרטי המעקב.

אם משהו מתעכב — כתבו לנו ונבדוק מיד.', 2),

  ('privacy','פרטיות','🔒',
   'אנחנו אוספים רק את מה שנדרש כדי לבצע את ההזמנה: שם, טלפון ואזור משלוח.

הפרטים אינם נמכרים ואינם מועברים לצד שלישי, למעט שירות המשלוחים שמביא אליכם את החבילה.

רוצים שנמחק את הפרטים שלכם? כתבו לנו ונעשה זאת.', 3),

  ('contact-policy','יצירת קשר ותמיכה','💬',
   'אפשר להגיע אלינו בוואטסאפ, בטלגרם או דרך טופס הפנייה באתר.

אנחנו משתדלים לחזור לכל פנייה באותו יום עסקים.

יש בעיה עם הזמנה? פתחו פנייה במרכז התמיכה ונטפל בה עד לפתרון.', 4)
on conflict (slug) do nothing;


-- ---------- תמריץ מוגבר לביקורות ----------------------------
-- ביקורות אמיתיות הן הנכס האמין ביותר. שווה לשלם עליהן יותר
-- בחודשים הראשונים. ניתן לשנות באדמין → רמות ונקודות.
update public.point_rules set points = 150 where key = 'review' and points < 150;
