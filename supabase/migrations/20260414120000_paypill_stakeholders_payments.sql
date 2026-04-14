-- =============================================================================
-- PayPill: roles (patient / doctor / pharmacy), care links, prescriptions,
--          payments — extends 20260413190000_paypill_core_schema.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('patient', 'doctor', 'pharmacy_staff', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.care_relationship_status AS ENUM ('pending', 'active', 'ended', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.prescription_status AS ENUM ('draft', 'active', 'on_hold', 'expired', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'requires_payment_method',
    'processing',
    'succeeded',
    'failed',
    'refunded',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_provider AS ENUM ('stripe', 'xrp_ledger', 'ppll_internal', 'manual', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- profile_roles: every auth user is at least patient; staff roles added by ops
-- -----------------------------------------------------------------------------
CREATE TABLE public.profile_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  UNIQUE (profile_id, role)
);

CREATE INDEX idx_profile_roles_profile ON public.profile_roles (profile_id);
CREATE INDEX idx_profile_roles_role ON public.profile_roles (role);

-- -----------------------------------------------------------------------------
-- doctor_profiles: one row per doctor account (links to auth profile)
-- -----------------------------------------------------------------------------
CREATE TABLE public.doctor_profiles (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  npi TEXT,
  medical_license_number TEXT,
  medical_license_state TEXT,
  specialty TEXT,
  practice_name TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- pharmacy_organizations + staff
-- -----------------------------------------------------------------------------
CREATE TABLE public.pharmacy_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name TEXT NOT NULL,
  doing_business_as TEXT,
  npi TEXT,
  dea_number TEXT,
  phone TEXT,
  email TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  region TEXT,
  postal_code TEXT,
  country CHAR(2) NOT NULL DEFAULT 'US',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.pharmacy_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacy_organizations (id) ON DELETE CASCADE,
  staff_profile_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  job_title TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pharmacy_id, staff_profile_id)
);

CREATE INDEX idx_pharmacy_staff_pharmacy ON public.pharmacy_staff (pharmacy_id);
CREATE INDEX idx_pharmacy_staff_profile ON public.pharmacy_staff (staff_profile_id);

-- -----------------------------------------------------------------------------
-- care_relationships: doctor ↔ patient (beyond free-text primary care in questionnaire)
-- -----------------------------------------------------------------------------
CREATE TABLE public.care_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_profile_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  doctor_profile_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status public.care_relationship_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT care_relationships_distinct CHECK (patient_profile_id <> doctor_profile_id)
);

CREATE INDEX idx_care_rel_patient ON public.care_relationships (patient_profile_id);
CREATE INDEX idx_care_rel_doctor ON public.care_relationships (doctor_profile_id);

-- -----------------------------------------------------------------------------
-- prescriptions: formal Rx (prescriber + patient + optional pharmacy)
-- -----------------------------------------------------------------------------
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_profile_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  prescriber_profile_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  pharmacy_id UUID REFERENCES public.pharmacy_organizations (id) ON DELETE SET NULL,
  medication_name TEXT NOT NULL,
  strength TEXT,
  dosage_form TEXT,
  sig TEXT,
  quantity_dispensed INTEGER,
  refills_authorized SMALLINT NOT NULL DEFAULT 0,
  refills_remaining SMALLINT NOT NULL DEFAULT 0,
  written_on DATE NOT NULL DEFAULT (CURRENT_DATE),
  expires_on DATE,
  status public.prescription_status NOT NULL DEFAULT 'active',
  external_rx_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT prescriptions_distinct CHECK (patient_profile_id <> prescriber_profile_id)
);

CREATE INDEX idx_prescriptions_patient ON public.prescriptions (patient_profile_id);
CREATE INDEX idx_prescriptions_prescriber ON public.prescriptions (prescriber_profile_id);
CREATE INDEX idx_prescriptions_pharmacy ON public.prescriptions (pharmacy_id);

-- -----------------------------------------------------------------------------
-- prescription_fills: pharmacy fulfillment events
-- -----------------------------------------------------------------------------
CREATE TABLE public.prescription_fills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions (id) ON DELETE CASCADE,
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacy_organizations (id) ON DELETE RESTRICT,
  filled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  quantity INTEGER NOT NULL,
  pharmacist_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prescription_fills_rx ON public.prescription_fills (prescription_id);

