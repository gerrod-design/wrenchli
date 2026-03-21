
CREATE TABLE IF NOT EXISTS public.edge_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  endpoint text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_edge_rate_limits_lookup 
  ON public.edge_rate_limits (identifier, endpoint, requested_at DESC);

-- Auto-cleanup: delete entries older than 2 minutes
CREATE OR REPLACE FUNCTION public.cleanup_edge_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.edge_rate_limits WHERE requested_at < now() - interval '2 minutes';
$$;

-- RLS: allow inserts from anon/service role, no public reads needed
ALTER TABLE public.edge_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow inserts for rate tracking"
  ON public.edge_rate_limits FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

CREATE POLICY "Allow service role full access"
  ON public.edge_rate_limits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
