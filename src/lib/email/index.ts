/**
 * Email module for AgroWater
 * Uses Resend for transactional emails
 */

export { getResendClient, EMAIL_CONFIG } from './client';
export { sendLowMoistureAlert, sendEmail } from './send';
export type { LowMoistureEmailData } from './templates/low-moisture';
