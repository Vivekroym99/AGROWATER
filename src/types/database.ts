export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      fields: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          boundary: Json; // GeoJSON Polygon stored as JSON
          area_hectares: number | null;
          crop_type: string | null;
          alert_threshold: number;
          alerts_enabled: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          boundary: Json;
          area_hectares?: number | null;
          crop_type?: string | null;
          alert_threshold?: number;
          alerts_enabled?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          boundary?: Json;
          area_hectares?: number | null;
          crop_type?: string | null;
          alert_threshold?: number;
          alerts_enabled?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      moisture_readings: {
        Row: {
          id: string;
          field_id: string;
          observation_date: string;
          moisture_index: number;
          vv_backscatter: number | null;
          vh_backscatter: number | null;
          source: string;
          processed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          field_id: string;
          observation_date: string;
          moisture_index: number;
          vv_backscatter?: number | null;
          vh_backscatter?: number | null;
          source?: string;
          processed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          field_id?: string;
          observation_date?: string;
          moisture_index?: number;
          vv_backscatter?: number | null;
          vh_backscatter?: number | null;
          source?: string;
          processed_at?: string;
          created_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          field_id: string;
          user_id: string;
          alert_type: string;
          message: string;
          moisture_value: number;
          threshold: number;
          sent_at: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          field_id: string;
          user_id: string;
          alert_type: string;
          message: string;
          moisture_value: number;
          threshold: number;
          sent_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          field_id?: string;
          user_id?: string;
          alert_type?: string;
          message?: string;
          moisture_value?: number;
          threshold?: number;
          sent_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: string;
          last_used_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
          created_at?: string;
          last_used_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          user_agent?: string | null;
          created_at?: string;
          last_used_at?: string | null;
        };
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          push_enabled: boolean;
          push_low_moisture: boolean;
          push_daily_summary: boolean;
          push_new_readings: boolean;
          email_enabled: boolean;
          email_low_moisture: boolean;
          email_weekly_report: boolean;
          quiet_hours_enabled: boolean;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          push_enabled?: boolean;
          push_low_moisture?: boolean;
          push_daily_summary?: boolean;
          push_new_readings?: boolean;
          email_enabled?: boolean;
          email_low_moisture?: boolean;
          email_weekly_report?: boolean;
          quiet_hours_enabled?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          push_enabled?: boolean;
          push_low_moisture?: boolean;
          push_daily_summary?: boolean;
          push_new_readings?: boolean;
          email_enabled?: boolean;
          email_low_moisture?: boolean;
          email_weekly_report?: boolean;
          quiet_hours_enabled?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'low_moisture' | 'data_updated' | 'system' | 'info';
          title: string;
          message: string;
          field_id: string | null;
          alert_id: string | null;
          read_at: string | null;
          dismissed_at: string | null;
          data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'low_moisture' | 'data_updated' | 'system' | 'info';
          title: string;
          message: string;
          field_id?: string | null;
          alert_id?: string | null;
          read_at?: string | null;
          dismissed_at?: string | null;
          data?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'low_moisture' | 'data_updated' | 'system' | 'info';
          title?: string;
          message?: string;
          field_id?: string | null;
          alert_id?: string | null;
          read_at?: string | null;
          dismissed_at?: string | null;
          data?: Json;
          created_at?: string;
        };
      };
      // Agro API tables
      agro_polygons: {
        Row: {
          id: string;
          field_id: string;
          agro_polygon_id: string;
          sync_status: 'synced' | 'pending' | 'error' | 'deleted';
          last_synced_at: string;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          field_id: string;
          agro_polygon_id: string;
          sync_status?: 'synced' | 'pending' | 'error' | 'deleted';
          last_synced_at?: string;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          field_id?: string;
          agro_polygon_id?: string;
          sync_status?: 'synced' | 'pending' | 'error' | 'deleted';
          last_synced_at?: string;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ndvi_readings: {
        Row: {
          id: string;
          field_id: string;
          observation_date: string;
          ndvi_mean: number | null;
          ndvi_min: number | null;
          ndvi_max: number | null;
          evi_mean: number | null;
          data_coverage: number | null;
          cloud_coverage: number | null;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          field_id: string;
          observation_date: string;
          ndvi_mean?: number | null;
          ndvi_min?: number | null;
          ndvi_max?: number | null;
          evi_mean?: number | null;
          data_coverage?: number | null;
          cloud_coverage?: number | null;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          field_id?: string;
          observation_date?: string;
          ndvi_mean?: number | null;
          ndvi_min?: number | null;
          ndvi_max?: number | null;
          evi_mean?: number | null;
          data_coverage?: number | null;
          cloud_coverage?: number | null;
          source?: string;
          created_at?: string;
        };
      };
      gdd_readings: {
        Row: {
          id: string;
          field_id: string;
          start_date: string;
          end_date: string;
          base_temp: number;
          accumulated_gdd: number;
          days_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          field_id: string;
          start_date: string;
          end_date: string;
          base_temp?: number;
          accumulated_gdd: number;
          days_count: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          field_id?: string;
          start_date?: string;
          end_date?: string;
          base_temp?: number;
          accumulated_gdd?: number;
          days_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      precipitation_readings: {
        Row: {
          id: string;
          field_id: string;
          start_date: string;
          end_date: string;
          total_precipitation_mm: number;
          days_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          field_id: string;
          start_date: string;
          end_date: string;
          total_precipitation_mm: number;
          days_count: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          field_id?: string;
          start_date?: string;
          end_date?: string;
          total_precipitation_mm?: number;
          days_count?: number;
          created_at?: string;
        };
      };
      agro_soil_readings: {
        Row: {
          id: string;
          field_id: string;
          observation_date: string;
          soil_moisture: number | null;
          soil_temp_surface: number | null;
          soil_temp_10cm: number | null;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          field_id: string;
          observation_date: string;
          soil_moisture?: number | null;
          soil_temp_surface?: number | null;
          soil_temp_10cm?: number | null;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          field_id?: string;
          observation_date?: string;
          soil_moisture?: number | null;
          soil_temp_surface?: number | null;
          soil_temp_10cm?: number | null;
          source?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      latest_field_moisture: {
        Row: {
          field_id: string;
          observation_date: string;
          moisture_index: number;
          vv_backscatter: number | null;
          processed_at: string;
        };
      };
      fields_with_status: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          boundary: Json;
          area_hectares: number | null;
          crop_type: string | null;
          alert_threshold: number;
          alerts_enabled: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          current_moisture: number | null;
          last_reading_date: string | null;
          status: 'good' | 'warning' | 'critical' | 'unknown';
        };
      };
      latest_field_ndvi: {
        Row: {
          field_id: string;
          observation_date: string;
          ndvi_mean: number | null;
          ndvi_min: number | null;
          ndvi_max: number | null;
          evi_mean: number | null;
          data_coverage: number | null;
          cloud_coverage: number | null;
        };
      };
      fields_with_vegetation: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          boundary: Json;
          area_hectares: number | null;
          crop_type: string | null;
          alert_threshold: number;
          alerts_enabled: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          current_moisture: number | null;
          last_moisture_date: string | null;
          current_ndvi: number | null;
          last_ndvi_date: string | null;
          moisture_status: 'good' | 'warning' | 'critical' | 'unknown';
          vegetation_status: 'excellent' | 'good' | 'moderate' | 'poor' | 'unknown';
        };
      };
    };
    Functions: {
      insert_field: {
        Args: {
          p_user_id: string;
          p_name: string;
          p_boundary: Json;
          p_crop_type?: string | null;
          p_alert_threshold?: number;
          p_alerts_enabled?: boolean;
        };
        Returns: {
          id: string;
          user_id: string;
          name: string;
          boundary: Json;
          area_hectares: number | null;
          crop_type: string | null;
          alert_threshold: number;
          alerts_enabled: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        }[];
      };
      update_field: {
        Args: {
          p_field_id: string;
          p_user_id: string;
          p_name?: string | null;
          p_boundary?: Json | null;
          p_crop_type?: string | null;
          p_alert_threshold?: number | null;
          p_alerts_enabled?: boolean | null;
        };
        Returns: {
          id: string;
          user_id: string;
          name: string;
          boundary: Json;
          area_hectares: number | null;
          crop_type: string | null;
          alert_threshold: number;
          alerts_enabled: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        }[];
      };
      get_field_boundary: {
        Args: {
          p_field_id: string;
          p_user_id: string;
        };
        Returns: {
          id: string;
          user_id: string;
          name: string;
          boundary: Json;
          alert_threshold: number;
          alerts_enabled: boolean;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Field = Database['public']['Tables']['fields']['Row'];
export type MoistureReading = Database['public']['Tables']['moisture_readings']['Row'];
export type Alert = Database['public']['Tables']['alerts']['Row'];
export type FieldWithStatus = Database['public']['Views']['fields_with_status']['Row'];
export type PushSubscription = Database['public']['Tables']['push_subscriptions']['Row'];
export type NotificationPreferences = Database['public']['Tables']['notification_preferences']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];

// Status type for moisture levels
export type MoistureStatus = 'good' | 'warning' | 'critical' | 'unknown';

// Vegetation status type for NDVI
export type VegetationStatus = 'excellent' | 'good' | 'moderate' | 'poor' | 'unknown';

// Agro polygon sync status
export type AgroSyncStatus = 'synced' | 'pending' | 'error' | 'deleted';

// Notification type
export type NotificationType = 'low_moisture' | 'data_updated' | 'system' | 'info';

// Agro API convenience types
export type AgroPolygonMapping = Database['public']['Tables']['agro_polygons']['Row'];
export type NDVIReading = Database['public']['Tables']['ndvi_readings']['Row'];
export type GDDReading = Database['public']['Tables']['gdd_readings']['Row'];
export type PrecipitationReading = Database['public']['Tables']['precipitation_readings']['Row'];
export type AgroSoilReading = Database['public']['Tables']['agro_soil_readings']['Row'];
export type LatestFieldNDVI = Database['public']['Views']['latest_field_ndvi']['Row'];
export type FieldWithVegetation = Database['public']['Views']['fields_with_vegetation']['Row'];

// GeoJSON types for field boundaries
export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

// Irrigation types
export type IrrigationMethod = 'sprinkler' | 'drip' | 'flood' | 'manual' | 'other' | 'none';
export type IrrigationScheduleStatus = 'pending' | 'completed' | 'skipped' | 'cancelled';

export interface IrrigationEvent {
  id: string;
  field_id: string;
  user_id: string;
  irrigation_date: string;
  water_amount_mm: number;
  water_volume_liters: number | null;
  duration_minutes: number | null;
  method: IrrigationMethod | null;
  notes: string | null;
  moisture_before: number | null;
  moisture_after: number | null;
  created_at: string;
  updated_at: string;
}

export interface IrrigationSchedule {
  id: string;
  field_id: string;
  user_id: string;
  scheduled_date: string;
  water_amount_mm: number;
  status: IrrigationScheduleStatus;
  completed_event_id: string | null;
  skip_reason: string | null;
  is_auto_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface FieldPlantingInfo {
  id: string;
  field_id: string;
  user_id: string;
  season_year: number;
  planting_date: string | null;
  expected_harvest_date: string | null;
  irrigation_method: IrrigationMethod | null;
  auto_schedule_enabled: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FieldIrrigationSummary {
  field_id: string;
  user_id: string;
  field_name: string;
  crop_type: string | null;
  area_hectares: number | null;
  planting_date: string | null;
  irrigation_method: IrrigationMethod | null;
  auto_schedule_enabled: boolean | null;
  last_irrigation_date: string | null;
  total_water_mm_this_year: number;
  irrigation_count_this_year: number;
  pending_schedules: number;
}
