import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database, NDVIReading } from '@/types/database';
import { checkRateLimit } from '@/lib/security';
import { isAgroConfigured, calculateNDVIStats, getNDVIStatus } from '@/lib/agroapi';

/**
 * GET /api/ndvi/[fieldId]
 * Get NDVI history for a field
 *
 * Query params:
 * - days: number of days of history (default: 30)
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
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get('days') || '30'), 365);

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
    // Verify field ownership
    const { data: field, error: fieldError } = await supabase
      .from('fields')
      .select('id, name, user_id')
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
    const fieldData = field as { id: string; name: string; user_id: string };

    // Check if field is synced with Agro API
    const { data: agroPolygon, error: agroError } = await supabase
      .from('agro_polygons')
      .select('agro_polygon_id, sync_status')
      .eq('field_id', fieldId)
      .single();

    if (agroError || !agroPolygon) {
      return NextResponse.json({
        fieldId,
        fieldName: fieldData.name,
        readings: [],
        stats: null,
        syncStatus: 'not_synced',
        needsSync: true,
        configured: true,
      });
    }

    // Type assertion for agroPolygon data
    const agroData = agroPolygon as { agro_polygon_id: string; sync_status: string };

    if (agroData.sync_status !== 'synced') {
      return NextResponse.json({
        fieldId,
        fieldName: fieldData.name,
        readings: [],
        stats: null,
        syncStatus: agroData.sync_status,
        needsSync: agroData.sync_status === 'error',
        configured: true,
      });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch NDVI readings from database
    const { data: readings, error: readingsError } = await supabase
      .from('ndvi_readings')
      .select('*')
      .eq('field_id', fieldId)
      .gte('observation_date', startDate.toISOString().split('T')[0])
      .lte('observation_date', endDate.toISOString().split('T')[0])
      .order('observation_date', { ascending: false });

    if (readingsError) {
      console.error('Error fetching NDVI readings:', readingsError);
      return NextResponse.json(
        { error: 'Failed to fetch NDVI data' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const ndviReadings = (readings || []) as NDVIReading[];
    const statsInput = ndviReadings.map((r) => ({
      observation_date: r.observation_date,
      ndvi_mean: r.ndvi_mean || 0,
      ndvi_min: r.ndvi_min || 0,
      ndvi_max: r.ndvi_max || 0,
      evi_mean: r.evi_mean,
      data_coverage: r.data_coverage || 0,
      cloud_coverage: r.cloud_coverage || 0,
      source: r.source,
    }));

    const stats = calculateNDVIStats(statsInput);
    const currentNDVI = ndviReadings[0]?.ndvi_mean ?? null;
    const currentStatus = getNDVIStatus(currentNDVI);

    return NextResponse.json({
      fieldId,
      fieldName: fieldData.name,
      readings: ndviReadings,
      stats,
      currentNDVI,
      currentStatus,
      syncStatus: 'synced',
      needsSync: false,
      configured: true,
    });
  } catch (error) {
    console.error('NDVI API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch NDVI data' },
      { status: 500 }
    );
  }
}
