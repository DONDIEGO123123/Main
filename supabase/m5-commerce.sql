-- ============================================================
-- מודול 5: רשימות, התראות מחיר, מעקב הזמנה, תמיכה, חיפוש
-- הרץ ב-SQL Editor. בטוח להרצה חוזרת.
-- ============================================================

-- ---------- רשימות קניות (#26) ------------------------------
create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null,
  name text not null default 'הרשימה שלי',
  icon text default '📝',
  created_at timestamptz not null default now()
);

create table if not exists public.shopping_list_items (
  id bigserial primary key,
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  product_id uuid not null,
  note text default '',
  created_at timestamptz not null default now(),
  unique (list_id, product_id)
);

-- ---------- היסטוריית מחירים והתראות (#29) ------------------
create table if not exists public.price_history (
  id bigserial primary key,
  product_id uuid not null,
  price numeric(10,2) not null,
  changed_at timestamptz not null default now()
);
create index if not exists price_hist_idx on public.price_history (product_id, changed_at desc);

create table if not exists public.price_alerts (
  id bigserial primary key,
  product_id uuid not null,
  member_id uuid,
  phone text,
  target_price numeric(10,2),          -- ריק = כל ירידה
  notified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists price_alerts_idx on public.price_alerts (product_id) where notified_at is null;

-- ---------- ציר סטטוס הזמנה (#53) ---------------------------
create table if not exists public.order_timeline (
  id bigserial primary key,
  order_id uuid not null,
  status text not null,
  note text default '',
  created_at timestamptz not null default now()
);
create index if not exists timeline_order_idx on public.order_timeline (order_id, created_at);

-- ---------- מרכז תמיכה (#56) --------------------------------
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number bigserial,
  member_id uuid,
  phone text not null,
  name text default '',
  order_id uuid,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new','open','in_progress','resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tickets_status_idx on public.support_tickets (status, created_at desc);
create index if not exists tickets_phone_idx  on public.support_tickets (phone);

create table if not exists public.ticket_replies (
  id bigserial primary key,
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author text not null default 'customer',   -- customer | admin
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------- אנליטיקת חיפוש (#57) ----------------------------
create table if not exists public.search_log (
  id bigserial primary key,
  query text not null,
  results int not null default 0,
  session_id text,
  created_at timestamptz not null default now()
);
create index if not exists search_q_idx  on public.search_log (query);
create index if not exists search_no_idx on public.search_log (created_at desc) where results = 0;

-- ---------- הרשאות ------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'shopping_lists','shopping_list_items','price_history','price_alerts',
    'order_timeline','support_tickets','ticket_replies','search_log'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s r" on public.%I', t, t);
    execute format('drop policy if exists "%s i" on public.%I', t, t);
    execute format('drop policy if exists "%s u" on public.%I', t, t);
    execute format('drop policy if exists "%s d" on public.%I', t, t);
    execute format('drop policy if exists "%s a" on public.%I', t, t);
    execute format('create policy "%s r" on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('create policy "%s i" on public.%I for insert to anon, authenticated with check (true)', t, t);
    execute format('create policy "%s u" on public.%I for update to anon, authenticated using (true) with check (true)', t, t);
    execute format('create policy "%s d" on public.%I for delete to anon, authenticated using (true)', t, t);
    execute format('create policy "%s a" on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- ---------- טריגר: תיעוד שינוי מחיר + התראות ----------------
create or replace function public.track_price_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare r record; v_member uuid;
begin
  if new.price is not distinct from old.price then return new; end if;

  insert into price_history (product_id, price) values (new.id, new.price);

  -- ירידת מחיר בלבד מפעילה התראה
  if new.price < old.price then
    for r in
      select * from price_alerts
       where product_id = new.id
         and notified_at is null
         and (target_price is null or new.price <= target_price)
    loop
      if r.member_id is not null then
        perform notify_member(
          r.member_id, 'stock',
          'המחיר ירד! ' || new.name,
          'מ-' || old.price || '₪ ל-' || new.price || '₪',
          '/products/' || new.id, '💰',
          'price-' || new.id || '-' || new.price
        );
      end if;
      update price_alerts set notified_at = now() where id = r.id;
    end loop;
  end if;

  -- חזרה למלאי
  if old.stock = 0 and new.stock > 0 then
    for r in select * from stock_alerts where product_id = new.id and notified = false loop
      select id into v_member from members where phone = r.phone limit 1;
      if v_member is not null then
        perform notify_member(
          v_member, 'stock', 'חזר למלאי: ' || new.name, '',
          '/products/' || new.id, '🔔', 'restock-' || new.id
        );
      end if;
      update stock_alerts set notified = true where id = r.id;
    end loop;
  end if;

  return new;
end $$;

drop trigger if exists products_price_watch on public.products;
create trigger products_price_watch
  after update on public.products
  for each row execute function public.track_price_change();

-- ---------- טריגר: ציר זמן להזמנה ---------------------------
create or replace function public.log_order_timeline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into order_timeline (order_id, status, note) values (new.id, 'new', 'ההזמנה התקבלה');
  elsif new.status is distinct from old.status then
    insert into order_timeline (order_id, status) values (new.id, new.status);
  end if;
  return new;
end $$;

drop trigger if exists orders_timeline_ins on public.orders;
create trigger orders_timeline_ins
  after insert on public.orders
  for each row execute function public.log_order_timeline();

drop trigger if exists orders_timeline_upd on public.orders;
create trigger orders_timeline_upd
  after update on public.orders
  for each row execute function public.log_order_timeline();
