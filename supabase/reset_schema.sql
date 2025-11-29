-- FULL RESET SCRIPT
-- Run this in Supabase SQL Editor to reset the entire schema

-- ============================================
-- DROP EVERYTHING FIRST
-- ============================================

-- Drop triggers
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
DROP TRIGGER IF EXISTS update_service_provider_contacts_updated_at ON service_provider_contacts;
DROP TRIGGER IF EXISTS update_service_providers_updated_at ON service_providers;
DROP TRIGGER IF EXISTS update_service_categories_updated_at ON service_categories;
DROP TRIGGER IF EXISTS update_stays_updated_at ON stays;
DROP TRIGGER IF EXISTS update_accommodations_updated_at ON accommodations;
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
DROP TRIGGER IF EXISTS update_itineraries_updated_at ON itineraries;

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS service_provider_contacts CASCADE;
DROP TABLE IF EXISTS service_providers CASCADE;
DROP TABLE IF EXISTS service_categories CASCADE;
DROP TABLE IF EXISTS itinerary_items CASCADE;
DROP TABLE IF EXISTS itineraries CASCADE;
DROP TABLE IF EXISTS stays CASCADE;
DROP TABLE IF EXISTS accommodations CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- ============================================
-- CREATE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CREATE TABLES
-- ============================================

-- Clients
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    preferences JSONB DEFAULT '{}',
    notes TEXT,
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'fr')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Accommodations
CREATE TABLE accommodations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'villa',
    address TEXT,
    capacity INTEGER,
    amenities JSONB DEFAULT '{}',
    description TEXT,
    base_rate DECIMAL(10, 2),
    nightly_rate DECIMAL(10, 2),
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Stays
CREATE TABLE stays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
    arrival_date DATE NOT NULL,
    departure_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT valid_stay_dates CHECK (departure_date >= arrival_date)
);

-- Service Categories
CREATE TABLE service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Service Providers
CREATE TABLE service_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category_id UUID REFERENCES service_categories(id),
    description TEXT,
    address TEXT,
    website TEXT,
    notes TEXT,
    policy_en TEXT,
    policy_fr TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Service Provider Contacts
CREATE TABLE service_provider_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
    contact_type TEXT NOT NULL,
    value TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Services
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    base_price DECIMAL(10, 2),
    currency TEXT DEFAULT 'EUR',
    pricing_type TEXT CHECK (pricing_type IS NULL OR pricing_type IN ('fixed', 'per_person', 'per_hour', 'custom')),
    capacity_min INTEGER,
    capacity_max INTEGER,
    is_available BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT services_capacity_check CHECK (capacity_max IS NULL OR capacity_min IS NULL OR capacity_max >= capacity_min)
);

-- Itineraries
CREATE TABLE itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stay_id UUID NOT NULL REFERENCES stays(id) ON DELETE CASCADE,
    share_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Itinerary Items
