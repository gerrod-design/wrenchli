
-- ============================================================
-- DIAGNOSIS RECORDS: Full observability for every diagnosis
-- ============================================================
CREATE TABLE public.diagnosis_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  vehicle_year TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_trim TEXT,
  vin TEXT,
  symptoms TEXT NOT NULL,
  zip_code TEXT,

  -- AI diagnosis output
  primary_diagnosis TEXT NOT NULL,
  primary_confidence INTEGER NOT NULL DEFAULT 0,
  rationale TEXT,
  alternative_diagnoses JSONB DEFAULT '[]'::jsonb,
  cost_estimate_low NUMERIC,
  cost_estimate_high NUMERIC,
  recommended_action TEXT,
  ai_model_used TEXT,

  -- Historical cross-reference
  historical_total_cases INTEGER DEFAULT 0,
  historical_similar_symptoms INTEGER DEFAULT 0,
  historical_most_common_diagnosis TEXT,
  historical_success_rate INTEGER DEFAULT 0,

  -- Customer decision
  customer_approved BOOLEAN DEFAULT FALSE,
  customer_approved_at TIMESTAMPTZ,
  customer_selected_diagnosis TEXT,

  -- Shop selection
  selected_shop_id UUID REFERENCES public.service_providers(id) ON DELETE SET NULL,
  shop_selection_rationale TEXT,

  -- Price approval
  estimated_cost NUMERIC,
  market_average_cost NUMERIC,
  cost_variance_percent NUMERIC,
  price_approved BOOLEAN DEFAULT FALSE,
  price_approved_at TIMESTAMPTZ,

  -- Booking
  tracking_number TEXT UNIQUE,
  booked_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'diagnosis_pending',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- REPAIR OUTCOMES: Post-repair data from customer AND shop
-- ============================================================
CREATE TABLE public.repair_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diagnosis_record_id UUID NOT NULL REFERENCES public.diagnosis_records(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.service_providers(id) ON DELETE SET NULL,

  -- Shop-reported outcome
  shop_actual_diagnosis TEXT,
  shop_actual_cost NUMERIC,
  shop_parts_used JSONB DEFAULT '[]'::jsonb,
  shop_labor_hours NUMERIC,
  shop_notes TEXT,
  shop_reported_at TIMESTAMPTZ,

  -- Customer-reported outcome
  customer_satisfaction INTEGER CHECK (customer_satisfaction BETWEEN 1 AND 5),
  customer_would_return BOOLEAN,
  customer_issues_since_repair BOOLEAN DEFAULT FALSE,
  customer_feedback TEXT,
  customer_reported_at TIMESTAMPTZ,

  -- Calculated accuracy metrics
  diagnosis_match BOOLEAN,
  cost_variance NUMERIC,
  cost_variance_percent NUMERIC,

  -- Follow-up
  rework_required BOOLEAN DEFAULT FALSE,
  rework_details TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SHOP JOBS: Real-time job queue for shop dashboard
-- ============================================================
CREATE TABLE public.shop_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diagnosis_record_id UUID NOT NULL REFERENCES public.diagnosis_records(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,

  -- Job status
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_completion TIMESTAMPTZ,

  -- Pricing
  estimated_cost NUMERIC,
  final_cost NUMERIC,
  price_approved_by_customer BOOLEAN DEFAULT FALSE,

  -- Shop notes
  shop_diagnosis_notes TEXT,
  shop_parts_ordered JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SHOP ACCOUNTS: Separate auth profiles for shop owners
-- ============================================================
CREATE TABLE public.shop_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  owner_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, shop_id)
);

-- ============================================================
-- QUALITY ALERTS: Anomaly detection, fraud flags, safety issues
-- ============================================================
CREATE TABLE public.quality_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES public.service_providers(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB DEFAULT '{}'::jsonb,
  action_required BOOLEAN DEFAULT TRUE,
  action_taken TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  escalated_to TEXT,
  escalated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PARTNERSHIP METRICS: Lender/insurance revenue tracking
-- ============================================================
CREATE TABLE public.partnership_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_name TEXT NOT NULL,
  partner_type TEXT NOT NULL,
  period TEXT NOT NULL,
  referrals_count INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.diagnosis_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_metrics ENABLE ROW LEVEL SECURITY;

-- DIAGNOSIS RECORDS: Users see own, anon can insert, admins see all
CREATE POLICY "Users can view own diagnoses" ON public.diagnosis_records
  FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "Anon can insert diagnoses" ON public.diagnosis_records
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Auth can insert diagnoses" ON public.diagnosis_records
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own diagnoses" ON public.diagnosis_records
  FOR UPDATE TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "Admins full access diagnosis_records" ON public.diagnosis_records
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- REPAIR OUTCOMES: Linked via diagnosis, users see own, shops see theirs
CREATE POLICY "Users can view own outcomes" ON public.repair_outcomes
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.diagnosis_records dr WHERE dr.id = diagnosis_record_id AND dr.customer_id = auth.uid())
  );
