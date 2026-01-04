import webPush from 'web-push';

// VAPID keys for web push notifications
// Generate new keys with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@agrowater.pl';

// Initialize web-push with VAPID keys
let isInitialized = false;

export function initializeWebPush(): boolean {
  if (isInitialized) return true;

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured. Push notifications disabled.');
    return false;
  }

  try {
    webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    isInitialized = true;
    return true;
  } catch (error) {
    console.error('Failed to initialize web push:', error);
    return false;
  }
}

// Get the public VAPID key for client-side subscription
export function getPublicVapidKey(): string {
  return VAPID_PUBLIC_KEY;
}

// Check if push notifications are configured
export function isPushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// Send a push notification to a single subscription
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  if (!initializeWebPush()) {
    return { success: false, error: 'Push notifications not configured' };
  }

  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };

    await webPush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      {
        TTL: 86400, // 24 hours
        urgency: 'normal',
      }
    );

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if subscription is expired/invalid
    if (
      error instanceof webPush.WebPushError &&
      (error.statusCode === 404 || error.statusCode === 410)
    ) {
      return { success: false, error: 'subscription_expired' };
    }

    console.error('Push notification error:', error);
    return { success: false, error: errorMessage };
  }
}

// Send push notifications to multiple subscriptions
export async function sendPushNotificationToMany(
  subscriptions: PushSubscription[],
  payload: PushNotificationPayload
): Promise<{
  successful: number;
  failed: number;
  expiredEndpoints: string[];
}> {
  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushNotification(sub, payload))
  );

  let successful = 0;
  let failed = 0;
  const expiredEndpoints: string[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      successful++;
    } else {
      failed++;
      if (
        result.status === 'fulfilled' &&
        result.value.error === 'subscription_expired'
      ) {
        expiredEndpoints.push(subscriptions[index].endpoint);
      }
    }
  });

  return { successful, failed, expiredEndpoints };
}
