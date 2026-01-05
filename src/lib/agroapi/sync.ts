/**
 * Field polygon synchronization with Agro API
 * Handles creation, updates, and deletion of Agro polygons
 */

import type { GeoJSONPolygon } from '@/types/database';
import type { SyncResult } from './types';
import { isAgroConfigured } from './client';
import { createAgroPolygon, deleteAgroPolygon, hasCapacityForPolygon } from './polygons';

/**
 * Sync a field to Agro API
 * Creates a polygon in Agro API and returns the polygon ID
 */
export async function syncFieldToAgro(
  fieldId: string,
  fieldName: string,
  boundary: GeoJSONPolygon,
  areaHectares: number
): Promise<SyncResult> {
  if (!isAgroConfigured()) {
    return {
      success: false,
      error: 'Agro API nie jest skonfigurowane',
    };
  }

  try {
    // Check if there's capacity for this polygon
    const capacity = await hasCapacityForPolygon(areaHectares);
    if (!capacity.hasCapacity) {
      return {
        success: false,
        error: capacity.reason,
      };
    }

    // Create polygon in Agro API
    const agroPolygon = await createAgroPolygon(fieldName, boundary);

    return {
      success: true,
      agroPolygonId: agroPolygon.id,
    };
  } catch (error) {
    console.error('Error syncing field to Agro API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany blad synchronizacji',
    };
  }
}

/**
 * Remove a field from Agro API
 * Deletes the polygon from Agro API
 */
export async function unsyncFieldFromAgro(agroPolygonId: string): Promise<SyncResult> {
  if (!isAgroConfigured()) {
    return {
      success: false,
      error: 'Agro API nie jest skonfigurowane',
    };
  }

  try {
    await deleteAgroPolygon(agroPolygonId);
    return { success: true };
  } catch (error) {
    console.error('Error removing field from Agro API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany blad usuwania',
    };
  }
}

/**
 * Update a field in Agro API
 * Deletes old polygon and creates new one (Agro API doesn't support updates)
 */
export async function updateFieldInAgro(
  oldAgroPolygonId: string,
  fieldName: string,
  boundary: GeoJSONPolygon
): Promise<SyncResult> {
  if (!isAgroConfigured()) {
    return {
      success: false,
      error: 'Agro API nie jest skonfigurowane',
    };
  }

  try {
    // Delete old polygon first
    await deleteAgroPolygon(oldAgroPolygonId);

    // Create new polygon
    const agroPolygon = await createAgroPolygon(fieldName, boundary);

    return {
      success: true,
      agroPolygonId: agroPolygon.id,
    };
  } catch (error) {
    console.error('Error updating field in Agro API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany blad aktualizacji',
    };
  }
}
