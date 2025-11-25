-- Remove duplicate fields from itineraries table
-- Since every itinerary is linked to a stay, we can get all this data from the stay

-- Step 1: Ensure all itineraries have a stay_id
-- Delete any itineraries without a stay_id (orphaned itineraries)
DELETE FROM itineraries WHERE stay_id IS NULL;

-- Step 2: Make stay_id NOT NULL
ALTER TABLE itineraries 
  ALTER COLUMN stay_id SET NOT NULL;

-- Step 3: Drop indexes on columns we're removing
DROP INDEX IF EXISTS idx_itineraries_client_id;
DROP INDEX IF EXISTS idx_itineraries_accommodation_id;

-- Step 4: Remove duplicate columns
ALTER TABLE itineraries 
  DROP COLUMN IF EXISTS client_id,
  DROP COLUMN IF EXISTS accommodation_id,
  DROP COLUMN IF EXISTS arrival_date,
  DROP COLUMN IF EXISTS departure_date,
  DROP COLUMN IF EXISTS client_name,
  DROP COLUMN IF EXISTS villa_name;

-- Step 5: Remove the constraint that checked dates (now in stays table)
ALTER TABLE itineraries 
  DROP CONSTRAINT IF EXISTS valid_dates;

