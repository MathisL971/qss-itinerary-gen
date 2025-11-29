-- Security Fix: Add Soft Delete Filtering to RLS Policies
-- This migration updates SELECT policies to exclude soft-deleted records
-- ensuring that deleted_at IS NULL for all SELECT operations

-- ============================================
-- Phase 1: Drop existing SELECT policies
-- ============================================

-- Clients
DROP POLICY IF EXISTS "Org members can view clients" ON clients;
DROP POLICY IF EXISTS "Public can view clients for shared itineraries" ON clients;

-- Accommodations
DROP POLICY IF EXISTS "Org members can view accommodations" ON accommodations;
DROP POLICY IF EXISTS "Public can view accommodations for shared itineraries" ON accommodations;

-- Stays
DROP POLICY IF EXISTS "Org members can view stays" ON stays;
DROP POLICY IF EXISTS "Public can view stays for shared itineraries" ON stays;

-- Service Categories
DROP POLICY IF EXISTS "Org members can view service_categories" ON service_categories;

-- Service Providers
DROP POLICY IF EXISTS "Org members can view service_providers" ON service_providers;
DROP POLICY IF EXISTS "Public can view service_providers for shared itineraries" ON service_providers;

-- Services
DROP POLICY IF EXISTS "Org members can view services" ON services;
DROP POLICY IF EXISTS "Public can view services for shared itineraries" ON services;

-- ============================================
-- Phase 2: Recreate SELECT policies with soft delete filtering
-- ============================================

-- Clients: Organization-based access + soft delete filter
CREATE POLICY "Org members can view clients" ON clients
    FOR SELECT USING (
        user_has_org_access(organization_id)
        AND deleted_at IS NULL
    );

CREATE POLICY "Public can view clients for shared itineraries" ON clients
    FOR SELECT USING (
        deleted_at IS NULL
        AND EXISTS (
            SELECT 1 FROM stays s
            JOIN itineraries i ON i.stay_id = s.id
            WHERE s.client_id = clients.id
            AND i.share_token IS NOT NULL
        )
    );

-- Accommodations: Organization-based access + soft delete filter
CREATE POLICY "Org members can view accommodations" ON accommodations
    FOR SELECT USING (
        user_has_org_access(organization_id)
        AND deleted_at IS NULL
    );

CREATE POLICY "Public can view accommodations for shared itineraries" ON accommodations
    FOR SELECT USING (
        deleted_at IS NULL
        AND EXISTS (
            SELECT 1 FROM stays s
            JOIN itineraries i ON i.stay_id = s.id
            WHERE s.accommodation_id = accommodations.id
            AND i.share_token IS NOT NULL
        )
    );

-- Stays: Organization-based access + soft delete filter
CREATE POLICY "Org members can view stays" ON stays
    FOR SELECT USING (
        user_has_org_access(organization_id)
        AND deleted_at IS NULL
    );

CREATE POLICY "Public can view stays for shared itineraries" ON stays
    FOR SELECT USING (
        deleted_at IS NULL
        AND EXISTS (
            SELECT 1 FROM itineraries i
            WHERE i.stay_id = stays.id
            AND i.share_token IS NOT NULL
        )
    );

-- Service Categories: Organization-based access + soft delete filter
CREATE POLICY "Org members can view service_categories" ON service_categories
    FOR SELECT USING (
        user_has_org_access(organization_id)
        AND deleted_at IS NULL
    );

-- Service Providers: Organization-based access + soft delete filter
CREATE POLICY "Org members can view service_providers" ON service_providers
    FOR SELECT USING (
        user_has_org_access(organization_id)
        AND deleted_at IS NULL
    );

CREATE POLICY "Public can view service_providers for shared itineraries" ON service_providers
    FOR SELECT USING (
        deleted_at IS NULL
        AND EXISTS (
            SELECT 1 FROM itinerary_items ii
            JOIN itineraries i ON i.id = ii.itinerary_id
            WHERE (ii.service_provider_id = service_providers.id
                OR EXISTS (
                    SELECT 1 FROM services svc 
                    WHERE svc.id = ii.service_id 
                    AND svc.service_provider_id = service_providers.id
                ))
            AND i.share_token IS NOT NULL
        )
    );

-- Services: Access via provider's organization + soft delete filter
CREATE POLICY "Org members can view services" ON services
    FOR SELECT USING (
        deleted_at IS NULL
        AND EXISTS (
            SELECT 1 FROM service_providers sp
            WHERE sp.id = services.service_provider_id
            AND user_has_org_access(sp.organization_id)
        )
    );

CREATE POLICY "Public can view services for shared itineraries" ON services
    FOR SELECT USING (
        deleted_at IS NULL
        AND EXISTS (
            SELECT 1 FROM itinerary_items ii
            JOIN itineraries i ON i.id = ii.itinerary_id
            WHERE ii.service_id = services.id
            AND i.share_token IS NOT NULL
        )
    );

-- ============================================
-- Note: INSERT, UPDATE, DELETE policies remain unchanged
-- They use user_has_org_access() without soft delete filter
-- since those operations should work on the record regardless
-- ============================================

