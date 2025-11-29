# Current Database Schema

## Overview

The application uses a multi-tenant architecture where all resources are owned by organizations. Users can belong to multiple organizations and switch between them.

### Core Tables
- `organizations`: Tenant entities that own all resources
- `organization_members`: Links users to organizations with roles (owner/member)

### Resource Tables
- `clients`: Client profiles (organization-scoped)
- `accommodations`: Villa/hotel properties (organization-scoped)
- `stays`: Guest stays linking clients to accommodations (organization-scoped)
- `itineraries`: Travel itineraries for stays (organization-scoped)
- `itinerary_items`: Individual events within itineraries
- `service_categories`: Categories for organizing service providers (organization-scoped)
- `service_providers`: External service providers (organization-scoped)
- `service_provider_contacts`: Contact information for providers
- `services`: Services offered by providers

## Tables

### `organizations`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `name` | TEXT | NOT NULL | Organization name |
| `slug` | TEXT | NOT NULL, UNIQUE | URL-friendly identifier |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Last update timestamp |

### `organization_members`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `organization_id` | UUID | NOT NULL, REFERENCES `organizations(id)` | Parent organization |
| `user_id` | UUID | NOT NULL, REFERENCES `auth.users(id)` | Member user |
| `role` | TEXT | NOT NULL, CHECK (role IN ('owner', 'member')) | Member role |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Creation timestamp |

**Constraints:**
- `UNIQUE(organization_id, user_id)` - User can only be a member once per org

### `clients`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `organization_id` | UUID | NOT NULL, REFERENCES `organizations(id)` | Owning organization |
| `name` | TEXT | NOT NULL | Client name |
| `email` | TEXT | | Email address |
| `phone` | TEXT | | Phone number |
| `language` | TEXT | | Preferred language (en/fr) |
| `preferences` | JSONB | DEFAULT '{}' | Client preferences |
| `notes` | TEXT | | Internal notes |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Last update timestamp |
| `deleted_at` | TIMESTAMPTZ | | Soft delete timestamp |

### `accommodations`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `organization_id` | UUID | NOT NULL, REFERENCES `organizations(id)` | Owning organization |
| `name` | TEXT | NOT NULL | Accommodation name |
| `type` | TEXT | NOT NULL, DEFAULT 'villa' | Type (villa, hotel, etc.) |
| `address` | TEXT | | Physical address |
| `capacity` | INTEGER | | Guest capacity |
| `amenities` | JSONB | DEFAULT '{}' | Available amenities |
| `description` | TEXT | | Description |
| `base_rate` | DECIMAL(10,2) | | Base rate |
| `nightly_rate` | DECIMAL(10,2) | | Nightly rate |
| `currency` | TEXT | DEFAULT 'USD' | Currency code |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Last update timestamp |
| `deleted_at` | TIMESTAMPTZ | | Soft delete timestamp |

### `stays`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `organization_id` | UUID | NOT NULL, REFERENCES `organizations(id)` | Owning organization |
| `client_id` | UUID | NOT NULL, REFERENCES `clients(id)` | Guest client |
| `accommodation_id` | UUID | NOT NULL, REFERENCES `accommodations(id)` | Property |
| `arrival_date` | DATE | NOT NULL | Check-in date |
| `departure_date` | DATE | NOT NULL | Check-out date |
| `status` | TEXT | NOT NULL, DEFAULT 'confirmed' | Status |
| `notes` | TEXT | | Internal notes |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Last update timestamp |
| `deleted_at` | TIMESTAMPTZ | | Soft delete timestamp |

**Constraints:**
- `valid_stay_dates`: `departure_date >= arrival_date`
- `status` CHECK: IN ('pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled')

### `itineraries`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `organization_id` | UUID | NOT NULL, REFERENCES `organizations(id)` | Owning organization |
| `user_id` | UUID | NOT NULL, REFERENCES `auth.users(id)` | Creator user |
| `stay_id` | UUID | REFERENCES `stays(id)` | Associated stay |
| `client_name` | TEXT | NOT NULL | Client name (legacy) |
| `villa_name` | TEXT | NOT NULL | Villa name (legacy) |
| `client_id` | UUID | REFERENCES `clients(id)` | Client reference |
| `accommodation_id` | UUID | REFERENCES `accommodations(id)` | Accommodation reference |
| `arrival_date` | DATE | NOT NULL | Arrival date |
| `departure_date` | DATE | NOT NULL | Departure date |
| `share_token` | TEXT | NOT NULL, UNIQUE | Public sharing token |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Last update timestamp |

