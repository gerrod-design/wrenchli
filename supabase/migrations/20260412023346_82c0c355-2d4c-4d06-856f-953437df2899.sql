
-- ============================================================
-- FIX 1: Prevent shop account hijacking
-- Replace the INSERT policy with one that validates shop ownership
-- via the shops table owner_user_id column.
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own shop account" ON public.shop_accounts;

CREATE POLICY "Users can insert own shop account"
  ON public.shop_accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = shop_id AND s.owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- FIX 2: Remove public SELECT on base shops table
-- The shops_public view (which excludes email/phone) is the
-- only public-facing read path. Shop owners and admins retain
-- access via their existing policies.
-- ============================================================
DROP POLICY IF EXISTS "Public can read active shops via view" ON public.shops;
