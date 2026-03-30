
-- Service providers table: stores all repair facilities from any data source
CREATE TABLE public.service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text,
  name text NOT NULL,
  address text NOT NULL,
  city text,
  state text,
  zip_code text NOT NULL,
  lat numeric,
  lng numeric,
  phone text,
  rating numeric,
  review_count integer DEFAULT 0,
  specialties text[] DEFAULT '{}',
  price_tier text DEFAULT 'mid',
  response_time text DEFAULT '< 2 hours',
  availability text DEFAULT 'next_day',
  is_dealer boolean DEFAULT false,
  dealer_brands text[] DEFAULT '{}',
  is_partnered boolean DEFAULT false,
  wrenchli_verified boolean DEFAULT false,
  quote_url text,
  booking_url text,
  data_source text NOT NULL DEFAULT 'manual',
  data_source_id text,
  last_refreshed_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(data_source, data_source_id)
);

-- Indexes for common queries
CREATE INDEX idx_service_providers_zip ON public.service_providers(zip_code);
CREATE INDEX idx_service_providers_state ON public.service_providers(state);
CREATE INDEX idx_service_providers_active ON public.service_providers(is_active) WHERE is_active = true;
CREATE INDEX idx_service_providers_location ON public.service_providers(lat, lng);

-- Enable RLS
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

-- Anyone can read active providers
CREATE POLICY "Anyone can read active providers"
  ON public.service_providers FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Only admins can manage providers
CREATE POLICY "Admins can manage all providers"
  ON public.service_providers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update trigger
CREATE TRIGGER update_service_providers_updated_at
  BEFORE UPDATE ON public.service_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
