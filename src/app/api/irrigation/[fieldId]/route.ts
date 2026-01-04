import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';
import { checkRateLimit } from '@/lib/security';
import { calculateIrrigationNeed, generateIrrigationSchedule } from '@/lib/irrigation';
import type { IrrigationEvent, FieldPlantingInfo } from '@/types/database';

/**
 * GET /api/irrigation/[fieldId]
 * Get irrigation data for a field: recommendation, history, and schedule
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
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get field with current moisture
    const { data: field, error: fieldError } = await supabase
      .from('fields_with_status')
      .select('*')
      .eq('id', fieldId)
      .eq('user_id', user.id)
      .single();

    if (fieldError || !field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    // Type assertion for field data
    const fieldData = field as {
      id: string;
      name: string;
      crop_type: string | null;
      area_hectares: number | null;
      current_moisture: number | null;
    };

    // Get planting info for current season
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: plantingInfo } = await (supabase as any)
      .from('field_planting_info')
      .select('*')
      .eq('field_id', fieldId)
      .eq('season_year', new Date().getFullYear())
      .single() as { data: FieldPlantingInfo | null };

    // Get irrigation history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: history } = await (supabase as any)
      .from('irrigation_events')
      .select('*')
      .eq('field_id', fieldId)
      .gte('irrigation_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('irrigation_date', { ascending: false })
      .limit(20) as { data: IrrigationEvent[] | null };

    // Get pending schedules
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: schedules } = await (supabase as any)
      .from('irrigation_schedules')
      .select('*')
      .eq('field_id', fieldId)
      .eq('status', 'pending')
      .gte('scheduled_date', new Date().toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true })
      .limit(14);

    // Calculate irrigation recommendation
    const soilMoisture = fieldData.current_moisture ?? 0.5;
    const areaHectares = fieldData.area_hectares ?? 1;
    const cropType = fieldData.crop_type || 'other';
    const plantingDate = plantingInfo?.planting_date
      ? new Date(plantingInfo.planting_date)
      : undefined;

    // Try to get weather forecast for better recommendations
    let weatherForecast;
    try {
      const weatherResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/weather/${fieldId}`,
        {
          headers: {
            Cookie: request.headers.get('cookie') || '',
          },
        }
      );
      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json();
        if (weatherData.weather?.daily) {
          weatherForecast = {
            rainProbability: weatherData.weather.daily[0]?.pop || 0,
            expectedRainMm: weatherData.weather.daily[0]?.rain || 0,
            temperature: weatherData.weather.current?.temp || 20,
            humidity: weatherData.weather.current?.humidity || 50,
          };
        }
      }
    } catch {
      // Weather not available, continue without it
    }

    const recommendation = calculateIrrigationNeed(
      cropType,
      soilMoisture,
      areaHectares,
      weatherForecast,
      plantingDate
    );

    // Generate 7-day schedule suggestion
    const suggestedSchedule = generateIrrigationSchedule(recommendation);

    // Calculate season statistics
    const currentYear = new Date().getFullYear();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: yearStats } = await (supabase as any)
      .from('irrigation_events')
      .select('water_amount_mm')
      .eq('field_id', fieldId)
      .gte('irrigation_date', `${currentYear}-01-01`);

    const totalWaterThisYear = (yearStats || []).reduce(
      (sum: number, e: { water_amount_mm: number }) => sum + e.water_amount_mm,
      0
    );

    return NextResponse.json({
      fieldId: fieldData.id,
      fieldName: fieldData.name,
      cropType,
      areaHectares,
      currentMoisture: soilMoisture,
      plantingInfo,
      recommendation,
      suggestedSchedule,
      history: history || [],
      pendingSchedules: schedules || [],
      stats: {
        totalWaterThisYear: Math.round(totalWaterThisYear * 10) / 10,
        irrigationCountThisYear: yearStats?.length || 0,
      },
    });
  } catch (error) {
    console.error('Irrigation API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get irrigation data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/irrigation/[fieldId]
 * Log a new irrigation event
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fieldId: string }> }
) {
  const rateLimitResult = await checkRateLimit(request, 'api');
  if (!rateLimitResult.success && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  const { fieldId } = await params;
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
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      irrigation_date,
      water_amount_mm,
      duration_minutes,
      method,
      notes,
      complete_schedule_id,
    } = body;

    // Validate required fields
    if (!irrigation_date || !water_amount_mm) {
      return NextResponse.json(
        { error: 'irrigation_date and water_amount_mm are required' },
        { status: 400 }
      );
    }

    // Get field for area calculation
    const { data: field } = await supabase
      .from('fields')
      .select('area_hectares, user_id')
      .eq('id', fieldId)
      .eq('user_id', user.id)
      .single();

    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    const fieldRow = field as { area_hectares: number | null; user_id: string };

    // Calculate water volume in liters
    const areaHectares = fieldRow.area_hectares || 1;
    const waterVolumeLiters = water_amount_mm * areaHectares * 10000;

    // Insert irrigation event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: event, error: insertError } = await (supabase as any)
      .from('irrigation_events')
      .insert({
        field_id: fieldId,
        user_id: user.id,
        irrigation_date,
        water_amount_mm,
        water_volume_liters: waterVolumeLiters,
        duration_minutes: duration_minutes || null,
        method: method || null,
        notes: notes || null,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating irrigation event:', insertError);
      return NextResponse.json(
        { error: 'Failed to create irrigation event' },
        { status: 500 }
      );
    }

    // If completing a schedule, update it
    if (complete_schedule_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('irrigation_schedules')
        .update({
          status: 'completed',
          completed_event_id: event.id,
        })
        .eq('id', complete_schedule_id)
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      success: true,
      eventId: event.id,
      waterVolumeLiters,
    });
  } catch (error) {
    console.error('Irrigation POST error:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
