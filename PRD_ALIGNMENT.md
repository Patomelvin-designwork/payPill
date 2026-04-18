# PayPill — PRD Alignment Roadmap

Companion to `PayPill_PRD.docx` (v1.0, April 2026). This file maps every PRD
requirement to the current repo, tracks status, and lists the next concrete
engineering steps. Keep it updated as features ship.

Legend: ✅ done · 🟡 partial / stubbed · ⬜ not started

---

## 1. Executive snapshot

| Area | Status | Notes |
| --- | --- | --- |
| Patient-facing web app (Vite + React + TS) | ✅ | `app/` — deployed at `pay-pill-eight.vercel.app` |
| Supabase backend (auth + Postgres) | ✅ | Project `ksxnyzpggezofxziysly`; core schema in `supabase/migrations/` |
| AI/ML recommendation engine | 🟡 | UI questionnaire (`AIQuestionnaire.tsx`) exists; no model service yet |
| XRP Ledger smart contracts | ⬜ | DB table `smart_contracts` only; no on-chain integration |
| Provider portal | ⬜ | PRD Persona 4/5 — not built |
| React Native mobile app | ⬜ | Web-only today |
| Foundation support program | ⬜ | No screener / eligibility logic |
| HIPAA / SOC 2 compliance artifacts | ⬜ | Auth exists; formal audit + BAAs pending |

---

## 2. Epic-level status

### Epic 1 — Patient Onboarding (PRD §Epics)

| Story | Acceptance criteria (PRD) | Status | Where |
| --- | --- | --- | --- |
| 1.1 Account Creation | Email / phone / SSO, verify <2 min, 8+ char password, HIPAA + ToS consent, <3 min total | 🟡 | `SignUpPage` in `app/src/App.tsx` — email + password + OTP verification done; **HIPAA/ToS checkbox added this PR**; SSO (Google/Apple) + phone OTP pending |
| 1.2 Insurance Verification | Carrier, member ID, group number, real-time eligibility, Medicare/Medicaid/commercial | 🟡 | **Coverage tab added to `SettingsPage` this PR** (captures fields + persists to `patient_profile`). Real-time eligibility API integration pending |
| 1.3 Health Profile Completion | ICD-10 search, meds, allergies, preferences, doc upload, progress indicator | 🟡 | `AIQuestionnaire.tsx` covers conditions/meds/allergies/preferences. ICD-10 code search + PDF/image upload pending |

### Epic 2 — AI Treatment Recommendations

| Story | Status | Notes |
| --- | --- | --- |
| 2.1 AI Analysis Execution | ⬜ | Page shell `AIAnalysisPage` exists; needs Edge Function invoking Python/TF service, comorbidity-driven ranking, ADA 2026 citations, interaction warnings |
| 2.2 Recommendation Explanation | ⬜ | Needs plain-language rationale, visual benefit display, side-effect summary |

Next steps:
1. Stand up a Supabase Edge Function `generate-recommendations` that calls the model backend (or an LLM proxy for v0).
2. Persist results to a new `ai_recommendations` table (ranked list with probability, ICD-10, rationale).
3. Render the ranked list with comorbidity chips and guideline links in `AIAnalysisPage`.

### Epic 3 — Pricing & Quotes

| Story | Status | Notes |
| --- | --- | --- |
| 3.1 Fixed-Cost Quote Generation | 🟡 | `SmartContractsPage` lists contracts; **no quote composition screen**. Needs NADAC lookup, breakdown (drug / dispensing / delivery), 30-day price-lock, retail comparison |
| 3.2 Foundation Support Eligibility | 🟡 | **Screener added to Settings → Coverage this PR** (income + household → FPL %). Needs auto-routing to $0 out-of-pocket path + application workflow |

Next steps:
1. New `quotes` table (`user_id`, `medication`, `drug_cost_cents`, `dispensing_fee_cents`, `delivery_cost_cents`, `insurance_copay_cents`, `retail_price_cents`, `locked_until`, `nadac_source`).
2. New route `/dashboard/quotes` with breakdown card and "Accept & Sign Contract" CTA.
3. Edge Function `generate-quote` that reads NADAC CSV (CMS) + insurance + eligibility.

### Epic 4 — Smart Contract Execution

| Story | Status | Notes |
| --- | --- | --- |
| 4.1 Smart Contract Deployment | 🟡 | `smart_contracts` table exists; no XRPL deployment. Needs xrpl.js integration, wallet signing, tx hash persistence |
| 4.2 PPLL Token Rewards | 🟡 | `ppll_transactions` table + `profiles.ppll_balance` exist; **redemption value surfaced on dashboard this PR**. Needs daily adherence cron + A1C-bonus trigger + on-chain IOU issuance |

Next steps:
1. Add `xrpl` dependency; build a thin service that accepts a quote and deploys a Hook (or issues an IOU escrow in v0).
2. Edge Function `award-ppll` fired by adherence log inserts (reward: 1 PPLL/day; bonus: 100 PPLL per 0.5% A1C drop).
3. Wallet connect in `SettingsPage → Wallet` tab (currently placeholder).

