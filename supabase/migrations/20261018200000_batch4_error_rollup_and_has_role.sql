-- Batch 4 (audit R-49 remainder): the client-error summary RPC answered only
-- a trailing ~65-minute window, so no 24-hour question could be asked of it.
-- Widen the window to 24 hours. Shape (error_type, reports, last_seen) and
-- SECURITY DEFINER posture are unchanged.
CREATE OR REPLACE FUNCTION public.get_client_error_summary()
 RETURNS TABLE(error_type text, reports bigint, last_seen timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT ce.error_type, count(*), max(ce.created_at)
  FROM public.client_errors ce
  WHERE ce.created_at > now() - interval '24 hours'
  GROUP BY ce.error_type
  ORDER BY count(*) DESC;
$function$;

-- Batch 4 (audit R-59): RLS policies on garage tables call
-- public.has_role(auth.uid(), 'admin') under policies granted to PUBLIC, so
-- anonymous PostgREST reads evaluate the function — but anon lacked EXECUTE,
-- turning an empty result into HTTP 401 "permission denied for function
-- has_role". has_role returns false for a null uid, so granting EXECUTE to
-- anon is safe and restores the honest empty set.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;
