-- Fix: RLS policy for itinerary_items fails because subquery on itineraries goes through RLS
-- Solution: Use SECURITY DEFINER function to check itinerary access without RLS recursion

-- ============================================
-- Phase 1: Create helper function to check itinerary access without RLS
-- ============================================

-- This function checks if the current user has access to an itinerary's organization
-- It runs with SECURITY DEFINER to bypass RLS on the itineraries table
CREATE OR REPLACE FUNCTION user_has_itinerary_access(itinerary_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    v_org_id UUID;
BEGIN
    -- Get the organization_id from the itinerary (bypassing RLS)
    SELECT organization_id INTO v_org_id
    FROM itineraries
    WHERE id = itinerary_id_param;
    
    -- If itinerary doesn't exist, deny access
    IF v_org_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user has access to this organization
    RETURN user_has_org_access(v_org_id);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION user_has_itinerary_access(UUID) TO authenticated;

-- ============================================
-- Phase 2: Drop existing itinerary_items policies
-- ============================================

DROP POLICY IF EXISTS "Org members can view itinerary_items" ON itinerary_items;
DROP POLICY IF EXISTS "Org members can insert itinerary_items" ON itinerary_items;
DROP POLICY IF EXISTS "Org members can update itinerary_items" ON itinerary_items;
DROP POLICY IF EXISTS "Org members can delete itinerary_items" ON itinerary_items;
DROP POLICY IF EXISTS "Public can view shared itinerary_items" ON itinerary_items;
DROP POLICY IF EXISTS "Public can view items for shared itineraries" ON itinerary_items;

-- ============================================
-- Phase 3: Recreate policies using the helper function
-- This avoids RLS recursion when checking itinerary access
-- ============================================

-- SELECT: Org members can view items from their org's itineraries
CREATE POLICY "Org members can view itinerary_items" ON itinerary_items
    FOR SELECT USING (
        user_has_itinerary_access(itinerary_id)
    );

-- SELECT: Public can view items from shared itineraries
CREATE POLICY "Public can view items for shared itineraries" ON itinerary_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM itineraries i
            WHERE i.id = itinerary_items.itinerary_id
            AND i.share_token IS NOT NULL
        )
    );

-- INSERT: Org members can insert items to their org's itineraries
CREATE POLICY "Org members can insert itinerary_items" ON itinerary_items
    FOR INSERT WITH CHECK (
        user_has_itinerary_access(itinerary_id)
    );

-- UPDATE: Org members can update items in their org's itineraries
CREATE POLICY "Org members can update itinerary_items" ON itinerary_items
    FOR UPDATE USING (
        user_has_itinerary_access(itinerary_id)
    );

-- DELETE: Org members can delete items from their org's itineraries
CREATE POLICY "Org members can delete itinerary_items" ON itinerary_items
    FOR DELETE USING (
        user_has_itinerary_access(itinerary_id)
    );

-- ============================================
-- Verification comment
-- ============================================
-- The issue was that itinerary_items policies did:
--   EXISTS (SELECT 1 FROM itineraries WHERE itineraries.id = itinerary_items.itinerary_id AND user_has_org_access(...))
-- 
-- This SELECT on itineraries went through itineraries' RLS, which could cause issues.
-- 
-- The fix uses user_has_itinerary_access() which is SECURITY DEFINER,
-- meaning it bypasses RLS when reading from itineraries to get the organization_id.