-- -----------------------------------------------------------------------------
-- payment_transactions: card / ledger / internal credits toward meds
-- -----------------------------------------------------------------------------
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_profile_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  amount_cents BIGINT NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  status public.payment_status NOT NULL DEFAULT 'processing',
  provider public.payment_provider NOT NULL DEFAULT 'other',
  external_reference TEXT,
  description TEXT,
  prescription_id UUID REFERENCES public.prescriptions (id) ON DELETE SET NULL,
  smart_contract_id UUID REFERENCES public.smart_contracts (id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payment_transactions_amount_nonzero CHECK (amount_cents <> 0)
);

CREATE INDEX idx_payment_tx_payer ON public.payment_transactions (payer_profile_id);
CREATE INDEX idx_payment_tx_status ON public.payment_transactions (status);
CREATE INDEX idx_payment_tx_prescription ON public.payment_transactions (prescription_id);

-- -----------------------------------------------------------------------------
-- updated_at triggers (reuse public.set_updated_at)
-- -----------------------------------------------------------------------------
CREATE TRIGGER tr_doctor_profiles_updated
  BEFORE UPDATE ON public.doctor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_pharmacy_organizations_updated
  BEFORE UPDATE ON public.pharmacy_organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_care_relationships_updated
  BEFORE UPDATE ON public.care_relationships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_prescriptions_updated
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_payment_transactions_updated
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Signup: default patient role (trigger body replaced)
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
  INSERT INTO public.profile_roles (profile_id, role) VALUES (NEW.id, 'patient');
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.profile_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_fills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- profile_roles: read own; mutations only via service_role / SECURITY DEFINER (signup bypasses RLS)
CREATE POLICY profile_roles_select_own ON public.profile_roles FOR SELECT USING (auth.uid() = profile_id);

-- doctor_profiles
CREATE POLICY doctor_profiles_select_own ON public.doctor_profiles FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY doctor_profiles_insert_own ON public.doctor_profiles FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY doctor_profiles_update_own ON public.doctor_profiles FOR UPDATE USING (auth.uid() = profile_id);

-- pharmacy org: visible to linked staff
CREATE POLICY pharmacy_org_select_staff ON public.pharmacy_organizations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.pharmacy_staff s
    WHERE s.pharmacy_id = pharmacy_organizations.id
      AND s.staff_profile_id = auth.uid()
      AND s.active = true
  )
);

CREATE POLICY pharmacy_org_update_admin ON public.pharmacy_organizations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.pharmacy_staff s
    WHERE s.pharmacy_id = pharmacy_organizations.id
      AND s.staff_profile_id = auth.uid()
      AND s.is_admin = true
      AND s.active = true
  )
);

-- pharmacy_staff: own row + coworkers at same pharmacy
CREATE POLICY pharmacy_staff_select_own ON public.pharmacy_staff FOR SELECT USING (auth.uid() = staff_profile_id);
CREATE POLICY pharmacy_staff_select_coworkers ON public.pharmacy_staff FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.pharmacy_staff me
    WHERE me.pharmacy_id = pharmacy_staff.pharmacy_id
      AND me.staff_profile_id = auth.uid()
      AND me.active = true
  )
);
CREATE POLICY pharmacy_staff_admin_manage ON public.pharmacy_staff FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.pharmacy_staff s2
    WHERE s2.pharmacy_id = pharmacy_staff.pharmacy_id
      AND s2.staff_profile_id = auth.uid()
      AND s2.is_admin = true
      AND s2.active = true
  )
);

-- care_relationships: patient or doctor on the row
CREATE POLICY care_rel_select_parties ON public.care_relationships FOR SELECT USING (
  auth.uid() = patient_profile_id OR auth.uid() = doctor_profile_id
);
CREATE POLICY care_rel_insert_doctor ON public.care_relationships FOR INSERT WITH CHECK (auth.uid() = doctor_profile_id);
CREATE POLICY care_rel_insert_patient ON public.care_relationships FOR INSERT WITH CHECK (auth.uid() = patient_profile_id);
CREATE POLICY care_rel_update_parties ON public.care_relationships FOR UPDATE USING (
  auth.uid() = patient_profile_id OR auth.uid() = doctor_profile_id
);

