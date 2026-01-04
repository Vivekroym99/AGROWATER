import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';
import { fetchMoistureForField, getDateRange } from '@/lib/earthengine';
import type { GeoJSONPolygon, CronJobResult, ProcessFieldResult } from '@/lib/earthengine';
import { sendLowMoistureAlert } from '@/lib/email';
import { checkRateLimit } from '@/lib/security';
import { sendLowMoistureNotification } from '@/lib/push';

// Interface for field data from fields_with_status view
interface FieldData {
  id: string;
  user_id: string;
  name: string;
  boundary: unknown;
  alert_threshold: number;
  alerts_enabled: boolean;
}

// Interface for profile data
interface ProfileData {
  id: string;
  email: string;
  full_name: string | null;
}

/**
 * POST /api/cron/moisture
 * Cron job endpoint to fetch moisture data for all active fields
 * Triggered daily by Vercel Cron
 *
 * Security: Verifies CRON_SECRET header
 */
export async function POST(request: NextRequest) {
  // Rate limiting for cron jobs
  const rateLimitResult = await checkRateLimit(request, 'cron');
  if (!rateLimitResult.success && rateLimitResult.response) {
    return rateLimitResult.response;
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

  const result: CronJobResult = {
    processed: 0,
    failed: 0,
    alerts_sent: 0,
    details: [],
  };

  try {
    // Get all active fields with boundary as GeoJSON
    const { data: fieldsData, error: fieldsError } = await supabase
      .from('fields_with_status')
      .select(`
        id,
        user_id,
        name,
        boundary,
        alert_threshold,
        alerts_enabled
      `)
      .eq('is_active', true);

    // Get profiles separately for email alerts
    const fields = fieldsData as unknown as FieldData[];
    const userIds = Array.from(new Set(fields.map(f => f.user_id)));
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    const profiles = (profilesData || []) as ProfileData[];
    const profilesMap = new Map<string, ProfileData>(
      profiles.map(p => [p.id, p])
    );

    if (fieldsError) {
      console.error('Error fetching fields:', fieldsError);
      return NextResponse.json(
        { error: 'Failed to fetch fields' },
        { status: 500 }
      );
    }

    if (!fields || fields.length === 0) {
      return NextResponse.json({
        ...result,
        message: 'No active fields to process',
      });
    }

    console.log(`Processing ${fields.length} fields...`);

    // Get date range (last 14 days to catch recent images)
    const { startDate, endDate } = getDateRange(14);

    // Process each field
    for (const field of fields) {
      const fieldResult: ProcessFieldResult = {
        fieldId: field.id,
        readings: [],
      };

      try {
        const boundary = field.boundary as GeoJSONPolygon;

        if (!boundary || boundary.type !== 'Polygon') {
          fieldResult.error = 'Invalid boundary';
          result.failed++;
          result.details.push(fieldResult);
          continue;
        }

        // Fetch moisture data from GEE
        const moistureReadings = await fetchMoistureForField(
          boundary,
          startDate,
          endDate
        );

        if (moistureReadings.length === 0) {
          fieldResult.error = 'No satellite data available';
          result.details.push(fieldResult);
          continue;
        }

        // Insert readings into database
        const readingsToInsert = moistureReadings.map((reading) => ({
          field_id: field.id,
          observation_date: reading.observation_date,
          moisture_index: reading.moisture_index,
          vv_backscatter: reading.vv_backscatter,
          vh_backscatter: reading.vh_backscatter,
          source: reading.source,
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase.from('moisture_readings') as any)
          .upsert(readingsToInsert, {
            onConflict: 'field_id,observation_date',
            ignoreDuplicates: false,
          });

        if (insertError) {
          console.error(`Error inserting readings for field ${field.id}:`, insertError);
          fieldResult.error = 'Database insert failed';
          result.failed++;
          result.details.push(fieldResult);
          continue;
        }

        fieldResult.readings = moistureReadings;
        result.processed++;

        // Check if alert should be sent
        const latestReading = moistureReadings[0];
        if (
          field.alerts_enabled &&
          latestReading.moisture_index < field.alert_threshold
        ) {
          // Check for recent alert (cooldown)
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);

          const { data: recentAlert } = await supabase
            .from('alerts')
            .select('id')
            .eq('field_id', field.id)
            .eq('alert_type', 'low_moisture')
            .gte('created_at', oneDayAgo.toISOString())
            .single();

          if (!recentAlert) {
            // Create alert record
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: alertError } = await (supabase.from('alerts') as any)
              .insert({
                field_id: field.id,
                user_id: field.user_id,
                alert_type: 'low_moisture',
                message: `Wilgotność na polu "${field.name}" spadła poniżej progu alertu.`,
                moisture_value: latestReading.moisture_index * 100,
                threshold: field.alert_threshold * 100,
              });

            if (!alertError) {
              result.alerts_sent++;

              // Send push notification
              const moisturePercent = latestReading.moisture_index * 100;
              const thresholdPercent = field.alert_threshold * 100;

              try {
                const pushResult = await sendLowMoistureNotification(
                  field.user_id,
                  field.id,
                  field.name,
                  moisturePercent,
                  thresholdPercent
                );

                if (pushResult.pushSent > 0) {
                  console.log(`Push notification sent to ${pushResult.pushSent} device(s) for field ${field.name}`);
                }
                if (pushResult.errors.length > 0) {
                  console.warn(`Push notification errors for field ${field.name}:`, pushResult.errors);
                }
              } catch (pushError) {
                console.error(`Failed to send push notification for field ${field.name}:`, pushError);
              }

              // Send email via Resend API
              const profile = profilesMap.get(field.user_id) as ProfileData | undefined;
              if (profile?.email) {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                await sendLowMoistureAlert(profile.email, {
                  recipientName: profile.full_name || '',
                  fieldName: field.name,
                  currentMoisture: moisturePercent,
                  threshold: thresholdPercent,
                  fieldUrl: `${appUrl}/fields/${field.id}`,
                });

                // Mark alert as sent
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase.from('alerts') as any)
                  .update({ sent_at: new Date().toISOString() })
                  .eq('field_id', field.id)
                  .eq('user_id', field.user_id)
                  .is('sent_at', null);
              }

              console.log(
                `Alert sent for field ${field.name}: moisture ${moisturePercent.toFixed(1)}%`
              );
            }
          }
        }

        result.details.push(fieldResult);
      } catch (fieldError) {
        console.error(`Error processing field ${field.id}:`, fieldError);
        fieldResult.error =
          fieldError instanceof Error ? fieldError.message : 'Unknown error';
        result.failed++;
        result.details.push(fieldResult);
      }

      // Small delay between fields to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      ...result,
      message: `Processed ${result.processed} fields, ${result.failed} failed, ${result.alerts_sent} alerts created`,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Cron job failed',
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
