CREATE OR REPLACE FUNCTION validate_diagnosis_record_ownership()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.diagnosis_record_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM diagnosis_records dr
      WHERE dr.id = NEW.diagnosis_record_id
    ) THEN
      RAISE EXCEPTION 'diagnosis_record_id does not belong to this shop';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE TRIGGER validate_shop_job_diagnosis
  BEFORE INSERT OR UPDATE ON shop_jobs
  FOR EACH ROW EXECUTE FUNCTION validate_diagnosis_record_ownership();