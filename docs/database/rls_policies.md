# RLS Policy Design

## General Principles

-   **Deny by Default**: RLS is enabled on all tables. Access must be explicitly granted.
-   **User Ownership**: Users can generally view/edit resources they created.
-   **Public/Shared Access**: Specific resources (like itineraries) may be accessible via share tokens.

## Policies by Table

### `clients`
-   **SELECT**: Users can view clients they created.
-   **INSERT**: Users can create clients (owner set to auth.uid()).
-   **UPDATE**: Users can update their own clients.
-   **DELETE**: Users can delete (soft delete) their own clients.

### `accommodations`
-   **SELECT**: Users can view accommodations they created.
-   **INSERT**: Users can create accommodations.
-   **UPDATE**: Users can update their own accommodations.
-   **DELETE**: Users can delete (soft delete) their own accommodations.

### `stays`
-   **SELECT**: Users can view stays they created.
-   **INSERT**: Users can create stays.
-   **UPDATE**: Users can update their own stays.
-   **DELETE**: Users can delete their own stays.

### `itineraries` (Existing updated)
-   **SELECT**: Users can view own. Public access via `share_token` (existing logic).
-   **INSERT/UPDATE/DELETE**: Owner only.

### `itinerary_items`
-   **SELECT**: Users can view items for their itineraries. Public access if parent itinerary is shared.
-   **INSERT/UPDATE/DELETE**: Owner only (via join to itinerary).

### `service_providers` & `services`
-   **SELECT**: Users can view providers they created (or global ones if we have a system/public set).
-   **INSERT/UPDATE/DELETE**: Owner only (or admin if we implement roles).

### `bookings`
-   **SELECT**: Users can view bookings for their stays.
-   **INSERT/UPDATE/DELETE**: Owner only.

### `invoices` & `payments`
-   **SELECT**: Users can view invoices for their stays.
-   **INSERT/UPDATE/DELETE**: Owner only.

### `tasks`
-   **SELECT**: Users can view tasks assigned to them or related to their entities.
-   **INSERT/UPDATE/DELETE**: Owner or assignee.

