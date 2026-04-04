
-- ============================================================
-- WRENCHLI — New Diagnostic Workflow Schema
-- 11 tables, 4 enums, indexes, triggers, RLS
-- ============================================================

-- Enums
CREATE TYPE session_status AS ENUM ('intake', 'diagnosing', 'complete', 'abandoned', 'outcome_reported');
CREATE TYPE severity_level AS ENUM ('minor', 'moderate', 'urgent', 'do_not_drive');
CREATE TYPE confidence_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE urgency_level AS ENUM ('monitor', 'schedule', 'soon', 'immediate');
CREATE TYPE diy_difficulty AS ENUM ('easy', 'moderate', 'professional_only');
CREATE TYPE problem_fixed_status AS ENUM ('yes', 'no', 'partial');

-- ============================================================
-- 1. VEHICLES
-- ============================================================
CREATE TABLE public.vehicles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid,
  make          text NOT NULL,
  model         text NOT NULL,
  year          integer NOT NULL,
  trim          text,
  mileage       integer,
  vin           text UNIQUE,
  nickname      text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Validation trigger instead of CHECK constraints
CREATE OR REPLACE FUNCTION public.validate_vehicle()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.year < 1900 OR NEW.year > 2100 THEN
    RAISE EXCEPTION 'Vehicle year must be between 1900 and 2100';
  END IF;
  IF NEW.mileage IS NOT NULL AND NEW.mileage < 0 THEN
    RAISE EXCEPTION 'Mileage cannot be negative';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_vehicle
  BEFORE INSERT OR UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.validate_vehicle();

-- ============================================================
-- 2. DIAGNOSTIC SESSIONS
-- ============================================================
CREATE TABLE public.diagnostic_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id      uuid REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id         uuid,
  anon_session_id text,
  status          session_status DEFAULT 'intake',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ============================================================
-- 3. SYMPTOM REPORTS
-- ============================================================
CREATE TABLE public.symptom_reports (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          uuid UNIQUE REFERENCES public.diagnostic_sessions(id) ON DELETE CASCADE,
  primary_symptom     text NOT NULL,
  symptom_location    text,
  when_it_happens     text,
  severity            severity_level,
  warning_lights      text[] DEFAULT '{}',
  raw_description     text,
  created_at          timestamptz DEFAULT now()
);

-- ============================================================
-- 4. DIAGNOSES
-- ============================================================
CREATE TABLE public.diagnoses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid UNIQUE REFERENCES public.diagnostic_sessions(id) ON DELETE CASCADE,
  confidence      confidence_level NOT NULL,
  urgency         urgency_level NOT NULL,
  explanation     text NOT NULL,
  raw_ai_response jsonb,
  model_used      text,
  created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- 5. POSSIBLE CAUSES
-- ============================================================
CREATE TABLE public.possible_causes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_id          uuid REFERENCES public.diagnoses(id) ON DELETE CASCADE,
  name                  text NOT NULL,
  probability           numeric(3,2),
  estimated_cost_low    integer,
  estimated_cost_high   integer,
  diy_difficulty        diy_difficulty,
  notes                 text,
  sort_order            integer DEFAULT 0,
  created_at            timestamptz DEFAULT now()
);

-- Validation trigger for probability
CREATE OR REPLACE FUNCTION public.validate_possible_cause()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.probability IS NOT NULL AND (NEW.probability < 0 OR NEW.probability > 1) THEN
    RAISE EXCEPTION 'Probability must be between 0 and 1';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_possible_cause
  BEFORE INSERT OR UPDATE ON public.possible_causes
  FOR EACH ROW EXECUTE FUNCTION public.validate_possible_cause();

-- ============================================================
-- 6. REPAIR RECOMMENDATIONS
-- ============================================================
CREATE TABLE public.repair_recommendations (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id                  uuid UNIQUE REFERENCES public.diagnostic_sessions(id) ON DELETE CASCADE,
  action                      text NOT NULL,
  next_steps                  text[] DEFAULT '{}',
  questions_to_ask_mechanic   text[] DEFAULT '{}',
  parts_likely_needed         text[] DEFAULT '{}',
  created_at                  timestamptz DEFAULT now()
);

