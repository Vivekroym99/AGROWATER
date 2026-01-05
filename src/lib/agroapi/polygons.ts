/**
 * Agro API polygon management
 * Handles creation, deletion, and listing of polygons
 */

import type { GeoJSONPolygon } from '@/types/database';
import type { AgroPolygon, PolygonUsage } from './types';
import { agroFetch, isAgroConfigured } from './client';

// Free tier limits
const FREE_TIER_MAX_POLYGONS = 10;
const FREE_TIER_MAX_AREA_HA = 1000;

/**
 * Create a polygon in Agro API
 */
export async function createAgroPolygon(
  name: string,
  boundary: GeoJSONPolygon
): Promise<AgroPolygon> {
  if (!isAgroConfigured()) {
    throw new Error('Agro API not configured');
  }

  const geoJson = {
    type: 'Feature' as const,
    properties: { name },
    geometry: boundary,
  };

  const response = await agroFetch('/polygons', {
    method: 'POST',
    body: JSON.stringify({
      name,
      geo_json: geoJson,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create Agro polygon: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Delete a polygon from Agro API
 */
export async function deleteAgroPolygon(agroPolygonId: string): Promise<void> {
  if (!isAgroConfigured()) {
    throw new Error('Agro API not configured');
  }

  const response = await agroFetch(`/polygons/${agroPolygonId}`, {
    method: 'DELETE',
  });

  // 404 is okay - polygon already deleted
  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    throw new Error(`Failed to delete Agro polygon: ${response.status} - ${errorText}`);
  }
}

/**
 * Get a single polygon from Agro API
 */
export async function getAgroPolygon(agroPolygonId: string): Promise<AgroPolygon | null> {
  if (!isAgroConfigured()) {
    throw new Error('Agro API not configured');
  }

  const response = await agroFetch(`/polygons/${agroPolygonId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Agro polygon: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * List all polygons from Agro API
 */
export async function listAgroPolygons(): Promise<AgroPolygon[]> {
  if (!isAgroConfigured()) {
    throw new Error('Agro API not configured');
  }

  const response = await agroFetch('/polygons');

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list Agro polygons: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Get polygon usage statistics
 * Returns current usage and remaining capacity
 */
export async function getPolygonUsage(): Promise<PolygonUsage> {
  const polygons = await listAgroPolygons();
  const totalArea = polygons.reduce((sum, p) => sum + (p.area || 0), 0);

  return {
    count: polygons.length,
    totalAreaHa: Math.round(totalArea * 100) / 100,
    remainingPolygons: Math.max(0, FREE_TIER_MAX_POLYGONS - polygons.length),
    remainingAreaHa: Math.max(0, FREE_TIER_MAX_AREA_HA - totalArea),
  };
}

/**
 * Check if there's capacity to add a new polygon
 */
export async function hasCapacityForPolygon(areaHectares: number): Promise<{
  hasCapacity: boolean;
  reason?: string;
}> {
  const usage = await getPolygonUsage();

  if (usage.remainingPolygons <= 0) {
    return {
      hasCapacity: false,
      reason: `Limit poligonow osiagniety (max ${FREE_TIER_MAX_POLYGONS})`,
    };
  }

  if (usage.remainingAreaHa < areaHectares) {
    return {
      hasCapacity: false,
      reason: `Niewystarczajaca powierzchnia (pozostalo ${usage.remainingAreaHa.toFixed(1)} ha, potrzeba ${areaHectares.toFixed(1)} ha)`,
    };
  }

  return { hasCapacity: true };
}
