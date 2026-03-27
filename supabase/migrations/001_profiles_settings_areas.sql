-- ============================================
-- MIGRATION 001: profiles, user_settings, life_areas, diagnostic_questions
-- ============================================

-- Helper: auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================
-- profiles
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  birth_year int not null check (birth_year between 1900 and 2100),
  gender text null,
  has_partner boolean not null default false,
  has_children boolean not null default false,
  occupation text null,
  life_stage text null,
  avatar_path text null,
  public_alias text null,
  onboarding_completed_at timestamptz null,
  email_verified_at timestamptz null,
  account_status text not null default 'active' check (account_status in ('active', 'pending_deletion', 'deleted')),
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_profiles_full_name_length check (char_length(full_name) between 0 and 120),
  constraint chk_profiles_public_alias_length check (public_alias is null or char_length(public_alias) between 2 and 50)
);

create index idx_profiles_account_status on public.profiles(account_status);
create index idx_profiles_deleted_at on public.profiles(deleted_at);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================
-- user_settings
-- ============================================
create table public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  timezone text not null default 'UTC',
  locale text not null default 'es-MX',
  notifications_enabled boolean not null default true,
  reminder_snoozed_until timestamptz null,
  ai_plan text not null default 'free' check (ai_plan in ('free', 'premium')),
  privacy_flags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_user_settings_privacy_flags check (jsonb_typeof(privacy_flags) = 'object')
);

create trigger trg_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- RLS
alter table public.user_settings enable row level security;

create policy "Users can read own settings"
  on public.user_settings for select
  using (user_id = auth.uid());

create policy "Users can insert own settings"
  on public.user_settings for insert
  with check (user_id = auth.uid());

create policy "Users can update own settings"
  on public.user_settings for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================
-- life_areas (catalog)
-- ============================================
create table public.life_areas (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  sort_order int not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint chk_life_areas_code_length check (char_length(code) between 2 and 50)
);

-- Seed life areas
insert into public.life_areas (code, name, sort_order) values
  ('financial',    'Financiero',     1),
  ('health',       'Salud',          2),
  ('family',       'Familiar',       3),
  ('relationship', 'Sentimental',    4),
  ('spiritual',    'Espiritual',     5),
  ('professional', 'Profesional',    6),
  ('social',       'Social',         7),
  ('leisure',      'Tiempo libre',   8);

-- RLS (read-only for authenticated)
alter table public.life_areas enable row level security;

create policy "Authenticated users can read life areas"
  on public.life_areas for select
  using (auth.role() = 'authenticated');

-- ============================================
-- diagnostic_questions (catalog)
-- ============================================
create table public.diagnostic_questions (
  id uuid primary key default gen_random_uuid(),
  life_area_id uuid not null references public.life_areas(id),
  question_type text not null check (question_type in ('scale', 'open')),
  prompt text not null,
  scale_min int null,
  scale_max int null,
  sort_order int not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint chk_diagnostic_questions_scale check (
    (question_type = 'scale' and scale_min is not null and scale_max is not null and scale_min < scale_max)
    or (question_type = 'open' and scale_min is null and scale_max is null)
  )
);

create index idx_diagnostic_questions_area_order on public.diagnostic_questions(life_area_id, sort_order);

-- RLS (read-only for authenticated)
alter table public.diagnostic_questions enable row level security;

create policy "Authenticated users can read questions"
  on public.diagnostic_questions for select
  using (auth.role() = 'authenticated');

-- ============================================
-- Seed diagnostic questions (sample per area)
-- ============================================
do $$
declare
  area_record record;
  q_order int;
begin
  for area_record in select id, code from public.life_areas order by sort_order loop
    q_order := 1;

    -- Scale question 1
    insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
    values (area_record.id, 'scale',
      case area_record.code
        when 'financial' then 'Que tan satisfecho estas con tu situacion financiera actual?'
        when 'health' then 'Que tan satisfecho estas con tu salud fisica actual?'
        when 'family' then 'Que tan satisfecho estas con tu relacion familiar?'
        when 'relationship' then 'Que tan satisfecho estas con tu vida sentimental?'
        when 'spiritual' then 'Que tan conectado te sientes con tu proposito de vida?'
        when 'professional' then 'Que tan satisfecho estas con tu desarrollo profesional?'
        when 'social' then 'Que tan satisfecho estas con tu vida social?'
        when 'leisure' then 'Que tan satisfecho estas con tu tiempo libre?'
      end,
      1, 5, q_order);
    q_order := q_order + 1;

    -- Scale question 2
    insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
    values (area_record.id, 'scale',
      case area_record.code
        when 'financial' then 'Que tan en control sientes tus gastos e ingresos?'
        when 'health' then 'Con que frecuencia haces ejercicio o actividad fisica?'
        when 'family' then 'Que tan presente te sientes en la vida de tu familia?'
        when 'relationship' then 'Que tan bien comunicas tus necesidades emocionales?'
        when 'spiritual' then 'Con que frecuencia dedicas tiempo a reflexion o meditacion?'
        when 'professional' then 'Que tanto estas creciendo en tus habilidades profesionales?'
        when 'social' then 'Que tan fuerte es tu red de apoyo social?'
        when 'leisure' then 'Con que frecuencia disfrutas actividades que te recargan?'
      end,
      1, 5, q_order);
    q_order := q_order + 1;

    -- Open question
    insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
    values (area_record.id, 'open',
      case area_record.code
        when 'financial' then 'Describe brevemente tu principal reto financiero actual.'
        when 'health' then 'Que habito de salud te gustaria cambiar o mejorar?'
        when 'family' then 'Que aspecto de tu vida familiar te gustaria fortalecer?'
        when 'relationship' then 'Que es lo que mas te gustaria mejorar en tu vida sentimental?'
        when 'spiritual' then 'Que significa para ti vivir con proposito?'
        when 'professional' then 'Cual es tu mayor ambicion profesional en los proximos meses?'
        when 'social' then 'Que tipo de conexiones sociales te hacen falta?'
        when 'leisure' then 'Que actividad disfrutas que no practicas lo suficiente?'
      end,
      null, null, q_order);
  end loop;
end $$;

-- ============================================
-- Auto-create profile and settings on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, birth_year)
  values (new.id, new.email, '', 1990);

  insert into public.user_settings (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
