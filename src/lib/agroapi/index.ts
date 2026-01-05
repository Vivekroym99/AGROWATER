/**
 * Agro API module exports
 * OpenWeatherMap Agro API integration for NDVI, GDD, and weather data
 */

// Client
export {
  isAgroConfigured,
  getApiKey,
  getAgroApiBase,
  initializeAgroClient,
  isAgroInitialized,
  resetAgroClient,
  agroFetch,
} from './client';

// Types
export type {
  AgroPolygon,
  AgroNDVIData,
  AgroSoilData,
  AgroAccumulatedTemp,
  AgroAccumulatedPrecip,
  NDVIResult,
  VegetationStats,
  PolygonUsage,
  SyncResult,
  GDDResult,
  PrecipitationResult,
  AgroSoilResult,
  VegetationStatus,
} from './types';

// Polygons
export {
  createAgroPolygon,
  deleteAgroPolygon,
  getAgroPolygon,
  listAgroPolygons,
  getPolygonUsage,
  hasCapacityForPolygon,
} from './polygons';

// NDVI
export {
  NDVI_THRESHOLDS,
  fetchNDVIForPolygon,
  fetchCurrentNDVI,
  calculateNDVIStats,
  getNDVIStatus,
  getNDVIDateRange,
} from './ndvi';

// Weather History
export {
  fetchAccumulatedTemperature,
  fetchAccumulatedPrecipitation,
  fetchSoilData,
  getSeasonStartDate,
  getWeatherHistoryDateRange,
} from './weather-history';

// Sync
export {
  syncFieldToAgro,
  unsyncFieldFromAgro,
  updateFieldInAgro,
} from './sync';

// Satellite Imagery
export {
  searchSatelliteImages,
  getSatelliteTileUrl,
  getTileUrlWithApiKey,
  filterByCloudCoverage,
  getMaxZoomForSource,
  PRESET_CONFIG,
} from './satellite';

export type {
  SatellitePreset,
  SatelliteImage,
  SatelliteImageResult,
} from './satellite';
