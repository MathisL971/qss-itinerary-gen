-- Fix: Infinite recursion in service_providers RLS policy
-- The issue: service_providers policy queries services, but services policy queries service_providers
-- Solution: Use SECURITY DEFINER functions to bypass RLS during policy evaluation

-- ============================================
-- Phase 1: Create helper function to check service-provider relationship without RLS
-- ============================================

-- This function checks if a service_provider_id is linked to any service used in a shared itinerary
-- It runs with SECURITY DEFINER to bypass RLS on the services table
CREATE OR REPLACE FUNCTION service_provider_has_shared_itinerary_service(provider_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM services svc
        JOIN itinerary_items ii ON ii.service_id = svc.id
        JOIN itineraries i ON i.id = ii.itinerary_id
        WHERE svc.service_provider_id = provider_id
        AND i.share_token IS NOT NULL
    );
$$;

-- Grant execute to all roles that might need it
GRANT EXECUTE ON FUNCTION service_provider_has_shared_itinerary_service(UUID) TO anon;
GRANT EXECUTE ON FUNCTION service_provider_has_shared_itinerary_service(UUID) TO authenticated;

-- ============================================
-- Phase 2: Drop the problematic policy
-- ============================================

DROP POLICY IF EXISTS "Public can view service_providers for shared itineraries" ON service_providers;

-- ============================================
-- Phase 3: Recreate the policy using the helper function
-- This avoids the recursive RLS check on services
-- ============================================

CREATE POLICY "Public can view service_providers for shared itineraries" ON service_providers
    FOR SELECT USING (
        deleted_at IS NULL
        AND (
            -- Direct link: service_provider is directly on an itinerary item
            EXISTS (
                SELECT 1 FROM itinerary_items ii
                JOIN itineraries i ON i.id = ii.itinerary_id
                WHERE ii.service_provider_id = service_providers.id
                AND i.share_token IS NOT NULL
            )
            OR
            -- Indirect link: service_provider owns a service used in a shared itinerary
            -- Using SECURITY DEFINER function to avoid RLS recursion
            service_provider_has_shared_itinerary_service(service_providers.id)
        )
    );

-- ============================================
-- Verification comment
-- ============================================
-- The recursion was:
-- 1. SELECT services → triggers "Org members can view services" policy
-- 2. That policy does: SELECT FROM service_providers WHERE ... 
-- 3. service_providers RLS triggers "Public can view service_providers for shared itineraries"
-- 4. That policy did: SELECT FROM services WHERE svc.service_provider_id = ...
-- 5. Back to step 1 → INFINITE RECURSION
--
-- The fix uses service_provider_has_shared_itinerary_service() which is SECURITY DEFINER,
-- meaning it runs as the function owner and bypasses RLS on the services table.

