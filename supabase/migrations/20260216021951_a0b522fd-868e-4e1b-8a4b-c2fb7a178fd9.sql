
ALTER TABLE public.notification_preferences
ADD COLUMN email_maintenance boolean NOT NULL DEFAULT true,
ADD COLUMN inapp_maintenance boolean NOT NULL DEFAULT true,
ADD COLUMN email_market_value boolean NOT NULL DEFAULT true,
ADD COLUMN inapp_market_value boolean NOT NULL DEFAULT true;
