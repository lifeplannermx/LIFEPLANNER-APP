-- ============================================
-- MIGRATION 004: AI analysis fields + segment_averages
-- ============================================

-- ============================================
-- Expand diagnostic_snapshots with AI analysis fields
-- ============================================
alter table public.diagnostic_snapshots
  add column area_analyses jsonb null,
  add column global_diagnosis text null,
  add column action_plan text null,
  add column strengths_weaknesses text null,
  add column segment_comparison jsonb null;

comment on column public.diagnostic_snapshots.area_analyses is
  'JSON object keyed by area_code, each containing interpretation, diagnosis, recommendations';
comment on column public.diagnostic_snapshots.global_diagnosis is
  'Global diagnosis text with patterns and root causes';
comment on column public.diagnostic_snapshots.action_plan is
  'Structured action plan: daily, weekly, monthly actions';
comment on column public.diagnostic_snapshots.strengths_weaknesses is
  '3 strengths + 3 weaknesses summary';
comment on column public.diagnostic_snapshots.segment_comparison is
  'Segment averages used for radar comparison at time of snapshot';

-- Allow service_role to update snapshots (Edge Functions write AI results)
create policy "Service role can update snapshots"
  on public.diagnostic_snapshots for update
  using (true)
  with check (true);

-- ============================================
-- segment_averages: pre-aggregated averages by demographic segment
-- ============================================
create table public.segment_averages (
  id uuid primary key default gen_random_uuid(),
  gender text not null,
  generation text not null,
  has_partner boolean not null,
  has_children boolean not null,
  area_code text not null references public.life_areas(code),
  avg_score numeric(4,2) not null default 0,
  total_score numeric(10,2) not null default 0,
  sample_size int not null default 0,
  updated_at timestamptz not null default now(),
  constraint uq_segment_area unique (gender, generation, has_partner, has_children, area_code),
  constraint chk_segment_gender check (gender in ('Hombre', 'Mujer', 'No binario', 'Otro')),
  constraint chk_segment_generation check (generation in ('Gen Z', 'Millennial', 'Gen X', 'Boomer', 'Silent'))
);

create index idx_segment_averages_lookup
  on public.segment_averages(gender, generation, has_partner, has_children);

create trigger trg_segment_averages_updated_at
  before update on public.segment_averages
  for each row execute function public.set_updated_at();

-- RLS: read-only for authenticated users
alter table public.segment_averages enable row level security;

create policy "Authenticated users can read segment averages"
  on public.segment_averages for select
  using (auth.role() = 'authenticated');

-- Service role can insert/update (for import scripts and Edge Functions)
create policy "Service role can manage segment averages"
  on public.segment_averages for all
  using (true)
  with check (true);

-- ============================================
-- Add unique constraint on life_areas.code (needed for FK)
-- Note: life_areas already has unique on code from migration 001
-- ============================================

-- ============================================
-- Function: get segment averages with fallback
-- If exact segment has < min_sample, relax filters progressively
-- ============================================
create or replace function public.get_segment_averages(
  p_gender text,
  p_generation text,
  p_has_partner boolean,
  p_has_children boolean,
  p_min_sample int default 30
)
returns table (
  area_code text,
  avg_score numeric,
  sample_size int,
  segment_label text
)
language plpgsql stable
as $$
declare
  v_count int;
  v_label text;
begin
  -- Level 1: exact match (all 4 filters)
  select count(*) into v_count
  from public.segment_averages sa
  where sa.gender = p_gender
    and sa.generation = p_generation
    and sa.has_partner = p_has_partner
    and sa.has_children = p_has_children
    and sa.sample_size >= p_min_sample;

  if v_count >= 8 then
    v_label := p_gender || ', ' || p_generation ||
      case when p_has_partner then ', con pareja' else ', sin pareja' end ||
      case when p_has_children then ', con hijos' else ', sin hijos' end;
    return query
      select sa.area_code, sa.avg_score, sa.sample_size, v_label
      from public.segment_averages sa
      where sa.gender = p_gender
        and sa.generation = p_generation
        and sa.has_partner = p_has_partner
        and sa.has_children = p_has_children;
    return;
  end if;

  -- Level 2: drop has_children
  select count(*) into v_count
  from public.segment_averages sa
  where sa.gender = p_gender
    and sa.generation = p_generation
    and sa.has_partner = p_has_partner
    and sa.sample_size >= p_min_sample;

  if v_count >= 8 then
    v_label := p_gender || ', ' || p_generation ||
      case when p_has_partner then ', con pareja' else ', sin pareja' end;
    return query
      select sa.area_code,
        avg(sa.avg_score)::numeric(4,2),
        sum(sa.sample_size)::int,
        v_label
      from public.segment_averages sa
      where sa.gender = p_gender
        and sa.generation = p_generation
        and sa.has_partner = p_has_partner
      group by sa.area_code;
    return;
  end if;

  -- Level 3: gender + generation only
  select count(*) into v_count
  from public.segment_averages sa
  where sa.gender = p_gender
    and sa.generation = p_generation
    and sa.sample_size >= p_min_sample;

  if v_count >= 8 then
    v_label := p_gender || ', ' || p_generation;
    return query
      select sa.area_code,
        avg(sa.avg_score)::numeric(4,2),
        sum(sa.sample_size)::int,
        v_label
      from public.segment_averages sa
      where sa.gender = p_gender
        and sa.generation = p_generation
      group by sa.area_code;
    return;
  end if;

  -- Level 4: generation only
  select count(*) into v_count
  from public.segment_averages sa
  where sa.generation = p_generation
    and sa.sample_size >= p_min_sample;

  if v_count >= 8 then
    v_label := p_generation;
    return query
      select sa.area_code,
        avg(sa.avg_score)::numeric(4,2),
        sum(sa.sample_size)::int,
        v_label
      from public.segment_averages sa
      where sa.generation = p_generation
      group by sa.area_code;
    return;
  end if;

  -- Level 5: all users (no filter)
  v_label := 'Todos los usuarios';
  return query
    select sa.area_code,
      avg(sa.avg_score)::numeric(4,2),
      sum(sa.sample_size)::int,
      v_label
    from public.segment_averages sa
    group by sa.area_code;
end;
$$;
