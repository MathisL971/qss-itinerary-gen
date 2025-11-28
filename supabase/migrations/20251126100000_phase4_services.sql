-- Phase 4: Services Architecture
-- Services offered by service providers

-- ============================================
-- Services Table
-- ============================================

CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    base_price DECIMAL(10, 2),
    currency TEXT DEFAULT 'EUR',
    pricing_type TEXT, -- 'fixed', 'per_person', 'per_hour', 'custom'
    capacity_min INTEGER,
    capacity_max INTEGER,
    is_available BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT services_capacity_check CHECK (
        capacity_max IS NULL OR capacity_min IS NULL OR capacity_max >= capacity_min
    ),
    CONSTRAINT services_pricing_type_check CHECK (
        pricing_type IS NULL OR pricing_type IN ('fixed', 'per_person', 'per_hour', 'custom')
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_services_provider_id ON services(service_provider_id);
CREATE INDEX IF NOT EXISTS idx_services_name ON services(name);
CREATE INDEX IF NOT EXISTS idx_services_is_available ON services(is_available);

-- Trigger for updated_at
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view services" ON services
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert services" ON services
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update services" ON services
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete services" ON services
    FOR DELETE USING (auth.role() = 'authenticated');

