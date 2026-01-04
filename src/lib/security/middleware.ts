import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from './rate-limit';
import { checkCsrf } from './csrf';

type RateLimitType = keyof typeof RATE_LIMITS;

export interface SecurityOptions {
  // Rate limiting
  rateLimit?: RateLimitType | false;
  // CSRF protection (enabled by default for mutating requests)
  csrf?: boolean;
  // Require authentication (checked by the handler, not middleware)
  requireAuth?: boolean;
}

const defaultOptions: SecurityOptions = {
  rateLimit: 'api',
  csrf: true,
  requireAuth: true,
};

// Security headers to add to all responses
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent XSS
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (disable unnecessary features)
  response.headers.set(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );

  return response;
}

// Combined security middleware wrapper
export function withSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: SecurityOptions = {}
) {
  const opts = { ...defaultOptions, ...options };

  return async (request: NextRequest): Promise<NextResponse> => {
    // 1. Rate limiting
    if (opts.rateLimit !== false) {
      const rateLimitResult = await checkRateLimit(request, opts.rateLimit);
      if (!rateLimitResult.success && rateLimitResult.response) {
        return addSecurityHeaders(rateLimitResult.response);
      }
    }

    // 2. CSRF protection (only for mutating requests)
    if (opts.csrf !== false) {
      const method = request.method.toUpperCase();
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        const csrfResult = await checkCsrf(request);
        if (!csrfResult.success && csrfResult.response) {
          return addSecurityHeaders(csrfResult.response);
        }
      }
    }

    // 3. Execute handler
    const response = await handler(request);

    // 4. Add security headers
    return addSecurityHeaders(response);
  };
}

// Simplified wrappers for common use cases

// For auth endpoints (stricter rate limiting, CSRF enabled)
export function withAuthSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return withSecurity(handler, {
    rateLimit: 'auth',
    csrf: true,
    requireAuth: false,
  });
}

// For password reset (very strict rate limiting)
export function withPasswordResetSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return withSecurity(handler, {
    rateLimit: 'passwordReset',
    csrf: true,
    requireAuth: false,
  });
}

// For data fetching operations (expensive, rate limited)
export function withDataFetchSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return withSecurity(handler, {
    rateLimit: 'dataFetch',
    csrf: true,
    requireAuth: true,
  });
}

// For cron jobs (rate limited, no CSRF, verified by secret)
export function withCronSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Verify cron secret in production
    if (process.env.NODE_ENV === 'production') {
      const cronSecret = request.headers.get('x-cron-secret');
      const expectedSecret = process.env.CRON_SECRET;

      if (!expectedSecret || cronSecret !== expectedSecret) {
        return addSecurityHeaders(
          NextResponse.json(
            { error: 'Unauthorized', message: 'Invalid cron secret' },
            { status: 401 }
          )
        );
      }
    }

    // Apply rate limiting (no CSRF for cron)
    return withSecurity(handler, {
      rateLimit: 'cron',
      csrf: false,
      requireAuth: false,
    })(request);
  };
}

// For public GET endpoints (no auth, rate limited, no CSRF)
export function withPublicSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return withSecurity(handler, {
    rateLimit: 'api',
    csrf: false,
    requireAuth: false,
  });
}
