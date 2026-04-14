-- PayPill Supabase schema
-- Apply this in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default 'New User',
  phone text,
  date_of_birth date,
  ppll_balance integer not null default 0 check (ppll_balance >= 0),
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  medication_reminders boolean not null default true,
  refill_alerts boolean not null default true,
  adherence_reports boolean not null default true,
  price_drop_alerts boolean not null default false,
  ai_updates boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.patient_medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete restrict,
  dosage text not null,
  frequency text not null,
  start_date date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.adherence_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  patient_medication_id uuid not null references public.patient_medications(id) on delete cascade,
  status text not null check (status in ('taken', 'partial', 'missed')),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.smart_contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  contract_ref text not null unique,
  medication_name text not null,
  status text not null check (status in ('active', 'expired', 'cancelled')),
  locked_price numeric(12, 2) not null check (locked_price >= 0),
  quantity text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  chain text not null default 'XRP Ledger',
  tx_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.ai_analyses(id) on delete cascade,
  medication_name text not null,
  confidence numeric(5, 2) not null check (confidence >= 0 and confidence <= 100),
  rationale text,
  estimated_monthly_savings numeric(12, 2) check (estimated_monthly_savings >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_patient_medications_user_id on public.patient_medications(user_id);
create index if not exists idx_adherence_events_user_id on public.adherence_events(user_id);
create index if not exists idx_adherence_events_medication_id on public.adherence_events(patient_medication_id);
create index if not exists idx_smart_contracts_user_id on public.smart_contracts(user_id);
create index if not exists idx_ai_analyses_user_id on public.ai_analyses(user_id);
create index if not exists idx_ai_recommendations_analysis_id on public.ai_recommendations(analysis_id);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();

drop trigger if exists set_notification_preferences_updated_at on public.notification_preferences;
create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row
execute function public.update_updated_at_column();

drop trigger if exists set_patient_medications_updated_at on public.patient_medications;
create trigger set_patient_medications_updated_at
before update on public.patient_medications
for each row
execute function public.update_updated_at_column();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New User')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name;

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.user_exists_by_email(email_input text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1
    from auth.users
    where lower(email) = lower(email_input)
  );
$$;

revoke all on function public.user_exists_by_email(text) from public;
grant execute on function public.user_exists_by_email(text) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.patient_medications enable row level security;
alter table public.adherence_events enable row level security;
alter table public.smart_contracts enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.ai_recommendations enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Notification prefs are viewable by owner" on public.notification_preferences;
create policy "Notification prefs are viewable by owner"
on public.notification_preferences
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Notification prefs are updatable by owner" on public.notification_preferences;
create policy "Notification prefs are updatable by owner"
on public.notification_preferences
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Medication rows owned by user" on public.patient_medications;
create policy "Medication rows owned by user"
on public.patient_medications
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Adherence rows owned by user" on public.adherence_events;
create policy "Adherence rows owned by user"
on public.adherence_events
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Smart contract rows owned by user" on public.smart_contracts;
create policy "Smart contract rows owned by user"
on public.smart_contracts
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "AI analysis rows owned by user" on public.ai_analyses;
create policy "AI analysis rows owned by user"
on public.ai_analyses
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "AI recommendations via owned analysis" on public.ai_recommendations;
create policy "AI recommendations via owned analysis"
on public.ai_recommendations
for all
to authenticated
using (
  exists (
    select 1
    from public.ai_analyses a
    where a.id = analysis_id and a.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.ai_analyses a
    where a.id = analysis_id and a.user_id = auth.uid()
  )
);
create extension if not exists pgcrypto;

create type medication_status as enum ('active', 'paused', 'stopped');
create type adherence_status as enum ('taken', 'partial', 'missed', 'skipped');
create type contract_status as enum ('active', 'expired', 'cancelled', 'pending');
create type recommendation_status as enum ('generated', 'accepted', 'rejected');
create type allergy_severity as enum ('mild', 'moderate', 'severe');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default 'New User',
  phone text,
  date_of_birth date,
  sex_at_birth text,
  location text,
  ppll_balance numeric(12,2) not null default 0,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conditions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.patient_conditions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  condition_id uuid not null references public.conditions(id),
  diagnosed_date date,
  treatment text,
  controlled text,
  created_at timestamptz not null default now(),
  unique(profile_id, condition_id)
);

