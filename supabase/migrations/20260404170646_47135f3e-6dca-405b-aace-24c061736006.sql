
-- TABLE 1: shop_integrations
CREATE TABLE public.shop_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES public.service_providers(id) NOT NULL,
  sms_provider text NOT NULL CHECK (sms_provider IN ('tekmetric', 'mitchell1', 'autoleap', 'shopware', 'protractor', 'rowriter', 'fullbay', 'napatracs', 'csv')),
  api_key_encrypted text,
  shop_location_id text,
  webhook_url text,
  is_active boolean DEFAULT true,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.shop_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shops can manage own integrations"
  ON public.shop_integrations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shop_accounts sa WHERE sa.user_id = auth.uid() AND sa.shop_id = shop_integrations.shop_id));

CREATE POLICY "Admins full access shop_integrations"
  ON public.shop_integrations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access shop_integrations"
  ON public.shop_integrations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- TABLE 2: integration_sync_log
CREATE TABLE public.integration_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_integration_id uuid REFERENCES public.shop_integrations(id) NOT NULL,
  session_id uuid REFERENCES public.diagnostic_sessions(id),
  direction text NOT NULL CHECK (direction IN ('push', 'pull')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retry')),
  sms_record_id text,
  payload_sent jsonb,
  response_received jsonb,
  error_message text,
  attempted_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.integration_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shops can view own sync logs"
  ON public.integration_sync_log FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shop_integrations si
    JOIN public.shop_accounts sa ON sa.shop_id = si.shop_id
    WHERE si.id = integration_sync_log.shop_integration_id AND sa.user_id = auth.uid()
  ));

CREATE POLICY "Admins full access integration_sync_log"
  ON public.integration_sync_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access integration_sync_log"
  ON public.integration_sync_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);
