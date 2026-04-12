CREATE OR REPLACE FUNCTION prevent_shop_id_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.shop_id <> OLD.shop_id THEN
    RAISE EXCEPTION 'shop_id cannot be reassigned';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lock_shop_id
  BEFORE UPDATE ON shop_accounts
  FOR EACH ROW EXECUTE FUNCTION prevent_shop_id_change();