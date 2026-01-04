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
    };
    Functions: {
      [_ in never]: never;
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

// Status type for moisture levels
export type MoistureStatus = 'good' | 'warning' | 'critical' | 'unknown';

// GeoJSON types for field boundaries
export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}
