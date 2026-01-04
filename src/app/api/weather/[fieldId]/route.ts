import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';
import { checkRateLimit } from '@/lib/security';
import {
  isWeatherConfigured,
  getWeatherForLocation,
  getPolygonCentroid,
  calculateMoistureImpact,
} from '@/lib/weather';
import type { GeoJSONPolygon } from '@/types/database';

// Simple in-memory cache for weather data (5 minute TTL)
const weatherCache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/weather/[fieldId]
 * Get weather data for a field based on its location
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

  // Check if weather is configured
  if (!isWeatherConfigured()) {
    return NextResponse.json(
      { error: 'Weather service not configured', configured: false },
      { status: 503 }
    );
  }

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
    // Get field boundary
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

    // Get centroid of field polygon
    const { lat, lon } = getPolygonCentroid(boundary.coordinates);

    // Check cache
    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cached = weatherCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json({
        ...(cached.data as Record<string, unknown>),
        cached: true,
      });
    }

    // Fetch weather data
    const weatherData = await getWeatherForLocation(lat, lon);

    // Calculate moisture impact
    const moistureImpact = calculateMoistureImpact(weatherData);

    const response = {
      fieldId: fieldData.id,
      fieldName: fieldData.name,
      weather: weatherData,
      moistureImpact,
      configured: true,
    };

    // Cache the response
    weatherCache.set(cacheKey, {
      data: response,
      expires: Date.now() + CACHE_TTL,
    });

    // Clean old cache entries periodically
    if (weatherCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of Array.from(weatherCache.entries())) {
        if (value.expires < now) {
          weatherCache.delete(key);
        }
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch weather' },
      { status: 500 }
    );
  }
}
