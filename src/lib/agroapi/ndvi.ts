/**
 * NDVI data fetching from Agro API
 */

import type { AgroNDVIData, NDVIResult, VegetationStats, VegetationStatus } from './types';
import { agroFetch, isAgroConfigured } from './client';

// NDVI thresholds for vegetation health assessment
export const NDVI_THRESHOLDS = {
  excellent: 0.6, // >= 0.6 is excellent
  good: 0.4,      // 0.4-0.59 is good
  moderate: 0.2,  // 0.2-0.39 is moderate
  // < 0.2 is poor
} as const;

// Minimum data coverage to accept reading (%)
const MIN_DATA_COVERAGE = 10;

/**
 * Fetch NDVI history for a polygon from Agro API
 */
export async function fetchNDVIForPolygon(
  agroPolygonId: string,
  startDate: string,
  endDate: string
): Promise<NDVIResult[]> {
  if (!isAgroConfigured()) {
    throw new Error('Agro API not configured');
  }

  const startUnix = Math.floor(new Date(startDate).getTime() / 1000);
  const endUnix = Math.floor(new Date(endDate).getTime() / 1000);

  const response = await agroFetch(
    `/ndvi/history?polyid=${agroPolygonId}&start=${startUnix}&end=${endUnix}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      // No data available for this polygon/period
      return [];
    }
    const errorText = await response.text();
    throw new Error(`NDVI fetch failed: ${response.status} - ${errorText}`);
  }

  const data: AgroNDVIData[] = await response.json();

  // Transform and filter data
  const results: NDVIResult[] = data
    .filter((item) => item.data && item.dc >= MIN_DATA_COVERAGE)
    .map((item) => ({
      observation_date: new Date(item.dt * 1000).toISOString().split('T')[0],
      ndvi_mean: Math.round(item.data.mean * 1000) / 1000,
      ndvi_min: Math.round(item.data.min * 1000) / 1000,
      ndvi_max: Math.round(item.data.max * 1000) / 1000,
      evi_mean: null, // EVI requires separate endpoint
      data_coverage: Math.round(item.dc * 100) / 100,
      cloud_coverage: Math.round(item.cl * 100) / 100,
      source: item.source || 'agro_api',
    }));

  // Sort by date descending and remove duplicates
  return results
    .sort((a, b) => new Date(b.observation_date).getTime() - new Date(a.observation_date).getTime())
    .filter((r, i, arr) => i === arr.findIndex((x) => x.observation_date === r.observation_date));
}

/**
 * Fetch current NDVI for a polygon (latest available)
 */
export async function fetchCurrentNDVI(agroPolygonId: string): Promise<NDVIResult | null> {
  if (!isAgroConfigured()) {
    throw new Error('Agro API not configured');
  }

  const response = await agroFetch(`/ndvi?polyid=${agroPolygonId}`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const errorText = await response.text();
    throw new Error(`Current NDVI fetch failed: ${response.status} - ${errorText}`);
  }

  const data: AgroNDVIData = await response.json();

  if (!data.data || data.dc < MIN_DATA_COVERAGE) {
    return null;
  }

  return {
    observation_date: new Date(data.dt * 1000).toISOString().split('T')[0],
    ndvi_mean: Math.round(data.data.mean * 1000) / 1000,
    ndvi_min: Math.round(data.data.min * 1000) / 1000,
    ndvi_max: Math.round(data.data.max * 1000) / 1000,
    evi_mean: null,
    data_coverage: Math.round(data.dc * 100) / 100,
    cloud_coverage: Math.round(data.cl * 100) / 100,
    source: data.source || 'agro_api',
  };
}

/**
 * Calculate NDVI statistics from readings
 */
export function calculateNDVIStats(readings: NDVIResult[]): VegetationStats | null {
  if (readings.length === 0) {
    return null;
  }

  const values = readings.map((r) => r.ndvi_mean);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Calculate trend based on recent vs overall average
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (readings.length >= 3) {
    const recent = readings.slice(0, 3).map((r) => r.ndvi_mean);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const diff = recentAvg - average;

    if (diff > 0.05) {
      trend = 'improving';
    } else if (diff < -0.05) {
      trend = 'declining';
    }
  }

  return {
    average: Math.round(average * 1000) / 1000,
    min: Math.round(min * 1000) / 1000,
    max: Math.round(max * 1000) / 1000,
    trend,
    count: readings.length,
  };
}

/**
 * Get vegetation status from NDVI value
 */
export function getNDVIStatus(ndvi: number | null): VegetationStatus {
  if (ndvi === null || ndvi === undefined) {
    return 'unknown';
  }

  if (ndvi >= NDVI_THRESHOLDS.excellent) {
    return 'excellent';
  }
  if (ndvi >= NDVI_THRESHOLDS.good) {
    return 'good';
  }
  if (ndvi >= NDVI_THRESHOLDS.moderate) {
    return 'moderate';
  }
  return 'poor';
}

/**
 * Get date range for NDVI queries
 */
export function getNDVIDateRange(days: number = 30): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}
