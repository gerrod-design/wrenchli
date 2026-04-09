
CREATE TABLE public.accuracy_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  category_type text NOT NULL,
  accuracy_rate numeric NOT NULL,
  sample_size integer NOT NULL,
  alert_date date NOT NULL DEFAULT CURRENT_DATE,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.accuracy_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access accuracy_alerts"
  ON public.accuracy_alerts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access accuracy_alerts"
  ON public.accuracy_alerts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_accuracy_alerts_updated_at
  BEFORE UPDATE ON public.accuracy_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_accuracy_alerts_date ON public.accuracy_alerts (alert_date);
CREATE INDEX idx_accuracy_alerts_category_type ON public.accuracy_alerts (category_type);
