import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';
import { checkRateLimit } from '@/lib/security';

/**
 * GET /api/notifications
 * Get user notifications
 *
 * Query params:
 * - limit: number (default 20)
 * - offset: number (default 0)
 * - unread_only: boolean (default false)
 */
export async function GET(request: NextRequest) {
  const rateLimitResult = await checkRateLimit(request, 'api');
  if (!rateLimitResult.success && rateLimitResult.response) {
    return rateLimitResult.response;
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

  // Parse query params
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');
  const unreadOnly = searchParams.get('unread_only') === 'true';

  // Build query
  let query = supabase
    .from('notifications')
    .select('*, fields(name)')
    .eq('user_id', user.id)
    .is('dismissed_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.is('read_at', null);
  }

  const { data: notifications, error, count } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }

  // Get unread count
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null)
    .is('dismissed_at', null);

  return NextResponse.json({
    data: notifications,
    unread_count: unreadCount || 0,
    total: count,
  });
}

/**
 * PATCH /api/notifications
 * Mark notifications as read
 *
 * Body: { ids?: string[], mark_all?: boolean }
 */
export async function PATCH(request: NextRequest) {
  const rateLimitResult = await checkRateLimit(request, 'api');
  if (!rateLimitResult.success && rateLimitResult.response) {
    return rateLimitResult.response;
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
    const body = await request.json();
    const { ids, mark_all } = body;

    const now = new Date().toISOString();

    if (mark_all) {
      // Mark all as read
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read_at: now })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return NextResponse.json(
          { error: 'Failed to mark notifications as read' },
          { status: 500 }
        );
      }
    } else if (ids && Array.isArray(ids) && ids.length > 0) {
      // Mark specific notifications as read
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read_at: now })
        .eq('user_id', user.id)
        .in('id', ids);

      if (error) {
        console.error('Error marking notifications as read:', error);
        return NextResponse.json(
          { error: 'Failed to mark notifications as read' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Either ids array or mark_all is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Dismiss notifications
 *
 * Body: { ids?: string[], dismiss_all?: boolean }
 */
export async function DELETE(request: NextRequest) {
  const rateLimitResult = await checkRateLimit(request, 'api');
  if (!rateLimitResult.success && rateLimitResult.response) {
    return rateLimitResult.response;
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
    const body = await request.json();
    const { ids, dismiss_all } = body;

    const now = new Date().toISOString();

    if (dismiss_all) {
      // Dismiss all
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ dismissed_at: now })
        .eq('user_id', user.id)
        .is('dismissed_at', null);

      if (error) {
        console.error('Error dismissing all notifications:', error);
        return NextResponse.json(
          { error: 'Failed to dismiss notifications' },
          { status: 500 }
        );
      }
    } else if (ids && Array.isArray(ids) && ids.length > 0) {
      // Dismiss specific notifications
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ dismissed_at: now })
        .eq('user_id', user.id)
        .in('id', ids);

      if (error) {
        console.error('Error dismissing notifications:', error);
        return NextResponse.json(
          { error: 'Failed to dismiss notifications' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Either ids array or dismiss_all is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
