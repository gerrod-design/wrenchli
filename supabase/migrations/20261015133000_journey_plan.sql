-- Journey Plan ("While your car is being fixed") — additive migration.
-- Brief: hidden_files/claude-briefs/2026-10-15-journey-build-brief.md
-- New tables only; no changes to existing tables or columns.
-- Provenance follows the two-layer Garage record: user-entered rows are
-- layer 'reported', source_type 'owner' (shop_capabilities: 'shop').

-- 1. Situation inputs + computed plan snapshot, one row per "plan session" for a vehicle
CREATE TABLE public.journey_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.user_vehicles(id) ON DELETE CASCADE,
  assessment_id uuid NULL, -- optional link to the originating assessment record, no FK enforced (table out of scope)
  downtime_days_min integer NOT NULL,
  downtime_days_max integer NOT NULL,
  daily_distance_miles numeric NOT NULL,
  budget_tier text NOT NULL CHECK (budget_tier IN ('low','medium','high')),
  vehicle_drivable boolean NOT NULL,
  metro_area text NOT NULL CHECK (metro_area IN ('detroit','columbus','other')),
  issue_category text NULL,
  plan_snapshot jsonb NOT NULL, -- output of buildJourneyPlan(), stored for audit/history
  layer text NOT NULL DEFAULT 'reported' CHECK (layer IN ('reported','observed')),
  source_type text NOT NULL DEFAULT 'owner' CHECK (source_type IN ('owner','technician','shop','document','system')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX journey_plans_vehicle_id_idx ON public.journey_plans(vehicle_id);
CREATE INDEX journey_plans_user_id_idx ON public.journey_plans(user_id);

ALTER TABLE public.journey_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY journey_plans_owner_select ON public.journey_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY journey_plans_owner_insert ON public.journey_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY journey_plans_owner_update ON public.journey_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY journey_plans_owner_delete ON public.journey_plans FOR DELETE USING (auth.uid() = user_id);

-- 2. Discrete user choices within a plan (e.g. "selected public transit", "noted considering rideshare")
CREATE TABLE public.journey_plan_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_plan_id uuid NOT NULL REFERENCES public.journey_plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step text NOT NULL CHECK (step IN ('getting_around','getting_car_there','paying_for_it')),
  option_key text NOT NULL, -- e.g. 'public_transit', 'rideshare_slot', 'tow_mobile_inspection', 'financing_waitlist'
  note text NULL,
  layer text NOT NULL DEFAULT 'reported' CHECK (layer IN ('reported','observed')),
  source_type text NOT NULL DEFAULT 'owner' CHECK (source_type IN ('owner','technician','shop','document','system')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX journey_plan_selections_plan_id_idx ON public.journey_plan_selections(journey_plan_id);

ALTER TABLE public.journey_plan_selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY jps_owner_select ON public.journey_plan_selections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY jps_owner_insert ON public.journey_plan_selections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY jps_owner_delete ON public.journey_plan_selections FOR DELETE USING (auth.uid() = user_id);

-- 3. Service contracts the owner records against a vehicle
CREATE TABLE public.vehicle_service_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.user_vehicles(id) ON DELETE CASCADE,
  provider_name text NOT NULL,
  plan_name text NULL,
  coverage_notes text NULL,
  expires_on date NULL,
  layer text NOT NULL DEFAULT 'reported' CHECK (layer IN ('reported','observed')),
  source_type text NOT NULL DEFAULT 'owner' CHECK (source_type IN ('owner','technician','shop','document','system')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vehicle_service_contracts_vehicle_id_idx ON public.vehicle_service_contracts(vehicle_id);

ALTER TABLE public.vehicle_service_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY vsc_owner_select ON public.vehicle_service_contracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY vsc_owner_insert ON public.vehicle_service_contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY vsc_owner_update ON public.vehicle_service_contracts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY vsc_owner_delete ON public.vehicle_service_contracts FOR DELETE USING (auth.uid() = user_id);

-- 4. Shop-declared capabilities (admin/ops-managed in v1; no public write path)
CREATE TABLE public.shop_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id text NOT NULL, -- matches Shop.id from find-shops edge function
  capability text NOT NULL CHECK (capability IN ('loaner_cars','shuttle','pickup_delivery','mobile_service')),
  declared_at timestamptz NOT NULL DEFAULT now(),
  layer text NOT NULL DEFAULT 'reported' CHECK (layer IN ('reported','observed')),
  source_type text NOT NULL DEFAULT 'shop' CHECK (source_type IN ('owner','technician','shop','document','system')),
  UNIQUE (shop_id, capability)
);
CREATE INDEX shop_capabilities_shop_id_idx ON public.shop_capabilities(shop_id);

ALTER TABLE public.shop_capabilities ENABLE ROW LEVEL SECURITY;
-- Public read (consumer-facing, no auth user scoping — shop capability is not personal data)
CREATE POLICY shop_capabilities_public_select ON public.shop_capabilities FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policy for anon/authenticated; writes via service-role only in v1.
