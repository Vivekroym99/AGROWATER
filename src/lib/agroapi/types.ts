/**
 * OpenWeatherMap Agro API type definitions
 */

// Agro API polygon structure
export interface AgroPolygon {
  id: string;
  name: string;
  center: [number, number]; // [lon, lat]
  area: number; // hectares
  user_id: string;
  geo_json: {
    type: 'Feature';
    properties: Record<string, unknown>;
    geometry: {
      type: 'Polygon';
      coordinates: number[][][];
    };
  };
  created_at: number; // Unix timestamp
}

// NDVI data from Agro API
export interface AgroNDVIData {
  dt: number; // Unix timestamp
  source: string;
  zoom: number;
  dc: number; // Data coverage percentage
  cl: number; // Cloud coverage percentage
  data: {
    mean: number;
    min: number;
    max: number;
    median: number;
    std: number;
    num: number;
  };
}

// Soil data from Agro API
export interface AgroSoilData {
  dt: number; // Unix timestamp
  t10: number; // Temperature at 10cm depth (Kelvin)
  moisture: number; // Moisture 0-1
  t0: number; // Surface temperature (Kelvin)
}

// Accumulated temperature response
export interface AgroAccumulatedTemp {
  dt: number;
  count: number;
  temp: {
    mean: number;
    min: number;
    max: number;
    sum: number;
  };
}

// Accumulated precipitation response
export interface AgroAccumulatedPrecip {
  dt: number;
  count: number;
  rain: {
    mean: number;
    sum: number;
  };
}

// Internal NDVI result format
export interface NDVIResult {
  observation_date: string;
  ndvi_mean: number;
  ndvi_min: number;
  ndvi_max: number;
  evi_mean: number | null;
  data_coverage: number;
  cloud_coverage: number;
  source: string;
}

// Vegetation statistics
export interface VegetationStats {
  average: number;
  min: number;
  max: number;
  trend: 'improving' | 'declining' | 'stable';
  count: number;
}

// Polygon usage stats
export interface PolygonUsage {
  count: number;
  totalAreaHa: number;
  remainingPolygons: number;
  remainingAreaHa: number;
}

// Sync result
export interface SyncResult {
  success: boolean;
  agroPolygonId?: string;
  error?: string;
}

// GDD result
export interface GDDResult {
  gdd: number;
  tempSum: number;
  daysCount: number;
  startDate: string;
  endDate: string;
}

// Precipitation result
export interface PrecipitationResult {
  totalMm: number;
  daysCount: number;
  startDate: string;
  endDate: string;
}

// Agro soil result (transformed)
export interface AgroSoilResult {
  moisture: number | null;
  tempSurface: number | null;
  temp10cm: number | null;
  timestamp: Date;
}

// Vegetation status type
export type VegetationStatus = 'unknown' | 'poor' | 'moderate' | 'good' | 'excellent';
