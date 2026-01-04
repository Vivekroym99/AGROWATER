/**
 * Google Earth Engine client initialization
 * Uses service account credentials for authentication
 */

import ee from '@google/earthengine';
import type { GEECredentials } from './types';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Get GEE credentials from environment variables
 */
function getCredentials(): GEECredentials {
  const email = process.env.GEE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GEE_PRIVATE_KEY;

  if (!email || !privateKey) {
    throw new Error(
      'GEE credentials not configured. Set GEE_SERVICE_ACCOUNT_EMAIL and GEE_PRIVATE_KEY environment variables.'
    );
  }

  // Handle escaped newlines in private key (from .env file)
  const formattedKey = privateKey.replace(/\\n/g, '\n');

  return {
    client_email: email,
    private_key: formattedKey,
  };
}

/**
 * Initialize Earth Engine with service account credentials
 * Uses singleton pattern - only initializes once
 */
export async function initializeEarthEngine(): Promise<void> {
  if (isInitialized) {
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = new Promise((resolve, reject) => {
    try {
      const credentials = getCredentials();

      ee.data.authenticateViaPrivateKey(
        {
          client_email: credentials.client_email,
          private_key: credentials.private_key,
        },
        () => {
          ee.initialize(
            null,
            null,
            () => {
              isInitialized = true;
              console.log('Earth Engine initialized successfully');
              resolve();
            },
            (error: Error) => {
              console.error('Earth Engine initialization failed:', error);
              initPromise = null;
              reject(new Error(`Failed to initialize Earth Engine: ${error.message}`));
            }
          );
        },
        (error: Error) => {
          console.error('Earth Engine authentication failed:', error);
          initPromise = null;
          reject(new Error(`Failed to authenticate with Earth Engine: ${error.message}`));
        }
      );
    } catch (error) {
      initPromise = null;
      reject(error);
    }
  });

  return initPromise;
}

/**
 * Get the Earth Engine module (must be initialized first)
 */
export function getEE(): typeof ee {
  if (!isInitialized) {
    throw new Error('Earth Engine not initialized. Call initializeEarthEngine() first.');
  }
  return ee;
}

/**
 * Check if Earth Engine is initialized
 */
export function isEarthEngineInitialized(): boolean {
  return isInitialized;
}
