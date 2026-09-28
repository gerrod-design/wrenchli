-- Shop partner program interest capture (program currently paused / onboarding gradually)
-- Two anonymous-capture tables:
--   shop_nominations: consumer "recommend your shop" nominations (aggregate demand evidence)
--   shop_interest:    shop-side "express interest / learn more" inbound
-- Conventions follow waitlist_signups: anon INSERT only; SELECT/UPDATE/DELETE admin-only.

-- ---------------------------------------------------------------------------
-- shop_nominations
-- ---------------------------------------------------------------------------
CREATE TABLE public.shop_nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL,
  city TEXT,
  consumer_email TEXT,
  source TEXT NOT NULL DEFAULT 'for-shops',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_nominations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can submit shop nomination"
  ON public.shop_nominations FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Only admins can read shop nominations"
  ON public.shop_nominations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update shop nominations"
  ON public.shop_nominations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete shop nominations"
  ON public.shop_nominations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- shop_interest
-- ---------------------------------------------------------------------------
CREATE TABLE public.shop_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  shop_system TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_interest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can submit shop interest"
  ON public.shop_interest FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Only admins can read shop interest"
  ON public.shop_interest FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update shop interest"
  ON public.shop_interest FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete shop interest"
  ON public.shop_interest FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
