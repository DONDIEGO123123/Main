-- ============================================================
-- שכבה 5: אוטומציה, ספקים ורווחיות, עגלות נטושות, חבילות
-- הרץ ב-SQL Editor של Supabase. בטוח להרצה חוזרת.
-- ============================================================

-- עלות ורווחיות ------------------------------------------------
alter table public.products add column if not exists cost_price numeric(10,2) default 0;
alter table public.products add column if not exists supplier text default '';
alter table public.products add column if not exists low_stock_at int default 3;

-- הנחת כמות לכל מוצר -------------------------------------------
alter table public.products add column if not exists bulk_qty int;
alter table public.products add column if not exists bulk_discount int;

-- חבילות מוצרים ------------------------------------------------
create table if not exists public.bundles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  image_url text,
  product_ids uuid[] default '{}',
  price numeric(10,2) not null default 0,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- עגלות נטושות -------------------------------------------------
create table if not exists public.abandoned_carts (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  phone text,
  member_id uuid,
  items jsonb not null default '[]'::jsonb,
  total numeric(10,2) not null default 0,
  recovered boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists abandoned_idx on public.abandoned_carts (updated_at desc);

-- רשימת המתנה למוצר --------------------------------------------
create table if not exists public.waitlist (
  id bigserial primary key,
  label text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

-- יומן פעולות אדמין --------------------------------------------
create table if not exists public.audit_log (
  id bigserial primary key,
  actor text default '',
  action text not null,
  detail text default '',
  created_at timestamptz not null default now()
);
create index if not exists audit_idx on public.audit_log (created_at desc);

-- הרשאות --------------------------------------------------------
alter table public.bundles enable row level security;
alter table public.abandoned_carts enable row level security;
alter table public.waitlist enable row level security;
alter table public.audit_log enable row level security;

do $$
declare t text;
begin
  -- קריאה ציבורית, ניהול לאדמין
  foreach t in array array['bundles'] loop
    execute format('drop policy if exists "%s read" on public.%I', t, t);
    execute format('drop policy if exists "%s admin" on public.%I', t, t);
    execute format('create policy "%s read" on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('create policy "%s admin" on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;

  -- כתיבה ציבורית (מהאתר), ניהול לאדמין
  foreach t in array array['abandoned_carts','waitlist','audit_log'] loop
    execute format('drop policy if exists "%s insert" on public.%I', t, t);
    execute format('drop policy if exists "%s update" on public.%I', t, t);
    execute format('drop policy if exists "%s admin" on public.%I', t, t);
    execute format('create policy "%s insert" on public.%I for insert to anon, authenticated with check (true)', t, t);
    execute format('create policy "%s update" on public.%I for update to anon, authenticated using (true) with check (true)', t, t);
    execute format('create policy "%s admin" on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- הפחתת מלאי אוטומטית בעת הזמנה ---------------------------------
create or replace function public.decrement_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare it jsonb;
begin
  for it in select * from jsonb_array_elements(new.items) loop
    update public.products
      set stock = greatest(0, stock - (it->>'qty')::int)
      where id = (it->>'product_id')::uuid and stock is not null;
  end loop;
  return new;
end $$;

drop trigger if exists orders_decrement_stock on public.orders;
create trigger orders_decrement_stock
  after insert on public.orders
  for each row execute function public.decrement_stock();
