-- ============================================================
-- LUXURY STORE — Supabase schema (run in SQL Editor)
-- ============================================================

create extension if not exists "uuid-ossp";

create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text default '',
  price numeric(10,2) not null default 0,
  compare_at_price numeric(10,2),
  image_url text,
  gallery text[] default '{}',
  videos text[] default '{}',
  category_id uuid references categories(id) on delete set null,
  is_featured boolean default false,
  is_active boolean default true,
  stock int default 0,
  views int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists products_category_idx on products(category_id);
create index if not exists products_active_idx on products(is_active);

create table if not exists promotions (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  subtitle text default '',
  image_url text,
  cta_label text default '',
  cta_url text default '',
  is_active boolean default true,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists banners (
  id uuid primary key default uuid_generate_v4(),
  headline text not null,
  subheadline text default '',
  image_url text,
  cta_label text default '',
  cta_url text default '',
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  author text not null,
  rating int not null check (rating between 1 and 5),
  content text not null,
  is_approved boolean default true,
  created_at timestamptz default now()
);

create table if not exists delivery_areas (
  id uuid primary key default uuid_generate_v4(),
  region text not null,
  name text not null,
  eta text default '',
  fee numeric(10,2) default 0,
  is_active boolean default true
);

create table if not exists faq (
  id uuid primary key default uuid_generate_v4(),
  question text not null,
  answer text not null,
  sort_order int default 0,
  is_active boolean default true
);

create table if not exists settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

insert into settings (key, value) values
  ('homepage_sections', '{"hero":true,"featured":true,"promotions":true,"why_us":true,"delivery":true,"reviews":true,"faq":true,"contact":true}'),
  ('site', '{"name":"LUXE","tagline":"יוקרה. איכות. שירות."}')
on conflict (key) do nothing;

create table if not exists contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text default '',
  message text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table categories enable row level security;
alter table products enable row level security;
alter table promotions enable row level security;
alter table banners enable row level security;
alter table reviews enable row level security;
alter table delivery_areas enable row level security;
alter table faq enable row level security;
alter table settings enable row level security;
alter table contact_messages enable row level security;

create policy "public read categories" on categories for select using (true);
create policy "public read products" on products for select using (is_active = true);
create policy "public read promotions" on promotions for select using (is_active = true);
create policy "public read banners" on banners for select using (is_active = true);
create policy "public read reviews" on reviews for select using (is_approved = true);
create policy "public read delivery" on delivery_areas for select using (is_active = true);
create policy "public read faq" on faq for select using (is_active = true);
create policy "public read settings" on settings for select using (true);
create policy "public insert contact" on contact_messages for insert with check (true);

create policy "admin all categories" on categories for all to authenticated using (true) with check (true);
create policy "admin all products" on products for all to authenticated using (true) with check (true);
create policy "admin all promotions" on promotions for all to authenticated using (true) with check (true);
create policy "admin all banners" on banners for all to authenticated using (true) with check (true);
create policy "admin all reviews" on reviews for all to authenticated using (true) with check (true);
create policy "admin all delivery" on delivery_areas for all to authenticated using (true) with check (true);
create policy "admin all faq" on faq for all to authenticated using (true) with check (true);
create policy "admin all settings" on settings for all to authenticated using (true) with check (true);
create policy "admin read contact" on contact_messages for select to authenticated using (true);
create policy "admin delete contact" on contact_messages for delete to authenticated using (true);

-- Storage bucket
insert into storage.buckets (id, name, public) values ('media','media', true)
on conflict (id) do nothing;

create policy "public read media" on storage.objects for select using (bucket_id = 'media');
create policy "admin write media" on storage.objects for insert to authenticated with check (bucket_id = 'media');
create policy "admin update media" on storage.objects for update to authenticated using (bucket_id = 'media');
create policy "admin delete media" on storage.objects for delete to authenticated using (bucket_id = 'media');

-- Seed
insert into categories (name, slug, sort_order) values
  ('קולקציית פרימיום','premium',1),
  ('מהדורה מוגבלת','limited',2),
  ('קלאסיקות','classics',3)
on conflict (slug) do nothing;

insert into faq (question, answer, sort_order) values
  ('כמה זמן לוקח משלוח?','משלוח מהיר עד 24–48 שעות לרוב אזורי הארץ.',1),
  ('אילו אמצעי תשלום מתקבלים?','העברה בנקאית, ביט, ומזומן בתיאום מראש.',2),
  ('האם ניתן להחזיר מוצר?','כן, עד 14 יום מרגע הקבלה, באריזה מקורית.',3),
  ('איך יוצרים קשר?','בטלגרם או וואטסאפ — מענה מהיר בכל שעות היום.',4);

insert into delivery_areas (region, name, eta, fee) values
  ('north','צפון','48 שעות',30),
  ('haifa','חיפה והקריות','24–48 שעות',25),
  ('center','מרכז והשרון','24 שעות',20),
  ('tel-aviv','תל אביב','עד 24 שעות',15),
  ('jerusalem','ירושלים והסביבה','24–48 שעות',25),
  ('south','דרום','48–72 שעות',35);


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
