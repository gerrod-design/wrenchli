
CREATE OR REPLACE FUNCTION public.check_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  recent_count integer;
  email_val text;
  email_col text;
  max_per_window integer := 5;
  window_interval interval := '15 minutes';
BEGIN
  -- Determine the email column name for this table
  email_col := CASE TG_TABLE_NAME
    WHEN 'shop_recommendations' THEN 'recommender_email'
    WHEN 'quote_requests' THEN 'customer_email'
    ELSE 'email'
  END;

  -- Dynamically get the email value using the column name
  EXECUTE format('SELECT ($1).%I', email_col) INTO email_val USING NEW;

  -- Skip rate limiting if no email provided
  IF email_val IS NULL OR email_val = '' THEN
    RETURN NEW;
  END IF;

  -- Count recent submissions from this email
  EXECUTE format(
    'SELECT count(*) FROM %I WHERE %I = $1 AND created_at > now() - $2',
    TG_TABLE_NAME,
    email_col
  ) INTO recent_count USING email_val, window_interval;

  IF recent_count >= max_per_window THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;

  RETURN NEW;
END;
$$;
