import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CSRF_TOKEN_NAME = 'agrowater-csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

// Generate a cryptographically secure random token
function generateToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    // Use crypto.randomUUID and combine for length
    return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 0);
  }

  // Fallback for environments without crypto.randomUUID
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < CSRF_TOKEN_LENGTH; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Get or create CSRF token
export async function getOrCreateCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;

  if (existingToken) {
    return existingToken;
  }

  const newToken = generateToken();

  // Set the token in a cookie
  cookieStore.set(CSRF_TOKEN_NAME, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return newToken;
}

// Validate CSRF token from request
export async function validateCsrfToken(request: NextRequest): Promise<boolean> {
  // Skip CSRF for GET, HEAD, OPTIONS requests (safe methods)
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }

  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_TOKEN_NAME)?.value;

  // Both must exist and match
  if (!headerToken || !cookieToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (headerToken.length !== cookieToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < headerToken.length; i++) {
    result |= headerToken.charCodeAt(i) ^ cookieToken.charCodeAt(i);
  }

  return result === 0;
}

// CSRF validation middleware
export async function checkCsrf(
  request: NextRequest
): Promise<{ success: boolean; response?: NextResponse }> {
  const isValid = await validateCsrfToken(request);

  if (!isValid) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Invalid CSRF token',
          message: 'Nieprawidlowy token CSRF. Odswiez strone i sprobuj ponownie.',
        },
        { status: 403 }
      ),
    };
  }

  return { success: true };
}

// Middleware wrapper for CSRF protection
export function withCsrfProtection(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const csrfResult = await checkCsrf(request);

    if (!csrfResult.success && csrfResult.response) {
      return csrfResult.response;
    }

    return handler(request);
  };
}
