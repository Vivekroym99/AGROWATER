'use client';

import { useState, useEffect, useCallback } from 'react';

const CSRF_HEADER_NAME = 'x-csrf-token';

interface UseCsrfResult {
  token: string | null;
  loading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
  getHeaders: () => Record<string, string>;
}

export function useCsrf(): UseCsrfResult {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/security/csrf', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      setToken(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('CSRF token fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  const getHeaders = useCallback((): Record<string, string> => {
    if (!token) return {};
    return { [CSRF_HEADER_NAME]: token };
  }, [token]);

  return {
    token,
    loading,
    error,
    refreshToken: fetchToken,
    getHeaders,
  };
}

// Utility function to make fetch requests with CSRF token
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // First, get a CSRF token if needed for mutating requests
  const method = (options.method || 'GET').toUpperCase();
  const needsCsrf = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  let csrfToken = '';

  if (needsCsrf) {
    try {
      const csrfResponse = await fetch('/api/security/csrf', {
        credentials: 'include',
      });
      const csrfData = await csrfResponse.json();
      csrfToken = csrfData.token;
    } catch (err) {
      console.warn('Failed to get CSRF token:', err);
    }
  }

  const headers = new Headers(options.headers);

  if (csrfToken) {
    headers.set(CSRF_HEADER_NAME, csrfToken);
  }

  // Ensure content-type is set for JSON bodies
  if (options.body && typeof options.body === 'string') {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}
