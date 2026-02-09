
-- Explicitly deny UPDATE and DELETE on all three form tables for everyone
-- (even authenticated users, unless they're admin)

-- waitlist_signups
CREATE POLICY "Only admins can update waitlist signups"
  ON public.waitlist_signups FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete waitlist signups"
  ON public.waitlist_signups FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- contact_submissions
CREATE POLICY "Only admins can update contact submissions"
  ON public.contact_submissions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete contact submissions"
  ON public.contact_submissions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- shop_applications
CREATE POLICY "Only admins can update shop applications"
  ON public.shop_applications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete shop applications"
  ON public.shop_applications FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Replace the permissive INSERT policies with restrictive ones scoped to anon
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
DROP POLICY IF EXISTS "Anyone can submit shop application" ON public.shop_applications;
DROP POLICY IF EXISTS "Anyone can submit waitlist signup" ON public.waitlist_signups;

CREATE POLICY "Anon can submit contact form"
  ON public.contact_submissions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can submit shop application"
  ON public.shop_applications FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can submit waitlist signup"
  ON public.waitlist_signups FOR INSERT
  TO anon
  WITH CHECK (true);

-- Also allow authenticated users to insert (in case forms are used while logged in)
CREATE POLICY "Authenticated can submit contact form"
  ON public.contact_submissions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can submit shop application"
  ON public.shop_applications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can submit waitlist signup"
  ON public.waitlist_signups FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- user_roles: deny INSERT/UPDATE/DELETE to non-admins
CREATE POLICY "Only admins can insert user_roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update user_roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete user_roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
