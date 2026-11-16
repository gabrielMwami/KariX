-- KariX trader product and inventory management
-- Traders can publish active listings against the existing product catalogue.
-- No new catalogue products or price fields are introduced in this migration.

BEGIN;

ALTER TABLE public.business_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business members can view their listings" ON public.business_products;
CREATE POLICY "Business members can view their listings"
ON public.business_products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.business_memberships m
    WHERE m.business_id = business_products.business_id
      AND m.user_id = (SELECT auth.uid())
      AND m.status = 'active'
      AND m.role IN ('owner', 'manager', 'editor')
  )
);

DROP POLICY IF EXISTS "Business members can create listings" ON public.business_products;
CREATE POLICY "Business members can create listings"
ON public.business_products
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = (SELECT auth.uid())
  AND listing_status = 'active'
  AND EXISTS (
    SELECT 1
    FROM public.businesses b
    JOIN public.business_memberships m
      ON m.business_id = b.business_id
    WHERE b.business_id = business_products.business_id
      AND b.is_published = true
      AND m.user_id = (SELECT auth.uid())
      AND m.status = 'active'
      AND m.role IN ('owner', 'manager', 'editor')
  )
  AND EXISTS (
    SELECT 1
    FROM public.products p
    WHERE p.product_id = business_products.product_id
      AND p.is_active = true
  )
);

DROP POLICY IF EXISTS "Business members can update listings" ON public.business_products;
CREATE POLICY "Business members can update listings"
ON public.business_products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.business_memberships m
    WHERE m.business_id = business_products.business_id
      AND m.user_id = (SELECT auth.uid())
      AND m.status = 'active'
      AND m.role IN ('owner', 'manager', 'editor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.businesses b
    JOIN public.business_memberships m
      ON m.business_id = b.business_id
    WHERE b.business_id = business_products.business_id
      AND b.is_published = true
      AND m.user_id = (SELECT auth.uid())
      AND m.status = 'active'
      AND m.role IN ('owner', 'manager', 'editor')
  )
);

-- Keep listing identity and original contributor attribution immutable to members.
CREATE OR REPLACE FUNCTION public.karix_protect_business_product_identity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'service_role') AND (
    NEW.business_id IS DISTINCT FROM OLD.business_id
    OR NEW.product_id IS DISTINCT FROM OLD.product_id
    OR NEW.created_by IS DISTINCT FROM OLD.created_by
  ) THEN
    RAISE EXCEPTION 'Listing business, product and creator attribution cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS business_products_protect_identity ON public.business_products;
CREATE TRIGGER business_products_protect_identity
BEFORE UPDATE ON public.business_products
FOR EACH ROW
EXECUTE FUNCTION public.karix_protect_business_product_identity();

COMMIT;
