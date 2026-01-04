import { createServerClient } from '@supabase/ssr';
import type { Database, NotificationType, NotificationPreferences, PushSubscription as PushSubscriptionRow } from '@/types/database';
import { sendPushNotification, isPushConfigured } from './vapid';

// Type alias for database row (using generated types)
type NotificationPreferencesRow = NotificationPreferences;

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  fieldId?: string;
  alertId?: string;
  data?: Record<string, unknown>;
}

export interface NotifyResult {
  notification?: { id: string };
  pushSent: number;
  pushFailed: number;
  errors: string[];
}

/**
 * Create a notification record and send push notifications to all user devices
 */
export async function createNotificationAndPush(
  params: CreateNotificationParams
): Promise<NotifyResult> {
  const result: NotifyResult = {
    pushSent: 0,
    pushFailed: 0,
    errors: [],
  };

  // Use service role for full access
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );

  try {
    // 1. Check user's notification preferences
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: preferences } = await (supabase as any)
      .from('notification_preferences')
      .select('*')
      .eq('user_id', params.userId)
      .single() as { data: NotificationPreferencesRow | null };

    // If no preferences exist, create defaults
    if (!preferences) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('notification_preferences').insert({
        user_id: params.userId,
      });
    }

    // Check quiet hours
    if (preferences?.quiet_hours_enabled && preferences.quiet_hours_start && preferences.quiet_hours_end) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const start = preferences.quiet_hours_start;
      const end = preferences.quiet_hours_end;

      // Handle quiet hours that cross midnight
      const isQuietTime = start < end
        ? (currentTime >= start && currentTime < end)
        : (currentTime >= start || currentTime < end);

      if (isQuietTime) {
        console.log(`Skipping push for user ${params.userId}: quiet hours active`);
        // Still create the notification, just don't send push
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: notification, error: notifError } = await (supabase as any)
          .from('notifications')
          .insert({
            user_id: params.userId,
            type: params.type,
            title: params.title,
            message: params.message,
            field_id: params.fieldId || null,
            alert_id: params.alertId || null,
            data: params.data || {},
          })
          .select('id')
          .single();

        if (notifError) {
          result.errors.push(`Failed to create notification: ${notifError.message}`);
        } else {
          result.notification = notification;
        }

        return result;
      }
    }

    // Check if push is enabled for this type
    const shouldSendPush = preferences?.push_enabled !== false && (
      (params.type === 'low_moisture' && preferences?.push_low_moisture !== false) ||
      (params.type === 'data_updated' && preferences?.push_new_readings !== false) ||
      (params.type === 'system') ||
      (params.type === 'info')
    );

    // 2. Create notification record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: notification, error: notifError } = await (supabase as any)
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        field_id: params.fieldId || null,
        alert_id: params.alertId || null,
        data: params.data || {},
      })
      .select('id')
      .single();

    if (notifError) {
      result.errors.push(`Failed to create notification: ${notifError.message}`);
      return result;
    }

    result.notification = notification;

    // 3. Send push notifications if configured and enabled
    if (!shouldSendPush) {
      console.log(`Push disabled for user ${params.userId} or notification type ${params.type}`);
      return result;
    }

    if (!isPushConfigured()) {
      console.log('Push notifications not configured (missing VAPID keys)');
      return result;
    }

    // Get all user's push subscriptions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscriptions, error: subsError } = await (supabase as any)
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', params.userId) as { data: PushSubscriptionRow[] | null; error: Error | null };

    if (subsError) {
      result.errors.push(`Failed to fetch push subscriptions: ${subsError.message}`);
      return result;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions for user ${params.userId}`);
      return result;
    }

    // Send push to each subscription
    for (const sub of subscriptions) {
      try {
        const pushResult = await sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          {
            title: params.title,
            body: params.message,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: `${params.type}-${params.fieldId || 'general'}`,
            data: {
              notification_id: notification.id,
              type: params.type,
              field_id: params.fieldId,
              url: params.fieldId ? `/fields/${params.fieldId}` : '/dashboard',
              ...params.data,
            },
          }
        );

        if (pushResult.success) {
          result.pushSent++;
          // Update last_used_at
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', sub.id);
        } else {
          result.pushFailed++;
          if (pushResult.error) {
            result.errors.push(`Push to ${sub.endpoint.slice(-20)}: ${pushResult.error}`);
          }
          // If subscription is invalid (410 Gone), remove it
          if (pushResult.error?.includes('410') || pushResult.error?.includes('expired')) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id);
            console.log(`Removed expired subscription ${sub.id}`);
          }
        }
      } catch (error) {
        result.pushFailed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Push error: ${errorMessage}`);
      }
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Notification error: ${errorMessage}`);
    return result;
  }
}

/**
 * Send a low moisture alert notification
 */
export async function sendLowMoistureNotification(
  userId: string,
  fieldId: string,
  fieldName: string,
  moisturePercent: number,
  thresholdPercent: number,
  alertId?: string
): Promise<NotifyResult> {
  return createNotificationAndPush({
    userId,
    type: 'low_moisture',
    title: 'Niski poziom wilgotnosci',
    message: `Pole "${fieldName}" ma wilgotnosc ${moisturePercent.toFixed(1)}% (prog: ${thresholdPercent.toFixed(1)}%)`,
    fieldId,
    alertId,
    data: {
      moisture_percent: moisturePercent,
      threshold_percent: thresholdPercent,
      requireInteraction: true,
    },
  });
}

/**
 * Send a data update notification
 */
export async function sendDataUpdateNotification(
  userId: string,
  fieldId: string,
  fieldName: string,
  readingsCount: number
): Promise<NotifyResult> {
  return createNotificationAndPush({
    userId,
    type: 'data_updated',
    title: 'Nowe dane satelitarne',
    message: `Zaktualizowano ${readingsCount} odczyt${readingsCount === 1 ? '' : readingsCount < 5 ? 'y' : 'ow'} dla pola "${fieldName}"`,
    fieldId,
    data: {
      readings_count: readingsCount,
    },
  });
}
