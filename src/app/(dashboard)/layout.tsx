'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils/cn';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { NotificationCenter } from '@/components/ui/NotificationCenter';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import {
  Droplets,
  LayoutDashboard,
  Map,
  PlusCircle,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, profile, loading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = useTranslations('nav');

  const navigation: NavItem[] = [
    { name: t('dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('fields'), href: '/fields', icon: Map },
    { name: t('addField'), href: '/fields/new', icon: PlusCircle },
    { name: t('settings'), href: '/settings', icon: Settings },
  ];

  if (loading) {
    return <FullPageSpinner />;
  }

  if (!user) {
    return null; // Middleware will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <Droplets className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">AgroWater</span>
            <button
              className="ml-auto lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Notifications, Theme & Language */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('notifications')}</span>
              <NotificationCenter />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('theme')}</span>
              <ThemeToggle variant="dropdown" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('language')}</span>
              <LanguageSwitcher />
            </div>
          </div>

          {/* User section */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="text-blue-700 dark:text-blue-300 font-medium">
                  {profile?.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {profile?.full_name || t('user')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {t('logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="flex items-center gap-2">
              <Droplets className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-gray-900 dark:text-white">AgroWater</span>
            </div>
            <div className="flex items-center gap-1">
              <NotificationCenter />
              <ThemeToggle variant="icon" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
