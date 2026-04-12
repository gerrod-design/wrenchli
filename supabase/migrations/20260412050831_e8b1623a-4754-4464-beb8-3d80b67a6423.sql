CREATE OR REPLACE FUNCTION prevent_shop_id_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.shop_id <> OLD.shop_id THEN
    RAISE EXCEPTION 'shop_id cannot be reassigned';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;