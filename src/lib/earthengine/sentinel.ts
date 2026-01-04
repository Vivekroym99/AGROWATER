/**
 * Sentinel-1 SAR data query functions
 * Extracts VV and VH backscatter values for field polygons
 */

import { getEE } from './client';
import type { GeoJSONPolygon, BackscatterStats, SentinelImageMetadata } from './types';

/**
 * Query Sentinel-1 GRD collection for a polygon
 */
export async function querySentinel1(
  polygon: GeoJSONPolygon,
  startDate: string,
  endDate: string
): Promise<Array<{ metadata: SentinelImageMetadata; stats: BackscatterStats }>> {
  const ee = getEE();

  // Convert GeoJSON polygon to EE geometry
  const geometry = ee.Geometry.Polygon(polygon.coordinates);

  // Query Sentinel-1 GRD collection
  const collection = ee
    .ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(geometry)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .select(['VV', 'VH']);

  // Get collection info
  const imageList = collection.toList(100);
  const count = await new Promise<number>((resolve, reject) => {
    collection.size().evaluate((result, error) => {
      if (error) reject(error);
      else resolve(result || 0);
    });
  });

  if (count === 0) {
    return [];
  }

  // Process each image
  const results: Array<{ metadata: SentinelImageMetadata; stats: BackscatterStats }> = [];

  for (let i = 0; i < Math.min(count, 50); i++) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const image = ee.Image(imageList.get(i) as any);

      // Get image metadata
      const metadata = await new Promise<SentinelImageMetadata>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (image.get('system:index') as any).evaluate((id: string | null, error: Error | null) => {
          if (error) reject(error);
          else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (image.get('system:time_start') as any).evaluate((time: number | null, err: Error | null) => {
              if (err) reject(err);
              else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (image.get('orbitProperties_pass') as any).evaluate((orbit: string | null, e: Error | null) => {
                  if (e) reject(e);
                  else {
                    resolve({
                      id: id || '',
                      acquisitionDate: new Date(time || 0).toISOString().split('T')[0],
                      orbit: (orbit as 'ASCENDING' | 'DESCENDING') || 'ASCENDING',
                    });
                  }
                });
              }
            });
          }
        });
      });

      // Calculate mean backscatter values for the polygon
      const stats = await extractBackscatterStats(image, geometry);

      results.push({ metadata, stats });
    } catch (error) {
      console.error(`Error processing image ${i}:`, error);
      // Continue with other images
    }
  }

  return results;
}

/**
 * Extract mean VV and VH backscatter values for a geometry
 */
async function extractBackscatterStats(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  image: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geometry: any
): Promise<BackscatterStats> {
  const ee = getEE();

  // Reduce region to get mean values
  const meanDict = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: geometry,
    scale: 10, // Sentinel-1 resolution
    maxPixels: 1e9,
  });

  return new Promise((resolve, reject) => {
    meanDict.evaluate(
      (result: { VV?: number; VH?: number } | null, error: Error | null) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            vv_mean: result?.VV ?? -999,
            vh_mean: result?.VH ?? null,
          });
        }
      }
    );
  });
}

/**
 * Get the most recent Sentinel-1 image date for a location
 */
export async function getLatestImageDate(polygon: GeoJSONPolygon): Promise<string | null> {
  const ee = getEE();
  const geometry = ee.Geometry.Polygon(polygon.coordinates);

  // Get most recent image
  const latestImage = ee
    .ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(geometry)
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .sort('system:time_start', false)
    .first();

  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (latestImage.get('system:time_start') as any).evaluate((time: number | null, error: Error | null) => {
      if (error) {
        // No images found
        resolve(null);
      } else if (time) {
        resolve(new Date(time).toISOString().split('T')[0]);
      } else {
        resolve(null);
      }
    });
  });
}
