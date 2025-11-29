-- Multi-tenancy: Organizations and Schema Changes
-- This migration adds organization support to the application

-- ============================================
-- Phase 1: Create Organization Tables
-- ============================================

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization members table (links users to organizations)
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Indexes for organization tables
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);

-- Trigger for organizations updated_at
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Phase 2: Add organization_id to existing tables
-- ============================================

-- Add organization_id column to clients (nullable first for migration)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add organization_id column to accommodations
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add organization_id column to stays
ALTER TABLE stays ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add organization_id column to itineraries
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add organization_id column to service_categories
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add organization_id column to service_providers
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- ============================================
-- Phase 3: Data Migration
-- ============================================

-- Create default organization for existing data
INSERT INTO organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'default')
ON CONFLICT (slug) DO NOTHING;

-- Migrate existing data to default organization
UPDATE clients SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE accommodations SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE stays SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE itineraries SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE service_categories SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE service_providers SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- Add all existing users as owners of the default organization
INSERT INTO organization_members (organization_id, user_id, role)
SELECT '00000000-0000-0000-0000-000000000001', id, 'owner'
FROM auth.users
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- ============================================
-- Phase 4: Add NOT NULL constraints
-- ============================================

ALTER TABLE clients ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE accommodations ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE stays ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE itineraries ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE service_categories ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE service_providers ALTER COLUMN organization_id SET NOT NULL;

