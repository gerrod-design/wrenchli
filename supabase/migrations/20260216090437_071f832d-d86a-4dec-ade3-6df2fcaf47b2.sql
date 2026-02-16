
-- API keys table
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  owner_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can manage API keys
CREATE POLICY "Admins can manage api_keys"
  ON public.api_keys FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Rate limit log (rolling window)
CREATE TABLE public.api_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_hash TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- No direct access — only edge functions use this via service role
CREATE POLICY "No public access to rate limits"
  ON public.api_rate_limits FOR ALL
  USING (false);

-- Index for fast lookups
CREATE INDEX idx_api_rate_limits_key_time ON public.api_rate_limits (key_hash, requested_at DESC);

-- Cleanup function: purge entries older than 2 minutes
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.api_rate_limits WHERE requested_at < now() - interval '2 minutes';
$$;
