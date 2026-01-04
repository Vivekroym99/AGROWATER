-- Enable PostGIS extension for spatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Fields table with PostGIS geometry
CREATE TABLE IF NOT EXISTS public.fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    boundary GEOMETRY(Polygon, 4326) NOT NULL,
    area_hectares DECIMAL(10, 2),
    crop_type TEXT,
    alert_threshold DECIMAL(3, 2) DEFAULT 0.30 NOT NULL,
    alerts_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Moisture readings table
CREATE TABLE IF NOT EXISTS public.moisture_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
    observation_date DATE NOT NULL,
    moisture_index DECIMAL(4, 3) NOT NULL CHECK (moisture_index >= 0 AND moisture_index <= 1),
    vv_backscatter DECIMAL(6, 2),
    vh_backscatter DECIMAL(6, 2),
    source TEXT DEFAULT 'sentinel1',
    processed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(field_id, observation_date)
);

-- Alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    message TEXT NOT NULL,
    moisture_value DECIMAL(5, 2) NOT NULL,
    threshold DECIMAL(5, 2) NOT NULL,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fields_user_id ON public.fields(user_id);
CREATE INDEX IF NOT EXISTS idx_fields_boundary ON public.fields USING GIST(boundary);
CREATE INDEX IF NOT EXISTS idx_moisture_readings_field_id ON public.moisture_readings(field_id);
CREATE INDEX IF NOT EXISTS idx_moisture_readings_date ON public.moisture_readings(observation_date DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_field_id ON public.alerts(field_id);

-- Row Level Security policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moisture_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Fields: users can only access their own fields
CREATE POLICY "Users can view own fields" ON public.fields
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own fields" ON public.fields
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fields" ON public.fields
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fields" ON public.fields
    FOR DELETE USING (auth.uid() = user_id);

-- Moisture readings: users can view readings for their own fields
CREATE POLICY "Users can view moisture readings for own fields" ON public.moisture_readings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.fields
            WHERE fields.id = moisture_readings.field_id
            AND fields.user_id = auth.uid()
        )
    );

-- Alerts: users can only access their own alerts
CREATE POLICY "Users can view own alerts" ON public.alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.alerts
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_fields_updated_at
    BEFORE UPDATE ON public.fields
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function: Auto-calculate area from boundary (in hectares)
CREATE OR REPLACE FUNCTION public.calculate_field_area()
RETURNS TRIGGER AS $$
BEGIN
    NEW.area_hectares := ST_Area(NEW.boundary::geography) / 10000;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_area_trigger
    BEFORE INSERT OR UPDATE OF boundary ON public.fields
    FOR EACH ROW EXECUTE FUNCTION public.calculate_field_area();

-- Service role can insert moisture readings (for cron jobs)
CREATE POLICY "Service can insert moisture" ON public.moisture_readings
    FOR INSERT WITH CHECK (true);

-- View: Latest moisture reading per field
CREATE OR REPLACE VIEW public.latest_field_moisture AS
SELECT DISTINCT ON (field_id)
    field_id,
    observation_date,
    moisture_index,
    vv_backscatter,
    processed_at
FROM public.moisture_readings
ORDER BY field_id, observation_date DESC;

-- View: Fields with current status
CREATE OR REPLACE VIEW public.fields_with_status AS
SELECT
    f.*,
    m.moisture_index AS current_moisture,
    m.observation_date AS last_reading_date,
    CASE
        WHEN m.moisture_index IS NULL THEN 'unknown'
        WHEN m.moisture_index < 0.30 THEN 'critical'
        WHEN m.moisture_index < 0.50 THEN 'warning'
        ELSE 'good'
    END AS status
FROM public.fields f
LEFT JOIN public.latest_field_moisture m ON f.id = m.field_id
WHERE f.is_active = TRUE;
