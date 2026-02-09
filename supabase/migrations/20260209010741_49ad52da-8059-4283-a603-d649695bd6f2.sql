
-- Waitlist signups
CREATE TABLE public.waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit waitlist signup"
  ON public.waitlist_signups FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can read waitlist"
  ON public.waitlist_signups FOR SELECT
  TO authenticated
  USING (true);

-- Shop applications
CREATE TABLE public.shop_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL,
  owner_name TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  state TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit shop application"
  ON public.shop_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can read shop applications"
  ON public.shop_applications FOR SELECT
  TO authenticated
  USING (true);

-- Contact submissions
CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact form"
  ON public.contact_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can read contact submissions"
  ON public.contact_submissions FOR SELECT
  TO authenticated
  USING (true);
