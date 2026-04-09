
CREATE TABLE public.security_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  check_name text NOT NULL,
  status text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  checked_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access security_audit_log"
  ON public.security_audit_log FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access security_audit_log"
  ON public.security_audit_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_security_audit_log_checked_at ON public.security_audit_log (checked_at);
CREATE INDEX idx_security_audit_log_check_name ON public.security_audit_log (check_name);

CREATE TABLE public.security_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  check_name text NOT NULL,
  severity text NOT NULL DEFAULT 'high',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  acknowledged boolean NOT NULL DEFAULT false,
  acknowledged_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access security_alerts"
  ON public.security_alerts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access security_alerts"
  ON public.security_alerts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_security_alerts_created_at ON public.security_alerts (created_at);

CREATE TRIGGER update_security_alerts_updated_at
  BEFORE UPDATE ON public.security_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