-- prescriptions: patient, prescriber, or staff at assigned pharmacy
CREATE POLICY rx_select_parties ON public.prescriptions FOR SELECT USING (
  auth.uid() = patient_profile_id
  OR auth.uid() = prescriber_profile_id
  OR (
    pharmacy_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.pharmacy_staff s
      WHERE s.pharmacy_id = prescriptions.pharmacy_id
        AND s.staff_profile_id = auth.uid()
        AND s.active = true
    )
  )
);
CREATE POLICY rx_insert_prescriber ON public.prescriptions FOR INSERT WITH CHECK (auth.uid() = prescriber_profile_id);
CREATE POLICY rx_update_parties ON public.prescriptions FOR UPDATE USING (
  auth.uid() = patient_profile_id
  OR auth.uid() = prescriber_profile_id
  OR (
    pharmacy_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.pharmacy_staff s
      WHERE s.pharmacy_id = prescriptions.pharmacy_id
        AND s.staff_profile_id = auth.uid()
        AND s.is_admin = true
        AND s.active = true
    )
  )
);

-- fills: pharmacy staff at that pharmacy
CREATE POLICY fills_select_related ON public.prescription_fills FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.pharmacy_staff s
    WHERE s.pharmacy_id = prescription_fills.pharmacy_id
      AND s.staff_profile_id = auth.uid()
      AND s.active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.prescriptions rx
    WHERE rx.id = prescription_fills.prescription_id
      AND (rx.patient_profile_id = auth.uid() OR rx.prescriber_profile_id = auth.uid())
  )
);
CREATE POLICY fills_insert_staff ON public.prescription_fills FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pharmacy_staff s
    WHERE s.pharmacy_id = prescription_fills.pharmacy_id
      AND s.staff_profile_id = auth.uid()
      AND s.active = true
  )
);

-- payments: payer sees own; optional link to prescription visible to parties already covered by rx policy if we join in app
CREATE POLICY payment_tx_select_payer ON public.payment_transactions FOR SELECT USING (auth.uid() = payer_profile_id);
CREATE POLICY payment_tx_insert_payer ON public.payment_transactions FOR INSERT WITH CHECK (auth.uid() = payer_profile_id);
CREATE POLICY payment_tx_update_payer ON public.payment_transactions FOR UPDATE USING (auth.uid() = payer_profile_id);

-- -----------------------------------------------------------------------------
-- Comments
-- -----------------------------------------------------------------------------
COMMENT ON TABLE public.profile_roles IS 'Account roles: default patient on signup; doctor/pharmacy_staff granted by admins.';
COMMENT ON TABLE public.doctor_profiles IS 'Credential block for prescribers; 1:1 with profiles that act as doctors.';
COMMENT ON TABLE public.pharmacy_organizations IS 'Pharmacy / fulfillment org; staff linked via pharmacy_staff.';
COMMENT ON TABLE public.prescriptions IS 'Formal prescriptions; payments may reference prescription_id.';
COMMENT ON TABLE public.payment_transactions IS 'Payments for medications, contracts, or other checkout; integrate Stripe/XRP in app layer.';

-- -----------------------------------------------------------------------------
-- Grants (new tables)
-- -----------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pharmacy_organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pharmacy_staff TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_relationships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescription_fills TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_transactions TO authenticated;

GRANT ALL ON public.profile_roles TO service_role;
GRANT ALL ON public.doctor_profiles TO service_role;
GRANT ALL ON public.pharmacy_organizations TO service_role;
GRANT ALL ON public.pharmacy_staff TO service_role;
GRANT ALL ON public.care_relationships TO service_role;
GRANT ALL ON public.prescriptions TO service_role;
GRANT ALL ON public.prescription_fills TO service_role;
GRANT ALL ON public.payment_transactions TO service_role;

-- -----------------------------------------------------------------------------
-- Backfill: existing profiles (created before this migration) get patient role
-- -----------------------------------------------------------------------------
INSERT INTO public.profile_roles (profile_id, role)
SELECT p.id, 'patient'::public.app_role
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.profile_roles pr WHERE pr.profile_id = p.id AND pr.role = 'patient'
);