---

## 3. Functional requirements traceability (PRD Acceptance Criteria)

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| F-001 | Patient Registration <3 min | P0 | 🟡 |
| F-002 | Insurance Verification, 95%+ US insurers | P0 | 🟡 |
| F-003 | AI Recommendations <30s, 92%+ accuracy | P0 | ⬜ |
| F-004 | Fixed-Cost Quotes, 30-day price lock | P0 | ⬜ |
| F-005 | Smart Contract Execution <5s | P0 | ⬜ |
| F-006 | Medication Delivery 3–5 business days, tracking | P0 | ⬜ |
| F-007 | Adherence Tracking, daily reminders | P0 | 🟡 |
| F-008 | PPLL Rewards <24h | P1 | 🟡 |
| F-009 | Provider Dashboard, <1s EHR load | P0 | ⬜ |
| F-010 | Prior Auth Automation, 80%+ plans | P1 | ⬜ |

## 4. Non-functional requirements

| ID | Target | Current |
| --- | --- | --- |
| NF-001 | 99.9% uptime | Vercel + Supabase SLAs — tracking needed |
| NF-002 | <200 ms p95 API | Not measured |
| NF-003 | <30 s AI inference | No AI service yet |
| NF-004 | 10 000+ concurrent users | Not load-tested |
| NF-005 | AES-256 at rest, TLS 1.3 | Supabase managed ✅ |
| NF-006 | HIPAA | Auth + RLS ✅; BAAs + audit pending |
| NF-007 | RPO <1h / RTO <4h | Supabase PITR required (Pro plan) |
| NF-008 | Mobile cold start <3s | RN app not built |

## 5. Data model gap analysis

Tables already aligned with PRD: `profiles`, `patient_profile`, `user_medications`,
`medication_doses`, `medication_refills`, `smart_contracts`, `ppll_transactions`,
`activity_events`, `user_wallets`, `user_notification_preferences`,
`health_questionnaire_responses`, `medical_conditions`, `user_allergies`,
stakeholder tables (doctors, pharmacies, prescriptions, payments).

Columns **added this PR** (see `supabase/migrations/20260418000000_paypill_prd_alignment.sql`):

- `profiles.hipaa_consent_at TIMESTAMPTZ`
- `profiles.terms_accepted_at TIMESTAMPTZ`
- `patient_profile.insurance_member_id TEXT`
- `patient_profile.insurance_group_number TEXT`
- `patient_profile.annual_income_usd INTEGER`
- `patient_profile.household_size SMALLINT`
- `patient_profile.foundation_support_requested BOOLEAN`

Tables still needed:

- `quotes` (Epic 3)
- `ai_recommendations` (Epic 2)
- `prior_authorizations` (F-010)
- `delivery_shipments` (F-006)
- `provider_accounts` / FHIR sync (Epic Provider)

## 6. Prioritized next 10 engineering tasks

1. Edge Function `generate-recommendations` + `ai_recommendations` table.
2. Route `/dashboard/quotes` + `quotes` table + NADAC CSV ingestion.
3. xrpl.js wallet connect in Settings → Wallet; persist address to `user_wallets`.
4. Cron for daily PPLL adherence reward + A1C-bonus trigger.
5. ICD-10 condition picker (replace 5 hardcoded chips in signup Step 3).
6. Medical-records upload to Supabase Storage (`records/{user_id}/…`) + OCR stub.
7. Real-time insurance eligibility adapter (Change Healthcare / Availity).
8. Prior-authorization form generator (F-010).
9. Provider portal MVP (auth + population dashboard).
10. React Native patient app scaffold (Expo) sharing the `@/lib/supabase` client.

## 7. Compliance checklist (PRD §Compliance & Security)

- ⬜ Sign Supabase BAA (Pro or Team plan)
- ⬜ Publish Privacy Policy + HIPAA Notice of Privacy Practices
- ⬜ Enable audit logging on all PHI tables
- ⬜ SOC 2 Type II roadmap + vendor questionnaire
- ⬜ FDA SaMD change-control policy for AI models
- ⬜ Penetration test (annual)

## 8. Success metrics (PRD §Success Metrics) — instrumentation plan

Each KPI requires an events pipeline (`posthog` or Supabase analytics):

- Cost Savings → compute `retail_price_cents - contract.locked_price_cents` per contract.
- Adherence (PDC) → derive from `medication_doses` (`taken / scheduled` over window).
- A1C reduction → new `lab_results` table with `a1c_percent`.
- Quote-to-purchase → `quotes.accepted_at / quotes.generated_at`.
- AI accuracy → offline evaluation against an endocrinologist panel dataset.

---

*Owner: engineering. Review monthly; gate Epic sign-off on the acceptance
criteria in the PRD, not this file.*
