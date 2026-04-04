
-- Parts quality enum
CREATE TYPE public.parts_quality AS ENUM ('OEM', 'aftermarket', 'remanufactured', 'mixed');

-- TABLE 1: shop_repair_confirmations
CREATE TABLE public.shop_repair_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.diagnostic_sessions(id),
  shop_id uuid REFERENCES public.service_providers(id),
  confirmed_issue text NOT NULL,
  actual_labor_rate integer,
  actual_parts_cost integer,
  actual_total_cost integer,
  parts_quality public.parts_quality,
  technician_notes text,
  repair_order_id text,
  confirmed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.shop_repair_confirmations ENABLE ROW LEVEL SECURITY;

-- Shops can insert their own confirmations
CREATE POLICY "Shops can insert own confirmations"
  ON public.shop_repair_confirmations FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shop_accounts sa
      WHERE sa.user_id = auth.uid() AND sa.shop_id = shop_repair_confirmations.shop_id
    )
  );

-- Consumers can read confirmations for their own sessions
CREATE POLICY "Consumers can read own session confirmations"
  ON public.shop_repair_confirmations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.diagnostic_sessions ds
      WHERE ds.id = shop_repair_confirmations.session_id AND ds.user_id = auth.uid()
    )
  );

-- Admins full access
CREATE POLICY "Admins full access shop_repair_confirmations"
  ON public.shop_repair_confirmations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role full access
CREATE POLICY "Service role full access shop_repair_confirmations"
  ON public.shop_repair_confirmations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- TABLE 2: shop_performance_metrics
CREATE TABLE public.shop_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES public.service_providers(id) NOT NULL,
  symptom_match_rate numeric(4,3),
  cost_percentile_local numeric(4,3),
  cost_percentile_by_repair jsonb DEFAULT '{}'::jsonb,
  avg_consumer_satisfaction numeric(3,2),
  verified_repairs_count integer DEFAULT 0,
  response_time_avg_hours numeric,
  period_start date NOT NULL,
  computed_at timestamptz DEFAULT now()
);

ALTER TABLE public.shop_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Anyone can read (consumers need to see shop scores)
CREATE POLICY "Anyone can read shop performance"
  ON public.shop_performance_metrics FOR SELECT TO public
  USING (true);

-- Service role only for write
CREATE POLICY "Service role write shop_performance_metrics"
  ON public.shop_performance_metrics FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Admins full access
CREATE POLICY "Admins full access shop_performance_metrics"
  ON public.shop_performance_metrics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
