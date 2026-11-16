-- Additional prerequisite objects for scratch replay of the
-- Brief 4 migration (20261115120000_pre_assessment_brief4_trust_loop)
-- in tests. Loaded AFTER referral-migration-stubs.sql (which
-- provides auth, app_role/has_role, quote_requests,
-- referral_packages, service_providers).
--
-- The diagnostic_accuracy table, its enums, and its validation
-- trigger below are copied VERBATIM from migration
-- 20260404143649_62b6cc9c-6c99-4eff-bd21-166c758809b2.sql (the
-- only migration that defines them), so the Brief 4 migration
-- replays against the real pre-Brief-4 shape. diagnostic_sessions
-- and outcome_reports are id-only FK targets.

create type public.confidence_level as enum ('low', 'medium', 'high');
create type public.urgency_level as enum ('monitor', 'schedule', 'soon', 'immediate');

create table public.diagnostic_sessions (
  id uuid primary key default gen_random_uuid()
);

create table public.outcome_reports (
  id uuid primary key default gen_random_uuid()
);

create table public.diagnostic_accuracy (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id              uuid UNIQUE REFERENCES public.diagnostic_sessions(id) ON DELETE CASCADE,
  outcome_report_id       uuid REFERENCES public.outcome_reports(id) ON DELETE CASCADE,
  predicted_top_cause     text NOT NULL,
  predicted_causes_all    text[] NOT NULL,
  predicted_confidence    confidence_level NOT NULL,
  predicted_urgency       urgency_level NOT NULL,
  actual_diagnosis        text,
  accuracy_score          numeric(4,3),
  match_label             text,
  match_explanation       text,
  confidence_was_correct  boolean,
  vehicle_make            text,
  vehicle_model           text,
  symptom_category        text,
  computed_at             timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_diagnostic_accuracy()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.accuracy_score IS NOT NULL AND (NEW.accuracy_score < 0 OR NEW.accuracy_score > 1) THEN
    RAISE EXCEPTION 'Accuracy score must be between 0 and 1';
  END IF;
  IF NEW.match_label IS NOT NULL AND NEW.match_label NOT IN ('exact', 'close', 'partial', 'miss', 'unverified') THEN
    RAISE EXCEPTION 'Invalid match_label value';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_diagnostic_accuracy
  BEFORE INSERT OR UPDATE ON public.diagnostic_accuracy
  FOR EACH ROW EXECUTE FUNCTION public.validate_diagnostic_accuracy();