create table if not exists public.allergens (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  allergen_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.patient_allergies (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  allergen_id uuid not null references public.allergens(id),
  severity allergy_severity not null default 'mild',
  reaction text,
  created_at timestamptz not null default now(),
  unique(profile_id, allergen_id)
);

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  dosage_form text,
  strength text,
  created_at timestamptz not null default now()
);

create table if not exists public.patient_medications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  medication_id uuid not null references public.medications(id),
  dosage text not null,
  frequency text not null,
  start_date date,
  next_refill_date date,
  remaining_quantity text,
  status medication_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medication_adherence_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  patient_medication_id uuid references public.patient_medications(id) on delete set null,
  event_time timestamptz not null default now(),
  status adherence_status not null,
  reward_points integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  model_version text not null,
  input_snapshot jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now()
);

create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.ai_analyses(id) on delete cascade,
  medication_id uuid references public.medications(id) on delete set null,
  recommendation_text text not null,
  confidence numeric(5,2),
  estimated_monthly_cost numeric(12,2),
  estimated_savings numeric(12,2),
  status recommendation_status not null default 'generated',
  created_at timestamptz not null default now()
);

create table if not exists public.smart_contracts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  recommendation_id uuid references public.ai_recommendations(id) on delete set null,
  contract_ref text not null unique,
  status contract_status not null default 'pending',
  locked_price numeric(12,2),
  quantity text,
  blockchain text,
  tx_hash text,
  start_date date,
  end_date date,
  auto_renew boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  medication_reminders boolean not null default true,
  refill_alerts boolean not null default true,
  adherence_reports boolean not null default true,
  price_drop_alerts boolean not null default false,
  ai_updates boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  network text not null default 'xrp_ledger',
  wallet_address text not null,
  is_connected boolean not null default true,
  created_at timestamptz not null default now(),
  unique(profile_id, network, wallet_address)
);

-- Compatibility migration for older schema revisions that used user_id.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'patient_conditions' and column_name = 'user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'patient_conditions' and column_name = 'profile_id'
  ) then
    alter table public.patient_conditions rename column user_id to profile_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'patient_allergies' and column_name = 'user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'patient_allergies' and column_name = 'profile_id'
  ) then
    alter table public.patient_allergies rename column user_id to profile_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'patient_medications' and column_name = 'user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'patient_medications' and column_name = 'profile_id'
  ) then
    alter table public.patient_medications rename column user_id to profile_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'medication_adherence_events' and column_name = 'user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'medication_adherence_events' and column_name = 'profile_id'
  ) then
    alter table public.medication_adherence_events rename column user_id to profile_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'ai_analyses' and column_name = 'user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'ai_analyses' and column_name = 'profile_id'
  ) then
    alter table public.ai_analyses rename column user_id to profile_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'smart_contracts' and column_name = 'user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'smart_contracts' and column_name = 'profile_id'
  ) then
    alter table public.smart_contracts rename column user_id to profile_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notification_preferences' and column_name = 'user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notification_preferences' and column_name = 'profile_id'
  ) then
    alter table public.notification_preferences rename column user_id to profile_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wallets' and column_name = 'user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wallets' and column_name = 'profile_id'
  ) then
    alter table public.wallets rename column user_id to profile_id;
  end if;

  -- Older revisions used created_at instead of generated_at on ai_analyses.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'ai_analyses' and column_name = 'created_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'ai_analyses' and column_name = 'generated_at'
  ) then
    alter table public.ai_analyses add column generated_at timestamptz;
    execute 'update public.ai_analyses set generated_at = created_at where generated_at is null';
    alter table public.ai_analyses alter column generated_at set default now();
    alter table public.ai_analyses alter column generated_at set not null;
  end if;

  -- Older revisions used occurred_at instead of event_time on medication_adherence_events.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'medication_adherence_events' and column_name = 'occurred_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'medication_adherence_events' and column_name = 'event_time'
  ) then
    alter table public.medication_adherence_events add column event_time timestamptz;
    execute 'update public.medication_adherence_events set event_time = occurred_at where event_time is null';
    alter table public.medication_adherence_events alter column event_time set default now();
    alter table public.medication_adherence_events alter column event_time set not null;
  end if;