-- ============================================================
-- 7. REPAIR HISTORY
-- ============================================================
CREATE TABLE public.repair_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id      uuid REFERENCES public.vehicles(id) ON DELETE CASCADE,
  session_id      uuid REFERENCES public.diagnostic_sessions(id) ON DELETE SET NULL,
  description     text NOT NULL,
  repair_date     date,
  cost_actual     integer,
  mileage_at      integer,
  shop_name       text,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- 8. OUTCOME REPORTS
-- ============================================================
CREATE TABLE public.outcome_reports (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          uuid UNIQUE REFERENCES public.diagnostic_sessions(id) ON DELETE CASCADE,
  user_id             uuid,
  shop_visit          boolean NOT NULL,
  actual_diagnosis    text,
  actual_cost         integer,
  problem_fixed       problem_fixed_status,
  repair_date         date,
  shop_name           text,
  shop_feedback       text,
  no_visit_reason     text,
  diy_notes           text,
  reported_at         timestamptz DEFAULT now()
);

-- ============================================================
-- 9. DIAGNOSTIC ACCURACY
-- ============================================================
CREATE TABLE public.diagnostic_accuracy (
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

-- Validation triggers for diagnostic_accuracy
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

-- ============================================================
-- 10. ACCURACY METRICS
-- ============================================================
CREATE TABLE public.accuracy_metrics (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type               text NOT NULL,
  period                    text NOT NULL,
  period_start              date NOT NULL,
  dimension_value           text,
  accuracy_rate             numeric(4,3) NOT NULL,
  confidence_calibration    numeric(4,3),
  outcomes_count            integer NOT NULL,
  trend                     text,
  exact_match_count         integer DEFAULT 0,
  close_match_count         integer DEFAULT 0,
  partial_match_count       integer DEFAULT 0,
  miss_count                integer DEFAULT 0,
  top_diagnoses             jsonb DEFAULT '[]',
  worst_diagnoses           jsonb DEFAULT '[]',
  computed_at               timestamptz DEFAULT now(),
  UNIQUE (metric_type, period, period_start, dimension_value)
);

-- Validation trigger for accuracy_metrics
CREATE OR REPLACE FUNCTION public.validate_accuracy_metrics()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.metric_type NOT IN ('overall', 'by_make', 'by_symptom_category') THEN
    RAISE EXCEPTION 'Invalid metric_type';
  END IF;
  IF NEW.period NOT IN ('daily', 'weekly', 'monthly') THEN
    RAISE EXCEPTION 'Invalid period';
  END IF;
  IF NEW.trend IS NOT NULL AND NEW.trend NOT IN ('improving', 'stable', 'declining') THEN
    RAISE EXCEPTION 'Invalid trend value';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_accuracy_metrics
  BEFORE INSERT OR UPDATE ON public.accuracy_metrics
  FOR EACH ROW EXECUTE FUNCTION public.validate_accuracy_metrics();

-- ============================================================
-- 11. OUTCOME REMINDERS
-- ============================================================
CREATE TABLE public.outcome_reminders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid UNIQUE REFERENCES public.diagnostic_sessions(id) ON DELETE CASCADE,
  user_id         uuid,
  scheduled_for   timestamptz NOT NULL,
  sent_at         timestamptz,
  opened_at       timestamptz,
  completed_at    timestamptz
);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE TRIGGER vehicles_set_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER sessions_set_updated_at
  BEFORE UPDATE ON public.diagnostic_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_vehicles_user_id           ON public.vehicles(user_id);
CREATE INDEX idx_sessions_vehicle_id        ON public.diagnostic_sessions(vehicle_id);
CREATE INDEX idx_sessions_user_id           ON public.diagnostic_sessions(user_id);
CREATE INDEX idx_sessions_anon              ON public.diagnostic_sessions(anon_session_id);
CREATE INDEX idx_symptom_session_id         ON public.symptom_reports(session_id);
CREATE INDEX idx_diagnosis_session_id       ON public.diagnoses(session_id);
CREATE INDEX idx_causes_diagnosis_id        ON public.possible_causes(diagnosis_id);
CREATE INDEX idx_recommendation_session_id  ON public.repair_recommendations(session_id);
CREATE INDEX idx_history_vehicle_id         ON public.repair_history(vehicle_id);
CREATE INDEX idx_outcomes_session_id        ON public.outcome_reports(session_id);
CREATE INDEX idx_outcomes_user_id           ON public.outcome_reports(user_id);
CREATE INDEX idx_accuracy_session_id        ON public.diagnostic_accuracy(session_id);
CREATE INDEX idx_accuracy_make              ON public.diagnostic_accuracy(vehicle_make);
CREATE INDEX idx_accuracy_symptom_cat       ON public.diagnostic_accuracy(symptom_category);
CREATE INDEX idx_accuracy_score             ON public.diagnostic_accuracy(accuracy_score);
CREATE INDEX idx_metrics_type_period        ON public.accuracy_metrics(metric_type, period, period_start);
CREATE INDEX idx_reminders_scheduled        ON public.outcome_reminders(scheduled_for) WHERE sent_at IS NULL;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.vehicles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnoses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.possible_causes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_history         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outcome_reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_accuracy    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accuracy_metrics       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outcome_reminders      ENABLE ROW LEVEL SECURITY;

