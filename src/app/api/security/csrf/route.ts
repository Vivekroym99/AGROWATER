import { NextResponse } from 'next/server';
import { getOrCreateCsrfToken } from '@/lib/security/csrf';
import { addSecurityHeaders } from '@/lib/security/middleware';

// GET /api/security/csrf - Get CSRF token
export async function GET() {
  try {
    const token = await getOrCreateCsrfToken();

    const response = NextResponse.json({ token });

    // Set the token in a cookie as well (httpOnly for security)
    response.cookies.set('agrowater-csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return addSecurityHeaders(
      NextResponse.json(
        { error: 'Failed to generate CSRF token' },
        { status: 500 }
      )
    );
  }
}
