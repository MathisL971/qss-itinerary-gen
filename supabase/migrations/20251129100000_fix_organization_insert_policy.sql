-- Fix organization insert policy
-- The auth.role() check was incorrect - should use auth.uid() to check authentication

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;

-- Create the corrected policy - use auth.uid() IS NOT NULL to check if user is authenticated
CREATE POLICY "Authenticated users can create organizations" ON organizations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

