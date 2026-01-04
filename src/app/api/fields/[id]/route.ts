import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';

interface RouteParams {
  params: { id: string };
}

// GET /api/fields/[id] - Get single field
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  const cookieStore = cookies();
  const { id } = params;

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

  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Fetch field with status
  const { data: field, error } = await supabase
    .from('fields_with_status')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Field not found' },
        { status: 404 }
      );
    }
    console.error('Error fetching field:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: field });
}

// PUT /api/fields/[id] - Update field
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const cookieStore = cookies();
  const { id } = params;

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

  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, boundary, crop_type, alert_threshold, alerts_enabled } = body;

    // Build update object with only provided fields
    const updates: Database['public']['Tables']['fields']['Update'] = {};
    if (name !== undefined) updates.name = name;
    if (boundary !== undefined) updates.boundary = boundary;
    if (crop_type !== undefined) updates.crop_type = crop_type;
    if (alert_threshold !== undefined) updates.alert_threshold = alert_threshold;
    if (alerts_enabled !== undefined) updates.alerts_enabled = alerts_enabled;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const fieldsTable = supabase.from('fields');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (fieldsTable as any)
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the field
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Field not found' },
          { status: 404 }
        );
      }
      console.error('Error updating field:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

// DELETE /api/fields/[id] - Soft delete field
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  const cookieStore = cookies();
  const { id } = params;

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

  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Soft delete by setting is_active = false
  const fieldsTable = supabase.from('fields');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (fieldsTable as any)
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', user.id); // Ensure user owns the field

  if (error) {
    console.error('Error deleting field:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
