-- Create a function to handle organization creation atomically
-- This function runs with SECURITY DEFINER to bypass RLS during the transaction
-- It creates the organization AND adds the user as owner in one atomic operation

CREATE OR REPLACE FUNCTION create_organization_with_owner(
    org_name TEXT,
    org_slug TEXT
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_org_id UUID;
    current_user_id UUID;
BEGIN
    -- Get the current user's ID
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to create an organization';
    END IF;
    
    -- Create the organization
    INSERT INTO organizations (name, slug)
    VALUES (org_name, org_slug)
    RETURNING organizations.id INTO new_org_id;
    
    -- Add the current user as owner
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (new_org_id, current_user_id, 'owner');
    
    -- Return the created organization
    RETURN QUERY
    SELECT o.id, o.name, o.slug, o.created_at, o.updated_at
    FROM organizations o
    WHERE o.id = new_org_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_organization_with_owner(TEXT, TEXT) TO authenticated;

