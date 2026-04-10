
-- Add missing columns to user_vehicles
ALTER TABLE public.user_vehicles
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false;

-- Add nhtsa_id to recall_alerts and unique constraint
ALTER TABLE public.recall_alerts
  ADD COLUMN IF NOT EXISTS nhtsa_id text;

-- Add unique constraint for recall deduplication (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recall_alerts_vehicle_nhtsa_unique'
  ) THEN
    ALTER TABLE public.recall_alerts
      ADD CONSTRAINT recall_alerts_vehicle_nhtsa_unique UNIQUE (vehicle_id, nhtsa_id);
  END IF;
END$$;

-- Create pro_subscriptions table
CREATE TABLE IF NOT EXISTS public.pro_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  status text NOT NULL DEFAULT 'trialing',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_pro_subscription_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'canceled', 'past_due', 'trialing') THEN
    RAISE EXCEPTION 'Invalid subscription status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_pro_subscription_status_trigger
  BEFORE INSERT OR UPDATE ON public.pro_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.validate_pro_subscription_status();

-- Updated_at trigger
CREATE TRIGGER update_pro_subscriptions_updated_at
  BEFORE UPDATE ON public.pro_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.pro_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own subscription"
  ON public.pro_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role manages subscriptions"
  ON public.pro_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_pro_subscriptions_user ON public.pro_subscriptions(user_id);
