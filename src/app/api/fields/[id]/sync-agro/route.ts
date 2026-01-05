import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database, GeoJSONPolygon } from '@/types/database';
import { checkRateLimit } from '@/lib/security';
import {
  isAgroConfigured,
  syncFieldToAgro,
  unsyncFieldFromAgro,
} from '@/lib/agroapi';

/**
 * POST /api/fields/[id]/sync-agro
 * Sync a field to Agro API (creates polygon in Agro API)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResult = await checkRateLimit(request, 'api');
  if (!rateLimitResult.success && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  const { id: fieldId } = await params;

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
    // Get field data
    const { data: field, error: fieldError } = await supabase
      .from('fields')
      .select('id, name, boundary, area_hectares, user_id')
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
    const fieldData = field as {
      id: string;
      name: string;
      boundary: unknown;
      area_hectares: number | null;
      user_id: string;
    };
    const boundary = fieldData.boundary as GeoJSONPolygon;

    if (!boundary || boundary.type !== 'Polygon' || !boundary.coordinates) {
      return NextResponse.json(
        { error: 'Invalid field boundary' },
        { status: 400 }
      );
    }

    // Check if already synced
    const { data: existingSync } = await supabase
      .from('agro_polygons')
      .select('id, agro_polygon_id, sync_status')
      .eq('field_id', fieldId)
      .single();

    if (existingSync) {
      const syncData = existingSync as { id: string; agro_polygon_id: string; sync_status: string };
      if (syncData.sync_status === 'synced') {
        return NextResponse.json(
          { error: 'Field is already synced', syncStatus: 'synced' },
          { status: 409 }
        );
      }
    }

    // Sync to Agro API
    const result = await syncFieldToAgro(
      fieldId,
      fieldData.name,
      boundary,
      fieldData.area_hectares || 0
    );

    if (!result.success) {
      // Update or insert with error status
      if (existingSync) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('agro_polygons') as any)
          .update({
            sync_status: 'error',
            error_message: result.error,
            updated_at: new Date().toISOString(),
          })
          .eq('field_id', fieldId);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('agro_polygons') as any).insert({
          field_id: fieldId,
          agro_polygon_id: '',
          sync_status: 'error',
          error_message: result.error,
        });
      }

      return NextResponse.json(
        { error: result.error, syncStatus: 'error' },
        { status: 400 }
      );
    }

    // Save the mapping
    if (existingSync) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('agro_polygons') as any)
        .update({
          agro_polygon_id: result.agroPolygonId!,
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('field_id', fieldId);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('agro_polygons') as any).insert({
        field_id: fieldId,
        agro_polygon_id: result.agroPolygonId!,
        sync_status: 'synced',
        last_synced_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      agroPolygonId: result.agroPolygonId,
      syncStatus: 'synced',
    });
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync field' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/fields/[id]/sync-agro
 * Remove field sync from Agro API
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResult = await checkRateLimit(request, 'api');
  if (!rateLimitResult.success && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  const { id: fieldId } = await params;

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
      .select('id, user_id')
      .eq('id', fieldId)
      .eq('user_id', user.id)
      .single();

    if (fieldError || !field) {
      return NextResponse.json(
        { error: 'Field not found' },
        { status: 404 }
      );
    }

    // Get existing sync
    const { data: existingSync, error: syncError } = await supabase
      .from('agro_polygons')
      .select('id, agro_polygon_id')
      .eq('field_id', fieldId)
      .single();

    if (syncError || !existingSync) {
      return NextResponse.json(
        { error: 'Field is not synced' },
        { status: 404 }
      );
    }

    const syncData = existingSync as { id: string; agro_polygon_id: string };

    // Delete from Agro API
    if (syncData.agro_polygon_id) {
      const result = await unsyncFieldFromAgro(syncData.agro_polygon_id);
      if (!result.success) {
        // Log error but continue to delete local record
        console.error('Error deleting from Agro API:', result.error);
      }
    }

    // Delete local record
    await supabase
      .from('agro_polygons')
      .delete()
      .eq('field_id', fieldId);

    return NextResponse.json({
      success: true,
      message: 'Field unsynced from Agro API',
    });
  } catch (error) {
    console.error('Unsync API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to unsync field' },
      { status: 500 }
    );
  }
}
