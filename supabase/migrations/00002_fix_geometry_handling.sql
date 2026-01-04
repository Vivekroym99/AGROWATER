-- Migration: Fix PostGIS geometry handling
-- Ensures proper conversion between GeoJSON (API) and PostGIS geometry (database)

-- Update fields_with_status view to return boundary as GeoJSON
DROP VIEW IF EXISTS public.fields_with_status;

CREATE VIEW public.fields_with_status AS
SELECT
    f.id,
    f.user_id,
    f.name,
    ST_AsGeoJSON(f.boundary)::jsonb AS boundary,
    f.area_hectares,
    f.crop_type,
    f.alert_threshold,
    f.alerts_enabled,
    f.is_active,
    f.created_at,
    f.updated_at,
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

-- Create function to insert field with GeoJSON boundary
CREATE OR REPLACE FUNCTION public.insert_field(
    p_user_id UUID,
    p_name TEXT,
    p_boundary JSONB,
    p_crop_type TEXT DEFAULT NULL,
    p_alert_threshold DECIMAL DEFAULT 0.30,
    p_alerts_enabled BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    boundary JSONB,
    area_hectares DECIMAL,
    crop_type TEXT,
    alert_threshold DECIMAL,
    alerts_enabled BOOLEAN,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO public.fields (
        user_id,
        name,
        boundary,
        crop_type,
        alert_threshold,
        alerts_enabled
    ) VALUES (
        p_user_id,
        p_name,
        ST_GeomFromGeoJSON(p_boundary::text),
        p_crop_type,
        p_alert_threshold,
        p_alerts_enabled
    )
    RETURNING fields.id INTO new_id;

    RETURN QUERY
    SELECT
        f.id,
        f.user_id,
        f.name,
        ST_AsGeoJSON(f.boundary)::jsonb AS boundary,
        f.area_hectares,
        f.crop_type,
        f.alert_threshold,
        f.alerts_enabled,
        f.is_active,
        f.created_at,
        f.updated_at
    FROM public.fields f
    WHERE f.id = new_id;
END;
$$;

-- Create function to update field with optional GeoJSON boundary
CREATE OR REPLACE FUNCTION public.update_field(
    p_field_id UUID,
    p_user_id UUID,
    p_name TEXT DEFAULT NULL,
    p_boundary JSONB DEFAULT NULL,
    p_crop_type TEXT DEFAULT NULL,
    p_alert_threshold DECIMAL DEFAULT NULL,
    p_alerts_enabled BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    boundary JSONB,
    area_hectares DECIMAL,
    crop_type TEXT,
    alert_threshold DECIMAL,
    alerts_enabled BOOLEAN,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.fields f
    SET
        name = COALESCE(p_name, f.name),
        boundary = CASE
            WHEN p_boundary IS NOT NULL THEN ST_GeomFromGeoJSON(p_boundary::text)
            ELSE f.boundary
        END,
        crop_type = COALESCE(p_crop_type, f.crop_type),
        alert_threshold = COALESCE(p_alert_threshold, f.alert_threshold),
        alerts_enabled = COALESCE(p_alerts_enabled, f.alerts_enabled),
        updated_at = NOW()
    WHERE f.id = p_field_id AND f.user_id = p_user_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        f.id,
        f.user_id,
        f.name,
        ST_AsGeoJSON(f.boundary)::jsonb AS boundary,
        f.area_hectares,
        f.crop_type,
        f.alert_threshold,
        f.alerts_enabled,
        f.is_active,
        f.created_at,
        f.updated_at
    FROM public.fields f
    WHERE f.id = p_field_id;
END;
$$;

-- Create function to get field boundary as GeoJSON (for moisture API)
CREATE OR REPLACE FUNCTION public.get_field_boundary(
    p_field_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    boundary JSONB,
    alert_threshold DECIMAL,
    alerts_enabled BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id,
        f.user_id,
        f.name,
        ST_AsGeoJSON(f.boundary)::jsonb AS boundary,
        f.alert_threshold,
        f.alerts_enabled
    FROM public.fields f
    WHERE f.id = p_field_id
      AND f.user_id = p_user_id
      AND f.is_active = TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.insert_field TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_field TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_field_boundary TO authenticated;
