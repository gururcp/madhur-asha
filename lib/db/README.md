# Database Package

This package manages the database schema and migrations for the Madhur Asha Ledger application.

## Quick Migration Guide

### Simple One-Command Migration

After making changes to schema files in `src/schema/`, run:

```bash
pnpm db:migrate
```

This command:
- Automatically loads environment variables from `.env`
- Pushes schema changes to the database
- Handles all the complexity for you

### Alternative: Manual Migration

If you prefer to run migrations manually:

```bash
# From workspace root
pnpm --filter @workspace/db migrate
```

## Schema Files

All database tables are defined in `src/schema/`:
- `users.ts` - User accounts and authentication
- `customers.ts` - Customer information
- `calculations.ts` - GST calculations
- `sessions.ts` - User sessions

## Making Schema Changes

1. Edit the schema file (e.g., `src/schema/customers.ts`)
2. Run `pnpm db:migrate` from workspace root
3. Done! Changes are applied to the database

## Example: Adding a Field

```typescript
// src/schema/customers.ts
export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gstin: text("gstin").unique(),
  // Add new field:
  email: text("email"),
  // ...
});
```

Then run: `pnpm db:migrate`

## Troubleshooting

### DATABASE_URL not found
Make sure `.env` file exists in workspace root with:
```
DATABASE_URL=postgresql://...
```

### Schema changes not applying
Try: `pnpm --filter @workspace/db push-force`

## Configuration

- `drizzle.config.mjs` - Drizzle Kit configuration
- `migrate.mjs` - Migration script that loads .env automatically