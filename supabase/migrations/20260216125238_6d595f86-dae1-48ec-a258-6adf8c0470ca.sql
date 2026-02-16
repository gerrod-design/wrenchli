
-- Developer accounts table for self-service API key management
CREATE TABLE public.developer_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  company_name text,
  stripe_customer_id text,
  subscription_tier text NOT NULL DEFAULT 'free',
  monthly_call_limit integer NOT NULL DEFAULT 50,
  current_month_calls integer NOT NULL DEFAULT 0,
  billing_cycle_start timestamp with time zone NOT NULL DEFAULT date_trunc('month', now()),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.developer_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own developer account"
  ON public.developer_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own developer account"
  ON public.developer_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own developer account"
  ON public.developer_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all developer accounts"
  ON public.developer_accounts FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Referral tracking table for 3-tier funnel
CREATE TABLE public.referral_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_token text NOT NULL,
  source text NOT NULL DEFAULT 'api',
  source_key_hash text,
  event_type text NOT NULL,
  shop_id text,
  shop_name text,
  vehicle_make text,
  vehicle_model text,
  vehicle_year text,
  zip_code text,
  diagnosis_title text,
  quote_request_id uuid REFERENCES public.quote_requests(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

-- Public insert for tracking (edge functions use service role, but anon needs insert for client-side click tracking)
CREATE POLICY "Anon can insert referral events"
  ON public.referral_events FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can insert referral events"
  ON public.referral_events FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only admins can read referral events"
  ON public.referral_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete referral events"
  ON public.referral_events FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Index for fast lookups
CREATE INDEX idx_referral_events_token ON public.referral_events(referral_token);
CREATE INDEX idx_referral_events_type ON public.referral_events(event_type);
CREATE INDEX idx_referral_events_created ON public.referral_events(created_at DESC);

-- Add referral_token to quote_requests for linking
ALTER TABLE public.quote_requests ADD COLUMN IF NOT EXISTS referral_token text;

-- Trigger for developer_accounts updated_at
CREATE TRIGGER update_developer_accounts_updated_at
  BEFORE UPDATE ON public.developer_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
