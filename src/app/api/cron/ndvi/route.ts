import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';
import { checkRateLimit } from '@/lib/security';
import { isAgroConfigured, fetchNDVIForPolygon, getNDVIStatus } from '@/lib/agroapi';

// Interface for agro polygon with field data
interface AgroPolygonWithField {
  id: string;
  field_id: string;
  agro_polygon_id: string;
  sync_status: string;
  field: {
    id: string;
    name: string;
    user_id: string;
    alerts_enabled: boolean;
  };
}

interface NDVICronResult {
  processed: number;
  failed: number;
  alerts_sent: number;
  details: Array<{
    fieldId: string;
    readings: number;
    error?: string;
  }>;
}

/**
 * POST /api/cron/ndvi
 * Cron job endpoint to fetch NDVI data for all synced fields
 * Triggered daily by Vercel Cron (after moisture cron)
 *
 * Security: Verifies CRON_SECRET header
 */
export async function POST(request: NextRequest) {
  // Rate limiting for cron jobs
  const rateLimitResult = await checkRateLimit(request, 'cron');
  if (!rateLimitResult.success && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  // Check if Agro API is configured
  if (!isAgroConfigured()) {
    return NextResponse.json(
      { error: 'Agro API not configured', configured: false },
      { status: 503 }
    );
  }

  // Verify cron secret (Vercel sends this header for cron jobs)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In production, verify the secret
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Use service role client for full access
  const supabase = createServerClient<Database>(
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

  const result: NDVICronResult = {
    processed: 0,
    failed: 0,
    alerts_sent: 0,
    details: [],
  };

  try {
    // Get all synced agro polygons with field data
    const { data: polygonsData, error: polygonsError } = await supabase
      .from('agro_polygons')
      .select(`
        id,
        field_id,
        agro_polygon_id,
        sync_status,
        field:fields!inner(
          id,
          name,
          user_id,
          alerts_enabled
        )
      `)
      .eq('sync_status', 'synced');

    if (polygonsError) {
      console.error('Error fetching agro polygons:', polygonsError);
      return NextResponse.json(
        { error: 'Failed to fetch synced polygons' },
        { status: 500 }
      );
    }

    const polygons = (polygonsData || []) as unknown as AgroPolygonWithField[];

    if (polygons.length === 0) {
      return NextResponse.json({
        ...result,
        message: 'No synced fields to process',
      });
    }

    console.log(`Processing NDVI for ${polygons.length} synced fields...`);

    // Get date range (last 30 days for NDVI data)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Process each synced polygon
    for (const polygon of polygons) {
      const fieldResult = {
        fieldId: polygon.field_id,
        readings: 0,
        error: undefined as string | undefined,
      };

      try {
        // Fetch NDVI data from Agro API
        const ndviReadings = await fetchNDVIForPolygon(
          polygon.agro_polygon_id,
          startDateStr,
          endDateStr
        );

        if (ndviReadings.length === 0) {
          fieldResult.error = 'No NDVI data available';
          result.details.push(fieldResult);
          continue;
        }

        // Insert readings into database
        const readingsToInsert = ndviReadings.map((reading) => ({
          field_id: polygon.field_id,
          observation_date: reading.observation_date,
          ndvi_mean: reading.ndvi_mean,
          ndvi_min: reading.ndvi_min,
          ndvi_max: reading.ndvi_max,
          evi_mean: reading.evi_mean || null,
          data_coverage: reading.data_coverage,
          cloud_coverage: reading.cloud_coverage,
          source: reading.source || 'agro_api',
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase.from('ndvi_readings') as any)
          .upsert(readingsToInsert, {
            onConflict: 'field_id,observation_date',
            ignoreDuplicates: false,
          });

        if (insertError) {
          console.error(`Error inserting NDVI readings for field ${polygon.field_id}:`, insertError);
          fieldResult.error = 'Database insert failed';
          result.failed++;
          result.details.push(fieldResult);
          continue;
        }

        fieldResult.readings = ndviReadings.length;
        result.processed++;

        // Check for vegetation stress alert (NDVI < 0.2)
        const latestReading = ndviReadings.sort(
          (a, b) => new Date(b.observation_date).getTime() - new Date(a.observation_date).getTime()
        )[0];

        if (
          polygon.field.alerts_enabled &&
          latestReading.ndvi_mean !== null &&
          latestReading.ndvi_mean < 0.2
        ) {
          const ndviStatus = getNDVIStatus(latestReading.ndvi_mean);

          // Check for recent alert (cooldown - 3 days for NDVI)
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

          const { data: recentAlert } = await supabase
            .from('alerts')
            .select('id')
            .eq('field_id', polygon.field_id)
            .eq('alert_type', 'vegetation_stress')
            .gte('created_at', threeDaysAgo.toISOString())
            .single();

          if (!recentAlert) {
            // Create alert record
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: alertError } = await (supabase.from('alerts') as any)
              .insert({
                field_id: polygon.field_id,
                user_id: polygon.field.user_id,
                alert_type: 'vegetation_stress',
                message: `NDVI na polu "${polygon.field.name}" spadlo do ${latestReading.ndvi_mean.toFixed(2)} (${ndviStatus}). Roslinnosc moze byc w slabym stanie.`,
                moisture_value: latestReading.ndvi_mean * 100,
                threshold: 20, // 0.2 as percentage
              });

            if (!alertError) {
              result.alerts_sent++;
              console.log(
                `Vegetation stress alert for field ${polygon.field.name}: NDVI ${latestReading.ndvi_mean.toFixed(2)}`
              );
            }
          }
        }

        result.details.push(fieldResult);
      } catch (fieldError) {
        console.error(`Error processing NDVI for field ${polygon.field_id}:`, fieldError);
        fieldResult.error = fieldError instanceof Error ? fieldError.message : 'Unknown error';
        result.failed++;
        result.details.push(fieldResult);
      }

      // Small delay between fields to avoid rate limiting (Agro API: 60 calls/min)
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      ...result,
      message: `Processed ${result.processed} fields, ${result.failed} failed, ${result.alerts_sent} alerts created`,
    });
  } catch (error) {
    console.error('NDVI cron job error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'NDVI cron job failed',
        ...result,
      },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
