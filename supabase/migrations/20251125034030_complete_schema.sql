-- Complete Schema Setup
-- This migration creates all tables, indexes, triggers, and RLS policies

-- Note: Using gen_random_uuid() which is built into PostgreSQL 13+
-- No extension needed

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Core Tables: Clients and Accommodations
-- ============================================

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    preferences JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create accommodations table
CREATE TABLE IF NOT EXISTS accommodations (
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

-- Create stays table
CREATE TABLE IF NOT EXISTS stays (
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

-- ============================================
-- Original Tables: Itineraries and Items
-- ============================================

-- Create itineraries table
CREATE TABLE IF NOT EXISTS itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    villa_name TEXT NOT NULL,
    client_id UUID REFERENCES clients(id),
    accommodation_id UUID REFERENCES accommodations(id),
    stay_id UUID REFERENCES stays(id) ON DELETE CASCADE,
    arrival_date DATE NOT NULL,
    departure_date DATE NOT NULL,
    share_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_dates CHECK (departure_date >= arrival_date)
);

-- Create itinerary_items table
CREATE TABLE IF NOT EXISTS itinerary_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
    day_date DATE NOT NULL,
    time TEXT NOT NULL DEFAULT '',
    event TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- Accommodations indexes
CREATE INDEX IF NOT EXISTS idx_accommodations_name ON accommodations(name);
CREATE INDEX IF NOT EXISTS idx_accommodations_type ON accommodations(type);

-- Stays indexes
CREATE INDEX IF NOT EXISTS idx_stays_client_id ON stays(client_id);
CREATE INDEX IF NOT EXISTS idx_stays_accommodation_id ON stays(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_stays_arrival_date ON stays(arrival_date);
CREATE INDEX IF NOT EXISTS idx_stays_status ON stays(status);

-- Itineraries indexes
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_share_token ON itineraries(share_token);
CREATE INDEX IF NOT EXISTS idx_itineraries_created_at ON itineraries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_itineraries_client_id ON itineraries(client_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_accommodation_id ON itineraries(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_stay_id ON itineraries(stay_id);

-- Itinerary items indexes
CREATE INDEX IF NOT EXISTS idx_itinerary_items_itinerary_id ON itinerary_items(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_day_date ON itinerary_items(day_date);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_sort_order ON itinerary_items(itinerary_id, day_date, sort_order);

-- ============================================
-- Triggers
-- ============================================

-- Triggers to automatically update updated_at
CREATE TRIGGER update_itineraries_updated_at
    BEFORE UPDATE ON itineraries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accommodations_updated_at
    BEFORE UPDATE ON accommodations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stays_updated_at
    BEFORE UPDATE ON stays
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stays ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Users can view clients" ON clients
    FOR SELECT USING (true);

CREATE POLICY "Users can insert clients" ON clients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update clients" ON clients
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete clients" ON clients
    FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for accommodations
CREATE POLICY "Users can view accommodations" ON accommodations
    FOR SELECT USING (true);

CREATE POLICY "Users can insert accommodations" ON accommodations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update accommodations" ON accommodations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete accommodations" ON accommodations
    FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for stays
CREATE POLICY "Users can view stays" ON stays
    FOR SELECT USING (true);

CREATE POLICY "Users can insert stays" ON stays
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update stays" ON stays
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete stays" ON stays
    FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for itineraries
CREATE POLICY "Users can view their own itineraries"
    ON itineraries
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own itineraries"
    ON itineraries
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itineraries"
    ON itineraries
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own itineraries"
    ON itineraries
    FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Public can view shared itineraries"
    ON itineraries
    FOR SELECT
    USING (true);

-- RLS Policies for itinerary_items
CREATE POLICY "Users can view items from their own itineraries"
    ON itinerary_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM itineraries
            WHERE itineraries.id = itinerary_items.itinerary_id
            AND itineraries.user_id = auth.uid()
        )
    );

CREATE POLICY "Public can view items from shared itineraries"
    ON itinerary_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM itineraries
            WHERE itineraries.id = itinerary_items.itinerary_id
        )
    );

CREATE POLICY "Users can insert items to their own itineraries"
    ON itinerary_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM itineraries
            WHERE itineraries.id = itinerary_items.itinerary_id
            AND itineraries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update items in their own itineraries"
    ON itinerary_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM itineraries
            WHERE itineraries.id = itinerary_items.itinerary_id
            AND itineraries.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM itineraries
            WHERE itineraries.id = itinerary_items.itinerary_id
            AND itineraries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete items from their own itineraries"
    ON itinerary_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM itineraries
            WHERE itineraries.id = itinerary_items.itinerary_id
            AND itineraries.user_id = auth.uid()
        )
    );

