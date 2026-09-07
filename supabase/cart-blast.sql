-- ============================================================
-- פנייה לעגלות נטושות — עמודת סימון
-- הרץ בפרויקט bbjqmbmuabhmtihuvomo. בטוח להרצה חוזרת.
-- ============================================================

alter table public.abandoned_carts
  add column if not exists contacted_at timestamptz;

create index if not exists carts_contact_idx
  on public.abandoned_carts (contacted_at, updated_at desc)
  where recovered = false;
