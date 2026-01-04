/**
 * Google Earth Engine integration for AgroWater
 * Provides soil moisture data from Sentinel-1 SAR satellite
 */

// Client and initialization
export {
  initializeEarthEngine,
  getEE,
  isEarthEngineInitialized,
} from './client';

// Sentinel-1 queries
export {
  querySentinel1,
  getLatestImageDate,
} from './sentinel';

// Moisture calculation
export {
  fetchMoistureForField,
  vvToMoistureIndex,
  calculateMoistureStats,
  getDateRange,
} from './moisture';

// Types
export type {
  GEECredentials,
  SentinelImageMetadata,
  BackscatterStats,
  FieldMoistureQuery,
  MoistureResult,
  GeoJSONPolygon,
  ProcessFieldResult,
  CronJobResult,
} from './types';
