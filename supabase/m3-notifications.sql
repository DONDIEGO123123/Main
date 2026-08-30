-- ============================================================
-- מודול 3: מרכז התראות, Activity Feed, העדפות
-- הרץ ב-SQL Editor. בטוח להרצה חוזרת.
-- ============================================================

-- ---------- התראות אישיות (#4) ------------------------------
create table if not exists public.notifications (
  id bigserial primary key,
  member_id uuid not null,
  kind text not null default 'general',   -- order | points | level | reward | stock | mission | community
  title text not null,
  body text default '',
  link text,                              -- deep link (#51)
  icon text default '🔔',
  is_read boolean not null default false,
  dedupe_key text,                        -- מונע התראות כפולות
  created_at timestamptz not null default now()
);
create index if not exists notif_member_idx on public.notifications (member_id, created_at desc);
create index if not exists notif_unread_idx on public.notifications (member_id) where is_read = false;
create unique index if not exists notif_dedupe_idx on public.notifications (member_id, dedupe_key)
  where dedupe_key is not null;

-- ---------- העדפות התראה (#5) -------------------------------
create table if not exists public.notification_prefs (
  member_id uuid primary key,
  orders boolean not null default true,
  points boolean not null default true,
  vip boolean not null default true,
  rewards boolean not null default true,
  stock boolean not null default true,
  community boolean not null default true,
  missions boolean not null default true,
  new_products boolean not null default true,
  push_token text,                        -- תשתית ל-Push בעתיד
  updated_at timestamptz not null default now()
);

-- ---------- Activity Feed קהילתי (#3) -----------------------
-- רק אירועים ציבוריים. אין כאן שום מידע אישי מזהה.
create table if not exists public.feed_items (
  id bigserial primary key,
  kind text not null,                     -- product | reward | challenge | announcement | milestone
  title text not null,
  body text default '',
  icon text default '✨',
  link text,
  image_url text,
  is_pinned boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists feed_created_idx on public.feed_items (created_at desc);

-- ---------- הרשאות ------------------------------------------
alter table public.notifications      enable row level security;
alter table public.notification_prefs enable row level security;
alter table public.feed_items         enable row level security;

do $$
declare t text;
begin
  foreach t in array array['notifications','notification_prefs','feed_items'] loop
    execute format('drop policy if exists "%s r" on public.%I', t, t);
    execute format('drop policy if exists "%s i" on public.%I', t, t);
    execute format('drop policy if exists "%s u" on public.%I', t, t);
    execute format('drop policy if exists "%s a" on public.%I', t, t);
    execute format('create policy "%s r" on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('create policy "%s i" on public.%I for insert to anon, authenticated with check (true)', t, t);
    execute format('create policy "%s u" on public.%I for update to anon, authenticated using (true) with check (true)', t, t);
    execute format('create policy "%s a" on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- ---------- שליחת התראה שרתית, ללא כפילויות -----------------
create or replace function public.notify_member(
  p_member_id uuid,
  p_kind text,
  p_title text,
  p_body text default '',
  p_link text default null,
  p_icon text default '🔔',
  p_dedupe text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare v_allowed boolean := true; v_id bigint;
begin
  -- מכבדים את העדפות המשתמש (#5)
  select case p_kind
           when 'order'     then orders
           when 'points'    then points
           when 'level'     then vip
           when 'reward'    then rewards
           when 'stock'     then stock
           when 'community' then community
           when 'mission'   then missions
           when 'product'   then new_products
           else true
         end
    into v_allowed
    from notification_prefs where member_id = p_member_id;

  if v_allowed is false then return null; end if;

  insert into notifications (member_id, kind, title, body, link, icon, dedupe_key)
  values (p_member_id, p_kind, p_title, p_body, p_link, p_icon, p_dedupe)
  on conflict do nothing
  returning id into v_id;

  return v_id;
end $$;

grant execute on function public.notify_member(uuid, text, text, text, text, text, text) to anon, authenticated;

-- ---------- טריגר: התראה על שינוי סטטוס הזמנה (#54) ---------
create or replace function public.notify_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_member uuid; v_label text;
begin
  if new.status is not distinct from old.status then return new; end if;

  select id into v_member from members where phone = new.customer_phone limit 1;
  if v_member is null then return new; end if;

  v_label := case new.status
    when 'confirmed' then 'ההזמנה אושרה ואנחנו מכינים אותה'
    when 'shipped'   then 'ההזמנה יצאה אליך'
    when 'delivered' then 'ההזמנה נמסרה'
    when 'cancelled' then 'ההזמנה בוטלה'
    else 'סטטוס ההזמנה עודכן' end;

  perform notify_member(
    v_member, 'order',
    'הזמנה #' || new.order_number,
    v_label,
    '/orders',
    '📦',
    'order-' || new.id || '-' || new.status      -- לא יישלח פעמיים
  );

  insert into events (name, member_id, entity_type, entity_id, metadata)
  values ('order_status_changed', v_member, 'order', new.id::text,
          jsonb_build_object('status', new.status));

  return new;
end $$;

drop trigger if exists orders_notify_status on public.orders;
create trigger orders_notify_status
  after update on public.orders
  for each row execute function public.notify_order_status();

-- ---------- טריגר: מוצר חדש נכנס ל-Feed ---------------------
create or replace function public.feed_on_new_product()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_active is not true then return new; end if;

  insert into feed_items (kind, title, body, icon, link, image_url)
  values ('product', 'מוצר חדש בחנות', new.name, '🆕',
          '/products/' || new.id, new.image_url);

  return new;
end $$;

drop trigger if exists products_feed on public.products;
create trigger products_feed
  after insert on public.products
  for each row execute function public.feed_on_new_product();