-- VEHICLES
CREATE POLICY "Users can manage their own vehicles"
  ON public.vehicles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anon can insert vehicles"
  ON public.vehicles FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Service role full access vehicles"
  ON public.vehicles FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access vehicles"
  ON public.vehicles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- DIAGNOSTIC SESSIONS
CREATE POLICY "Users can manage their own sessions"
  ON public.diagnostic_sessions FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role full access sessions"
  ON public.diagnostic_sessions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access sessions"
  ON public.diagnostic_sessions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- SYMPTOM REPORTS
CREATE POLICY "Symptom reports via session"
  ON public.symptom_reports FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.diagnostic_sessions s
    WHERE s.id = session_id AND (s.user_id = auth.uid() OR s.user_id IS NULL)
  ));

CREATE POLICY "Service role full access symptom_reports"
  ON public.symptom_reports FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access symptom_reports"
  ON public.symptom_reports FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- DIAGNOSES
CREATE POLICY "Diagnoses via session"
  ON public.diagnoses FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.diagnostic_sessions s
    WHERE s.id = session_id AND (s.user_id = auth.uid() OR s.user_id IS NULL)
  ));

CREATE POLICY "Service role full access diagnoses"
  ON public.diagnoses FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access diagnoses"
  ON public.diagnoses FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- POSSIBLE CAUSES
CREATE POLICY "Possible causes via session"
  ON public.possible_causes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.diagnoses d
    JOIN public.diagnostic_sessions s ON s.id = d.session_id
    WHERE d.id = diagnosis_id AND (s.user_id = auth.uid() OR s.user_id IS NULL)
  ));

CREATE POLICY "Service role full access possible_causes"
  ON public.possible_causes FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access possible_causes"
  ON public.possible_causes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- REPAIR RECOMMENDATIONS
CREATE POLICY "Recommendations via session"
  ON public.repair_recommendations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.diagnostic_sessions s
    WHERE s.id = session_id AND (s.user_id = auth.uid() OR s.user_id IS NULL)
  ));

CREATE POLICY "Service role full access repair_recommendations"
  ON public.repair_recommendations FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access repair_recommendations"
  ON public.repair_recommendations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- REPAIR HISTORY
CREATE POLICY "Users can manage their own repair history"
  ON public.repair_history FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.id = vehicle_id AND v.user_id = auth.uid()
  ));

CREATE POLICY "Service role full access repair_history"
  ON public.repair_history FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access repair_history"
  ON public.repair_history FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- OUTCOME REPORTS
CREATE POLICY "Users can manage their own outcome reports"
  ON public.outcome_reports FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role full access outcome_reports"
  ON public.outcome_reports FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access outcome_reports"
  ON public.outcome_reports FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- DIAGNOSTIC ACCURACY
CREATE POLICY "Users can read their own accuracy records"
  ON public.diagnostic_accuracy FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.diagnostic_sessions s
    WHERE s.id = session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Service role full access diagnostic_accuracy"
  ON public.diagnostic_accuracy FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access diagnostic_accuracy"
  ON public.diagnostic_accuracy FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ACCURACY METRICS (public read)
CREATE POLICY "Anyone can read accuracy metrics"
  ON public.accuracy_metrics FOR SELECT
  USING (true);

CREATE POLICY "Service role full access accuracy_metrics"
  ON public.accuracy_metrics FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access accuracy_metrics"
  ON public.accuracy_metrics FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- OUTCOME REMINDERS
CREATE POLICY "Users can read their own reminders"
  ON public.outcome_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access outcome_reminders"
  ON public.outcome_reminders FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access outcome_reminders"
  ON public.outcome_reminders FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
