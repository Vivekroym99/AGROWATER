# OpenWeatherMap Agro API Integration

## Overview

This document describes the integration of OpenWeatherMap's Agro API into AGROWATER to add NDVI vegetation indices, accumulated temperature (GDD), cumulative precipitation, and enhanced soil data.

**Key Principle:** Google Earth Engine (GEE) remains the PRIMARY source for soil moisture data. Agro API COMPLEMENTS but does not replace GEE.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGROWATER DATA STACK                         │
├─────────────────────────────────────────────────────────────────┤
│  GEE (Sentinel-1)     │ PRIMARY    │ Soil moisture (SAR)       │
│  Agro API             │ ENHANCE    │ NDVI, GDD, precipitation  │
│  Weather API          │ ENHANCE    │ Current + forecast        │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Status

| Phase | Component | Status | Notes |
|-------|-----------|--------|-------|
| 1 | Database migration | ✅ Complete | All tables and views created |
| 1 | Agro API client library | ✅ Complete | 7 files in src/lib/agroapi/ |
| 1 | TypeScript types | ✅ Complete | Added to database.ts |
| 2 | NDVI API route | ✅ Complete | GET /api/ndvi/[fieldId] |
| 2 | useNDVIHistory hook | ✅ Complete | React hook for NDVI data |
| 2 | NDVIChart component | ✅ Complete | Recharts visualization |
| 2 | NDVI constants | ✅ Complete | Thresholds, colors, text |
| 2 | Field page integration | ✅ Complete | NDVI section with sync UI |
| 3 | Agronomic API route | ✅ Complete | GET /api/agronomic/[fieldId] |
| 3 | AgronomicWidget | ✅ Complete | GDD, precipitation, soil |
| 3 | Polish translations | ✅ Complete | pl.json and en.json |
| 4 | Polygon sync API | ✅ Complete | POST/DELETE sync-agro |
| 4 | NDVI cron job | ✅ Complete | Daily at 7am UTC |
| 4 | Vercel cron config | ✅ Complete | vercel.json updated |
| 4 | Sync UI | ✅ Complete | Buttons and status indicators |

---

## Phase 1: Core Infrastructure

### 1.1 Environment Variables

Add to `.env.local`:
```bash
AGRO_API_KEY=your_api_key_here
AGRO_API_ENABLED=true
```

**How to get API key:**
1. Register at https://agromonitoring.com/
2. Create account and verify email
3. Go to API Keys section in dashboard
4. Copy API key

**Free tier limits:**
- 1,000 hectares total
- 10 polygons/month
- 60 API calls/minute

### 1.2 Database Migration

**File:** `supabase/migrations/00005_agro_api_integration.sql`

**Tables created:**

| Table | Purpose |
|-------|---------|
| `agro_polygons` | Maps field_id → agro_polygon_id |
| `ndvi_readings` | NDVI/EVI data per field per date |
| `gdd_readings` | Growing Degree Days accumulation |
| `precipitation_readings` | Cumulative precipitation |
| `agro_soil_readings` | Secondary soil data from Agro API |

**Views created:**

| View | Purpose |
|------|---------|
| `latest_field_ndvi` | Latest NDVI reading per field |
| `fields_with_vegetation` | Extended field view with vegetation status |

**RLS Policies:**
- Users can only read their own data
- Service role can insert for cron jobs

### 1.3 Agro API Client Library

**Location:** `src/lib/agroapi/`

| File | Purpose |
|------|---------|
| `client.ts` | Singleton initialization, `isAgroConfigured()`, `agroFetch()` |
| `types.ts` | TypeScript interfaces for all Agro API responses |
| `polygons.ts` | `createAgroPolygon()`, `deleteAgroPolygon()`, `hasCapacityForPolygon()` |
| `ndvi.ts` | `fetchNDVIForPolygon()`, `calculateNDVIStats()`, `getNDVIStatus()` |
| `weather-history.ts` | `fetchAccumulatedTemperature()`, `fetchAccumulatedPrecipitation()`, `fetchSoilData()` |
| `sync.ts` | `syncFieldToAgro()`, `unsyncFieldFromAgro()`, `updateFieldInAgro()` |
| `index.ts` | Re-exports all modules |

### 1.4 TypeScript Types

**File:** `src/types/database.ts`

**Added types:**
```typescript
export type VegetationStatus = 'excellent' | 'good' | 'moderate' | 'poor' | 'unknown';
export type AgroSyncStatus = 'synced' | 'pending' | 'error' | 'deleted';
export type AgroPolygonMapping = Database['public']['Tables']['agro_polygons']['Row'];
export type NDVIReading = Database['public']['Tables']['ndvi_readings']['Row'];
export type GDDReading = Database['public']['Tables']['gdd_readings']['Row'];
export type PrecipitationReading = Database['public']['Tables']['precipitation_readings']['Row'];
export type AgroSoilReading = Database['public']['Tables']['agro_soil_readings']['Row'];
export type LatestFieldNDVI = Database['public']['Views']['latest_field_ndvi']['Row'];
export type FieldWithVegetation = Database['public']['Views']['fields_with_vegetation']['Row'];
```

