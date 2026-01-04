/**
 * Google Earth Engine type definitions for AgroWater
 */

export interface GEECredentials {
  client_email: string;
  private_key: string;
}

export interface SentinelImageMetadata {
  id: string;
  acquisitionDate: string;
  orbit: 'ASCENDING' | 'DESCENDING';
}

export interface BackscatterStats {
  vv_mean: number;
  vh_mean: number | null;
}

export interface FieldMoistureQuery {
  fieldId: string;
  boundary: GeoJSONPolygon;
  startDate: string;
  endDate: string;
}

export interface MoistureResult {
  observation_date: string;
  moisture_index: number;
  vv_backscatter: number;
  vh_backscatter: number | null;
  source: string;
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface ProcessFieldResult {
  fieldId: string;
  readings: MoistureResult[];
  error?: string;
}

export interface CronJobResult {
  processed: number;
  failed: number;
  alerts_sent: number;
  details: ProcessFieldResult[];
}
