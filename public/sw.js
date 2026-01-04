// Service Worker for Push Notifications
// AgroWater - Soil Moisture Monitoring

const CACHE_NAME = 'agrowater-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let data = {
    title: 'AgroWater',
    body: 'Masz nowe powiadomienie',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'agrowater-notification',
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        ...data,
        ...payload,
      };
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    tag: data.tag || 'agrowater-notification',
    data: data.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: data.data?.requireInteraction || false,
    actions: data.actions || [
      {
        action: 'view',
        title: 'Zobacz',
      },
      {
        action: 'dismiss',
        title: 'Odrzuc',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  // Handle different actions
  if (action === 'dismiss') {
    // Just close the notification
    return;
  }

  // Default action: open the app
  let urlToOpen = '/dashboard';

  // Navigate to specific page based on notification data
  if (data.url) {
    urlToOpen = data.url;
  } else if (data.field_id) {
    urlToOpen = `/fields/${data.field_id}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
});

// Handle background sync (for offline notifications)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    const response = await fetch('/api/notifications?unread_only=true&limit=5');
    if (response.ok) {
      const data = await response.json();
      console.log('[SW] Synced notifications:', data.unread_count);
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}
