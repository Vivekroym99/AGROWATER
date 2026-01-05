import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database, GeoJSONPolygon } from '@/types/database';
import { checkRateLimit } from '@/lib/security';
import {
  isAgroConfigured,
  fetchAccumulatedTemperature,
  fetchAccumulatedPrecipitation,
  fetchSoilData,
  getSeasonStartDate,
} from '@/lib/agroapi';
import { getPolygonCentroid } from '@/lib/weather';

/**
 * GET /api/agronomic/[fieldId]
 * Get agronomic data for a field (GDD, precipitation, soil data)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fieldId: string }> }
) {
  const rateLimitResult = await checkRateLimit(request, 'api');
  if (!rateLimitResult.success && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  const { fieldId } = await params;

  // Check if Agro API is configured
  if (!isAgroConfigured()) {
    return NextResponse.json(
      { error: 'Agro API not configured', configured: false },
      { status: 503 }
    );
  }

  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors from Server Components
          }
        },
      },
    }
  );

  // Check authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get field with boundary
    const { data: field, error: fieldError } = await supabase
      .from('fields')
      .select('id, name, boundary, user_id')
      .eq('id', fieldId)
      .eq('user_id', user.id)
      .single();

    if (fieldError || !field) {
      return NextResponse.json(
        { error: 'Field not found' },
        { status: 404 }
      );
    }

    // Type assertion for field data
    const fieldData = field as { id: string; name: string; boundary: unknown; user_id: string };
    const boundary = fieldData.boundary as GeoJSONPolygon;

    if (!boundary || boundary.type !== 'Polygon' || !boundary.coordinates) {
      return NextResponse.json(
        { error: 'Invalid field boundary' },
        { status: 400 }
      );
    }

    // Get field centroid for weather history API calls
    const centroid = getPolygonCentroid(boundary.coordinates);
    if (!centroid) {
      return NextResponse.json(
        { error: 'Could not calculate field centroid' },
        { status: 400 }
      );
    }

    // Get season dates
    const seasonStart = getSeasonStartDate();
    const today = new Date().toISOString().split('T')[0];

    // Check if field has agro polygon for soil data
    const { data: agroPolygon } = await supabase
      .from('agro_polygons')
      .select('agro_polygon_id, sync_status')
      .eq('field_id', fieldId)
      .single();

    const agroData = agroPolygon as { agro_polygon_id: string; sync_status: string } | null;

    // Fetch all data in parallel
    const results = await Promise.allSettled([
      fetchAccumulatedTemperature(centroid.lat, centroid.lon, seasonStart, today),
      fetchAccumulatedPrecipitation(centroid.lat, centroid.lon, seasonStart, today),
      agroData?.sync_status === 'synced'
        ? fetchSoilData(agroData.agro_polygon_id)
        : Promise.resolve(null),
    ]);

    // Extract results
    const [gddResult, precipResult, soilResult] = results;

    return NextResponse.json({
      fieldId,
      fieldName: fieldData.name,
      configured: true,
      seasonStart,
      gdd: gddResult.status === 'fulfilled' ? gddResult.value : null,
      precipitation: precipResult.status === 'fulfilled' ? precipResult.value : null,
      soil: soilResult.status === 'fulfilled' ? soilResult.value : null,
      hasSoilData: agroData?.sync_status === 'synced',
      errors: {
        gdd: gddResult.status === 'rejected' ? gddResult.reason?.message : null,
        precipitation: precipResult.status === 'rejected' ? precipResult.reason?.message : null,
        soil: soilResult.status === 'rejected' ? soilResult.reason?.message : null,
      },
    });
  } catch (error) {
    console.error('Agronomic API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch agronomic data' },
      { status: 500 }
    );
  }
}
