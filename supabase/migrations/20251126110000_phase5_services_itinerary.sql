-- Phase 5: Link Services to Itinerary Items

-- ============================================
-- Add service_id to itinerary_items
-- ============================================

ALTER TABLE itinerary_items
ADD COLUMN service_id UUID REFERENCES services(id) ON DELETE SET NULL;

-- Create index for service lookups
CREATE INDEX IF NOT EXISTS idx_itinerary_items_service_id ON itinerary_items(service_id);

