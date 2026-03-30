
-- Shop search logs: tracks every find-shops search attempt for demand analysis
CREATE TABLE public.shop_search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_code text NOT NULL,
  city_resolved text,
  state text,
  service_type text DEFAULT 'general',
  vehicle_make text,
  results_count integer NOT NULL DEFAULT 0,
  searched_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX idx_shop_search_logs_zip ON public.shop_search_logs(zip_code);
CREATE INDEX idx_shop_search_logs_searched_at ON public.shop_search_logs(searched_at);
CREATE INDEX idx_shop_search_logs_unserved ON public.shop_search_logs(results_count) WHERE results_count = 0;

-- Enable RLS
ALTER TABLE public.shop_search_logs ENABLE ROW LEVEL SECURITY;

-- Edge function inserts via service role; admins can read
CREATE POLICY "Service role can insert search logs"
  ON public.shop_search_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Only admins can read search logs"
  ON public.shop_search_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete search logs"
  ON public.shop_search_logs FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
