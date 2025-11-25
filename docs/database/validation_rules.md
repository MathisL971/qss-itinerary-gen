# Data Validation Rules

## Clients
-   `email`: Must be a valid email format.
-   `name`: Not null, non-empty string.

## Accommodations
-   `name`: Not null, non-empty.
-   `type`: Must be one of defined types (villa, hotel, etc.).
-   `capacity`: Positive integer.

## Stays
-   `arrival_date` & `departure_date`: `departure_date` >= `arrival_date`.
-   `status`: Must be valid enum (pending, confirmed, etc.).

## Services
-   `base_price` & `per_person_price`: Non-negative.

## Bookings
-   `booking_date`: Must be within Stay's date range.
-   `status`: Valid enum.

## Invoices
-   `invoice_number`: Unique.
-   `total`: Non-negative (usually).

