/**
 * Email sending functions for AgroWater
 */

import { getResendClient, EMAIL_CONFIG } from './client';
import {
  getLowMoistureSubject,
  getLowMoistureHtml,
  getLowMoistureText,
  type LowMoistureEmailData,
} from './templates/low-moisture';

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send a low moisture alert email
 */
export async function sendLowMoistureAlert(
  to: string,
  data: LowMoistureEmailData
): Promise<SendEmailResult> {
  try {
    const resend = getResendClient();

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      to,
      subject: getLowMoistureSubject(data.fieldName),
      html: getLowMoistureHtml(data),
      text: getLowMoistureText(data),
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return {
        success: false,
        error: result.error.message,
      };
    }

    return {
      success: true,
      id: result.data?.id,
    };
  } catch (error) {
    console.error('Failed to send low moisture alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send a generic email
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendEmailResult> {
  try {
    const resend = getResendClient();

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return {
        success: false,
        error: result.error.message,
      };
    }

    return {
      success: true,
      id: result.data?.id,
    };
  } catch (error) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
