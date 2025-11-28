-- Add multilingual policy fields to service_providers
-- Rename existing policy to policy_en and add policy_fr

-- First, rename the existing policy column to policy_en
ALTER TABLE service_providers 
RENAME COLUMN policy TO policy_en;

-- Add the French policy column
ALTER TABLE service_providers 
ADD COLUMN policy_fr TEXT;

-- Copy existing policy_en content to policy_fr as a starting point (optional, can be removed)
-- UPDATE service_providers SET policy_fr = policy_en WHERE policy_en IS NOT NULL;

