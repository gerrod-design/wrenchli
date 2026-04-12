-- Drop the existing overly permissive INSERT policy on referral_packages
DROP POLICY IF EXISTS "Anon can insert referral packages" ON public.referral_packages;
DROP POLICY IF EXISTS "Anyone can insert referral packages" ON public.referral_packages;

-- Create restricted INSERT policy: authenticated users only, must own the row
CREATE POLICY "Authenticated users can insert referral packages"
ON public.referral_packages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
