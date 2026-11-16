-- =============================================================
-- Pre-assessment Brief 4 — the trust loop (2026-11-15)
--
-- Two data changes, nothing else:
--
--  1. public.referral_packages gains a nullable session_id, the
--     diagnostic_sessions row the package's snapshot came from.
--     It is written at package creation from the session id
--     already in scope where the package is built (the wizard's
--     RecommendationStep; the Garage path resolves it from the
--     assessment_handoffs record behind the snapshot). It stays
--     NULL when the origin session cannot be resolved — the
--     grader then falls back to the package's own
--     diagnosis_details snapshot. ON DELETE SET NULL: a package
--     is a share artifact and must survive its session.
--
--  2. public.diagnostic_accuracy gains a source dimension so a
--     grade from a shop's referral outcome is never pooled with
--     a consumer self-report grade:
--       source text NOT NULL DEFAULT 'consumer_self_report',
--       CHECK (source IN ('consumer_self_report','shop_referral')).
--     Existing rows take the default, which is what they all are.
--     The old single-column UNIQUE on session_id (created inline
--     in 20260404143649) is dropped and replaced with
--     UNIQUE (session_id, source), so one session can hold one
--     grade per source: a self-report grade and a shop grade for
--     the same session coexist.
--     Note: Postgres treats NULL session_id values as distinct
--     under a plain UNIQUE, so snapshot-graded rows (session_id
--     NULL) are deduplicated by the grader itself (it stamps the
--     referral id into the grade's match_explanation marker and
--     checks for it before inserting).
--
-- Trigger review (required by the brief): the
-- validate_diagnostic_accuracy trigger (20260404143649, never
-- replaced since) checks only that accuracy_score stays within
-- 0..1 and that match_label stays in
-- ('exact','close','partial','miss','unverified'). It never
-- references the source, and shop grades use the same score
-- range and label vocabulary as self-report grades, so its
-- rules do not reject the new source's shape. NO adjustment.
-- =============================================================

-- -------------------------------------------------------------
-- 1. referral_packages.session_id
-- -------------------------------------------------------------
ALTER TABLE public.referral_packages
  ADD COLUMN IF NOT EXISTS session_id uuid NULL
    REFERENCES public.diagnostic_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS referral_packages_session_id_idx
  ON public.referral_packages (session_id);

COMMENT ON COLUMN public.referral_packages.session_id IS
  'Brief 4 (2026-11-15): the diagnostic_sessions row this package was created from. Written at package creation; NULL when the origin session cannot be resolved (grader falls back to the diagnosis_details snapshot).';

-- -------------------------------------------------------------
-- 2. diagnostic_accuracy.source + uniqueness move
-- -------------------------------------------------------------
ALTER TABLE public.diagnostic_accuracy
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'consumer_self_report';

ALTER TABLE public.diagnostic_accuracy
  DROP CONSTRAINT IF EXISTS diagnostic_accuracy_source_check;
ALTER TABLE public.diagnostic_accuracy
  ADD CONSTRAINT diagnostic_accuracy_source_check
  CHECK (source IN ('consumer_self_report', 'shop_referral'));

COMMENT ON COLUMN public.diagnostic_accuracy.source IS
  'Brief 4 (2026-11-15): which outcome produced this grade. consumer_self_report = the owner reported the outcome (report-diagnostic-outcome); shop_referral = a shop''s referral outcome graded at the owner-confirmation counting moment (grade-referral-outcome). The two sources are never pooled in any readout.';

-- Drop the old single-column UNIQUE on session_id, however it is
-- named (inline creation in 20260404143649 auto-named it
-- diagnostic_accuracy_session_id_key; the catalog lookup below
-- catches any unique constraint on exactly {session_id}).
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'diagnostic_accuracy'
      AND con.contype = 'u'
      AND (SELECT array_agg(att.attname::text ORDER BY att.attname::text)
           FROM pg_attribute att
           WHERE att.attrelid = con.conrelid
             AND att.attnum = ANY (con.conkey)) = ARRAY['session_id']
  LOOP
    EXECUTE format(
      'ALTER TABLE public.diagnostic_accuracy DROP CONSTRAINT %I',
      c.conname
    );
  END LOOP;
END;
$$;

ALTER TABLE public.diagnostic_accuracy
  DROP CONSTRAINT IF EXISTS diagnostic_accuracy_session_source_key;
ALTER TABLE public.diagnostic_accuracy
  ADD CONSTRAINT diagnostic_accuracy_session_source_key
  UNIQUE (session_id, source);
