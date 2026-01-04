/**
 * Soil moisture index calculation from Sentinel-1 SAR data
 *
 * The VV backscatter from Sentinel-1 correlates with soil moisture:
 * - Higher (less negative) VV values indicate wetter soil
 * - Lower (more negative) VV values indicate drier soil
 *
 * Typical VV range: -20 dB (dry) to -8 dB (wet)
 */

import { initializeEarthEngine } from './client';
import { querySentinel1 } from './sentinel';
import type { GeoJSONPolygon, MoistureResult } from './types';

// VV backscatter range for normalization (in dB)
const VV_MIN = -20; // Very dry soil
const VV_MAX = -8;  // Saturated soil

/**
 * Convert VV backscatter (dB) to moisture index (0-1)
 * Uses linear normalization within expected VV range
 */
export function vvToMoistureIndex(vvDb: number): number {
  // Clamp VV to expected range
  const clampedVV = Math.max(VV_MIN, Math.min(VV_MAX, vvDb));

  // Normalize to 0-1 scale
  // Higher VV (less negative) = higher moisture
  const moisture = (clampedVV - VV_MIN) / (VV_MAX - VV_MIN);

  // Round to 3 decimal places
  return Math.round(moisture * 1000) / 1000;
}

/**
 * Fetch moisture data for a field polygon
 * Returns array of moisture readings for the date range
 */
export async function fetchMoistureForField(
  polygon: GeoJSONPolygon,
  startDate: string,
  endDate: string
): Promise<MoistureResult[]> {
  // Initialize Earth Engine if not already done
  await initializeEarthEngine();

  // Query Sentinel-1 data
  const sentinelData = await querySentinel1(polygon, startDate, endDate);

  if (sentinelData.length === 0) {
    console.log('No Sentinel-1 data found for the specified date range');
    return [];
  }

  // Convert backscatter to moisture readings
  const moistureReadings: MoistureResult[] = sentinelData
    .filter((item) => item.stats.vv_mean !== -999) // Filter invalid values
    .map((item) => ({
      observation_date: item.metadata.acquisitionDate,
      moisture_index: vvToMoistureIndex(item.stats.vv_mean),
      vv_backscatter: Math.round(item.stats.vv_mean * 100) / 100,
      vh_backscatter: item.stats.vh_mean
        ? Math.round(item.stats.vh_mean * 100) / 100
        : null,
      source: 'sentinel1',
    }));

  // Sort by date (newest first)
  moistureReadings.sort(
    (a, b) => new Date(b.observation_date).getTime() - new Date(a.observation_date).getTime()
  );

  // Remove duplicates (same date)
  const uniqueReadings = moistureReadings.filter(
    (reading, index, self) =>
      index === self.findIndex((r) => r.observation_date === reading.observation_date)
  );

  return uniqueReadings;
}

/**
 * Calculate moisture statistics from readings
 */
export function calculateMoistureStats(readings: MoistureResult[]): {
  average: number;
  min: number;
  max: number;
  trend: 'up' | 'down' | 'stable';
  count: number;
} | null {
  if (readings.length === 0) {
    return null;
  }

  const moistureValues = readings.map((r) => r.moisture_index);

  const average = moistureValues.reduce((a, b) => a + b, 0) / moistureValues.length;
  const min = Math.min(...moistureValues);
  const max = Math.max(...moistureValues);

  // Calculate trend (compare last 3 readings if available)
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (readings.length >= 3) {
    const recent = readings.slice(0, 3).map((r) => r.moisture_index);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = average;

    const diff = recentAvg - olderAvg;
    if (diff > 0.05) trend = 'up';
    else if (diff < -0.05) trend = 'down';
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
 * Get date range for querying (default: last 30 days)
 */
export function getDateRange(days: number = 30): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}
