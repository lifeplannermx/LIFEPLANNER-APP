-- ============================================
-- MIGRATION 003: diagnostic_responses & diagnostic_snapshots
-- ============================================

-- ============================================
-- diagnostic_responses (one row per answer)
-- ============================================
create table public.diagnostic_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.diagnostic_questions(id),
  scale_value int null check (scale_value between 1 and 5),
  open_text text null,
  created_at timestamptz not null default now(),
  constraint chk_diagnostic_responses_answer check (
    (scale_value is not null and open_text is null)
    or (scale_value is null and open_text is not null)
  ),
  constraint uq_diagnostic_responses_user_question unique (user_id, question_id)
);

create index idx_diagnostic_responses_user on public.diagnostic_responses(user_id);

-- RLS
alter table public.diagnostic_responses enable row level security;

create policy "Users can read own responses"
  on public.diagnostic_responses for select
  using (user_id = auth.uid());

create policy "Users can insert own responses"
  on public.diagnostic_responses for insert
  with check (user_id = auth.uid());

create policy "Users can update own responses"
  on public.diagnostic_responses for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================
-- diagnostic_snapshots (immutable result per diagnostic run)
-- ============================================
create table public.diagnostic_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  scores jsonb not null default '{}'::jsonb,
  overall_score numeric(3,1) null,
  ai_summary text null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint chk_diagnostic_snapshots_scores check (jsonb_typeof(scores) = 'object')
);

create index idx_diagnostic_snapshots_user on public.diagnostic_snapshots(user_id);

-- RLS
alter table public.diagnostic_snapshots enable row level security;

create policy "Users can read own snapshots"
  on public.diagnostic_snapshots for select
  using (user_id = auth.uid());

create policy "Users can insert own snapshots"
  on public.diagnostic_snapshots for insert
  with check (user_id = auth.uid());
