import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  // Auth endpoints - stricter limits to prevent brute force
  auth: { requests: 5, window: '1m' as const },
  // Password reset - very strict
  passwordReset: { requests: 3, window: '15m' as const },
  // General API - moderate limits
  api: { requests: 60, window: '1m' as const },
  // Data fetching (GEE) - expensive operations
  dataFetch: { requests: 10, window: '1m' as const },
  // Cron jobs - should be called once
  cron: { requests: 5, window: '1m' as const },
} as const;

type RateLimitType = keyof typeof RATE_LIMITS;

// In-memory store for development (when Redis is not configured)
const memoryStore = new Map<string, { count: number; resetAt: number }>();

// Parse window string to milliseconds
function parseWindow(window: string): number {
  const match = window.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 60000; // Default 1 minute

  const [, value, unit] = match;
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
  };

  return parseInt(value) * multipliers[unit];
}

// In-memory rate limiter for development
function memoryRateLimit(
  identifier: string,
  limit: { requests: number; window: string }
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const windowMs = parseWindow(limit.window);
  const key = identifier;

  const record = memoryStore.get(key);

  if (!record || now >= record.resetAt) {
    // New window
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit.requests - 1, reset: now + windowMs };
  }

  if (record.count >= limit.requests) {
    return { success: false, remaining: 0, reset: record.resetAt };
  }

  record.count++;
  return { success: true, remaining: limit.requests - record.count, reset: record.resetAt };
}

// Clean up old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const entries = Array.from(memoryStore.entries());
    for (const [key, value] of entries) {
      if (now >= value.resetAt) {
        memoryStore.delete(key);
      }
    }
  }, 60000); // Clean every minute
}

// Create Upstash rate limiter if configured
let upstashRatelimit: Ratelimit | null = null;

function getUpstashRatelimit(): Ratelimit | null {
  if (upstashRatelimit) return upstashRatelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    const redis = new Redis({ url, token });
    upstashRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1m'),
      analytics: true,
      prefix: 'agrowater:ratelimit',
    });
    return upstashRatelimit;
  } catch {
    console.warn('Failed to initialize Upstash Redis, using memory rate limiter');
    return null;
  }
}

// Get client identifier from request
export function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');

  const ip = cfIp || realIp || forwarded?.split(',')[0]?.trim() || 'unknown';

  return ip;
}

// Main rate limit check function
export async function checkRateLimit(
  request: NextRequest,
  type: RateLimitType = 'api'
): Promise<{ success: boolean; response?: NextResponse }> {
  const config = RATE_LIMITS[type];
  const identifier = `${type}:${getClientIdentifier(request)}`;

  // Try Upstash first, fall back to memory
  const ratelimit = getUpstashRatelimit();

  let result: { success: boolean; remaining: number; reset: number };

  if (ratelimit) {
    const upstashResult = await ratelimit.limit(identifier);
    result = {
      success: upstashResult.success,
      remaining: upstashResult.remaining,
      reset: upstashResult.reset,
    };
  } else {
    result = memoryRateLimit(identifier, config);
  }

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Zbyt wiele zapytan. Sprobuj ponownie pozniej.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.requests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.reset.toString(),
          },
        }
      ),
    };
  }

  return { success: true };
}

// Middleware wrapper for rate limiting
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  type: RateLimitType = 'api'
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimitResult = await checkRateLimit(request, type);

    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    return handler(request);
  };
}