-- ============================================
-- Phase 5: Add indexes for organization_id
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_accommodations_organization_id ON accommodations(organization_id);
CREATE INDEX IF NOT EXISTS idx_stays_organization_id ON stays(organization_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_organization_id ON itineraries(organization_id);
CREATE INDEX IF NOT EXISTS idx_service_categories_organization_id ON service_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_organization_id ON service_providers(organization_id);

-- ============================================
-- Phase 6: Helper function for RLS
-- ============================================

-- Function to check if current user has access to an organization
CREATE OR REPLACE FUNCTION user_has_org_access(org_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = org_id 
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is an owner of an organization
CREATE OR REPLACE FUNCTION user_is_org_owner(org_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = org_id 
        AND user_id = auth.uid()
        AND role = 'owner'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Phase 7: RLS Policies for Organizations
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can view organizations they belong to
CREATE POLICY "Users can view their organizations" ON organizations
    FOR SELECT USING (user_has_org_access(id));

-- Organizations: Authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations" ON organizations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Organizations: Owners can update their organizations
CREATE POLICY "Owners can update their organizations" ON organizations
    FOR UPDATE USING (user_is_org_owner(id));

-- Organizations: Owners can delete their organizations
CREATE POLICY "Owners can delete their organizations" ON organizations
    FOR DELETE USING (user_is_org_owner(id));

-- Organization Members: Users can view members of orgs they belong to
CREATE POLICY "Users can view org members" ON organization_members
    FOR SELECT USING (user_has_org_access(organization_id));

-- Organization Members: Owners can add members
CREATE POLICY "Owners can add org members" ON organization_members
    FOR INSERT WITH CHECK (
        user_is_org_owner(organization_id) 
        OR (
            -- Allow users to add themselves when creating a new org
            auth.uid() = user_id 
            AND role = 'owner'
            AND NOT EXISTS (
                SELECT 1 FROM organization_members om 
                WHERE om.organization_id = organization_members.organization_id
            )
        )
    );

-- Organization Members: Owners can update member roles
CREATE POLICY "Owners can update org members" ON organization_members
    FOR UPDATE USING (user_is_org_owner(organization_id));

-- Organization Members: Owners can remove members, or members can remove themselves
CREATE POLICY "Owners can remove org members or self-remove" ON organization_members
    FOR DELETE USING (
        user_is_org_owner(organization_id) 
        OR auth.uid() = user_id
    );

-- ============================================
-- Phase 8: Update RLS Policies for Existing Tables
-- ============================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view clients" ON clients;
DROP POLICY IF EXISTS "Users can insert clients" ON clients;
DROP POLICY IF EXISTS "Users can update clients" ON clients;
DROP POLICY IF EXISTS "Users can delete clients" ON clients;

DROP POLICY IF EXISTS "Users can view accommodations" ON accommodations;
DROP POLICY IF EXISTS "Users can insert accommodations" ON accommodations;
DROP POLICY IF EXISTS "Users can update accommodations" ON accommodations;
DROP POLICY IF EXISTS "Users can delete accommodations" ON accommodations;

DROP POLICY IF EXISTS "Users can view stays" ON stays;
DROP POLICY IF EXISTS "Users can insert stays" ON stays;
DROP POLICY IF EXISTS "Users can update stays" ON stays;
DROP POLICY IF EXISTS "Users can delete stays" ON stays;

DROP POLICY IF EXISTS "Users can view their own itineraries" ON itineraries;
DROP POLICY IF EXISTS "Users can insert their own itineraries" ON itineraries;
DROP POLICY IF EXISTS "Users can update their own itineraries" ON itineraries;
DROP POLICY IF EXISTS "Users can delete their own itineraries" ON itineraries;
DROP POLICY IF EXISTS "Public can view shared itineraries" ON itineraries;

DROP POLICY IF EXISTS "Users can view service_categories" ON service_categories;
DROP POLICY IF EXISTS "Authenticated users can insert service_categories" ON service_categories;
DROP POLICY IF EXISTS "Authenticated users can update service_categories" ON service_categories;
DROP POLICY IF EXISTS "Authenticated users can delete service_categories" ON service_categories;

DROP POLICY IF EXISTS "Users can view service_providers" ON service_providers;
DROP POLICY IF EXISTS "Authenticated users can insert service_providers" ON service_providers;
DROP POLICY IF EXISTS "Authenticated users can update service_providers" ON service_providers;
DROP POLICY IF EXISTS "Authenticated users can delete service_providers" ON service_providers;

-- Clients: Organization-based access
CREATE POLICY "Org members can view clients" ON clients
    FOR SELECT USING (user_has_org_access(organization_id));

CREATE POLICY "Org members can insert clients" ON clients
    FOR INSERT WITH CHECK (user_has_org_access(organization_id));

CREATE POLICY "Org members can update clients" ON clients
    FOR UPDATE USING (user_has_org_access(organization_id));

CREATE POLICY "Org members can delete clients" ON clients
    FOR DELETE USING (user_has_org_access(organization_id));

-- Accommodations: Organization-based access
CREATE POLICY "Org members can view accommodations" ON accommodations
    FOR SELECT USING (user_has_org_access(organization_id));

CREATE POLICY "Org members can insert accommodations" ON accommodations
    FOR INSERT WITH CHECK (user_has_org_access(organization_id));

CREATE POLICY "Org members can update accommodations" ON accommodations
    FOR UPDATE USING (user_has_org_access(organization_id));

CREATE POLICY "Org members can delete accommodations" ON accommodations
    FOR DELETE USING (user_has_org_access(organization_id));

-- Stays: Organization-based access
CREATE POLICY "Org members can view stays" ON stays
    FOR SELECT USING (user_has_org_access(organization_id));

CREATE POLICY "Org members can insert stays" ON stays
    FOR INSERT WITH CHECK (user_has_org_access(organization_id));

CREATE POLICY "Org members can update stays" ON stays
    FOR UPDATE USING (user_has_org_access(organization_id));

CREATE POLICY "Org members can delete stays" ON stays
    FOR DELETE USING (user_has_org_access(organization_id));

-- Itineraries: Organization-based access + public share
CREATE POLICY "Org members can view itineraries" ON itineraries
    FOR SELECT USING (user_has_org_access(organization_id));

CREATE POLICY "Public can view shared itineraries" ON itineraries
    FOR SELECT USING (share_token IS NOT NULL);

CREATE POLICY "Org members can insert itineraries" ON itineraries
    FOR INSERT WITH CHECK (user_has_org_access(organization_id));

CREATE POLICY "Org members can update itineraries" ON itineraries
    FOR UPDATE USING (user_has_org_access(organization_id));

CREATE POLICY "Org members can delete itineraries" ON itineraries
    FOR DELETE USING (user_has_org_access(organization_id));

-- Service Categories: Organization-based access
CREATE POLICY "Org members can view service_categories" ON service_categories
    FOR SELECT USING (user_has_org_access(organization_id));

CREATE POLICY "Org members can insert service_categories" ON service_categories
    FOR INSERT WITH CHECK (user_has_org_access(organization_id));

CREATE POLICY "Org members can update service_categories" ON service_categories
    FOR UPDATE USING (user_has_org_access(organization_id));

CREATE POLICY "Org members can delete service_categories" ON service_categories
    FOR DELETE USING (user_has_org_access(organization_id));

-- Service Providers: Organization-based access
CREATE POLICY "Org members can view service_providers" ON service_providers
    FOR SELECT USING (user_has_org_access(organization_id));

CREATE POLICY "Org members can insert service_providers" ON service_providers
    FOR INSERT WITH CHECK (user_has_org_access(organization_id));

CREATE POLICY "Org members can update service_providers" ON service_providers
    FOR UPDATE USING (user_has_org_access(organization_id));

CREATE POLICY "Org members can delete service_providers" ON service_providers
    FOR DELETE USING (user_has_org_access(organization_id));

-- ============================================
-- Phase 9: Update itinerary_items policies
-- ============================================

-- Drop existing itinerary_items policies
DROP POLICY IF EXISTS "Users can view items from their own itineraries" ON itinerary_items;
DROP POLICY IF EXISTS "Public can view items from shared itineraries" ON itinerary_items;
DROP POLICY IF EXISTS "Users can insert items to their own itineraries" ON itinerary_items;
DROP POLICY IF EXISTS "Users can update items in their own itineraries" ON itinerary_items;
DROP POLICY IF EXISTS "Users can delete items from their own itineraries" ON itinerary_items;

-- Itinerary Items: Access based on parent itinerary's organization
CREATE POLICY "Org members can view itinerary_items" ON itinerary_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM itineraries
            WHERE itineraries.id = itinerary_items.itinerary_id
            AND user_has_org_access(itineraries.organization_id)
        )
    );

CREATE POLICY "Public can view shared itinerary_items" ON itinerary_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM itineraries
            WHERE itineraries.id = itinerary_items.itinerary_id
            AND itineraries.share_token IS NOT NULL
        )
    );

