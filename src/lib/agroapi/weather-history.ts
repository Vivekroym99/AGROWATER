/**
 * Historical weather data from Agro API
 * Includes accumulated temperature (GDD) and cumulative precipitation
 */

import type {
  AgroAccumulatedTemp,
  AgroAccumulatedPrecip,
  AgroSoilData,
  GDDResult,
  PrecipitationResult,
  AgroSoilResult,
} from './types';
import { agroFetch, isAgroConfigured } from './client';

// Default base temperature for GDD calculation (Celsius)
const DEFAULT_BASE_TEMP = 10;

/**
 * Fetch accumulated temperature (Growing Degree Days) for a location
 */
export async function fetchAccumulatedTemperature(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
  baseTemp: number = DEFAULT_BASE_TEMP
): Promise<GDDResult> {
  if (!isAgroConfigured()) {
    throw new Error('Agro API not configured');
  }

  const startUnix = Math.floor(new Date(startDate).getTime() / 1000);
  const endUnix = Math.floor(new Date(endDate).getTime() / 1000);

  const response = await agroFetch(
    `/weather/history/accumulated_temperature?lat=${lat}&lon=${lon}&start=${startUnix}&end=${endUnix}&threshold=${baseTemp}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GDD fetch failed: ${response.status} - ${errorText}`);
  }

  const data: AgroAccumulatedTemp[] = await response.json();

  // Get the last entry which has the cumulative values
  const lastEntry = data[data.length - 1];

  return {
    gdd: Math.round((lastEntry?.temp.sum || 0) * 10) / 10,
    tempSum: lastEntry?.temp.sum || 0,
    daysCount: lastEntry?.count || 0,
    startDate,
    endDate,
  };
}

/**
 * Fetch cumulative precipitation for a location
 */
export async function fetchAccumulatedPrecipitation(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): Promise<PrecipitationResult> {
  if (!isAgroConfigured()) {
    throw new Error('Agro API not configured');
  }

  const startUnix = Math.floor(new Date(startDate).getTime() / 1000);
  const endUnix = Math.floor(new Date(endDate).getTime() / 1000);

  const response = await agroFetch(
    `/weather/history/accumulated_precipitation?lat=${lat}&lon=${lon}&start=${startUnix}&end=${endUnix}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Precipitation fetch failed: ${response.status} - ${errorText}`);
  }

  const data: AgroAccumulatedPrecip[] = await response.json();

  // Get the last entry which has the cumulative values
  const lastEntry = data[data.length - 1];

  return {
    totalMm: Math.round((lastEntry?.rain.sum || 0) * 10) / 10,
    daysCount: lastEntry?.count || 0,
    startDate,
    endDate,
  };
}

/**
 * Fetch current soil data for a polygon
 */
export async function fetchSoilData(agroPolygonId: string): Promise<AgroSoilResult> {
  if (!isAgroConfigured()) {
    throw new Error('Agro API not configured');
  }

  const response = await agroFetch(`/soil?polyid=${agroPolygonId}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Soil data fetch failed: ${response.status} - ${errorText}`);
  }

  const data: AgroSoilData = await response.json();

  // Convert temperatures from Kelvin to Celsius
  const kelvinToCelsius = (k: number | undefined): number | null => {
    if (k === undefined || k === null) return null;
    return Math.round((k - 273.15) * 10) / 10;
  };

  return {
    moisture: data.moisture ?? null,
    tempSurface: kelvinToCelsius(data.t0),
    temp10cm: kelvinToCelsius(data.t10),
    timestamp: new Date(data.dt * 1000),
  };
}

/**
 * Get the growing season start date
 * Default: March 1st of current year (or previous year if before March)
 */
export function getSeasonStartDate(): string {
  const now = new Date();
  const year = now.getMonth() < 2 ? now.getFullYear() - 1 : now.getFullYear();
  return `${year}-03-01`;
}

/**
 * Get date range for weather history queries
 */
export function getWeatherHistoryDateRange(days: number = 30): {
  startDate: string;
  endDate: string;
} {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}
