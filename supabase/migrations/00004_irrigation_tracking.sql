-- Migration: Irrigation Tracking
-- Created: 2024
-- Description: Add tables for tracking irrigation history and schedules

-- Irrigation events (actual irrigation performed)
CREATE TABLE IF NOT EXISTS irrigation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Irrigation details
  irrigation_date DATE NOT NULL,
  water_amount_mm DECIMAL(6,2) NOT NULL, -- mm of water applied
  water_volume_liters DECIMAL(12,2), -- total liters (calculated from area)
  duration_minutes INTEGER, -- how long irrigation ran

  -- Method and notes
  method TEXT CHECK (method IN ('sprinkler', 'drip', 'flood', 'manual', 'other')),
  notes TEXT,

  -- Soil moisture before and after (if measured)
  moisture_before DECIMAL(5,4),
  moisture_after DECIMAL(5,4),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for irrigation events
CREATE INDEX idx_irrigation_events_field_id ON irrigation_events(field_id);
CREATE INDEX idx_irrigation_events_user_id ON irrigation_events(user_id);
CREATE INDEX idx_irrigation_events_date ON irrigation_events(irrigation_date DESC);

-- Enable RLS
ALTER TABLE irrigation_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for irrigation events
CREATE POLICY "Users can view own irrigation events"
  ON irrigation_events FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own irrigation events"
  ON irrigation_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own irrigation events"
  ON irrigation_events FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own irrigation events"
  ON irrigation_events FOR DELETE
  USING (user_id = auth.uid());

-- Irrigation schedules (planned irrigation)
CREATE TABLE IF NOT EXISTS irrigation_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Schedule details
  scheduled_date DATE NOT NULL,
  water_amount_mm DECIMAL(6,2) NOT NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped', 'cancelled')),
  completed_event_id UUID REFERENCES irrigation_events(id),
  skip_reason TEXT,

  -- Auto-generated or manual
  is_auto_generated BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for irrigation schedules
CREATE INDEX idx_irrigation_schedules_field_id ON irrigation_schedules(field_id);
CREATE INDEX idx_irrigation_schedules_user_id ON irrigation_schedules(user_id);
CREATE INDEX idx_irrigation_schedules_date ON irrigation_schedules(scheduled_date);
CREATE INDEX idx_irrigation_schedules_status ON irrigation_schedules(status);

-- Enable RLS
ALTER TABLE irrigation_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policies for irrigation schedules
CREATE POLICY "Users can view own irrigation schedules"
  ON irrigation_schedules FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own irrigation schedules"
  ON irrigation_schedules FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own irrigation schedules"
  ON irrigation_schedules FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own irrigation schedules"
  ON irrigation_schedules FOR DELETE
  USING (user_id = auth.uid());

-- Field planting info (for crop stage calculation)
CREATE TABLE IF NOT EXISTS field_planting_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Planting info
  season_year INTEGER NOT NULL,
  planting_date DATE,
  expected_harvest_date DATE,

  -- Irrigation settings
  irrigation_method TEXT CHECK (irrigation_method IN ('sprinkler', 'drip', 'flood', 'manual', 'none')),
  auto_schedule_enabled BOOLEAN DEFAULT FALSE,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint per field per season
  UNIQUE(field_id, season_year)
);

-- Indexes
CREATE INDEX idx_field_planting_info_field_id ON field_planting_info(field_id);
CREATE INDEX idx_field_planting_info_user_id ON field_planting_info(user_id);

-- Enable RLS
ALTER TABLE field_planting_info ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own planting info"
  ON field_planting_info FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own planting info"
  ON field_planting_info FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own planting info"
  ON field_planting_info FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own planting info"
  ON field_planting_info FOR DELETE
  USING (user_id = auth.uid());

-- Updated at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER irrigation_events_updated_at
  BEFORE UPDATE ON irrigation_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER irrigation_schedules_updated_at
  BEFORE UPDATE ON irrigation_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER field_planting_info_updated_at
  BEFORE UPDATE ON field_planting_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- View for irrigation summary per field
CREATE OR REPLACE VIEW field_irrigation_summary AS
SELECT
  f.id AS field_id,
  f.user_id,
  f.name AS field_name,
  f.crop_type,
  f.area_hectares,

  -- Planting info
  fpi.planting_date,
  fpi.irrigation_method,
  fpi.auto_schedule_enabled,

  -- Last irrigation
  (SELECT irrigation_date FROM irrigation_events ie
   WHERE ie.field_id = f.id
   ORDER BY irrigation_date DESC LIMIT 1) AS last_irrigation_date,

  -- Total water this season (current year)
  (SELECT COALESCE(SUM(water_amount_mm), 0) FROM irrigation_events ie
   WHERE ie.field_id = f.id
   AND EXTRACT(YEAR FROM irrigation_date) = EXTRACT(YEAR FROM NOW())) AS total_water_mm_this_year,

  -- Irrigation count this season
  (SELECT COUNT(*) FROM irrigation_events ie
   WHERE ie.field_id = f.id
   AND EXTRACT(YEAR FROM irrigation_date) = EXTRACT(YEAR FROM NOW())) AS irrigation_count_this_year,

  -- Pending scheduled irrigations
  (SELECT COUNT(*) FROM irrigation_schedules isc
   WHERE isc.field_id = f.id
   AND isc.status = 'pending'
   AND isc.scheduled_date >= CURRENT_DATE) AS pending_schedules

FROM fields f
LEFT JOIN field_planting_info fpi ON fpi.field_id = f.id
  AND fpi.season_year = EXTRACT(YEAR FROM NOW())
WHERE f.is_active = TRUE;

-- Grant permissions
GRANT SELECT ON field_irrigation_summary TO authenticated;
