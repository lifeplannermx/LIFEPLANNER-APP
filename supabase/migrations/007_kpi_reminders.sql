-- ============================================
-- MIGRATION 007: Reminder fields on kpi_versions + weekly check-in tracking
-- ============================================

-- Add reminder config to kpi_versions
alter table public.kpi_versions
  add column reminder_enabled boolean not null default false,
  add column reminder_time time null,
  add column reminder_days text[] null;

comment on column public.kpi_versions.reminder_enabled is
  'Whether the user opted-in to receive push reminders for this KPI';
comment on column public.kpi_versions.reminder_time is
  'Time of day for the reminder (e.g. 08:00)';
comment on column public.kpi_versions.reminder_days is
  'Days of the week for reminders. Array of: mon,tue,wed,thu,fri,sat,sun. Null = every day for daily, or derived from frequency.';

-- Weekly check-in log (one per user per week)
create table public.weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  cycle_id uuid not null references public.cycles(id) on delete cascade,
  week_start date not null,
  completed_kpi_ids uuid[] not null default '{}',
  notes text null,
  created_at timestamptz not null default now(),
  constraint uq_weekly_checkin unique (user_id, week_start)
);

create index idx_weekly_checkins_user on public.weekly_checkins(user_id, week_start);

alter table public.weekly_checkins enable row level security;

create policy "Users can read own checkins"
  on public.weekly_checkins for select using (user_id = auth.uid());

create policy "Users can insert own checkins"
  on public.weekly_checkins for insert with check (user_id = auth.uid());

create policy "Users can update own checkins"
  on public.weekly_checkins for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