CREATE TABLE itinerary_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
    day_date DATE NOT NULL,
    time TEXT NOT NULL DEFAULT '',
    event TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    is_accommodation_location BOOLEAN DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    service_provider_id UUID REFERENCES service_providers(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_language ON clients(language);

CREATE INDEX idx_accommodations_name ON accommodations(name);
CREATE INDEX idx_accommodations_type ON accommodations(type);

CREATE INDEX idx_stays_client_id ON stays(client_id);
CREATE INDEX idx_stays_accommodation_id ON stays(accommodation_id);
CREATE INDEX idx_stays_arrival_date ON stays(arrival_date);
CREATE INDEX idx_stays_status ON stays(status);

CREATE INDEX idx_service_categories_name ON service_categories(name);

CREATE INDEX idx_service_providers_category_id ON service_providers(category_id);
CREATE INDEX idx_service_providers_name ON service_providers(name);
CREATE INDEX idx_service_providers_is_active ON service_providers(is_active);

CREATE INDEX idx_service_provider_contacts_provider_id ON service_provider_contacts(service_provider_id);
CREATE INDEX idx_service_provider_contacts_type ON service_provider_contacts(contact_type);

CREATE INDEX idx_services_provider_id ON services(service_provider_id);
CREATE INDEX idx_services_name ON services(name);
CREATE INDEX idx_services_is_available ON services(is_available);

CREATE INDEX idx_itineraries_user_id ON itineraries(user_id);
CREATE INDEX idx_itineraries_share_token ON itineraries(share_token);
CREATE INDEX idx_itineraries_stay_id ON itineraries(stay_id);
CREATE INDEX idx_itineraries_created_at ON itineraries(created_at DESC);

CREATE INDEX idx_itinerary_items_itinerary_id ON itinerary_items(itinerary_id);
CREATE INDEX idx_itinerary_items_day_date ON itinerary_items(day_date);
CREATE INDEX idx_itinerary_items_sort_order ON itinerary_items(itinerary_id, day_date, sort_order);
CREATE INDEX idx_itinerary_items_service_provider_id ON itinerary_items(service_provider_id);
CREATE INDEX idx_itinerary_items_service_id ON itinerary_items(service_id);

-- ============================================
-- CREATE TRIGGERS
-- ============================================

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accommodations_updated_at BEFORE UPDATE ON accommodations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stays_updated_at BEFORE UPDATE ON stays FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_categories_updated_at BEFORE UPDATE ON service_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_providers_updated_at BEFORE UPDATE ON service_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_provider_contacts_updated_at BEFORE UPDATE ON service_provider_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_itineraries_updated_at BEFORE UPDATE ON itineraries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stays ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_provider_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Clients
CREATE POLICY "Users can view clients" ON clients FOR SELECT USING (true);
CREATE POLICY "Users can insert clients" ON clients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update clients" ON clients FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete clients" ON clients FOR DELETE USING (auth.role() = 'authenticated');

-- Accommodations
CREATE POLICY "Users can view accommodations" ON accommodations FOR SELECT USING (true);
CREATE POLICY "Users can insert accommodations" ON accommodations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update accommodations" ON accommodations FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete accommodations" ON accommodations FOR DELETE USING (auth.role() = 'authenticated');

-- Stays
CREATE POLICY "Users can view stays" ON stays FOR SELECT USING (true);
CREATE POLICY "Users can insert stays" ON stays FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update stays" ON stays FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete stays" ON stays FOR DELETE USING (auth.role() = 'authenticated');

-- Service Categories
CREATE POLICY "Users can view service_categories" ON service_categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert service_categories" ON service_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update service_categories" ON service_categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete service_categories" ON service_categories FOR DELETE USING (auth.role() = 'authenticated');

-- Service Providers
CREATE POLICY "Users can view service_providers" ON service_providers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert service_providers" ON service_providers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update service_providers" ON service_providers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete service_providers" ON service_providers FOR DELETE USING (auth.role() = 'authenticated');

-- Service Provider Contacts
CREATE POLICY "Users can view service_provider_contacts" ON service_provider_contacts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert service_provider_contacts" ON service_provider_contacts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update service_provider_contacts" ON service_provider_contacts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete service_provider_contacts" ON service_provider_contacts FOR DELETE USING (auth.role() = 'authenticated');

-- Services
CREATE POLICY "Users can view services" ON services FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert services" ON services FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update services" ON services FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete services" ON services FOR DELETE USING (auth.role() = 'authenticated');

-- Itineraries
CREATE POLICY "Users can view their own itineraries" ON itineraries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own itineraries" ON itineraries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own itineraries" ON itineraries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own itineraries" ON itineraries FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Public can view shared itineraries" ON itineraries FOR SELECT USING (true);

-- Itinerary Items
CREATE POLICY "Users can view items from their own itineraries" ON itinerary_items FOR SELECT USING (EXISTS (SELECT 1 FROM itineraries WHERE itineraries.id = itinerary_items.itinerary_id AND itineraries.user_id = auth.uid()));
CREATE POLICY "Public can view items from shared itineraries" ON itinerary_items FOR SELECT USING (EXISTS (SELECT 1 FROM itineraries WHERE itineraries.id = itinerary_items.itinerary_id));
CREATE POLICY "Users can insert items to their own itineraries" ON itinerary_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM itineraries WHERE itineraries.id = itinerary_items.itinerary_id AND itineraries.user_id = auth.uid()));
CREATE POLICY "Users can update items in their own itineraries" ON itinerary_items FOR UPDATE USING (EXISTS (SELECT 1 FROM itineraries WHERE itineraries.id = itinerary_items.itinerary_id AND itineraries.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM itineraries WHERE itineraries.id = itinerary_items.itinerary_id AND itineraries.user_id = auth.uid()));
CREATE POLICY "Users can delete items from their own itineraries" ON itinerary_items FOR DELETE USING (EXISTS (SELECT 1 FROM itineraries WHERE itineraries.id = itinerary_items.itinerary_id AND itineraries.user_id = auth.uid()));

-- ============================================
-- DONE!
-- ============================================

