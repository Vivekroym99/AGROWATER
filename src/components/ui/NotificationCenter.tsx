'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { cn } from '@/lib/utils/cn';
import type { NotificationType } from '@/types/database';
import {
  Bell,
  BellOff,
  CheckCheck,
  X,
  Trash2,
  Droplets,
  AlertTriangle,
  Info,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

const typeIcons: Record<NotificationType, typeof Droplets> = {
  low_moisture: Droplets,
  data_updated: RefreshCw,
  system: Settings,
  info: Info,
};

const typeColors: Record<NotificationType, string> = {
  low_moisture: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30',
  data_updated: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  system: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
  info: 'text-gray-500 bg-gray-100 dark:bg-gray-700',
};

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismiss,
    dismissAll,
  } = useNotifications();

  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    permission: pushPermission,
    loading: pushLoading,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
  } = usePushNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowSettings(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleNotificationClick = async (id: string, read_at: string | null) => {
    if (!read_at) {
      await markAsRead([id]);
    }
  };

  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: pl });
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          'text-gray-600 dark:text-gray-400',
          'hover:bg-gray-100 dark:hover:bg-gray-700',
          'focus:outline-none focus:ring-2 focus:ring-blue-500'
        )}
        aria-label={`Powiadomienia${unreadCount > 0 ? ` (${unreadCount} nieprzeczytanych)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-80 sm:w-96',
            'bg-white dark:bg-gray-800',
            'rounded-lg shadow-lg',
            'border border-gray-200 dark:border-gray-700',
            'z-50 overflow-hidden'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Powiadomienia</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  'text-gray-500 dark:text-gray-400',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  showSettings && 'bg-gray-100 dark:bg-gray-700'
                )}
                title="Ustawienia powiadomien"
              >
                <Settings className="h-4 w-4" />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    'text-gray-500 dark:text-gray-400',
                    'hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                  title="Oznacz wszystkie jako przeczytane"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={dismissAll}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    'text-gray-500 dark:text-gray-400',
                    'hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                  title="Usun wszystkie"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Powiadomienia push
              </h4>
              {!pushSupported ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <BellOff className="h-4 w-4" />
                  <span>Powiadomienia push nie sa wspierane w tej przegladarce</span>
                </div>
              ) : pushPermission === 'denied' ? (
                <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Powiadomienia zablokowane. Zmien ustawienia przegladarki.</span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {pushSubscribed ? 'Powiadomienia wlaczone' : 'Wlacz powiadomienia push'}
                  </span>
                  <button
                    onClick={() => (pushSubscribed ? unsubscribePush() : subscribePush())}
                    disabled={pushLoading}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      pushSubscribed
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    )}
                  >
                    {pushLoading ? '...' : pushSubscribed ? 'Wylacz' : 'Wlacz'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin" />
                <p className="text-sm">Ladowanie...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Brak powiadomien</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.map((notification) => {
                  const Icon = typeIcons[notification.type] || Info;
                  const colorClass = typeColors[notification.type] || typeColors.info;
                  const isUnread = !notification.read_at;

                  return (
                    <li
                      key={notification.id}
                      className={cn(
                        'px-4 py-3 transition-colors cursor-pointer',
                        'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                        isUnread && 'bg-blue-50/50 dark:bg-blue-900/10'
                      )}
                      onClick={() => handleNotificationClick(notification.id, notification.read_at)}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={cn('flex-shrink-0 p-2 rounded-lg', colorClass)}>
                          <Icon className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                'text-sm',
                                isUnread
                                  ? 'font-semibold text-gray-900 dark:text-white'
                                  : 'text-gray-700 dark:text-gray-300'
                              )}
                            >
                              {notification.title}
                            </p>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {isUnread && (
                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dismiss([notification.id]);
                                }}
                                className={cn(
                                  'p-1 rounded opacity-0 group-hover:opacity-100',
                                  'hover:bg-gray-200 dark:hover:bg-gray-600',
                                  'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                )}
                                title="Usun"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {formatTime(notification.created_at)}
                            </span>
                            {notification.fields?.name && (
                              <>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                  {notification.fields.name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={fetchNotifications}
                disabled={loading}
                className={cn(
                  'w-full text-center text-sm text-blue-600 dark:text-blue-400',
                  'hover:text-blue-700 dark:hover:text-blue-300',
                  'disabled:opacity-50'
                )}
              >
                {loading ? 'Odswiezanie...' : 'Odswiez'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Export a simpler badge component for use in other places
export function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
      {count > 99 ? '99+' : count}
    </span>
  );
}
