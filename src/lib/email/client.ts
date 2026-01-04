/**
 * Resend email client singleton for AgroWater
 */

import { Resend } from 'resend';

let resendClient: Resend | null = null;

/**
 * Get the Resend client singleton
 */
export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }

    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

/**
 * Email configuration
 */
export const EMAIL_CONFIG = {
  from: 'AgroWater <alerty@agrowater.pl>',
  replyTo: 'support@agrowater.pl',
} as const;
