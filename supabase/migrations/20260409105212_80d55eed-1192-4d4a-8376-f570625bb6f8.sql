ALTER TABLE public.accuracy_alerts
ADD COLUMN IF NOT EXISTS threshold numeric(5,2) DEFAULT 60.00;