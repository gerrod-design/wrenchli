
-- =====================================================
-- My Garage: Cloud-backed vehicle lifecycle tables
-- =====================================================

-- 1. User vehicles
CREATE TABLE public.user_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year integer NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  trim text,
  engine text,
  transmission text,
  drive_type text,
  fuel_type text,
  vin text,
  body_type text,
  color text,
  nickname text,
  current_mileage integer,
  last_mileage_update timestamptz DEFAULT now(),
  location_zip text,
  purchase_date date,
  purchase_price numeric,
  purchase_mileage integer,
  driving_style text DEFAULT 'normal',
  annual_mileage_estimate integer DEFAULT 12000,
  usage_type text DEFAULT 'commuter',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique index to prevent duplicate vehicles per user
CREATE UNIQUE INDEX idx_user_vehicles_unique
  ON public.user_vehicles(user_id, year, make, model, COALESCE(trim, ''));

-- 2. Maintenance records
CREATE TABLE public.maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.user_vehicles(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  service_date date NOT NULL,
  mileage_at_service integer,
  cost numeric,
  shop_name text,
  shop_location text,
  description text,
  notes text,
  next_service_due_mileage integer,
  next_service_due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Vehicle value history
CREATE TABLE public.vehicle_value_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.user_vehicles(id) ON DELETE CASCADE,
  estimated_value numeric NOT NULL,
  confidence_score integer DEFAULT 85,
  source text DEFAULT 'calculated',
  repair_cost_context numeric,
  cost_ratio numeric,
  recommendation_type text,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_user_vehicles_user ON public.user_vehicles(user_id, is_active);
CREATE INDEX idx_maintenance_vehicle ON public.maintenance_records(vehicle_id, service_date DESC);
CREATE INDEX idx_value_history_vehicle ON public.vehicle_value_history(vehicle_id, recorded_at DESC);

-- RLS
ALTER TABLE public.user_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_value_history ENABLE ROW LEVEL SECURITY;

-- user_vehicles policies
CREATE POLICY "Users can view own vehicles" ON public.user_vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vehicles" ON public.user_vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vehicles" ON public.user_vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vehicles" ON public.user_vehicles FOR DELETE USING (auth.uid() = user_id);

-- maintenance_records policies
CREATE POLICY "Users can view own maintenance" ON public.maintenance_records FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_vehicles WHERE user_vehicles.id = maintenance_records.vehicle_id AND user_vehicles.user_id = auth.uid()));
CREATE POLICY "Users can insert own maintenance" ON public.maintenance_records FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_vehicles WHERE user_vehicles.id = maintenance_records.vehicle_id AND user_vehicles.user_id = auth.uid()));
CREATE POLICY "Users can update own maintenance" ON public.maintenance_records FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_vehicles WHERE user_vehicles.id = maintenance_records.vehicle_id AND user_vehicles.user_id = auth.uid()));
CREATE POLICY "Users can delete own maintenance" ON public.maintenance_records FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.user_vehicles WHERE user_vehicles.id = maintenance_records.vehicle_id AND user_vehicles.user_id = auth.uid()));

-- vehicle_value_history policies
CREATE POLICY "Users can view own value history" ON public.vehicle_value_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_vehicles WHERE user_vehicles.id = vehicle_value_history.vehicle_id AND user_vehicles.user_id = auth.uid()));
CREATE POLICY "Users can insert own value history" ON public.vehicle_value_history FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_vehicles WHERE user_vehicles.id = vehicle_value_history.vehicle_id AND user_vehicles.user_id = auth.uid()));

-- Admin policies
CREATE POLICY "Admins can manage all vehicles" ON public.user_vehicles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all maintenance" ON public.maintenance_records FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all value history" ON public.vehicle_value_history FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Triggers
CREATE TRIGGER update_user_vehicles_updated_at BEFORE UPDATE ON public.user_vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maintenance_records_updated_at BEFORE UPDATE ON public.maintenance_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
