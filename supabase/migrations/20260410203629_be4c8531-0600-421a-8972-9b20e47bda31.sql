
-- Drop existing INSERT and UPDATE policies that allow self-assignment
DROP POLICY IF EXISTS "Only admins can insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update user_roles" ON public.user_roles;

-- Service role is the only way to grant or modify roles
-- (service_role already has full access via the existing "Service role full access" policy,
--  so no new INSERT/UPDATE policies are needed for authenticated users)
