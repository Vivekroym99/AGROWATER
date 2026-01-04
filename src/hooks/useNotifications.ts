'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Notification } from '@/types/database';

interface NotificationWithField extends Notification {
  fields?: { name: string } | null;
}

interface UseNotificationsResult {
  notifications: NotificationWithField[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (ids: string[]) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  dismiss: (ids: string[]) => Promise<boolean>;
  dismissAll: () => Promise<boolean>;
}

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<NotificationWithField[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/notifications?limit=50');

      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, reset state
          setNotifications([]);
          setUnreadCount(0);
          return;
        }
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.data || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Poll for new notifications every minute
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          ids.includes(n.id) ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - ids.length));

      return true;
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);

      return true;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  }, []);

  const dismiss = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss notifications');
      }

      // Update local state
      const dismissedUnread = notifications.filter(
        (n) => ids.includes(n.id) && !n.read_at
      ).length;
      setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
      setUnreadCount((prev) => Math.max(0, prev - dismissedUnread));

      return true;
    } catch (err) {
      console.error('Error dismissing notifications:', err);
      return false;
    }
  }, [notifications]);

  const dismissAll = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dismiss_all: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss all notifications');
      }

      // Update local state
      setNotifications([]);
      setUnreadCount(0);

      return true;
    } catch (err) {
      console.error('Error dismissing all notifications:', err);
      return false;
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismiss,
    dismissAll,
  };
}
