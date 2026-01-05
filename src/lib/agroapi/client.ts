/**
 * OpenWeatherMap Agro API client
 * Manages authentication and API connectivity
 */

const AGRO_API_BASE = 'https://api.agromonitoring.com/agro/1.0';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Check if Agro API is configured and enabled
 */
export function isAgroConfigured(): boolean {
  return !!(
    process.env.AGRO_API_KEY &&
    process.env.AGRO_API_ENABLED === 'true'
  );
}

/**
 * Get the Agro API key from environment
 */
export function getApiKey(): string {
  const apiKey = process.env.AGRO_API_KEY;
  if (!apiKey) {
    throw new Error(
      'AGRO_API_KEY not configured. Set AGRO_API_KEY environment variable.'
    );
  }
  return apiKey;
}

/**
 * Exported API key for use in tile URLs (read-only access)
 */
export const AGRO_API_KEY = process.env.AGRO_API_KEY;

/**
 * Get the Agro API base URL
 */
export function getAgroApiBase(): string {
  return AGRO_API_BASE;
}

/**
 * Initialize Agro API client
 * Verifies API key works by listing polygons
 * Uses singleton pattern - only initializes once
 */
export async function initializeAgroClient(): Promise<void> {
  if (isInitialized) {
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = new Promise(async (resolve, reject) => {
    try {
      if (!isAgroConfigured()) {
        throw new Error('Agro API not configured or disabled');
      }

      const apiKey = getApiKey();

      // Test API connectivity by listing polygons
      const response = await fetch(`${AGRO_API_BASE}/polygons?appid=${apiKey}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Agro API test failed: ${response.status} - ${errorText}`);
      }

      isInitialized = true;
      console.log('Agro API client initialized successfully');
      resolve();
    } catch (error) {
      initPromise = null;
      console.error('Agro API initialization failed:', error);
      reject(error);
    }
  });

  return initPromise;
}

/**
 * Check if Agro API client is initialized
 */
export function isAgroInitialized(): boolean {
  return isInitialized;
}

/**
 * Reset initialization state (for testing)
 */
export function resetAgroClient(): void {
  isInitialized = false;
  initPromise = null;
}

/**
 * Make authenticated request to Agro API
 */
export async function agroFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!isAgroConfigured()) {
    throw new Error('Agro API not configured');
  }

  const apiKey = getApiKey();
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${AGRO_API_BASE}${endpoint}${separator}appid=${apiKey}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  return response;
}