CREATE POLICY "Users can insert outcomes" ON public.repair_outcomes
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.diagnosis_records dr WHERE dr.id = diagnosis_record_id AND dr.customer_id = auth.uid())
  );
CREATE POLICY "Users can update own outcomes" ON public.repair_outcomes
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.diagnosis_records dr WHERE dr.id = diagnosis_record_id AND dr.customer_id = auth.uid())
  );
CREATE POLICY "Shops can view their outcomes" ON public.repair_outcomes
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.shop_accounts sa WHERE sa.user_id = auth.uid() AND sa.shop_id = repair_outcomes.shop_id)
  );
CREATE POLICY "Shops can update their outcomes" ON public.repair_outcomes
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.shop_accounts sa WHERE sa.user_id = auth.uid() AND sa.shop_id = repair_outcomes.shop_id)
  );
CREATE POLICY "Anon can insert outcomes" ON public.repair_outcomes
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Admins full access repair_outcomes" ON public.repair_outcomes
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- SHOP JOBS: Shops see their jobs, customers see their jobs
CREATE POLICY "Shops can view their jobs" ON public.shop_jobs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.shop_accounts sa WHERE sa.user_id = auth.uid() AND sa.shop_id = shop_jobs.shop_id)
  );
CREATE POLICY "Shops can update their jobs" ON public.shop_jobs
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.shop_accounts sa WHERE sa.user_id = auth.uid() AND sa.shop_id = shop_jobs.shop_id)
  );
CREATE POLICY "Customers can view their jobs" ON public.shop_jobs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.diagnosis_records dr WHERE dr.id = diagnosis_record_id AND dr.customer_id = auth.uid())
  );
CREATE POLICY "Admins full access shop_jobs" ON public.shop_jobs
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- SHOP ACCOUNTS: Users see own, admins see all
CREATE POLICY "Users can view own shop account" ON public.shop_accounts
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own shop account" ON public.shop_accounts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own shop account" ON public.shop_accounts
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins full access shop_accounts" ON public.shop_accounts
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- QUALITY ALERTS: Admins + shop owners for their shop
CREATE POLICY "Shops can view their alerts" ON public.quality_alerts
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.shop_accounts sa WHERE sa.user_id = auth.uid() AND sa.shop_id = quality_alerts.shop_id)
  );
CREATE POLICY "Admins full access quality_alerts" ON public.quality_alerts
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PARTNERSHIP METRICS: Admin only
CREATE POLICY "Admins full access partnership_metrics" ON public.partnership_metrics
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER update_diagnosis_records_updated_at
  BEFORE UPDATE ON public.diagnosis_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_repair_outcomes_updated_at
  BEFORE UPDATE ON public.repair_outcomes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shop_jobs_updated_at
  BEFORE UPDATE ON public.shop_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shop_accounts_updated_at
  BEFORE UPDATE ON public.shop_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quality_alerts_updated_at
  BEFORE UPDATE ON public.quality_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partnership_metrics_updated_at
  BEFORE UPDATE ON public.partnership_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_diagnosis_records_customer ON public.diagnosis_records(customer_id);
CREATE INDEX idx_diagnosis_records_shop ON public.diagnosis_records(selected_shop_id);
CREATE INDEX idx_diagnosis_records_status ON public.diagnosis_records(status);
CREATE INDEX idx_diagnosis_records_tracking ON public.diagnosis_records(tracking_number);
CREATE INDEX idx_repair_outcomes_diagnosis ON public.repair_outcomes(diagnosis_record_id);
CREATE INDEX idx_repair_outcomes_shop ON public.repair_outcomes(shop_id);
CREATE INDEX idx_shop_jobs_shop ON public.shop_jobs(shop_id);
CREATE INDEX idx_shop_jobs_status ON public.shop_jobs(status);
CREATE INDEX idx_shop_accounts_user ON public.shop_accounts(user_id);
CREATE INDEX idx_shop_accounts_shop ON public.shop_accounts(shop_id);
CREATE INDEX idx_quality_alerts_shop ON public.quality_alerts(shop_id);
CREATE INDEX idx_quality_alerts_status ON public.quality_alerts(status);
