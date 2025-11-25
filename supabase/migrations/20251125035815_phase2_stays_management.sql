-- Phase 2: Stays Management
-- This migration makes stays the primary entity and links itineraries to stays

-- Note: The stays table was already created in the complete_schema migration
-- This migration focuses on:
-- 1. Making stay_id required on itineraries (after data migration)
-- 2. Migrating existing itinerary data to create stays

-- Step 1: Create stays from existing itineraries that have client_id and accommodation_id
-- Only create stays if they don't already exist for the same client/accommodation/dates
INSERT INTO stays (client_id, accommodation_id, arrival_date, departure_date, status)
SELECT DISTINCT 
    i.client_id,
    i.accommodation_id,
    i.arrival_date,
    i.departure_date,
    'confirmed'::text
FROM itineraries i
WHERE i.client_id IS NOT NULL 
  AND i.accommodation_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM stays s
    WHERE s.client_id = i.client_id
      AND s.accommodation_id = i.accommodation_id
      AND s.arrival_date = i.arrival_date
      AND s.departure_date = i.departure_date
  );

-- Step 2: Link existing itineraries to their corresponding stays
UPDATE itineraries i
SET stay_id = s.id
FROM stays s
WHERE i.client_id = s.client_id
  AND i.accommodation_id = s.accommodation_id
  AND i.arrival_date = s.arrival_date
  AND i.departure_date = s.departure_date
  AND i.stay_id IS NULL;

-- Step 3: For itineraries that still don't have a stay_id (missing client_id or accommodation_id),
-- create stays from client_name and villa_name if possible
-- First, try to find matching clients and accommodations
DO $$
DECLARE
    itinerary_record RECORD;
    found_client_id UUID;
    found_accommodation_id UUID;
    created_stay_id UUID;
BEGIN
    FOR itinerary_record IN 
        SELECT id, client_name, villa_name, arrival_date, departure_date, client_id, accommodation_id
        FROM itineraries
        WHERE stay_id IS NULL
    LOOP
        -- Try to find client by name if client_id is missing
        IF itinerary_record.client_id IS NULL AND itinerary_record.client_name IS NOT NULL THEN
            SELECT id INTO found_client_id
            FROM clients
            WHERE name = itinerary_record.client_name
            LIMIT 1;
        ELSE
            found_client_id := itinerary_record.client_id;
        END IF;

        -- Try to find accommodation by name if accommodation_id is missing
        IF itinerary_record.accommodation_id IS NULL AND itinerary_record.villa_name IS NOT NULL THEN
            SELECT id INTO found_accommodation_id
            FROM accommodations
            WHERE name = itinerary_record.villa_name
            LIMIT 1;
        ELSE
            found_accommodation_id := itinerary_record.accommodation_id;
        END IF;

        -- If we have both client and accommodation, create stay and link
        IF found_client_id IS NOT NULL AND found_accommodation_id IS NOT NULL THEN
            -- Check if stay already exists
            SELECT id INTO created_stay_id
            FROM stays
            WHERE client_id = found_client_id
              AND accommodation_id = found_accommodation_id
              AND arrival_date = itinerary_record.arrival_date
              AND departure_date = itinerary_record.departure_date
            LIMIT 1;

            -- Create stay if it doesn't exist
            IF created_stay_id IS NULL THEN
                INSERT INTO stays (client_id, accommodation_id, arrival_date, departure_date, status)
                VALUES (found_client_id, found_accommodation_id, itinerary_record.arrival_date, itinerary_record.departure_date, 'confirmed')
                RETURNING id INTO created_stay_id;
            END IF;

            -- Link itinerary to stay
            UPDATE itineraries
            SET stay_id = created_stay_id,
                client_id = found_client_id,
                accommodation_id = found_accommodation_id
            WHERE id = itinerary_record.id;
        END IF;
    END LOOP;
END $$;

-- Step 4: After data migration, make stay_id NOT NULL (but allow NULL temporarily for transition)
-- We'll make it required in application logic first, then enforce at DB level later
-- For now, keep it nullable to allow gradual migration

-- Note: Making stay_id required will be done in a future migration once all data is migrated
-- ALTER TABLE itineraries ALTER COLUMN stay_id SET NOT NULL;