end $$;

drop index if exists public.idx_patient_medications_profile_id;
drop index if exists public.idx_patient_conditions_profile_id;
drop index if exists public.idx_patient_allergies_profile_id;
drop index if exists public.idx_adherence_profile_id_event_time;
drop index if exists public.idx_ai_analyses_profile_id_generated_at;
drop index if exists public.idx_smart_contracts_profile_id;
create index if not exists idx_patient_medications_profile_id on public.patient_medications(profile_id);
create index if not exists idx_patient_conditions_profile_id on public.patient_conditions(profile_id);
create index if not exists idx_patient_allergies_profile_id on public.patient_allergies(profile_id);
create index if not exists idx_adherence_profile_id_event_time on public.medication_adherence_events(profile_id, event_time desc);
create index if not exists idx_ai_analyses_profile_id_generated_at on public.ai_analyses(profile_id, generated_at desc);
create index if not exists idx_smart_contracts_profile_id on public.smart_contracts(profile_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_patient_medications_updated_at on public.patient_medications;
create trigger trg_patient_medications_updated_at
before update on public.patient_medications
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New User')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name;

  insert into public.notification_preferences (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.user_exists_by_email(email_input text)
returns boolean
language sql
security definer
set search_path = auth, public
as $$
  select exists(
    select 1
    from auth.users
    where lower(email) = lower(email_input)
  );
$$;

revoke all on function public.user_exists_by_email(text) from public;
grant execute on function public.user_exists_by_email(text) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.patient_conditions enable row level security;
alter table public.patient_allergies enable row level security;
alter table public.patient_medications enable row level security;
alter table public.medication_adherence_events enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.smart_contracts enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.wallets enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "patient_conditions_owner_only" on public.patient_conditions;
create policy "patient_conditions_owner_only" on public.patient_conditions
for all to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists "patient_allergies_owner_only" on public.patient_allergies;
create policy "patient_allergies_owner_only" on public.patient_allergies
for all to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists "patient_medications_owner_only" on public.patient_medications;
create policy "patient_medications_owner_only" on public.patient_medications
for all to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists "adherence_owner_only" on public.medication_adherence_events;
create policy "adherence_owner_only" on public.medication_adherence_events
for all to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists "ai_analyses_owner_only" on public.ai_analyses;
create policy "ai_analyses_owner_only" on public.ai_analyses
for all to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists "ai_recommendations_owner_only" on public.ai_recommendations;
create policy "ai_recommendations_owner_only" on public.ai_recommendations
for all to authenticated
using (
  exists (
    select 1 from public.ai_analyses a
    where a.id = analysis_id and a.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.ai_analyses a
    where a.id = analysis_id and a.profile_id = auth.uid()
  )
);

drop policy if exists "smart_contracts_owner_only" on public.smart_contracts;
create policy "smart_contracts_owner_only" on public.smart_contracts
for all to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists "notification_preferences_owner_only" on public.notification_preferences;
create policy "notification_preferences_owner_only" on public.notification_preferences
for all to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists "wallets_owner_only" on public.wallets;
create policy "wallets_owner_only" on public.wallets
for all to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

grant select on public.conditions to authenticated;
grant select on public.allergens to authenticated;
grant select on public.medications to authenticated;
