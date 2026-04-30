# Database Migrations - Quick Reference

## TL;DR - One Command to Rule Them All

After making any schema changes, just run:

```bash
pnpm db:migrate
```

That's it! ✨

## What This Does

1. Automatically loads your `.env` file
2. Compares your schema with the database
3. Applies any changes
4. Shows you what changed

## Common Scenarios

### Adding a New Field

1. Edit schema file (e.g., `lib/db/src/schema/customers.ts`)
2. Run `pnpm db:migrate`
3. Done!

### Adding a New Table

1. Create new schema file in `lib/db/src/schema/`
2. Export it from `lib/db/src/schema/index.ts`
3. Run `pnpm db:migrate`
4. Done!

### Making a Field Unique

```typescript
// Before
gstin: text("gstin"),

// After
gstin: text("gstin").unique(),
```

Then: `pnpm db:migrate`

## No More Complexity

- ❌ No manual SQL scripts
- ❌ No environment variable juggling
- ❌ No complex migration files
- ✅ Just one simple command

## Behind the Scenes

The `pnpm db:migrate` command:
- Uses `lib/db/migrate.mjs` script
- Loads `.env` from workspace root automatically
- Runs `drizzle-kit push` with proper configuration
- Handles all the complexity for you

## Troubleshooting

### "DATABASE_URL not found"
Make sure `.env` exists in the workspace root with your database URL.

### Changes not applying
The command will show you what changes it's making. If nothing happens, your schema might already match the database.

### Need to force changes
If you need to bypass safety checks:
```bash
pnpm --filter @workspace/db push-force
```

## More Info

See `lib/db/README.md` for detailed documentation.