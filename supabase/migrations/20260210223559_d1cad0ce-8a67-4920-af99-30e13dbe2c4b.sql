
-- Reusable rate-limit function: max N inserts per email per interval
CREATE OR REPLACE FUNCTION public.check_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  recent_count integer;
  email_val text;
  max_per_window integer := 5;
  window_interval interval := '15 minutes';
BEGIN
  -- Extract email from the appropriate column
  email_val := CASE TG_TABLE_NAME
    WHEN 'contact_submissions' THEN NEW.email
    WHEN 'waitlist_signups' THEN NEW.email
    WHEN 'shop_applications' THEN NEW.email
    WHEN 'shop_recommendations' THEN NEW.recommender_email
    WHEN 'quote_requests' THEN NEW.customer_email
    ELSE NULL
  END;

  -- Skip rate limiting if no email provided
  IF email_val IS NULL OR email_val = '' THEN
    RETURN NEW;
  END IF;

  -- Count recent submissions from this email
  EXECUTE format(
    'SELECT count(*) FROM %I WHERE %I = $1 AND created_at > now() - $2',
    TG_TABLE_NAME,
    CASE TG_TABLE_NAME
      WHEN 'shop_recommendations' THEN 'recommender_email'
      WHEN 'quote_requests' THEN 'customer_email'
      ELSE 'email'
    END
  ) INTO recent_count USING email_val, window_interval;

  IF recent_count >= max_per_window THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;

  RETURN NEW;
END;
$$;

-- Apply trigger to each public-insert table
CREATE TRIGGER rate_limit_contact
  BEFORE INSERT ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.check_rate_limit();

CREATE TRIGGER rate_limit_waitlist
  BEFORE INSERT ON public.waitlist_signups
  FOR EACH ROW EXECUTE FUNCTION public.check_rate_limit();

CREATE TRIGGER rate_limit_shop_applications
  BEFORE INSERT ON public.shop_applications
  FOR EACH ROW EXECUTE FUNCTION public.check_rate_limit();

CREATE TRIGGER rate_limit_shop_recommendations
  BEFORE INSERT ON public.shop_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.check_rate_limit();

CREATE TRIGGER rate_limit_quote_requests
  BEFORE INSERT ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.check_rate_limit();