CREATE POLICY "Org members can insert itinerary_items" ON itinerary_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM itineraries
            WHERE itineraries.id = itinerary_items.itinerary_id
            AND user_has_org_access(itineraries.organization_id)
        )
    );

CREATE POLICY "Org members can update itinerary_items" ON itinerary_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM itineraries
            WHERE itineraries.id = itinerary_items.itinerary_id
            AND user_has_org_access(itineraries.organization_id)
        )
    );

CREATE POLICY "Org members can delete itinerary_items" ON itinerary_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM itineraries
            WHERE itineraries.id = itinerary_items.itinerary_id
            AND user_has_org_access(itineraries.organization_id)
        )
    );

-- ============================================
-- Phase 10: Update service_provider_contacts policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view service_provider_contacts" ON service_provider_contacts;
DROP POLICY IF EXISTS "Authenticated users can insert service_provider_contacts" ON service_provider_contacts;
DROP POLICY IF EXISTS "Authenticated users can update service_provider_contacts" ON service_provider_contacts;
DROP POLICY IF EXISTS "Authenticated users can delete service_provider_contacts" ON service_provider_contacts;

-- Service Provider Contacts: Access based on parent provider's organization
CREATE POLICY "Org members can view service_provider_contacts" ON service_provider_contacts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM service_providers
            WHERE service_providers.id = service_provider_contacts.service_provider_id
            AND user_has_org_access(service_providers.organization_id)
        )
    );

CREATE POLICY "Org members can insert service_provider_contacts" ON service_provider_contacts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM service_providers
            WHERE service_providers.id = service_provider_contacts.service_provider_id
            AND user_has_org_access(service_providers.organization_id)
        )
    );

CREATE POLICY "Org members can update service_provider_contacts" ON service_provider_contacts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM service_providers
            WHERE service_providers.id = service_provider_contacts.service_provider_id
            AND user_has_org_access(service_providers.organization_id)
        )
    );

CREATE POLICY "Org members can delete service_provider_contacts" ON service_provider_contacts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM service_providers
            WHERE service_providers.id = service_provider_contacts.service_provider_id
            AND user_has_org_access(service_providers.organization_id)
        )
    );

-- ============================================
-- Phase 11: Update services policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view services" ON services;
DROP POLICY IF EXISTS "Authenticated users can insert services" ON services;
DROP POLICY IF EXISTS "Authenticated users can update services" ON services;
DROP POLICY IF EXISTS "Authenticated users can delete services" ON services;

-- Services: Access based on parent provider's organization
CREATE POLICY "Org members can view services" ON services
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM service_providers
            WHERE service_providers.id = services.service_provider_id
            AND user_has_org_access(service_providers.organization_id)
        )
    );

CREATE POLICY "Org members can insert services" ON services
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM service_providers
            WHERE service_providers.id = services.service_provider_id
            AND user_has_org_access(service_providers.organization_id)
        )
    );

CREATE POLICY "Org members can update services" ON services
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM service_providers
            WHERE service_providers.id = services.service_provider_id
            AND user_has_org_access(service_providers.organization_id)
        )
    );

CREATE POLICY "Org members can delete services" ON services
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM service_providers
            WHERE service_providers.id = services.service_provider_id
            AND user_has_org_access(service_providers.organization_id)
        )
    );

