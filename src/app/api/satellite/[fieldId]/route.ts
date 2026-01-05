import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';
import { checkRateLimit } from '@/lib/security';
import {
  isAgroConfigured,
  searchSatelliteImages,
  filterByCloudCoverage,
} from '@/lib/agroapi';
import { SATELLITE_CONFIG } from '@/lib/constants';

/**
 * GET /api/satellite/[fieldId]
 * Get satellite images for a field
 * Requires field to be synced with Agro API
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
    // Get field and verify ownership
    const { data: fieldData, error: fieldError } = await supabase
      .from('fields')
      .select('id, name, user_id')
      .eq('id', fieldId)
      .eq('user_id', user.id)
      .single();

    if (fieldError || !fieldData) {
      return NextResponse.json(
        { error: 'Field not found' },
        { status: 404 }
      );
    }

    // Type assertion for field data
    const field = fieldData as { id: string; name: string; user_id: string };

    // Check if field is synced with Agro API
    const { data: agroPolygon, error: polygonError } = await supabase
      .from('agro_polygons')
      .select('agro_polygon_id, sync_status')
      .eq('field_id', fieldId)
      .single();

    if (polygonError || !agroPolygon) {
      return NextResponse.json({
        fieldId,
        fieldName: field.name,
        images: [],
        needsSync: true,
        syncStatus: 'not_synced',
        configured: true,
      });
    }

    const syncData = agroPolygon as { agro_polygon_id: string; sync_status: string };

    if (syncData.sync_status !== 'synced' || !syncData.agro_polygon_id) {
      return NextResponse.json({
        fieldId,
        fieldName: field.name,
        images: [],
        needsSync: true,
        syncStatus: syncData.sync_status,
        configured: true,
      });
    }

    // Get days parameter (default 30)
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30', 10);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Search for satellite images
    const allImages = await searchSatelliteImages(
      syncData.agro_polygon_id,
      startDate,
      endDate
    );

    // Filter by cloud coverage
    const filteredImages = filterByCloudCoverage(
      allImages,
      SATELLITE_CONFIG.maxCloudCoverage
    );

    return NextResponse.json({
      fieldId,
      fieldName: field.name,
      images: filteredImages,
      totalImages: allImages.length,
      filteredCount: filteredImages.length,
      needsSync: false,
      syncStatus: 'synced',
      agroPolygonId: syncData.agro_polygon_id,
      configured: true,
    });
  } catch (error) {
    console.error('Satellite API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch satellite images' },
      { status: 500 }
    );
  }
}
