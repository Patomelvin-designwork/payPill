-- =============================================================================
-- PayPill PRD alignment migration
-- Adds columns required by the PayPill PRD v1.0 (April 2026):
--   * Epic 1 Story 1.1 — HIPAA consent + ToS acknowledgment timestamps
--   * Epic 1 Story 1.2 — Insurance member ID + group number
--   * Epic 3 Story 3.2 — Foundation support screening (income, household)
-- Safe to re-run (uses IF NOT EXISTS).
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hipaa_consent_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

ALTER TABLE public.patient_profile
  ADD COLUMN IF NOT EXISTS insurance_member_id           TEXT,
  ADD COLUMN IF NOT EXISTS insurance_group_number        TEXT,
  ADD COLUMN IF NOT EXISTS annual_income_usd             INTEGER
    CHECK (annual_income_usd IS NULL OR annual_income_usd >= 0),
  ADD COLUMN IF NOT EXISTS household_size                SMALLINT
    CHECK (household_size IS NULL OR household_size BETWEEN 1 AND 20),
  ADD COLUMN IF NOT EXISTS foundation_support_requested  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS foundation_support_requested_at TIMESTAMPTZ;

-- Documentation (shows up in the Supabase Studio UI)
COMMENT ON COLUMN public.profiles.hipaa_consent_at  IS 'Timestamp when the user accepted the HIPAA Notice of Privacy Practices (PRD F-001).';
COMMENT ON COLUMN public.profiles.terms_accepted_at IS 'Timestamp when the user accepted the Terms of Service (PRD F-001).';

COMMENT ON COLUMN public.patient_profile.insurance_member_id    IS 'Insurance member ID captured during Epic 1 Story 1.2.';
COMMENT ON COLUMN public.patient_profile.insurance_group_number IS 'Insurance group number captured during Epic 1 Story 1.2.';
COMMENT ON COLUMN public.patient_profile.annual_income_usd      IS 'Self-reported annual household income for Epic 3 Story 3.2 FPL calculation.';
COMMENT ON COLUMN public.patient_profile.household_size         IS 'Household size used alongside annual_income_usd for FPL screening.';
COMMENT ON COLUMN public.patient_profile.foundation_support_requested    IS 'True if patient opted into PayPill Foundation support screening.';
COMMENT ON COLUMN public.patient_profile.foundation_support_requested_at IS 'When the patient requested Foundation support screening.';
