
CREATE TABLE public.wizard_funnel_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid REFERENCES public.diagnostic_sessions(id) ON DELETE CASCADE,
  step_number   integer NOT NULL,
  step_name     text NOT NULL,
  device_type   text CHECK (device_type IN ('mobile', 'desktop', 'tablet')),
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_funnel_session ON public.wizard_funnel_events(session_id);
CREATE INDEX idx_funnel_step ON public.wizard_funnel_events(step_number);

ALTER TABLE public.wizard_funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages funnel events"
  ON public.wizard_funnel_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can insert funnel events"
  ON public.wizard_funnel_events FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can insert funnel events"
  ON public.wizard_funnel_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins full access wizard_funnel_events"
  ON public.wizard_funnel_events FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.funnel_metrics (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_of                   date NOT NULL,
  step_number               integer NOT NULL,
  step_name                 text NOT NULL,
  total_sessions            integer DEFAULT 0,
  completed_step            integer DEFAULT 0,
  completion_rate           numeric(5,2),
  avg_time_seconds          integer,
  mobile_completion_rate    numeric(5,2),
  desktop_completion_rate   numeric(5,2),
  computed_at               timestamptz DEFAULT now()
);

ALTER TABLE public.funnel_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages funnel metrics"
  ON public.funnel_metrics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins full access funnel_metrics"
  ON public.funnel_metrics FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
