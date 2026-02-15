
CREATE TABLE public.finance_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  quote_request_id uuid REFERENCES public.quote_requests(id) ON DELETE SET NULL,
  provider text NOT NULL,
  option_type text NOT NULL,
  apr numeric NOT NULL,
  monthly_payment numeric NOT NULL,
  term_months integer NOT NULL,
  total_cost numeric NOT NULL,
  repair_cost numeric NOT NULL,
  vehicle_year text,
  vehicle_make text,
  vehicle_model text,
  zip_code text
);

ALTER TABLE public.finance_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert finance selection"
  ON public.finance_selections FOR INSERT
  TO anon WITH CHECK (true);

CREATE POLICY "Authenticated can insert finance selection"
  ON public.finance_selections FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Only admins can read finance selections"
  ON public.finance_selections FOR SELECT
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update finance selections"
  ON public.finance_selections FOR UPDATE
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete finance selections"
  ON public.finance_selections FOR DELETE
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER check_finance_selection_rate_limit
  BEFORE INSERT ON public.finance_selections
  FOR EACH ROW
  EXECUTE FUNCTION public.check_rate_limit();
