import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';

// GET /api/fields - Get all fields for authenticated user
export async function GET() {
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

  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Fetch fields with status view
  const { data: fields, error } = await supabase
    .from('fields_with_status')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching fields:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: fields,
    count: fields?.length || 0,
  });
}

// POST /api/fields - Create new field
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

    if (!name || !boundary) {
      return NextResponse.json(
        { error: 'Name and boundary are required' },
        { status: 400 }
      );
    }

    // Insert field - area_hectares is calculated by trigger
    const fieldsTable = supabase.from('fields');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (fieldsTable as any)
      .insert({
        user_id: user.id,
        name,
        boundary,
        crop_type: crop_type || null,
        alert_threshold: alert_threshold || 0.3,
        alerts_enabled: alerts_enabled ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating field:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
