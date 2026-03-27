-- ============================================
-- MIGRATION 006: cycles, goals, kpis, kpi_versions, completion_logs
-- ============================================

-- ============================================
-- cycles: 90-day planning periods
-- ============================================
create table public.cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  diagnostic_snapshot_id uuid null references public.diagnostic_snapshots(id),
  starts_at date not null default current_date,
  ends_at date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_cycles_dates check (ends_at > starts_at)
);

create index idx_cycles_user_active on public.cycles(user_id, is_active);

create trigger trg_cycles_updated_at
  before update on public.cycles
  for each row execute function public.set_updated_at();

-- Only one active cycle per user
create unique index uq_cycles_one_active
  on public.cycles(user_id) where (is_active = true);

-- RLS
alter table public.cycles enable row level security;

create policy "Users can read own cycles"
  on public.cycles for select using (user_id = auth.uid());

create policy "Users can insert own cycles"
  on public.cycles for insert with check (user_id = auth.uid());

create policy "Users can update own cycles"
  on public.cycles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================
-- goals: up to 3 per cycle, linked to a life area
-- ============================================
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.cycles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  life_area_id uuid not null references public.life_areas(id),
  title text not null,
  description text null,
  priority int not null default 1 check (priority between 1 and 3),
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_goals_title_length check (char_length(title) between 3 and 200)
);

create index idx_goals_cycle on public.goals(cycle_id);
create index idx_goals_user_status on public.goals(user_id, status);

create trigger trg_goals_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- RLS
alter table public.goals enable row level security;

create policy "Users can read own goals"
  on public.goals for select using (user_id = auth.uid());

create policy "Users can insert own goals"
  on public.goals for insert with check (user_id = auth.uid());

create policy "Users can update own goals"
  on public.goals for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================
-- kpis: up to 3 per goal
-- ============================================
create table public.kpis (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_kpis_goal on public.kpis(goal_id);
create index idx_kpis_user on public.kpis(user_id);

create trigger trg_kpis_updated_at
  before update on public.kpis
  for each row execute function public.set_updated_at();

-- RLS
alter table public.kpis enable row level security;

create policy "Users can read own kpis"
  on public.kpis for select using (user_id = auth.uid());

create policy "Users can insert own kpis"
  on public.kpis for insert with check (user_id = auth.uid());

create policy "Users can update own kpis"
  on public.kpis for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================
-- kpi_versions: append-only, tracks changes to KPI definition
-- ============================================
create table public.kpi_versions (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid not null references public.kpis(id) on delete cascade,
  title text not null,
  description text null,
  target_value numeric(10,2) not null check (target_value > 0),
  unit text not null default 'veces',
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly', 'monthly')),
  version_number int not null default 1,
  created_at timestamptz not null default now(),
  constraint chk_kpi_versions_title_length check (char_length(title) between 3 and 200),
  constraint uq_kpi_version unique (kpi_id, version_number)
);

create index idx_kpi_versions_kpi on public.kpi_versions(kpi_id);

-- RLS
alter table public.kpi_versions enable row level security;

create policy "Users can read own kpi versions"
  on public.kpi_versions for select
  using (exists (
    select 1 from public.kpis k where k.id = kpi_id and k.user_id = auth.uid()
  ));

create policy "Users can insert own kpi versions"
  on public.kpi_versions for insert
  with check (exists (
    select 1 from public.kpis k where k.id = kpi_id and k.user_id = auth.uid()
  ));

-- ============================================
-- completion_logs: single source of truth for execution
-- ============================================
create table public.completion_logs (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid not null references public.kpis(id) on delete cascade,
  kpi_version_id uuid not null references public.kpi_versions(id),
  user_id uuid not null references public.profiles(id) on delete cascade,
  value numeric(10,2) not null default 1,
  logged_at date not null default current_date,
  notes text null,
  created_at timestamptz not null default now(),
  constraint chk_completion_logs_value check (value >= 0),
  constraint uq_completion_log_per_day unique (kpi_id, logged_at)
);

create index idx_completion_logs_user_date on public.completion_logs(user_id, logged_at);
create index idx_completion_logs_kpi on public.completion_logs(kpi_id, logged_at);

-- RLS
alter table public.completion_logs enable row level security;

create policy "Users can read own logs"
  on public.completion_logs for select using (user_id = auth.uid());

create policy "Users can insert own logs"
  on public.completion_logs for insert with check (user_id = auth.uid());

create policy "Users can update own logs"
  on public.completion_logs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own logs"
  on public.completion_logs for delete using (user_id = auth.uid());
