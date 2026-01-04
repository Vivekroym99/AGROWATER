import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';
import { fetchMoistureForField, getDateRange } from '@/lib/earthengine';
import type { GeoJSONPolygon } from '@/lib/earthengine';

// Interface for field data from select query
interface FieldData {
  id: string;
  user_id: string;
  boundary: unknown;
  name: string;
  alert_threshold: number;
  alerts_enabled: boolean;
}

/**
 * POST /api/moisture/fetch
 * Fetch moisture data from Google Earth Engine for a specific field
 *
 * Body: { field_id: string, days?: number }
 */
export async function POST(request: NextRequest) {
  const cookieStore = cookies();

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
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { field_id, days = 30 } = body;

    if (!field_id) {
      return NextResponse.json(
        { error: 'field_id is required' },
        { status: 400 }
      );
    }

    // Get field and verify ownership
    const { data: fieldData, error: fieldError } = await supabase
      .from('fields')
      .select('id, user_id, boundary, name, alert_threshold, alerts_enabled')
      .eq('id', field_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (fieldError || !fieldData) {
      return NextResponse.json(
        { error: 'Field not found or access denied' },
        { status: 404 }
      );
    }

    // Cast to typed field
    const field = fieldData as unknown as FieldData;

    // Parse boundary from database (stored as GeoJSON)
    const boundary = field.boundary as GeoJSONPolygon;

    if (!boundary || boundary.type !== 'Polygon') {
      return NextResponse.json(
        { error: 'Invalid field boundary' },
        { status: 400 }
      );
    }

    // Get date range
    const { startDate, endDate } = getDateRange(days);

    // Fetch moisture data from GEE
    const moistureReadings = await fetchMoistureForField(
      boundary,
      startDate,
      endDate
    );

    if (moistureReadings.length === 0) {
      return NextResponse.json({
        data: [],
        message: 'No satellite data available for this date range',
        inserted: 0,
      });
    }

    // Use service role client for inserting readings (bypasses RLS)
    const serviceSupabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {},
        },
      }
    );

    // Insert readings into database (upsert to handle duplicates)
    const readingsToInsert = moistureReadings.map((reading) => ({
      field_id: field_id,
      observation_date: reading.observation_date,
      moisture_index: reading.moisture_index,
      vv_backscatter: reading.vv_backscatter,
      vh_backscatter: reading.vh_backscatter,
      source: reading.source,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (serviceSupabase.from('moisture_readings') as any)
      .upsert(readingsToInsert, {
        onConflict: 'field_id,observation_date',
        ignoreDuplicates: false,
      });

    if (insertError) {
      console.error('Error inserting moisture readings:', insertError);
      return NextResponse.json(
        { error: 'Failed to save moisture data' },
        { status: 500 }
      );
    }

    // Check if latest reading triggers an alert
    const latestReading = moistureReadings[0];
    let alertSent = false;

    if (
      field.alerts_enabled &&
      latestReading.moisture_index < field.alert_threshold
    ) {
      // Check if alert was already sent in last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const { data: recentAlert } = await serviceSupabase
        .from('alerts')
        .select('id')
        .eq('field_id', field_id)
        .eq('alert_type', 'low_moisture')
        .gte('created_at', oneDayAgo.toISOString())
        .single();

      if (!recentAlert) {
        // Create alert record (email sending handled separately)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: alertError } = await (serviceSupabase.from('alerts') as any)
          .insert({
            field_id: field_id,
            user_id: user.id,
            alert_type: 'low_moisture',
            message: `Wilgotność na polu "${field.name}" spadła poniżej progu alertu.`,
            moisture_value: latestReading.moisture_index * 100,
            threshold: field.alert_threshold * 100,
          });

        if (!alertError) {
          alertSent = true;
        }
      }
    }

    return NextResponse.json({
      data: moistureReadings,
      inserted: readingsToInsert.length,
      alert_triggered: alertSent,
      field_name: field.name,
    });
  } catch (error) {
    console.error('Error fetching moisture data:', error);

    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      { error: `Failed to fetch moisture data: ${message}` },
      { status: 500 }
    );
  }
}
