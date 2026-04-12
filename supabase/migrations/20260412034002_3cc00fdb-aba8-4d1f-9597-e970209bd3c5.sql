-- Block all client-side inserts on user_roles; only service_role can insert
CREATE POLICY "Only service role can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated, anon
WITH CHECK (false);
