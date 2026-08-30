-- ============================================================
-- מודול 6: CRM — סגמנטים, הצבעות, סקרים, משוב
-- הרץ ב-SQL Editor. בטוח להרצה חוזרת.
-- ============================================================

-- ---------- הצבעות קהילה (#23) ------------------------------
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  description text default '',
  options jsonb not null default '[]'::jsonb,   -- ["אפשרות א","אפשרות ב"]
  reward_points int not null default 0,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_votes (
  id bigserial primary key,
  poll_id uuid not null references public.polls(id) on delete cascade,
  member_id uuid not null,
  choice int not null,
  created_at timestamptz not null default now(),
  unique (poll_id, member_id)                   -- הצבעה אחת לחבר
);

-- ---------- סקרים (#24) -------------------------------------
create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  question text not null,
  kind text not null default 'text' check (kind in ('text','rating','choice')),
  options jsonb default '[]'::jsonb,
  reward_points int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.survey_answers (
  id bigserial primary key,
  survey_id uuid not null references public.surveys(id) on delete cascade,
  member_id uuid,
  answer text not null,
  created_at timestamptz not null default now(),
  unique (survey_id, member_id)
);

-- ---------- משוב ורעיונות (#35) -----------------------------
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  member_id uuid,
  phone text,
  title text not null,
  body text default '',
  status text not null default 'new'
    check (status in ('new','reviewing','planned','completed','rejected')),
  votes int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.feedback_votes (
  id bigserial primary key,
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  member_id uuid not null,
  created_at timestamptz not null default now(),
  unique (feedback_id, member_id)
);

-- ---------- הרשאות ------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'polls','poll_votes','surveys','survey_answers','feedback','feedback_votes'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s r" on public.%I', t, t);
    execute format('drop policy if exists "%s i" on public.%I', t, t);
    execute format('drop policy if exists "%s a" on public.%I', t, t);
    execute format('create policy "%s r" on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('create policy "%s i" on public.%I for insert to anon, authenticated with check (true)', t, t);
    execute format('create policy "%s a" on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- ---------- הצבעה שרתית, ללא כפילויות -----------------------
create or replace function public.cast_vote(
  p_poll_id uuid, p_member_id uuid, p_choice int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_reward int; v_ends timestamptz; v_active boolean;
begin
  select reward_points, ends_at, is_active into v_reward, v_ends, v_active
    from polls where id = p_poll_id;
  if not found or not v_active then
    return jsonb_build_object('ok', false, 'reason', 'closed');
  end if;
  if v_ends is not null and v_ends < now() then
    return jsonb_build_object('ok', false, 'reason', 'ended');
  end if;

  if exists (select 1 from poll_votes where poll_id = p_poll_id and member_id = p_member_id) then
    return jsonb_build_object('ok', false, 'reason', 'voted');
  end if;

  insert into poll_votes (poll_id, member_id, choice)
  values (p_poll_id, p_member_id, p_choice);

  if v_reward > 0 then
    perform award_points(p_member_id, 'challenge', 'השתתפות בהצבעה',
                         v_reward, 'poll-' || p_poll_id || '-' || p_member_id);
  end if;

  perform add_reputation(p_member_id, 'survey', 'poll-' || p_poll_id || '-' || p_member_id);

  return jsonb_build_object('ok', true, 'points', v_reward);
end $$;

grant execute on function public.cast_vote(uuid, uuid, int) to anon, authenticated;

-- ---------- מענה לסקר --------------------------------------
create or replace function public.answer_survey(
  p_survey_id uuid, p_member_id uuid, p_answer text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_reward int; v_active boolean;
begin
  select reward_points, is_active into v_reward, v_active
    from surveys where id = p_survey_id;
  if not found or not v_active then
    return jsonb_build_object('ok', false, 'reason', 'closed');
  end if;

  if exists (select 1 from survey_answers where survey_id = p_survey_id and member_id = p_member_id) then
    return jsonb_build_object('ok', false, 'reason', 'answered');
  end if;

  insert into survey_answers (survey_id, member_id, answer)
  values (p_survey_id, p_member_id, p_answer);

  if v_reward > 0 then
    perform award_points(p_member_id, 'challenge', 'השתתפות בסקר',
                         v_reward, 'survey-' || p_survey_id || '-' || p_member_id);
  end if;

  return jsonb_build_object('ok', true, 'points', v_reward);
end $$;

grant execute on function public.answer_survey(uuid, uuid, text) to anon, authenticated;

-- ---------- הצבעה על רעיון ---------------------------------
create or replace function public.vote_feedback(
  p_feedback_id uuid, p_member_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from feedback_votes
             where feedback_id = p_feedback_id and member_id = p_member_id) then
    return jsonb_build_object('ok', false, 'reason', 'voted');
  end if;

  insert into feedback_votes (feedback_id, member_id) values (p_feedback_id, p_member_id);
  update feedback set votes = votes + 1 where id = p_feedback_id;

  return jsonb_build_object('ok', true);
end $$;

grant execute on function public.vote_feedback(uuid, uuid) to anon, authenticated;