---

## Phase 2: NDVI Integration

### 2.1 NDVI API Route

**File:** `src/app/api/ndvi/[fieldId]/route.ts`

**Endpoint:** `GET /api/ndvi/[fieldId]?days=30`

**Response:**
```json
{
  "fieldId": "uuid",
  "fieldName": "Field Name",
  "readings": [...],
  "stats": {
    "mean": 0.45,
    "min": 0.32,
    "max": 0.58,
    "trend": "improving",
    "readingsCount": 12
  },
  "currentNDVI": 0.52,
  "currentStatus": "good",
  "syncStatus": "synced",
  "needsSync": false,
  "configured": true
}
```

### 2.2 useNDVIHistory Hook

**File:** `src/hooks/useNDVIHistory.ts`

**Usage:**
```typescript
const {
  readings,
  loading,
  error,
  configured,
  needsSync,
  syncStatus,
  stats,
  currentNDVI,
  currentStatus,
  refetch,
} = useNDVIHistory(fieldId, timeRange);
```

### 2.3 NDVIChart Component

**File:** `src/components/charts/NDVIChart.tsx`

**Features:**
- Line chart with reference areas for status zones
- Color-coded zones: excellent (>0.6), good (0.4-0.6), moderate (0.2-0.4), poor (<0.2)
- Custom tooltip with status label
- Loading and empty states
- Dark mode support

### 2.4 NDVI Constants

**File:** `src/lib/constants.ts`

**Added:**
- `NDVI_THRESHOLDS` - Status threshold values
- `NDVI_STATUS_COLORS` - UI colors for each status
- `NDVI_CHART_CONFIG` - Chart styling
- `NDVI_TEXT` - Polish UI strings
- `AGRONOMIC_TEXT` - Polish UI strings for agronomic data

---

## Phase 3: Agronomic Data

### 3.1 Agronomic API Route

**File:** `src/app/api/agronomic/[fieldId]/route.ts`

**Endpoint:** `GET /api/agronomic/[fieldId]`

**Response:**
```json
{
  "fieldId": "uuid",
  "fieldName": "Field Name",
  "configured": true,
  "seasonStart": "2024-03-01",
  "gdd": {
    "gdd": 1250.5,
    "tempSum": 1250.5,
    "daysCount": 180,
    "startDate": "2024-03-01",
    "endDate": "2024-08-28"
  },
  "precipitation": {
    "totalMm": 324.5,
    "daysCount": 180,
    "startDate": "2024-03-01",
    "endDate": "2024-08-28"
  },
  "soil": {
    "moisture": 0.35,
    "tempSurface": 22.5,
    "temp10cm": 18.3,
    "timestamp": "2024-08-28T12:00:00Z"
  },
  "hasSoilData": true,
  "errors": { "gdd": null, "precipitation": null, "soil": null }
}
```

### 3.2 AgronomicWidget Component

**File:** `src/components/dashboard/AgronomicWidget.tsx`

**Features:**
- 3-column grid layout
- GDD with thermometer icon
- Precipitation with droplet icon
- Soil temperature with plant icon
- Graceful degradation when not configured
- Loading and error states

### 3.3 Translations

**Files:**
- `src/i18n/messages/pl.json`
- `src/i18n/messages/en.json`

**Added sections:**
- `ndvi.*` - NDVI titles, status labels, descriptions
- `agronomic.*` - GDD, precipitation, soil labels

---

## Phase 4: Automation & Sync

### 4.1 Polygon Sync API

**File:** `src/app/api/fields/[id]/sync-agro/route.ts`

**Endpoints:**

| Method | Action |
|--------|--------|
| `POST /api/fields/[id]/sync-agro` | Sync field to Agro API |
| `DELETE /api/fields/[id]/sync-agro` | Remove field from Agro API |

**POST Response:**
```json
{
  "success": true,
  "agroPolygonId": "agro_polygon_id",
  "syncStatus": "synced"
}
```

### 4.2 NDVI Cron Job

**File:** `src/app/api/cron/ndvi/route.ts`

**Schedule:** Daily at 7:00 AM UTC (after moisture cron at 6:00 AM)

**Process:**
1. Get all synced agro polygons
2. Fetch NDVI data for last 30 days
3. Upsert readings to database
4. Check for vegetation stress alerts (NDVI < 0.2)
5. Create alerts if needed

### 4.3 Vercel Cron Config

