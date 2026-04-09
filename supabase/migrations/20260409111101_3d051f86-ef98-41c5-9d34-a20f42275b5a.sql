CREATE TABLE public.shop_engagement_metrics (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id             uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  week_of             date NOT NULL,
  sessions_count      integer DEFAULT 0,
  outcomes_count      integer DEFAULT 0,
  confirmation_rate   numeric(5,2) DEFAULT 0,
  flagged             boolean DEFAULT false,
  flag_reason         text,
  computed_at         timestamptz DEFAULT now(),
  UNIQUE(shop_id, week_of)
);

CREATE INDEX idx_engagement_shop ON public.shop_engagement_metrics(shop_id);
CREATE INDEX idx_engagement_week ON public.shop_engagement_metrics(week_of);

ALTER TABLE public.shop_engagement_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages engagement metrics"
  ON public.shop_engagement_metrics FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access engagement metrics"
  ON public.shop_engagement_metrics FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Shops can read own engagement metrics"
  ON public.shop_engagement_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_accounts sa
      WHERE sa.shop_id = shop_engagement_metrics.shop_id
        AND sa.user_id = auth.uid()
    )
  );