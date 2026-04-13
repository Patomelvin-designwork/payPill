-- =============================================================================
-- payPill — initial database schema for Supabase (PostgreSQL)
-- Derived from: app/src/store/paypill-store.ts, AIQuestionnaire.tsx (HealthProfile),
--               App.tsx (treatments, contracts, adherence, activity, settings).
-- Run order: single file, top to bottom, in Supabase SQL Editor or:
--   supabase db push   (if CLI is linked to your project)
-- =============================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Reference: body systems (matches AI questionnaire groupings)
-- -----------------------------------------------------------------------------
create table if not exists public.body_systems (
  id text primary key,
  display_name text not null,
  sort_order smallint not null default 0
);

insert into public.body_systems (id, display_name, sort_order) values
  ('cardiovascular', 'Cardiovascular', 1),
  ('endocrine', 'Endocrine & Metabolic', 2),
  ('respiratory', 'Respiratory', 3),
  ('neurological', 'Neurological', 4),
  ('mental', 'Mental Health', 5),
  ('kidney', 'Kidney & Urinary', 6),
  ('musculoskeletal', 'Musculoskeletal', 7),
  ('cancer', 'Cancer/Oncology', 8)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Profiles (1:1 with auth.users) — app user + PPLL + onboarding
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  phone text,
  avatar_url text,
  ppll_balance bigint not null default 0,
  onboarding_complete boolean not null default false,
  xrpl_wallet_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_ppll_balance_non_negative check (ppll_balance >= 0)
);

-- -----------------------------------------------------------------------------
-- Full questionnaire snapshot (flexible JSON + versioning)
-- -----------------------------------------------------------------------------
create table if not exists public.health_questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  payload jsonb not null,
  schema_version smallint not null default 1,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists health_questionnaire_responses_user_id_idx
  on public.health_questionnaire_responses (user_id);
create index if not exists health_questionnaire_responses_created_at_idx
  on public.health_questionnaire_responses (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Normalized health data (queryable; mirrors HealthProfile in AIQuestionnaire)
-- -----------------------------------------------------------------------------
create table if not exists public.health_identity (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  first_name text,
  last_name text,
  date_of_birth date,
  gender text,
  location text,
  updated_at timestamptz not null default now()
);

create table if not exists public.health_vitals (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  height_cm numeric(6, 2),
  weight_kg numeric(7, 2),
  bmi numeric(5, 2),
  blood_pressure_systolic smallint,
  blood_pressure_diastolic smallint,
  heart_rate_bpm smallint,
  updated_at timestamptz not null default now()
);

create table if not exists public.health_lifestyle (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  exercise text,
  alcohol text,
  smoking text,
  diet text,
  sleep text,
  stress text,
  updated_at timestamptz not null default now()
);

create table if not exists public.health_providers (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  primary_care text,
  insurance text,
  plan_type text,
  updated_at timestamptz not null default now()
);

create table if not exists public.health_conditions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  body_system_id text references public.body_systems (id),
  condition_name text not null,
  diagnosed_date date,
  treatment text,
  controlled text,
  created_at timestamptz not null default now()
);

create index if not exists health_conditions_user_id_idx
  on public.health_conditions (user_id);

create table if not exists public.health_medication_intake (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  dosage text,
  frequency text,
  start_date date,
  created_at timestamptz not null default now()
);

create index if not exists health_medication_intake_user_id_idx
  on public.health_medication_intake (user_id);

create table if not exists public.health_allergies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  allergen text not null,
  severity text,
  reaction text,
  allergen_type text,
  created_at timestamptz not null default now()
);

create index if not exists health_allergies_user_id_idx
  on public.health_allergies (user_id);

-- -----------------------------------------------------------------------------
-- Active treatment plan (My Treatments / dashboard)
-- -----------------------------------------------------------------------------
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  dosage text,
  frequency text,
  status text not null default 'active'
    check (status in ('active', 'low', 'paused', 'ended')),
  remaining_supply text,
  next_refill_date date,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists medications_user_id_idx on public.medications (user_id);

