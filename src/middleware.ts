import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add security headers to response
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent XSS
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (adjust as needed)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.googleapis.com https://*.upstash.io; frame-ancestors 'none';"
    );
  }

  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(self), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );

  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
}

export async function middleware(request: NextRequest) {
  // Update session first
  const response = await updateSession(request);

  // Add security headers
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
