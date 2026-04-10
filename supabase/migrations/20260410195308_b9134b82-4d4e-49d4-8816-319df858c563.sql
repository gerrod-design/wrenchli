
-- 1. Tighten user_roles INSERT: admin can only insert roles for themselves
DROP POLICY IF EXISTS "Only admins can insert user_roles" ON public.user_roles;
CREATE POLICY "Only admins can insert user_roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    AND user_id = auth.uid()
  );

-- 2. Add user_id to api_keys for ownership scoping
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS user_id uuid;

-- 3. Replace blanket admin policy with scoped policies
DROP POLICY IF EXISTS "Admins can manage api_keys" ON public.api_keys;

CREATE POLICY "Users can view own api_keys"
  ON public.api_keys FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own api_keys"
  ON public.api_keys FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api_keys"
  ON public.api_keys FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own api_keys"
  ON public.api_keys FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
