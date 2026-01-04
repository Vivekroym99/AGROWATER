import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';

/**
 * DELETE /api/auth/delete-account
 * Delete user's account and all associated data
 *
 * Body: { confirmation: string } - must be "USUŃ KONTO"
 */
export async function DELETE(request: NextRequest) {
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
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { confirmation } = body;

    // Verify confirmation text
    if (confirmation !== 'USUŃ KONTO') {
      return NextResponse.json(
        { error: 'Nieprawidłowe potwierdzenie. Wpisz "USUŃ KONTO".' },
        { status: 400 }
      );
    }

    // Use service role client for deletion
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

    // Soft delete all user's fields (cascade will handle moisture_readings and alerts)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (serviceSupabase.from('fields') as any)
      .update({ is_active: false })
      .eq('user_id', user.id);

    // Delete the user's profile
    await serviceSupabase.from('profiles').delete().eq('id', user.id);

    // Delete the user from auth.users (this will sign them out)
    const { error: deleteError } = await serviceSupabase.auth.admin.deleteUser(
      user.id
    );

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { error: 'Nie udało się usunąć konta. Spróbuj ponownie.' },
        { status: 500 }
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
