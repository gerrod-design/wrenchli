-- Detroit Shop Spotlight directory (buildathon, Sept 2026)
--
-- Public, hand-verified independent shop listings for Detroit, MI, plus the
-- technician-profile environment. This is SEPARATE from the legacy paused
-- shop-marketplace tables (public.shops, public.shops_public): those belong
-- to the retired partner program and are not read by the spotlight UI.
--
-- Truth rules enforced at the data layer:
--   * spotlight_shops rows are independent listings unless listing_status = 'partner'
--   * google_rating / google_review_count are third-party data, shown with attribution
--   * spotlight_technicians.wrenchli_job_count / wrenchli_rating_avg stay NULL
--     until real verified-outcome data exists (never seeded, never invented)

CREATE TABLE public.spotlight_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address_line1 TEXT,
  city TEXT NOT NULL DEFAULT 'Detroit',
  state TEXT NOT NULL DEFAULT 'MI',
  zip TEXT,
  phone TEXT,
  website_url TEXT,
  hours_json JSONB,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  google_rating NUMERIC(2,1),
  google_review_count INTEGER,
  listing_status TEXT NOT NULL DEFAULT 'unclaimed'
    CHECK (listing_status IN ('unclaimed', 'claimed', 'partner')),
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.spotlight_technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.spotlight_shops(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  photo_url TEXT,
  bio TEXT,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  years_experience INTEGER,
  ase_certifications TEXT[] NOT NULL DEFAULT '{}',
  mi_cert_number TEXT,
  mi_cert_verified BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'shop_added'
    CHECK (status IN ('shop_added', 'verified')),
  -- Populated ONLY from real Wrenchli-verified completed jobs. NULL until then.
  wrenchli_job_count INTEGER,
  wrenchli_rating_avg NUMERIC(2,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.spotlight_technician_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID NOT NULL REFERENCES public.spotlight_technicians(id) ON DELETE CASCADE,
  -- Opaque consumer reference. NEVER store consumer PII here.
  consumer_ref TEXT NOT NULL,
  job_reference TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.spotlight_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spotlight_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spotlight_technician_endorsements ENABLE ROW LEVEL SECURITY;

-- Public read on all three tables. No public write: rows are created by
-- hand-verified seed inserts and the shop claim flow via service role.
CREATE POLICY "Public can read spotlight shops"
  ON public.spotlight_shops FOR SELECT USING (true);

CREATE POLICY "Public can read spotlight technicians"
  ON public.spotlight_technicians FOR SELECT USING (true);

CREATE POLICY "Public can read spotlight technician endorsements"
  ON public.spotlight_technician_endorsements FOR SELECT USING (true);

CREATE INDEX idx_spotlight_shops_slug ON public.spotlight_shops (slug);
CREATE INDEX idx_spotlight_shops_status ON public.spotlight_shops (listing_status);
CREATE INDEX idx_spotlight_technicians_shop ON public.spotlight_technicians (shop_id);
CREATE INDEX idx_spotlight_endorsements_tech ON public.spotlight_technician_endorsements (technician_id);
