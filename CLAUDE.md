# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AGROWATER is a web application that shows farmers soil moisture status of their agricultural fields using free Sentinel-1 satellite data, with email alerts when soil becomes too dry.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **Maps**: React-Leaflet 4 + Leaflet 1.9 + Leaflet-Draw 1.0
- **Charts**: Recharts 2
- **Forms**: React Hook Form 7 + Zod 3
- **Database**: Supabase (PostgreSQL + PostGIS for spatial data)
- **Auth**: Supabase Auth with Row Level Security
- **Email**: Resend
- **Satellite Data**: Google Earth Engine
- **Hosting**: Vercel

## Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npm run type-check       # TypeScript check (npx tsc --noEmit)

# Testing
npm run test             # Run unit tests in watch mode (Vitest)
npm run test:run         # Run unit tests once
npm run test:coverage    # Run tests with coverage report
npm run test:e2e         # Run E2E tests (Playwright)
npm run test:e2e:ui      # Run E2E tests with UI
npm run test:e2e:headed  # Run E2E tests in headed browser

# Database
npx supabase start                                              # Local Supabase
npx supabase db push                                            # Push migrations
npx supabase gen types typescript --local > src/types/database.ts  # Generate types
```

### Testing Structure
- **Unit tests**: Located in `src/**/*.{test,spec}.{ts,tsx}`, run with Vitest
- **E2E tests**: Located in `e2e/` directory, run with Playwright
- **Test setup**: `src/test/setup.ts` for Vitest configuration

## Architecture

### Directory Structure
```
src/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/             # Auth route group (login, register)
│   ├── (dashboard)/        # Protected dashboard routes
│   └── api/                # API routes
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── map/                # Leaflet map components
│   ├── charts/             # Recharts components
│   └── forms/              # Form components
├── lib/
│   ├── supabase/           # Supabase client (client.ts, server.ts)
│   ├── earthengine/        # Google Earth Engine integration
│   └── email/              # Resend email utilities
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript types (including database.ts)
```

### Database Schema

Four core tables with PostGIS for spatial data:

- **profiles**: Extended user data (references auth.users, auto-created via trigger)
- **fields**: Agricultural parcels with `GEOMETRY(Polygon, 4326)` for boundaries
- **moisture_readings**: Satellite-derived soil moisture values per field
- **alerts**: Notification records when moisture drops below threshold

Key views:
- **fields_with_status**: Joins fields with latest moisture readings and computed status ('good'/'warning'/'critical'/'unknown')

### Key Patterns

**Supabase Clients**: Three client patterns in `src/lib/supabase/`:
- `client.ts`: Browser client with `createBrowserClient` for client components
- `server.ts`: Server client with `createServerClient` for server components/API routes
- `middleware.ts`: Session refresh via `updateSession()` called in `src/middleware.ts`

**Spatial Queries**: Use PostGIS functions (`ST_Area`, `ST_AsGeoJSON`, `ST_GeomFromGeoJSON`) for polygon operations.

**Map Components**: React-Leaflet components must be client components (`'use client'`) and dynamically imported with `next/dynamic` to avoid SSR issues.

**Path Alias**: Use `@/*` to import from `src/*` (configured in tsconfig.json).

**CSS Utilities**: Use `cn()` from `@/lib/utils/cn` for merging Tailwind classes with clsx + tailwind-merge.

**Localization**: UI strings are in Polish. All text constants are in `src/lib/constants.ts` under `UI_TEXT`, `CROP_TYPES`, and status labels. Map defaults to Poland center coordinates.

**API Routes Pattern**: API routes in `src/app/api/` create their own Supabase server client inline and check authentication via `supabase.auth.getUser()`.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEE_SERVICE_ACCOUNT_EMAIL
GEE_PRIVATE_KEY
RESEND_API_KEY
NEXT_PUBLIC_APP_URL
```

## Custom Slash Commands

Defined in `.claude/commands/`:

| Command | Purpose |
|---------|---------|
| `/setup` | Initialize project with all dependencies |
| `/dev` | Start development server with checks |
| `/build` | Build with error handling |
| `/fix <issue>` | Diagnose and fix issues |
| `/feature <desc>` | Implement new features |
| `/review <target>` | Code review |
| `/test [target]` | Run tests |
| `/db <operation>` | Database operations (migrate, push, types) |
| `/deploy` | Deploy to Vercel |
| `/analyze <type>` | Analyze codebase (architecture, security, performance) |
| `/explain <topic>` | Explain code or concepts |
