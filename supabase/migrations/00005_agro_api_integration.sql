-- Migration: Agro API Integration
-- Adds tables for NDVI, GDD, precipitation, and Agro API polygon mapping

-- Agro API polygon mapping
-- Links AGROWATER fields to Agro API polygon IDs
CREATE TABLE IF NOT EXISTS public.agro_polygons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
    agro_polygon_id TEXT NOT NULL UNIQUE,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error', 'deleted')),
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(field_id)
);

-- NDVI/EVI readings table
CREATE TABLE IF NOT EXISTS public.ndvi_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
    observation_date DATE NOT NULL,
    ndvi_mean DECIMAL(5, 4) CHECK (ndvi_mean >= -1 AND ndvi_mean <= 1),
    ndvi_min DECIMAL(5, 4),
    ndvi_max DECIMAL(5, 4),
    evi_mean DECIMAL(5, 4),
    data_coverage DECIMAL(5, 2),
    cloud_coverage DECIMAL(5, 2),
    source TEXT DEFAULT 'agro_api',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(field_id, observation_date)
);

-- Accumulated temperature (GDD) readings
CREATE TABLE IF NOT EXISTS public.gdd_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    base_temp DECIMAL(4, 1) DEFAULT 10.0,
    accumulated_gdd DECIMAL(8, 2) NOT NULL,
    days_count INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(field_id, start_date, end_date, base_temp)
);

-- Cumulative precipitation tracking
CREATE TABLE IF NOT EXISTS public.precipitation_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_precipitation_mm DECIMAL(8, 2) NOT NULL,
    days_count INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(field_id, start_date, end_date)
);

-- Agro API soil data (validation/secondary source)
CREATE TABLE IF NOT EXISTS public.agro_soil_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
    observation_date DATE NOT NULL,
    soil_moisture DECIMAL(4, 3),
    soil_temp_surface DECIMAL(5, 2),
    soil_temp_10cm DECIMAL(5, 2),
    source TEXT DEFAULT 'agro_api',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(field_id, observation_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agro_polygons_field_id ON public.agro_polygons(field_id);
CREATE INDEX IF NOT EXISTS idx_agro_polygons_agro_id ON public.agro_polygons(agro_polygon_id);
CREATE INDEX IF NOT EXISTS idx_ndvi_readings_field_id ON public.ndvi_readings(field_id);
CREATE INDEX IF NOT EXISTS idx_ndvi_readings_date ON public.ndvi_readings(observation_date DESC);
CREATE INDEX IF NOT EXISTS idx_gdd_readings_field_id ON public.gdd_readings(field_id);
CREATE INDEX IF NOT EXISTS idx_precipitation_readings_field_id ON public.precipitation_readings(field_id);
CREATE INDEX IF NOT EXISTS idx_agro_soil_readings_field_id ON public.agro_soil_readings(field_id);

-- Row Level Security policies
ALTER TABLE public.agro_polygons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ndvi_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdd_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precipitation_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agro_soil_readings ENABLE ROW LEVEL SECURITY;

-- Users can view their own data (via field ownership)
CREATE POLICY "Users can view own agro_polygons" ON public.agro_polygons
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.fields WHERE fields.id = agro_polygons.field_id AND fields.user_id = auth.uid())
    );

CREATE POLICY "Users can view ndvi for own fields" ON public.ndvi_readings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.fields WHERE fields.id = ndvi_readings.field_id AND fields.user_id = auth.uid())
    );

CREATE POLICY "Users can view gdd for own fields" ON public.gdd_readings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.fields WHERE fields.id = gdd_readings.field_id AND fields.user_id = auth.uid())
    );

CREATE POLICY "Users can view precipitation for own fields" ON public.precipitation_readings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.fields WHERE fields.id = precipitation_readings.field_id AND fields.user_id = auth.uid())
    );

CREATE POLICY "Users can view agro_soil for own fields" ON public.agro_soil_readings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.fields WHERE fields.id = agro_soil_readings.field_id AND fields.user_id = auth.uid())
    );

-- Service role can insert/update (for cron jobs and sync operations)
CREATE POLICY "Service can insert agro_polygons" ON public.agro_polygons FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update agro_polygons" ON public.agro_polygons FOR UPDATE USING (true);
CREATE POLICY "Service can delete agro_polygons" ON public.agro_polygons FOR DELETE USING (true);
CREATE POLICY "Service can insert ndvi" ON public.ndvi_readings FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can insert gdd" ON public.gdd_readings FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update gdd" ON public.gdd_readings FOR UPDATE USING (true);
CREATE POLICY "Service can insert precipitation" ON public.precipitation_readings FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can insert agro_soil" ON public.agro_soil_readings FOR INSERT WITH CHECK (true);

-- View: Latest NDVI per field
CREATE OR REPLACE VIEW public.latest_field_ndvi AS
SELECT DISTINCT ON (field_id)
    field_id,
    observation_date,
    ndvi_mean,
    ndvi_min,
    ndvi_max,
    evi_mean,
    data_coverage,
    cloud_coverage
FROM public.ndvi_readings
ORDER BY field_id, observation_date DESC;

-- View: Fields with vegetation status (extends fields_with_status)
CREATE OR REPLACE VIEW public.fields_with_vegetation AS
SELECT
    f.*,
    m.moisture_index AS current_moisture,
    m.observation_date AS last_moisture_date,
    n.ndvi_mean AS current_ndvi,
    n.observation_date AS last_ndvi_date,
    CASE
        WHEN m.moisture_index IS NULL THEN 'unknown'
        WHEN m.moisture_index < 0.30 THEN 'critical'
        WHEN m.moisture_index < 0.50 THEN 'warning'
        ELSE 'good'
    END AS moisture_status,
    CASE
        WHEN n.ndvi_mean IS NULL THEN 'unknown'
        WHEN n.ndvi_mean < 0.2 THEN 'poor'
        WHEN n.ndvi_mean < 0.4 THEN 'moderate'
        WHEN n.ndvi_mean < 0.6 THEN 'good'
        ELSE 'excellent'
    END AS vegetation_status
FROM public.fields f
LEFT JOIN public.latest_field_moisture m ON f.id = m.field_id
LEFT JOIN public.latest_field_ndvi n ON f.id = n.field_id
WHERE f.is_active = TRUE;

-- Updated_at triggers
CREATE TRIGGER update_agro_polygons_updated_at
    BEFORE UPDATE ON public.agro_polygons
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_gdd_readings_updated_at
    BEFORE UPDATE ON public.gdd_readings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
