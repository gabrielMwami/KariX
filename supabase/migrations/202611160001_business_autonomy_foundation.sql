-- KariX: business autonomy foundation
-- Apply manually in Supabase SQL Editor after reviewing this migration.
-- Existing business rows are deliberately backfilled as legacy and remain unpublished.
-- No streets, access points, products, or existing business records are deleted or rewritten.

BEGIN;

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS submission_source text NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS claim_status text NOT NULL DEFAULT 'unclaimed';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.businesses'::regclass
      AND conname = 'businesses_submission_source_check'
  ) THEN
    ALTER TABLE public.businesses
      ADD CONSTRAINT businesses_submission_source_check
      CHECK (submission_source IN ('community', 'trader', 'staff', 'legacy'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.businesses'::regclass
      AND conname = 'businesses_claim_status_check'
  ) THEN
    ALTER TABLE public.businesses
      ADD CONSTRAINT businesses_claim_status_check
      CHECK (claim_status IN ('unclaimed', 'claimed', 'disputed'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.business_memberships (
  membership_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(business_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'manager', 'editor')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id)
);

CREATE INDEX IF NOT EXISTS business_memberships_user_idx
  ON public.business_memberships(user_id, status);
CREATE INDEX IF NOT EXISTS business_memberships_business_idx
  ON public.business_memberships(business_id, status);

CREATE TABLE IF NOT EXISTS public.business_claims (
  claim_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(business_id) ON DELETE CASCADE,
  claimant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(evidence) = 'object'),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL)
    OR
    (status <> 'pending' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_claims_business_idx
  ON public.business_claims(business_id, status);
CREATE INDEX IF NOT EXISTS business_claims_claimant_idx
  ON public.business_claims(claimant_id, created_at DESC);

-- A trader creating their own business receives owner membership automatically.
-- Community-submitted businesses are published but remain unclaimed.
CREATE OR REPLACE FUNCTION public.karix_assign_business_creator_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.submission_source = 'trader' AND NEW.created_by IS NOT NULL THEN
    INSERT INTO public.business_memberships
      (business_id, user_id, role, status, granted_by)
    VALUES
      (NEW.business_id, NEW.created_by, 'owner', 'active', NEW.created_by)
    ON CONFLICT (business_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS businesses_assign_creator_membership ON public.businesses;
CREATE TRIGGER businesses_assign_creator_membership
AFTER INSERT ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.karix_assign_business_creator_membership();

-- Protect verification, attribution and claim state from ordinary owner edits.
CREATE OR REPLACE FUNCTION public.karix_protect_business_control_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'service_role') AND (
    NEW.status IS DISTINCT FROM OLD.status
    OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
    OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
    OR NEW.created_by IS DISTINCT FROM OLD.created_by
    OR NEW.submission_source IS DISTINCT FROM OLD.submission_source
    OR NEW.claim_status IS DISTINCT FROM OLD.claim_status
  ) THEN
    RAISE EXCEPTION 'Verification, attribution and claim fields are controlled by KariX moderation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS businesses_protect_control_fields ON public.businesses;
CREATE TRIGGER businesses_protect_control_fields
BEFORE UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.karix_protect_business_control_fields();

ALTER TABLE public.business_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their business memberships" ON public.business_memberships;
CREATE POLICY "Users can view their business memberships"
ON public.business_memberships
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.business_memberships viewer
    WHERE viewer.business_id = business_memberships.business_id
      AND viewer.user_id = (SELECT auth.uid())
      AND viewer.status = 'active'
  )
);

-- Membership writes are intentionally not exposed to clients. Automatic owner grants
-- happen through the trigger; claim approvals/membership invitations are privileged workflows.

DROP POLICY IF EXISTS "Users can view their business claims" ON public.business_claims;
CREATE POLICY "Users can view their business claims"
ON public.business_claims
FOR SELECT
TO authenticated
USING (claimant_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can request business claims" ON public.business_claims;
CREATE POLICY "Authenticated users can request business claims"
ON public.business_claims
FOR INSERT
TO authenticated
WITH CHECK (
  claimant_id = (SELECT auth.uid())
  AND status = 'pending'
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.business_id = business_claims.business_id
      AND b.is_published = true
      AND b.claim_status = 'unclaimed'
  )
);

-- Public discovery: published businesses can be found before formal verification.
-- Existing verified-business visibility is preserved.
DROP POLICY IF EXISTS "Public can view verified businesses" ON public.businesses;
CREATE POLICY "Public can view published businesses"
ON public.businesses
FOR SELECT
TO anon, authenticated
USING (is_published = true OR status = 'verified');

-- Authenticated community members can publish a new unclaimed business immediately.
DROP POLICY IF EXISTS "Authenticated users can submit community businesses" ON public.businesses;
CREATE POLICY "Authenticated users can submit community businesses"
ON public.businesses
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = (SELECT auth.uid())
  AND is_published = true
  AND submission_source = 'community'
  AND claim_status = 'unclaimed'
  AND status = 'pending'
  AND verified_at IS NULL
  AND verified_by IS NULL
);

-- Traders can create and publish their own business; owner membership is automatic.
DROP POLICY IF EXISTS "Traders can register their own businesses" ON public.businesses;
CREATE POLICY "Traders can register their own businesses"
ON public.businesses
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = (SELECT auth.uid())
  AND is_published = true
  AND submission_source = 'trader'
  AND claim_status = 'claimed'
  AND status = 'pending'
  AND verified_at IS NULL
  AND verified_by IS NULL
);

-- Existing members can edit business profile details. Protected control fields are
-- separately guarded by the trigger above.
DROP POLICY IF EXISTS "Business members can update their business profiles" ON public.businesses;
CREATE POLICY "Business members can update their business profiles"
ON public.businesses
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.business_memberships m
    WHERE m.business_id = businesses.business_id
      AND m.user_id = (SELECT auth.uid())
      AND m.status = 'active'
      AND m.role IN ('owner', 'manager', 'editor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.business_memberships m
    WHERE m.business_id = businesses.business_id
      AND m.user_id = (SELECT auth.uid())
      AND m.status = 'active'
      AND m.role IN ('owner', 'manager', 'editor')
  )
);

-- Category associations are visible when the parent business is published,
-- not only after it is marked verified.
DROP POLICY IF EXISTS "Public can view verified business categories" ON public.business_categories;
CREATE POLICY "Public can view published business categories"
ON public.business_categories
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.business_id = business_categories.business_id
      AND (b.is_published = true OR b.status = 'verified')
  )
  AND EXISTS (
    SELECT 1 FROM public.categories c
    WHERE c.category_id = business_categories.category_id
      AND c.is_active = true
  )
);

COMMIT;
