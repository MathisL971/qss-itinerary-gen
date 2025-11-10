-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create itineraries table
CREATE TABLE IF NOT EXISTS itineraries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    villa_name TEXT NOT NULL,
    arrival_date DATE NOT NULL,
    departure_date DATE NOT NULL,
    share_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_dates CHECK (departure_date >= arrival_date)
);

-- Create itinerary_items table
CREATE TABLE IF NOT EXISTS itinerary_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
    day_date DATE NOT NULL,
    time TEXT NOT NULL DEFAULT '',
    event TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_share_token ON itineraries(share_token);
CREATE INDEX IF NOT EXISTS idx_itineraries_created_at ON itineraries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_itinerary_id ON itinerary_items(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_day_date ON itinerary_items(day_date);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_sort_order ON itinerary_items(itinerary_id, day_date, sort_order);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_itineraries_updated_at
    BEFORE UPDATE ON itineraries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for itineraries table

-- Policy: Users can view their own itineraries
CREATE POLICY "Users can view their own itineraries"
    ON itineraries
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own itineraries
CREATE POLICY "Users can insert their own itineraries"
    ON itineraries
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own itineraries
CREATE POLICY "Users can update their own itineraries"
    ON itineraries
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own itineraries
CREATE POLICY "Users can delete their own itineraries"
    ON itineraries
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Public can view shared itineraries (via share_token)
-- Note: This policy allows public read access. The application code filters
-- by share_token, so users can only access itineraries they have the token for.
-- For stricter security, consider using a function-based policy that validates
-- the share_token parameter.
CREATE POLICY "Public can view shared itineraries"
    ON itineraries
    FOR SELECT
    USING (true);

-- RLS Policies for itinerary_items table

-- Policy: Users can view items from their own itineraries
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

-- Policy: Public can view items from shared itineraries
CREATE POLICY "Public can view items from shared itineraries"
    ON itinerary_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM itineraries
            WHERE itineraries.id = itinerary_items.itinerary_id
        )
    );

-- Policy: Users can insert items to their own itineraries
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

-- Policy: Users can update items in their own itineraries
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

-- Policy: Users can delete items from their own itineraries
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

