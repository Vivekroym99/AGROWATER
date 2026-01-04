'use client';

import { useState, useEffect, useCallback } from 'react';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | 'default';
  loading: boolean;
  error: string | null;
}

interface UsePushNotificationsResult extends PushNotificationState {
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
}

// Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    loading: true,
    error: null,
  });

  // Check if push notifications are supported and get current state
  useEffect(() => {
    const checkSupport = async () => {
      // Check browser support
      const isSupported =
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;

      if (!isSupported) {
        setState((prev) => ({
          ...prev,
          isSupported: false,
          loading: false,
        }));
        return;
      }

      // Get current permission
      const permission = Notification.permission;

      // Check if already subscribed
      let isSubscribed = false;
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        isSubscribed = subscription !== null;
      } catch (error) {
        console.error('Error checking push subscription:', error);
      }

      setState({
        isSupported: true,
        isSubscribed,
        permission,
        loading: false,
        error: null,
      });
    };

    checkSupport();
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      throw error;
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    setState((prev) => ({ ...prev, permission }));
    return permission;
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Request permission if needed
      if (Notification.permission === 'default') {
        const permission = await requestPermission();
        if (permission !== 'granted') {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: 'Notification permission denied',
          }));
          return false;
        }
      } else if (Notification.permission === 'denied') {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Notifications are blocked. Please enable them in browser settings.',
        }));
        return false;
      }

      // Register service worker
      await registerServiceWorker();
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from server
      const configResponse = await fetch('/api/push/subscribe');
      const configData = await configResponse.json();

      if (!configData.configured || !configData.publicKey) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Push notifications not configured on server',
        }));
        return false;
      }

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(configData.publicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: btoa(
                String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('p256dh')!)))
              ),
              auth: btoa(
                String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('auth')!)))
              ),
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription on server');
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        loading: false,
        error: null,
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe';
      console.error('Push subscription error:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return false;
    }
  }, [requestPermission, registerServiceWorker]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Remove from server
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        loading: false,
        error: null,
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unsubscribe';
      console.error('Push unsubscription error:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return false;
    }
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    requestPermission,
  };
}
