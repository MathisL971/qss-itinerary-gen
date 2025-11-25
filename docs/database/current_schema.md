# Current Database Schema

## Overview

The application currently uses a simple schema with two main tables:

- `itineraries`: Stores the main itinerary details.
- `itinerary_items`: Stores individual items/events for each itinerary.

## Tables

### `itineraries`

| Column | Type | Constraints | Description |
|Link|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT `uuid_generate_v4()` | Unique identifier |
| `user_id` | UUID | NOT NULL, REFERENCES `auth.users(id)` | Owner of the itinerary |
| `client_name` | TEXT | NOT NULL | Name of the client (currently unstructured) |
| `villa_name` | TEXT | NOT NULL | Name of the villa (currently unstructured) |
| `arrival_date` | DATE | NOT NULL | Arrival date |
| `departure_date` | DATE | NOT NULL | Departure date |
| `share_token` | TEXT | NOT NULL, UNIQUE | Token for public sharing |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | Last update timestamp |

**Constraints:**

- `valid_dates`: `departure_date >= arrival_date`

**Indexes:**

- `idx_itineraries_user_id`
- `idx_itineraries_share_token`
- `idx_itineraries_created_at`

### `itinerary_items`

| Column         | Type        | Constraints                               | Description              |
| -------------- | ----------- | ----------------------------------------- | ------------------------ |
| `id`           | UUID        | PRIMARY KEY, DEFAULT `uuid_generate_v4()` | Unique identifier        |
| `itinerary_id` | UUID        | NOT NULL, REFERENCES `itineraries(id)`    | Parent itinerary         |
| `day_date`     | DATE        | NOT NULL                                  | Date of the item         |
| `time`         | TEXT        | NOT NULL, DEFAULT ''                      | Time of the event        |
| `event`        | TEXT        | NOT NULL, DEFAULT ''                      | Description of the event |
| `location`     | TEXT        | NOT NULL, DEFAULT ''                      | Location of the event    |
| `sort_order`   | INTEGER     | NOT NULL, DEFAULT 0                       | Ordering within the day  |
| `created_at`   | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()`                 | Creation timestamp       |

**Indexes:**

- `idx_itinerary_items_itinerary_id`
- `idx_itinerary_items_day_date`
- `idx_itinerary_items_sort_order`

## Relationships

- `itineraries.user_id` -> `auth.users.id` (One-to-Many: User has many itineraries)
- `itinerary_items.itinerary_id` -> `itineraries.id` (One-to-Many: Itinerary has many items)