**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/moisture",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/ndvi",
      "schedule": "0 7 * * *"
    }
  ]
}
```

### 4.4 Sync UI

**File:** `src/app/(dashboard)/fields/[id]/page.tsx`

**Features:**
- "Sync with Agro API" button when not synced
- Status indicators for sync state
- "Remove sync" option when synced
- Error state with retry button
- Pending state indicator

---

## File Summary

### New Files Created (18)

```
supabase/migrations/00005_agro_api_integration.sql
src/lib/agroapi/client.ts
src/lib/agroapi/types.ts
src/lib/agroapi/polygons.ts
src/lib/agroapi/ndvi.ts
src/lib/agroapi/weather-history.ts
src/lib/agroapi/sync.ts
src/lib/agroapi/index.ts
src/app/api/ndvi/[fieldId]/route.ts
src/app/api/agronomic/[fieldId]/route.ts
src/app/api/fields/[id]/sync-agro/route.ts
src/app/api/cron/ndvi/route.ts
src/hooks/useNDVIHistory.ts
src/components/charts/NDVIChart.tsx
src/components/dashboard/AgronomicWidget.tsx
docs/AGRO_API_INTEGRATION.md
```

### Modified Files (6)

```
.env.local (add AGRO_API_KEY, AGRO_API_ENABLED)
src/types/database.ts (add new types)
src/lib/constants.ts (add NDVI thresholds, UI text)
src/components/charts/index.ts (export NDVIChart)
src/i18n/messages/pl.json (add translations)
src/i18n/messages/en.json (add translations)
src/app/(dashboard)/fields/[id]/page.tsx (add NDVI section, sync UI)
vercel.json (add NDVI cron)
```

---

## Graceful Degradation

All Agro API features follow this principle:

1. **Check configuration:** `isAgroConfigured()` before any API call
2. **Components return null:** When not configured
3. **API routes return 503:** With `{ configured: false }`
4. **Hooks track state:** `configured` boolean in return value
5. **App works fully:** Without Agro API - only GEE features

---

## Remaining / Future Work

### Not Implemented (Out of Scope)

| Feature | Reason |
|---------|--------|
| EVI (Enhanced Vegetation Index) | Data fetched but not displayed - can add chart later |
| Soil moisture from Agro API | Secondary to GEE SAR data |
| Weather history charts | Current weather widget sufficient |
| Polygon update API | Agro API doesn't support updates - delete+create used |

### Potential Enhancements

1. **Push notifications for vegetation stress** - Currently only creates alert record
2. **Email alerts for low NDVI** - Same as moisture alerts
3. **Agronomic recommendations** - Based on GDD + crop type
4. **Historical comparison** - Compare seasons
5. **Export NDVI data** - Add to CSV/PDF export

---

## Testing Checklist

### Manual Testing

- [ ] Add AGRO_API_KEY to .env.local
- [ ] Run database migration
- [ ] Navigate to field detail page
- [ ] Verify NDVI section appears (if configured)
- [ ] Click "Sync with Agro API" button
- [ ] Verify sync completes successfully
- [ ] Verify NDVI chart appears after sync
- [ ] Verify AgronomicWidget shows data
- [ ] Test unsync functionality
- [ ] Test error handling (invalid API key)

### Automated Testing (Future)

- [ ] Unit tests for `src/lib/agroapi/ndvi.ts`
- [ ] Unit tests for `src/lib/agroapi/sync.ts`
- [ ] E2E test for sync flow
- [ ] E2E test for NDVI chart rendering

---

## Troubleshooting

### Common Issues

**NDVI section doesn't appear:**
- Check `AGRO_API_ENABLED=true` in .env.local
- Check `AGRO_API_KEY` is set

**Sync fails with "limit exceeded":**
- Free tier: 10 polygons, 1000 ha
- Delete unused syncs or upgrade plan

**No NDVI data after sync:**
- Agro API needs time to process new polygons
- Wait 24 hours for first data
- Check field boundary is valid

**Cron job not running:**
- Verify CRON_SECRET is set
- Check Vercel deployment logs
- Manual test: `GET /api/cron/ndvi`

---

## API Reference

### Agro API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `POST /polygons` | Create polygon |
| `DELETE /polygons/{id}` | Delete polygon |
| `GET /polygons` | List polygons |
| `GET /ndvi/history?polyid={id}` | NDVI history |
| `GET /weather/history/accumulated_temperature` | GDD data |
| `GET /weather/history/accumulated_precipitation` | Precipitation |
| `GET /soil?polyid={id}` | Current soil data |

### Internal API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ndvi/[fieldId]` | GET | NDVI history for field |
| `/api/agronomic/[fieldId]` | GET | GDD, precipitation, soil |
| `/api/fields/[id]/sync-agro` | POST | Sync field to Agro API |
| `/api/fields/[id]/sync-agro` | DELETE | Remove sync |
| `/api/cron/ndvi` | POST/GET | Daily NDVI fetch |

---

## Changelog

### v1.0.0 (Initial Release)

- Full Agro API integration
- NDVI visualization and tracking
- Agronomic data widget (GDD, precipitation, soil)
- Field sync management
- Daily automated NDVI updates
- Polish and English translations
