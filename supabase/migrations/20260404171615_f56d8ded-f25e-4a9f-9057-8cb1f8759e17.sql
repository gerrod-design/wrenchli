
-- ============================================================
-- SHOPS — Partner repair shops on the Wrenchli platform
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shops (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id     uuid,
  name              text NOT NULL,
  slug              text UNIQUE,
  owner_name        text,
  email             text,
  phone             text,
  address_street    text,
  address_city      text,
  address_state     text,
  address_zip       text,
  bay_count         text,
  verified_status   text DEFAULT 'pending',
  is_pilot          boolean DEFAULT true,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_shop()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.verified_status IS NOT NULL AND NEW.verified_status NOT IN ('pending', 'active', 'suspended') THEN
    RAISE EXCEPTION 'Invalid verified_status value';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_shop_before_change
  BEFORE INSERT OR UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.validate_shop();

CREATE TRIGGER shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_shops_slug ON public.shops(slug);
CREATE INDEX IF NOT EXISTS idx_shops_zip ON public.shops(address_zip);
CREATE INDEX IF NOT EXISTS idx_shops_status ON public.shops(verified_status);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage their shop"
  ON public.shops FOR ALL
  TO authenticated
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Anyone can read active shops"
  ON public.shops FOR SELECT
  TO anon, authenticated
  USING (verified_status = 'active');

CREATE POLICY "Service role full access shops"
  ON public.shops FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Add missing columns to shop_integrations
-- ============================================================
ALTER TABLE public.shop_integrations
  ADD COLUMN IF NOT EXISTS api_key_iv text,
  ADD COLUMN IF NOT EXISTS webhook_secret text,
  ADD COLUMN IF NOT EXISTS last_sync_status text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- Add missing column to integration_sync_log
-- ============================================================
ALTER TABLE public.integration_sync_log
  ADD COLUMN IF NOT EXISTS attempt_number integer DEFAULT 1;

-- ============================================================
-- Add missing column to shop_repair_confirmations
-- ============================================================
ALTER TABLE public.shop_repair_confirmations
  ADD COLUMN IF NOT EXISTS shop_integration_id uuid REFERENCES public.shop_integrations(id) ON DELETE SET NULL;