-- Scheduled doses (Today's medications)
create table if not exists public.dose_schedules (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications (id) on delete cascade,
  scheduled_time_label text not null,
  dose_instruction text,
  recurrence jsonb,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists dose_schedules_medication_id_idx
  on public.dose_schedules (medication_id);

create table if not exists public.dose_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  medication_id uuid references public.medications (id) on delete set null,
  dose_schedule_id uuid references public.dose_schedules (id) on delete set null,
  taken_at timestamptz not null default now(),
  status text not null default 'taken'
    check (status in ('taken', 'skipped', 'late', 'scheduled')),
  ppll_awarded int not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists dose_events_user_taken_at_idx
  on public.dose_events (user_id, taken_at desc);

-- -----------------------------------------------------------------------------
-- Smart contracts & pricing (Contracts page)
-- -----------------------------------------------------------------------------
create table if not exists public.smart_contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  external_ref text,
  medication_id uuid references public.medications (id) on delete set null,
  medication_display_name text,
  status text not null default 'active'
    check (status in ('draft', 'active', 'expired', 'cancelled')),
  valid_from date,
  valid_until date,
  locked_price_cents bigint,
  currency text not null default 'USD',
  quantity_description text,
  blockchain_network text,
  tx_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists smart_contracts_user_id_idx
  on public.smart_contracts (user_id);

-- -----------------------------------------------------------------------------
-- Activity feed + PPLL ledger
-- -----------------------------------------------------------------------------
create table if not exists public.user_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  activity_type text not null,
  title text not null,
  subtitle text,
  ppll_delta int not null default 0,
  metadata jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists user_activities_user_occurred_idx
  on public.user_activities (user_id, occurred_at desc);

create table if not exists public.ppll_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta bigint not null,
  balance_after bigint not null,
  reason text not null,
  reference_type text,
  reference_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists ppll_ledger_user_created_idx
  on public.ppll_ledger_entries (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Settings: notification preferences
-- -----------------------------------------------------------------------------
create table if not exists public.user_notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  medication_reminders boolean not null default true,
  refill_alerts boolean not null default true,
  adherence_reports boolean not null default true,
  price_drop_alerts boolean not null default false,
  ai_recommendations boolean not null default true,
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Optional: AI analysis runs linked to a questionnaire snapshot
-- -----------------------------------------------------------------------------
create table if not exists public.ai_recommendation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  questionnaire_response_id uuid references public.health_questionnaire_responses (id) on delete set null,
  summary jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_recommendation_runs_user_id_idx
  on public.ai_recommendation_runs (user_id);

-- -----------------------------------------------------------------------------
-- updated_at trigger
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists medications_set_updated_at on public.medications;
create trigger medications_set_updated_at
  before update on public.medications
  for each row execute procedure public.set_updated_at();

drop trigger if exists smart_contracts_set_updated_at on public.smart_contracts;
create trigger smart_contracts_set_updated_at
  before update on public.smart_contracts
  for each row execute procedure public.set_updated_at();

-- -----------------------------------------------------------------------------
-- New auth user → profile row
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  );
  insert into public.user_notification_preferences (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.health_questionnaire_responses enable row level security;
alter table public.health_identity enable row level security;
alter table public.health_vitals enable row level security;
alter table public.health_lifestyle enable row level security;
alter table public.health_providers enable row level security;
alter table public.health_conditions enable row level security;
alter table public.health_medication_intake enable row level security;
alter table public.health_allergies enable row level security;
alter table public.medications enable row level security;
alter table public.dose_schedules enable row level security;
alter table public.dose_events enable row level security;
alter table public.smart_contracts enable row level security;
alter table public.user_activities enable row level security;
alter table public.ppll_ledger_entries enable row level security;
alter table public.user_notification_preferences enable row level security;
alter table public.ai_recommendation_runs enable row level security;

-- body_systems: public read
alter table public.body_systems enable row level security;

create policy "Body systems are readable by everyone"
  on public.body_systems for select
  using (true);

-- Helper: own profile row
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Generic pattern for user-owned tables
create policy "health_questionnaire_responses_select_own"
  on public.health_questionnaire_responses for select
  using (auth.uid() = user_id);
create policy "health_questionnaire_responses_insert_own"
  on public.health_questionnaire_responses for insert
  with check (auth.uid() = user_id);
create policy "health_questionnaire_responses_update_own"
  on public.health_questionnaire_responses for update
  using (auth.uid() = user_id);

create policy "health_identity_select_own"
  on public.health_identity for select using (auth.uid() = user_id);
create policy "health_identity_upsert_own"
  on public.health_identity for insert with check (auth.uid() = user_id);
create policy "health_identity_update_own"
  on public.health_identity for update using (auth.uid() = user_id);

create policy "health_vitals_select_own"
  on public.health_vitals for select using (auth.uid() = user_id);
create policy "health_vitals_insert_own"
  on public.health_vitals for insert with check (auth.uid() = user_id);
create policy "health_vitals_update_own"
  on public.health_vitals for update using (auth.uid() = user_id);

create policy "health_lifestyle_select_own"
  on public.health_lifestyle for select using (auth.uid() = user_id);
create policy "health_lifestyle_insert_own"
  on public.health_lifestyle for insert with check (auth.uid() = user_id);
create policy "health_lifestyle_update_own"
  on public.health_lifestyle for update using (auth.uid() = user_id);

create policy "health_providers_select_own"
  on public.health_providers for select using (auth.uid() = user_id);
create policy "health_providers_insert_own"
  on public.health_providers for insert with check (auth.uid() = user_id);
create policy "health_providers_update_own"
  on public.health_providers for update using (auth.uid() = user_id);

create policy "health_conditions_select_own"
  on public.health_conditions for select using (auth.uid() = user_id);
create policy "health_conditions_insert_own"
  on public.health_conditions for insert with check (auth.uid() = user_id);
create policy "health_conditions_update_own"
  on public.health_conditions for update using (auth.uid() = user_id);
create policy "health_conditions_delete_own"
  on public.health_conditions for delete using (auth.uid() = user_id);

create policy "health_medication_intake_select_own"
  on public.health_medication_intake for select using (auth.uid() = user_id);
create policy "health_medication_intake_insert_own"
  on public.health_medication_intake for insert with check (auth.uid() = user_id);
create policy "health_medication_intake_update_own"
  on public.health_medication_intake for update using (auth.uid() = user_id);
create policy "health_medication_intake_delete_own"
  on public.health_medication_intake for delete using (auth.uid() = user_id);

create policy "health_allergies_select_own"
  on public.health_allergies for select using (auth.uid() = user_id);
create policy "health_allergies_insert_own"
  on public.health_allergies for insert with check (auth.uid() = user_id);
create policy "health_allergies_update_own"
  on public.health_allergies for update using (auth.uid() = user_id);
create policy "health_allergies_delete_own"
  on public.health_allergies for delete using (auth.uid() = user_id);

create policy "medications_select_own"
  on public.medications for select using (auth.uid() = user_id);
create policy "medications_insert_own"
  on public.medications for insert with check (auth.uid() = user_id);
create policy "medications_update_own"
  on public.medications for update using (auth.uid() = user_id);
create policy "medications_delete_own"
  on public.medications for delete using (auth.uid() = user_id);

create policy "dose_schedules_select_own"
  on public.dose_schedules for select
  using (
    exists (
      select 1 from public.medications m
      where m.id = dose_schedules.medication_id and m.user_id = auth.uid()
    )
  );
create policy "dose_schedules_insert_own"
  on public.dose_schedules for insert
  with check (
    exists (
      select 1 from public.medications m
      where m.id = medication_id and m.user_id = auth.uid()
    )
  );
create policy "dose_schedules_update_own"
  on public.dose_schedules for update
  using (
    exists (
      select 1 from public.medications m
      where m.id = dose_schedules.medication_id and m.user_id = auth.uid()
    )
  );
create policy "dose_schedules_delete_own"
  on public.dose_schedules for delete
  using (
    exists (
      select 1 from public.medications m
      where m.id = dose_schedules.medication_id and m.user_id = auth.uid()
    )
  );

create policy "dose_events_select_own"
  on public.dose_events for select using (auth.uid() = user_id);
create policy "dose_events_insert_own"
  on public.dose_events for insert with check (auth.uid() = user_id);
create policy "dose_events_update_own"
  on public.dose_events for update using (auth.uid() = user_id);

create policy "smart_contracts_select_own"
  on public.smart_contracts for select using (auth.uid() = user_id);
create policy "smart_contracts_insert_own"
  on public.smart_contracts for insert with check (auth.uid() = user_id);
create policy "smart_contracts_update_own"
  on public.smart_contracts for update using (auth.uid() = user_id);

create policy "user_activities_select_own"
  on public.user_activities for select using (auth.uid() = user_id);
create policy "user_activities_insert_own"
  on public.user_activities for insert with check (auth.uid() = user_id);

create policy "ppll_ledger_select_own"
  on public.ppll_ledger_entries for select using (auth.uid() = user_id);
create policy "ppll_ledger_insert_own"
  on public.ppll_ledger_entries for insert with check (auth.uid() = user_id);

create policy "user_notification_preferences_select_own"
  on public.user_notification_preferences for select using (auth.uid() = user_id);
create policy "user_notification_preferences_update_own"
  on public.user_notification_preferences for update using (auth.uid() = user_id);

create policy "ai_recommendation_runs_select_own"
  on public.ai_recommendation_runs for select using (auth.uid() = user_id);
create policy "ai_recommendation_runs_insert_own"
  on public.ai_recommendation_runs for insert with check (auth.uid() = user_id);
