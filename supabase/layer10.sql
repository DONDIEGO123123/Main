-- ============================================================
-- מסירה ד': אתגרים, מתנת הצטרפות, אינטגרציות
-- הרץ ב-SQL Editor של Supabase. בטוח להרצה חוזרת.
-- ============================================================

-- אתגרי קהילה --------------------------------------------------
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  goal_type text not null default 'orders' check (goal_type in ('orders','points','referrals')),
  goal_value int not null default 1,
  reward_points int not null default 0,
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table if not exists public.challenge_completions (
  id bigserial primary key,
  member_id uuid not null,
  challenge_id uuid not null,
  created_at timestamptz not null default now(),
  unique (member_id, challenge_id)
);

insert into public.challenges (title, description, goal_type, goal_value, reward_points, sort_order) values
  ('הזמנה ראשונה',  'בצע את ההזמנה הראשונה שלך',        'orders',    1, 100, 1),
  ('לקוח קבוע',      'בצע 3 הזמנות',                      'orders',    3, 300, 2),
  ('משפיען',         'הבא חבר אחד שיזמין',                'referrals', 1, 250, 3)
on conflict do nothing;

alter table public.challenges enable row level security;
alter table public.challenge_completions enable row level security;

drop policy if exists "ch read" on public.challenges;
drop policy if exists "ch admin" on public.challenges;
create policy "ch read" on public.challenges for select to anon, authenticated using (true);
create policy "ch admin" on public.challenges for all to authenticated using (true) with check (true);

drop policy if exists "cc read" on public.challenge_completions;
drop policy if exists "cc insert" on public.challenge_completions;
create policy "cc read" on public.challenge_completions for select to anon, authenticated using (true);
create policy "cc insert" on public.challenge_completions for insert to anon, authenticated with check (true);
