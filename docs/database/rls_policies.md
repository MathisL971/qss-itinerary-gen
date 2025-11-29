# RLS Policy Design

## General Principles

- **Deny by Default**: RLS is enabled on all tables. Access must be explicitly granted.
- **Organization-Based Access**: Users can access resources belonging to organizations they are members of.
- **Public/Shared Access**: Specific resources (like itineraries) may be accessible via share tokens.
- **Role-Based Management**: Organization owners can manage members; regular members can CRUD resources.

## Helper Functions

### `user_has_org_access(org_id UUID)`

Returns `TRUE` if the current user (`auth.uid()`) is a member of the specified organization.

```sql
CREATE FUNCTION user_has_org_access(org_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id AND user_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER;
```

### `user_is_org_owner(org_id UUID)`

Returns `TRUE` if the current user is an **owner** of the specified organization.

```sql
CREATE FUNCTION user_is_org_owner(org_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role = 'owner'
  );
$$ LANGUAGE SQL SECURITY DEFINER;
```

## Policies by Table

### `organizations`

| Operation | Policy                                       |
| --------- | -------------------------------------------- |
| SELECT    | Users can view organizations they belong to  |
| INSERT    | Authenticated users can create organizations |
| UPDATE    | Organization owners only                     |
| DELETE    | Organization owners only                     |

### `organization_members`

| Operation | Policy                                                                 |
| --------- | ---------------------------------------------------------------------- |
| SELECT    | Members can view other members of their organizations                  |
| INSERT    | Owners can add members; users can add themselves as owner of a new org |
| UPDATE    | Owners only                                                            |
| DELETE    | Owners can remove anyone; members can remove themselves                |

### `clients`

| Operation | Policy                                                                 |
| --------- | ---------------------------------------------------------------------- |
| SELECT    | Organization members can view                                          |
| INSERT    | Organization members can create (must include valid `organization_id`) |
| UPDATE    | Organization members can update                                        |
| DELETE    | Organization members can delete                                        |

### `accommodations`

| Operation | Policy                          |
| --------- | ------------------------------- |
| SELECT    | Organization members can view   |
| INSERT    | Organization members can create |
| UPDATE    | Organization members can update |
| DELETE    | Organization members can delete |

### `stays`

| Operation | Policy                          |
| --------- | ------------------------------- |
| SELECT    | Organization members can view   |
| INSERT    | Organization members can create |
| UPDATE    | Organization members can update |
| DELETE    | Organization members can delete |

### `itineraries`

| Operation | Policy                                                             |
| --------- | ------------------------------------------------------------------ |
| SELECT    | Organization members can view; **Public access via `share_token`** |
| INSERT    | Organization members can create                                    |
| UPDATE    | Organization members can update                                    |
| DELETE    | Organization members can delete                                    |

### `itinerary_items`

| Operation | Policy                                                                                   |
| --------- | ---------------------------------------------------------------------------------------- |
| SELECT    | Members can view items for their org's itineraries; Public access for shared itineraries |
| INSERT    | Members can insert items to their org's itineraries                                      |
| UPDATE    | Members can update items in their org's itineraries                                      |
| DELETE    | Members can delete items from their org's itineraries                                    |

_Access is determined by joining to `itineraries` and checking `organization_id`._

### `service_categories`

| Operation | Policy                          |
| --------- | ------------------------------- |
| SELECT    | Organization members can view   |
| INSERT    | Organization members can create |
| UPDATE    | Organization members can update |
| DELETE    | Organization members can delete |

### `service_providers`

| Operation | Policy                          |
| --------- | ------------------------------- |
| SELECT    | Organization members can view   |
| INSERT    | Organization members can create |
| UPDATE    | Organization members can update |
| DELETE    | Organization members can delete |

### `service_provider_contacts`

| Operation | Policy                                                 |
| --------- | ------------------------------------------------------ |
| SELECT    | Members can view contacts for their org's providers    |
| INSERT    | Members can create contacts for their org's providers  |
| UPDATE    | Members can update contacts for their org's providers  |
| DELETE    | Members can delete contacts from their org's providers |

_Access is determined by joining to `service_providers` and checking `organization_id`._

### `services`

| Operation | Policy                                                 |
| --------- | ------------------------------------------------------ |
| SELECT    | Members can view services for their org's providers    |
| INSERT    | Members can create services for their org's providers  |
| UPDATE    | Members can update services for their org's providers  |
| DELETE    | Members can delete services from their org's providers |

_Access is determined by joining to `service_providers` and checking `organization_id`._

## Policy Implementation Examples

### Direct Organization Check

```sql
-- For tables with organization_id column
CREATE POLICY "Org members can view clients" ON clients
    FOR SELECT USING (user_has_org_access(organization_id));
```

### Indirect Organization Check (via parent table)

```sql
-- For child tables without organization_id
CREATE POLICY "Org members can view itinerary_items" ON itinerary_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM itineraries
            WHERE itineraries.id = itinerary_items.itinerary_id
            AND user_has_org_access(itineraries.organization_id)
        )
    );
```

### Public Access for Shared Resources

```sql
-- Allow public access to shared itineraries
CREATE POLICY "Public can view shared itineraries" ON itineraries
    FOR SELECT USING (share_token IS NOT NULL);
```

## Security Considerations

1. **SECURITY DEFINER**: Helper functions use `SECURITY DEFINER` to ensure they run with elevated privileges and can access the `organization_members` table.

2. **No Direct auth.users Access**: Client-side code cannot directly query `auth.users`. User lookups for invitations should be handled through server-side functions or edge functions.

3. **Cascade Deletes**: When an organization is deleted, all related resources are cascade-deleted via foreign key constraints.

4. **Soft Deletes**: Resource tables support soft deletion via `deleted_at` column, but RLS policies don't filter by this - application logic should handle it.
