
-- Create the update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create quote_requests table
CREATE TABLE public.quote_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  vehicle_year TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_trim TEXT,
  diagnosis_title TEXT NOT NULL,
  diagnosis_code TEXT,
  diagnosis_urgency TEXT,
  diagnosis_diy_feasibility TEXT,
  zip_code TEXT NOT NULL,
  metro_area TEXT,
  estimated_cost_low NUMERIC,
  estimated_cost_high NUMERIC,
  cost_estimate_details JSONB DEFAULT '{}'::jsonb,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_notes TEXT,
  status TEXT NOT NULL DEFAULT 'estimate_generated',
  referral_requested_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can submit quote request"
ON public.quote_requests FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Authenticated can submit quote request"
ON public.quote_requests FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Only admins can read quote requests"
ON public.quote_requests FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update quote requests"
ON public.quote_requests FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete quote requests"
ON public.quote_requests FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anon can update own quote request"
ON public.quote_requests FOR UPDATE TO anon
USING (true) WITH CHECK (true);

CREATE TRIGGER update_quote_requests_updated_at
BEFORE UPDATE ON public.quote_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_quote_requests_status ON public.quote_requests(status);
CREATE INDEX idx_quote_requests_zip ON public.quote_requests(zip_code);
CREATE INDEX idx_quote_requests_created ON public.quote_requests(created_at DESC);
