
-- Drop existing tables to rebuild with correct schema
DROP TABLE IF EXISTS public.security_alerts CASCADE;
DROP TABLE IF EXISTS public.security_audit_log CASCADE;

-- Create security_audit_log
CREATE TABLE public.security_audit_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name   text NOT NULL,
  status       text CHECK (status IN ('pass', 'fail', 'warning')) NOT NULL,
  details      text,
  checked_at   timestamptz DEFAULT now()
);

CREATE INDEX idx_security_log_date ON public.security_audit_log(checked_at);
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages security log"
  ON public.security_audit_log FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins can read security log"
  ON public.security_audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create security_alerts
CREATE TABLE public.security_alerts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name    text NOT NULL,
  severity      text CHECK (severity IN ('critical', 'high', 'medium', 'low')) NOT NULL,
  details       text NOT NULL,
  resolved      boolean DEFAULT false,
  resolved_at   timestamptz,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages security alerts"
  ON public.security_alerts FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access security alerts"
  ON public.security_alerts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RPC for marking alerts resolved (admin only)
CREATE OR REPLACE FUNCTION public.resolve_security_alert(alert_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.security_alerts
  SET resolved = true, resolved_at = now()
  WHERE id = alert_id;
END;
$$;
