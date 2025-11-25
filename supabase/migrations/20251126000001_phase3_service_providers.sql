-- Phase 3: Service Providers Foundation

-- ============================================
-- Service Categories
-- ============================================

CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT service_categories_name_key UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_service_categories_name ON service_categories(name);

-- Trigger for updated_at
CREATE TRIGGER update_service_categories_updated_at
    BEFORE UPDATE ON service_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view service_categories" ON service_categories
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert service_categories" ON service_categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update service_categories" ON service_categories
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete service_categories" ON service_categories
    FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- Service Providers
-- ============================================

CREATE TABLE IF NOT EXISTS service_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category_id UUID REFERENCES service_categories(id),
    description TEXT,
    address TEXT,
    website TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_service_providers_category_id ON service_providers(category_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_name ON service_providers(name);
CREATE INDEX IF NOT EXISTS idx_service_providers_is_active ON service_providers(is_active);

-- Trigger for updated_at
CREATE TRIGGER update_service_providers_updated_at
    BEFORE UPDATE ON service_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view service_providers" ON service_providers
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert service_providers" ON service_providers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update service_providers" ON service_providers
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete service_providers" ON service_providers
    FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- Service Provider Contacts
-- ============================================

CREATE TABLE IF NOT EXISTS service_provider_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
    contact_type TEXT NOT NULL, -- 'phone', 'email', 'whatsapp', etc.
    value TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_provider_contacts_provider_id ON service_provider_contacts(service_provider_id);
CREATE INDEX IF NOT EXISTS idx_service_provider_contacts_type ON service_provider_contacts(contact_type);

-- Trigger for updated_at
CREATE TRIGGER update_service_provider_contacts_updated_at
    BEFORE UPDATE ON service_provider_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE service_provider_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view service_provider_contacts" ON service_provider_contacts
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert service_provider_contacts" ON service_provider_contacts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update service_provider_contacts" ON service_provider_contacts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete service_provider_contacts" ON service_provider_contacts
    FOR DELETE USING (auth.role() = 'authenticated');

