-- =============================================================================
-- PayPill core schema for Supabase (PostgreSQL)
-- Derived from: app/src/store/paypill-store.ts, AIQuestionnaire HealthProfile,
--               App.tsx dashboard (medications, refills, contracts, adherence, PPLL)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.medication_dose_status AS ENUM (
    'scheduled', 'due', 'taken', 'skipped', 'missed', 'upcoming'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.smart_contract_status AS ENUM (
    'draft', 'active', 'expired', 'cancelled', 'pending_renewal'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ppll_transaction_type AS ENUM (
    'adherence_reward',
    'bonus',
    'penalty',
    'adjustment',
    'redemption',
    'contract_event',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- profiles: 1:1 with auth.users (app session / PPLL / onboarding flags)
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  onboarding_completed_at TIMESTAMPTZ,
  ppll_balance NUMERIC(18, 4) NOT NULL DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_email ON public.profiles (email);

-- -----------------------------------------------------------------------------
-- patient_profile: demographics + vitals + lifestyle + coverage (HealthProfile)
-- -----------------------------------------------------------------------------
CREATE TABLE public.patient_profile (
  user_id UUID PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  gender TEXT,
  location TEXT,
  height_cm NUMERIC(6, 2),
  weight_kg NUMERIC(7, 2),
  bmi NUMERIC(5, 2),
  blood_pressure_systolic SMALLINT,
  blood_pressure_diastolic SMALLINT,
  heart_rate_bpm SMALLINT,
  exercise_level TEXT,
  alcohol_use TEXT,
  smoking_status TEXT,
  diet_notes TEXT,
  sleep_pattern TEXT,
  stress_level TEXT,
  primary_care_provider TEXT,
  insurance_name TEXT,
  insurance_plan_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- health_questionnaire_responses: full JSON snapshot per submission (AI / audit)
-- -----------------------------------------------------------------------------
CREATE TABLE public.health_questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  schema_version SMALLINT NOT NULL DEFAULT 1,
  payload JSONB NOT NULL,
  is_complete BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_hqr_user_submitted ON public.health_questionnaire_responses (user_id, submitted_at DESC);

-- -----------------------------------------------------------------------------
-- medical_conditions (body systems + condition rows from questionnaire)
-- -----------------------------------------------------------------------------
CREATE TABLE public.medical_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  questionnaire_response_id UUID REFERENCES public.health_questionnaire_responses (id) ON DELETE SET NULL,
  body_system_id TEXT NOT NULL,
  condition_name TEXT NOT NULL,
  diagnosed_date DATE,
  treatment TEXT,
  controlled_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_medical_conditions_user ON public.medical_conditions (user_id);

-- -----------------------------------------------------------------------------
-- user_medications: current meds (questionnaire + dashboard “My medications”)
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  questionnaire_response_id UUID REFERENCES public.health_questionnaire_responses (id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  start_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_medications_user_active ON public.user_medications (user_id) WHERE is_active = true;

-- -----------------------------------------------------------------------------
-- user_allergies
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  questionnaire_response_id UUID REFERENCES public.health_questionnaire_responses (id) ON DELETE SET NULL,
  allergen TEXT NOT NULL,
  severity TEXT,
  reaction TEXT,
  allergen_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_allergies_user ON public.user_allergies (user_id);

-- -----------------------------------------------------------------------------
-- medication_doses: scheduled / today’s doses (dashboard adherence)
-- -----------------------------------------------------------------------------
CREATE TABLE public.medication_doses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  user_medication_id UUID NOT NULL REFERENCES public.user_medications (id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  display_time_label TEXT,
  status public.medication_dose_status NOT NULL DEFAULT 'scheduled',
  taken_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_medication_doses_user_day ON public.medication_doses (user_id, scheduled_for);

-- -----------------------------------------------------------------------------
-- refills / locked pricing (Upcoming Refills UI)
-- -----------------------------------------------------------------------------
CREATE TABLE public.medication_refills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  user_medication_id UUID REFERENCES public.user_medications (id) ON DELETE SET NULL,
  medication_name TEXT NOT NULL,
  next_refill_on DATE NOT NULL,
  days_until_refill SMALLINT,
  quantity_description TEXT,
  locked_price_cents INTEGER,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_medication_refills_user_date ON public.medication_refills (user_id, next_refill_on);

-- -----------------------------------------------------------------------------
-- smart_contracts (XRP Ledger demo → persisted fields)
-- -----------------------------------------------------------------------------
CREATE TABLE public.smart_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  user_medication_id UUID REFERENCES public.user_medications (id) ON DELETE SET NULL,
  external_contract_ref TEXT,
  medication_label TEXT NOT NULL,
  status public.smart_contract_status NOT NULL DEFAULT 'draft',
  blockchain_network TEXT NOT NULL DEFAULT 'XRP Ledger',
  tx_hash TEXT,
  locked_price_cents INTEGER,
  quantity_description TEXT,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_smart_contracts_user_status ON public.smart_contracts (user_id, status);

-- -----------------------------------------------------------------------------
-- PPLL ledger (immutable-style log; profiles.ppll_balance is cache / denorm)
-- -----------------------------------------------------------------------------
CREATE TABLE public.ppll_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  amount NUMERIC(18, 4) NOT NULL,
  balance_after NUMERIC(18, 4) NOT NULL,
  tx_type public.ppll_transaction_type NOT NULL DEFAULT 'other',
  reference_table TEXT,
  reference_id UUID,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ppll_tx_user_created ON public.ppll_transactions (user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- Activity / audit stream (Recent Activity UI)
-- -----------------------------------------------------------------------------
CREATE TABLE public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  reward_label TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_activity_events_user ON public.activity_events (user_id, occurred_at DESC);

-- -----------------------------------------------------------------------------
-- Notification preferences (Settings toggles in App.tsx)
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  medication_reminders BOOLEAN NOT NULL DEFAULT true,
  refill_alerts BOOLEAN NOT NULL DEFAULT true,
  appointment_reminders BOOLEAN NOT NULL DEFAULT true,
  price_drop_alerts BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Optional: linked wallets (onboarding XRP copy)
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  wallet_type TEXT NOT NULL,
  public_address TEXT NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, wallet_type)
);

CREATE INDEX idx_user_wallets_user ON public.user_wallets (user_id);

-- -----------------------------------------------------------------------------
-- updated_at trigger helper
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_patient_profile_updated
  BEFORE UPDATE ON public.patient_profile
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_user_medications_updated
  BEFORE UPDATE ON public.user_medications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_medication_doses_updated
  BEFORE UPDATE ON public.medication_doses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_medication_refills_updated
  BEFORE UPDATE ON public.medication_refills
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_smart_contracts_updated
  BEFORE UPDATE ON public.smart_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_user_notification_preferences_updated
  BEFORE UPDATE ON public.user_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- New auth user → profile row (Supabase Auth)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
  );
  INSERT INTO public.user_notification_preferences (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_doses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_refills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppll_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- patient_profile
CREATE POLICY patient_profile_all_own ON public.patient_profile FOR ALL USING (auth.uid() = user_id);

-- questionnaire
CREATE POLICY hqr_all_own ON public.health_questionnaire_responses FOR ALL USING (auth.uid() = user_id);

-- medical_conditions
CREATE POLICY medical_conditions_all_own ON public.medical_conditions FOR ALL USING (auth.uid() = user_id);

-- user_medications
CREATE POLICY user_medications_all_own ON public.user_medications FOR ALL USING (auth.uid() = user_id);

-- user_allergies
CREATE POLICY user_allergies_all_own ON public.user_allergies FOR ALL USING (auth.uid() = user_id);

-- medication_doses
CREATE POLICY medication_doses_all_own ON public.medication_doses FOR ALL USING (auth.uid() = user_id);

-- medication_refills
CREATE POLICY medication_refills_all_own ON public.medication_refills FOR ALL USING (auth.uid() = user_id);

-- smart_contracts
CREATE POLICY smart_contracts_all_own ON public.smart_contracts FOR ALL USING (auth.uid() = user_id);

-- ppll_transactions (typically insert via service role; users read own)
CREATE POLICY ppll_tx_select_own ON public.ppll_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY ppll_tx_insert_own ON public.ppll_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- activity_events
CREATE POLICY activity_events_select_own ON public.activity_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY activity_events_insert_own ON public.activity_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- notification preferences
CREATE POLICY unp_all_own ON public.user_notification_preferences FOR ALL USING (auth.uid() = user_id);

-- wallets
CREATE POLICY user_wallets_all_own ON public.user_wallets FOR ALL USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Comments (documentation in DB)
-- -----------------------------------------------------------------------------
COMMENT ON TABLE public.profiles IS 'App user profile; mirrors paypill-store user + PPLL balance.';
COMMENT ON TABLE public.patient_profile IS 'Normalized HealthProfile from AIQuestionnaire.';
COMMENT ON TABLE public.health_questionnaire_responses IS 'Full JSON payload per questionnaire run for AI/audit.';
COMMENT ON TABLE public.user_medications IS 'Medications the user takes; ties to dashboard and questionnaire.';
COMMENT ON TABLE public.medication_doses IS 'Scheduled dose instances for adherence tracking.';
COMMENT ON TABLE public.smart_contracts IS 'Locked-price medication agreements (e.g. XRP Ledger).';
COMMENT ON TABLE public.ppll_transactions IS 'Append-only style rewards ledger; amount positive or negative.';

-- -----------------------------------------------------------------------------
-- API access (PostgREST / Supabase client)
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
