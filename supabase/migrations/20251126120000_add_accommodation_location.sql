-- Add is_accommodation_location flag to itinerary_items
-- When true, the location should display the stay's accommodation name

ALTER TABLE itinerary_items
ADD COLUMN is_accommodation_location BOOLEAN DEFAULT false;