### `itinerary_items`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `itinerary_id` | UUID | NOT NULL, REFERENCES `itineraries(id)` | Parent itinerary |
| `day_date` | DATE | NOT NULL | Date of the item |
| `time` | TEXT | NOT NULL, DEFAULT '' | Time of event |
| `event` | TEXT | NOT NULL, DEFAULT '' | Event description |
| `location` | TEXT | NOT NULL, DEFAULT '' | Location |
| `is_accommodation_location` | BOOLEAN | DEFAULT false | Use accommodation as location |
| `sort_order` | INTEGER | NOT NULL, DEFAULT 0 | Display order |
| `service_provider_id` | UUID | REFERENCES `service_providers(id)` | Associated provider |
| `service_id` | UUID | REFERENCES `services(id)` | Associated service |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Creation timestamp |

### `service_categories`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `organization_id` | UUID | NOT NULL, REFERENCES `organizations(id)` | Owning organization |
| `name` | TEXT | NOT NULL | Category name |
| `description` | TEXT | | Description |
| `icon` | TEXT | | Emoji/icon |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Last update timestamp |
| `deleted_at` | TIMESTAMPTZ | | Soft delete timestamp |

### `service_providers`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `organization_id` | UUID | NOT NULL, REFERENCES `organizations(id)` | Owning organization |
| `name` | TEXT | NOT NULL | Provider name |
| `category_id` | UUID | REFERENCES `service_categories(id)` | Category |
| `description` | TEXT | | Description |
| `address` | TEXT | | Physical address |
| `website` | TEXT | | Website URL |
| `notes` | TEXT | | Internal notes |
| `policy_en` | TEXT | | Policy (English) |
| `policy_fr` | TEXT | | Policy (French) |
| `is_active` | BOOLEAN | DEFAULT true | Active status |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Last update timestamp |
| `deleted_at` | TIMESTAMPTZ | | Soft delete timestamp |

### `service_provider_contacts`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `service_provider_id` | UUID | NOT NULL, REFERENCES `service_providers(id)` | Parent provider |
| `contact_type` | TEXT | NOT NULL | Type (phone, email, etc.) |
| `value` | TEXT | NOT NULL | Contact value |
| `is_primary` | BOOLEAN | DEFAULT false | Primary contact flag |
| `notes` | TEXT | | Notes |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Last update timestamp |

### `services`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `service_provider_id` | UUID | NOT NULL, REFERENCES `service_providers(id)` | Parent provider |
| `name` | TEXT | NOT NULL | Service name |
| `description` | TEXT | | Description |
| `duration_minutes` | INTEGER | | Duration |
| `base_price` | DECIMAL(10,2) | | Base price |
| `currency` | TEXT | DEFAULT 'EUR' | Currency |
| `pricing_type` | TEXT | | Type (fixed, per_person, etc.) |
| `capacity_min` | INTEGER | | Minimum capacity |
| `capacity_max` | INTEGER | | Maximum capacity |
| `is_available` | BOOLEAN | DEFAULT true | Availability |
| `notes` | TEXT | | Internal notes |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Last update timestamp |
| `deleted_at` | TIMESTAMPTZ | | Soft delete timestamp |

## Relationships

### Organization Ownership
- All resource tables have `organization_id` -> `organizations.id`
- Users access resources through organization membership

### User -> Organization (Many-to-Many via organization_members)
- `organization_members.user_id` -> `auth.users.id`
- `organization_members.organization_id` -> `organizations.id`

### Client -> Stay -> Itinerary
- `stays.client_id` -> `clients.id`
- `stays.accommodation_id` -> `accommodations.id`
- `itineraries.stay_id` -> `stays.id`
- `itinerary_items.itinerary_id` -> `itineraries.id`

### Service Provider -> Services
- `service_providers.category_id` -> `service_categories.id`
- `services.service_provider_id` -> `service_providers.id`
- `service_provider_contacts.service_provider_id` -> `service_providers.id`

## Helper Functions

### `user_has_org_access(org_id UUID)`
Returns true if the current user is a member of the specified organization.

### `user_is_org_owner(org_id UUID)`
Returns true if the current user is an owner of the specified organization.
