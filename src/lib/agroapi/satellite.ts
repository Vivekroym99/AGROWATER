/**
 * Agro API Satellite Imagery functions
 * Provides access to satellite imagery tiles for field visualization
 */

import { agroFetch, isAgroConfigured, getApiKey } from './client';

// Satellite image presets available from Agro API
export type SatellitePreset = 'truecolor' | 'falsecolor' | 'ndvi' | 'evi';

// Satellite image search result from Agro API
export interface SatelliteImageResult {
  dt: number; // Unix timestamp
  type: string; // Image type (e.g., 'Landsat 8', 'Sentinel 2')
  dc: number; // Data coverage percentage
  cl: number; // Cloud coverage percentage
  sun: {
    elevation: number;
    azimuth: number;
  };
  image: {
    truecolor: string;
    falsecolor: string;
    ndvi: string;
    evi: string;
  };
  tile: {
    truecolor: string;
    falsecolor: string;
    ndvi: string;
    evi: string;
  };
  stats: {
    ndvi: string;
    evi: string;
  };
  data: {
    truecolor: string;
    falsecolor: string;
    ndvi: string;
    evi: string;
  };
}

// Processed satellite image for frontend use
export interface SatelliteImage {
  id: string; // Unique identifier based on timestamp
  date: Date;
  dateString: string; // ISO date string
  source: string; // 'Sentinel-2' or 'Landsat-8'
  cloudCoverage: number; // Percentage
  dataCoverage: number; // Percentage
  tileUrls: {
    truecolor: string;
    falsecolor: string;
    ndvi: string;
    evi: string;
  };
}

// API base URL for tiles
const AGRO_TILE_BASE = 'https://api.agromonitoring.com/agro/1.0';

/**
 * Search for available satellite images for a polygon
 * @param polygonId - The Agro API polygon ID
 * @param startDate - Start date for search (default: 30 days ago)
 * @param endDate - End date for search (default: today)
 * @returns Array of available satellite images
 */
export async function searchSatelliteImages(
  polygonId: string,
  startDate?: Date,
  endDate?: Date
): Promise<SatelliteImage[]> {
  if (!isAgroConfigured()) {
    console.warn('Agro API not configured');
    return [];
  }

  // Default to last 30 days
  const end = endDate || new Date();
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const startUnix = Math.floor(start.getTime() / 1000);
  const endUnix = Math.floor(end.getTime() / 1000);

  try {
    const response = await agroFetch(
      `/image/search?polyid=${polygonId}&start=${startUnix}&end=${endUnix}`
    );

    if (!response.ok) {
      console.error('Satellite image search failed:', response.status);
      return [];
    }

    const data: SatelliteImageResult[] = await response.json();

    // Transform and filter results
    const images: SatelliteImage[] = data
      .map((img) => {
        const date = new Date(img.dt * 1000);
        return {
          id: `${polygonId}_${img.dt}`,
          date,
          dateString: date.toISOString().split('T')[0],
          source: normalizeSourceName(img.type),
          cloudCoverage: img.cl,
          dataCoverage: img.dc,
          tileUrls: {
            truecolor: img.tile.truecolor,
            falsecolor: img.tile.falsecolor,
            ndvi: img.tile.ndvi,
            evi: img.tile.evi,
          },
        };
      })
      // Sort by date descending (newest first)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    return images;
  } catch (error) {
    console.error('Error searching satellite images:', error);
    return [];
  }
}

/**
 * Get the tile URL pattern for a specific preset
 * This URL can be used directly with Leaflet TileLayer
 * @param polygonId - The Agro API polygon ID
 * @param imageTimestamp - Unix timestamp of the image
 * @param preset - The visualization preset
 * @returns Tile URL pattern with {z}/{x}/{y} placeholders
 */
export function getSatelliteTileUrl(
  polygonId: string,
  imageTimestamp: number,
  preset: SatellitePreset
): string {
  if (!isAgroConfigured()) {
    console.warn('Agro API not configured');
    return '';
  }

  const apiKey = getApiKey();
  // Agro API tile URL format
  return `${AGRO_TILE_BASE}/image/${imageTimestamp}/${polygonId}/${preset}/{z}/{x}/{y}?appid=${apiKey}`;
}

/**
 * Get tile URL directly from the search result
 * This is the preferred method as it uses the exact URL from the API
 * @param tileUrlTemplate - The tile URL template from search results
 * @returns Tile URL with proper API key
 */
export function getTileUrlWithApiKey(tileUrlTemplate: string): string {
  if (!isAgroConfigured()) {
    console.warn('Agro API not configured');
    return '';
  }

  const apiKey = getApiKey();
  // Add API key if not already present
  if (tileUrlTemplate.includes('appid=')) {
    return tileUrlTemplate;
  }

  const separator = tileUrlTemplate.includes('?') ? '&' : '?';
  return `${tileUrlTemplate}${separator}appid=${apiKey}`;
}

/**
 * Filter satellite images by cloud coverage
 * @param images - Array of satellite images
 * @param maxCloudCoverage - Maximum cloud coverage percentage (default: 30)
 * @returns Filtered array of images
 */
export function filterByCloudCoverage(
  images: SatelliteImage[],
  maxCloudCoverage: number = 30
): SatelliteImage[] {
  return images.filter((img) => img.cloudCoverage <= maxCloudCoverage);
}

/**
 * Normalize satellite source name for display
 */
function normalizeSourceName(source: string): string {
  const sourceLower = source.toLowerCase();
  if (sourceLower.includes('sentinel')) {
    return 'Sentinel-2';
  }
  if (sourceLower.includes('landsat')) {
    return 'Landsat-8';
  }
  return source;
}

/**
 * Get the maximum zoom level for a satellite source
 * @param source - The satellite source name
 * @returns Maximum zoom level
 */
export function getMaxZoomForSource(source: string): number {
  const sourceLower = source.toLowerCase();
  if (sourceLower.includes('sentinel')) {
    return 14;
  }
  if (sourceLower.includes('landsat')) {
    return 13;
  }
  return 13; // Default to Landsat zoom
}

/**
 * Get preset display configuration
 */
export const PRESET_CONFIG: Record<SatellitePreset, { label: string; description: string }> = {
  truecolor: {
    label: 'True Color',
    description: 'Natural RGB visualization',
  },
  falsecolor: {
    label: 'False Color',
    description: 'Enhanced vegetation visibility (NIR)',
  },
  ndvi: {
    label: 'NDVI',
    description: 'Vegetation health index',
  },
  evi: {
    label: 'EVI',
    description: 'Enhanced vegetation index',
  },
};
