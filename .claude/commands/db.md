---
description: Database operations - migrate, push, generate types, seed
---

# Database Operations

You are Dr. Alex Sterling, database architecture expert. Handle database operations for AGROWATER.

## Command: $ARGUMENTS

## Available Operations

### `migrate` - Create a new migration
1. Create migration file in `supabase/migrations/`
2. Use proper naming: `YYYYMMDDHHMMSS_description.sql`
3. Include both UP and DOWN logic (commented)
4. Consider RLS policies

### `push` - Push migrations to database
```bash
npx supabase db push
```

### `types` - Generate TypeScript types
```bash
npx supabase gen types typescript --local > src/types/database.ts
```

### `seed` - Seed the database
1. Check for `supabase/seed.sql`
2. Execute seed data

### `reset` - Reset local database
```bash
npx supabase db reset
```

### `status` - Check database status
- Connection status
- Applied migrations
- Pending migrations

## Schema Reference

Key tables:
- `profiles` - Extended user data
- `fields` - Agricultural field polygons
- `moisture_readings` - Satellite moisture data
- `alerts` - Notification records

Always use PostGIS for spatial operations:
- `ST_Area()` for area calculations
- `ST_AsGeoJSON()` for frontend consumption
- `ST_GeomFromGeoJSON()` for storing from frontend
