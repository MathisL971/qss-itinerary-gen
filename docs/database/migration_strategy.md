# Migration Strategy

## Approach

We will follow a **progressive migration strategy**, implementing changes phase by phase. Each phase will be fully implemented, tested, and verified before moving to the next.

## Tools

- **Supabase CLI**: Used for generating, applying, and managing migrations.
- **Version Control**: All migration files will be committed to git.

## Workflow

1.  **Generate Migration**: `supabase migration new <phase_number>_<description>`
2.  **Implement SQL**: Write the DDL and DML statements in the generated file.
    - Create tables
    - Add constraints & indexes
    - Define RLS policies
    - Migrate existing data (if applicable)
3.  **Apply Migration**: `supabase db push`
4.  **Verification**: Check database state and application functionality.
5.  **Code Updates**: Update application code to use new schema.
6.  **Testing**: Thoroughly test the phase.

## Rollback Plan

- **Reversibility**: Migrations should be written to be reversible where possible.
- **Backups**: Create database backups before applying major migrations (Phase 1 & 2).
- **Scripts**: Maintain rollback scripts/commands for critical data migrations.

## Phases

### Phase 1: Foundation

- Create `clients` and `accommodations` tables.
- Migrate string data from `itineraries` to these new tables.
- Update `itineraries` to reference new tables (temporarily keeping string fields if needed for transition, or cut over directly).

### Phase 2: Stays

- Create `stays` table.
- Migrate `itineraries` to link to `stays`.
- Make `itineraries` child of `stays`.

### Phase 3: Service Providers

- Create `service_categories`, `service_providers`, `service_provider_contacts`.

### Phase 4: Services

- Create `services` table.

### Phase 5: Service Linking

- Update `itinerary_items` to link to `services`.

### Phase 6: Bookings

- Create `bookings` table.

### Phase 7: Tasks

- Create `tasks` table.

### Phase 8: Invoicing

- Create `invoices`, `invoice_items`, `payments`.

### Phase 9: Enhanced Features

- `attachments`, `notifications`, `user_roles`, `permissions`.
