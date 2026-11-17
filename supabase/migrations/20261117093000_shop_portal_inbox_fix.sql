-- Fix get_shop_inbox (2026-11-17): the referrals aggregate
-- ordered by item.sent_at, but item is the jsonb value, not a
-- table; the subquery's sent_at column is the sort key. Caught
-- by the live proof call (PostgREST 42P01).

CREATE OR REPLACE FUNCTION public.get_shop_inbox()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_shop uuid := public.my_shop_id();
  v_result jsonb;
BEGIN
  IF v_shop IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_shop_account');
  END IF;

  SELECT jsonb_build_object(
    'ok', true,
    'shop', (SELECT jsonb_build_object(
               'id', sp.id, 'name', sp.name, 'city', sp.city,
               'state', sp.state, 'phone', sp.phone)
             FROM public.service_providers sp WHERE sp.id = v_shop),
    'counts', (SELECT jsonb_build_object(
               'received', count(*),
               'accepted', count(*) FILTER (WHERE sr.status IN ('accepted','outcome_reported','completed','not_completed')),
               'completed', count(*) FILTER (WHERE sr.status = 'completed'),
               'owner_confirmed', count(*) FILTER (WHERE sr.status = 'completed' AND sr.completion_confirmed_by = 'owner'))
             FROM public.shop_referrals sr
             WHERE sr.shop_id = v_shop AND sr.referral_kind = 'repair'),
    'referrals', COALESCE((SELECT jsonb_agg(item ORDER BY sent_at DESC)
             FROM (SELECT jsonb_build_object(
               'id', sr.id,
               'status', sr.status,
               'sent_at', sr.sent_at,
               'responded_at', sr.responded_at,
               'window_expires_at', sr.window_expires_at,
               'outcome_reported_at', sr.outcome_reported_at,
               'completion_confirmed_by', sr.completion_confirmed_by,
               'vehicle_year', rp.vehicle_year,
               'vehicle_make', rp.vehicle_make,
               'vehicle_model', rp.vehicle_model,
               'diagnosis_title', rp.diagnosis_title,
               'diagnosis_urgency', rp.diagnosis_urgency,
               'estimated_cost_low', rp.estimated_cost_low,
               'estimated_cost_high', rp.estimated_cost_high,
               'metro_area', rp.metro_area
             ) AS item, sr.sent_at AS sent_at
             FROM public.shop_referrals sr
             JOIN public.referral_packages rp ON rp.id = sr.package_id
             WHERE sr.shop_id = v_shop AND sr.referral_kind = 'repair'
             ) s), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
