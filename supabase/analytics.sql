-- ============================================================
-- Analytics upgrade: visits + contact clicks
-- Run this in the Supabase SQL Editor (safe to run once).
-- If you haven't run schema.sql yet — run schema.sql only,
-- this is already included there.
-- ============================================================

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text,
  path text
);

create table if not exists public.click_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('telegram','whatsapp')),
  path text
);

create index if not exists site_visits_created_idx on public.site_visits (created_at);
create index if not exists click_events_kind_idx on public.click_events (kind);

alter table public.site_visits enable row level security;
alter table public.click_events enable row level security;

-- visitors may only write; only the admin may read
create policy "visits insert" on public.site_visits for insert to anon, authenticated with check (true);
create policy "visits read" on public.site_visits for select to authenticated using (true);
create policy "clicks insert" on public.click_events for insert to anon, authenticated with check (true);
create policy "clicks read" on public.click_events for select to authenticated using (true);
