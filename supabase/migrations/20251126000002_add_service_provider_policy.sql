-- Phase 3 Addition: Add policy field to service providers
-- and link itinerary items to service providers

-- Add policy column to service_providers
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS policy TEXT;

-- Add service_provider_id to itinerary_items
ALTER TABLE itinerary_items ADD COLUMN IF NOT EXISTS service_provider_id UUID REFERENCES service_providers(id) ON DELETE SET NULL;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_itinerary_items_service_provider_id ON itinerary_items(service_provider_id);

