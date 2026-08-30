-- ============================================================
-- מסירה ב': גלריית לקוחות, וידאו בדף הבית
-- הרץ ב-SQL Editor של Supabase. בטוח להרצה חוזרת.
-- ============================================================

create table if not exists public.customer_photos (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text default '',
  product_id uuid,
  is_approved boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.customer_photos enable row level security;

drop policy if exists "photos read" on public.customer_photos;
drop policy if exists "photos admin" on public.customer_photos;
create policy "photos read" on public.customer_photos
  for select to anon, authenticated using (is_approved = true);
create policy "photos admin" on public.customer_photos
  for all to authenticated using (true) with check (true);
