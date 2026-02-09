-- Remove the overly permissive anonymous update policy
DROP POLICY IF EXISTS "Anon can update own quote request" ON public.quote_requests;