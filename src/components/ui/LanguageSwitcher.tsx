'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';
import { useLocale } from '@/i18n';
import { Globe, Check, ChevronDown } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'buttons';
  className?: string;
}

export function LanguageSwitcher({
  variant = 'dropdown',
  className,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const currentLocale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocaleChange = (locale: Locale) => {
    // Set cookie for locale
    document.cookie = `locale=${locale};path=/;max-age=31536000`;
    setIsOpen(false);
    // Refresh the page to apply new locale
    router.refresh();
  };

  if (variant === 'buttons') {
    return (
      <div className={cn('flex gap-1', className)}>
        {locales.map((locale) => (
          <button
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className={cn(
              'px-2 py-1 rounded text-sm font-medium transition-colors',
              currentLocale === locale
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            {localeFlags[locale]} {locale.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
          'text-gray-700 dark:text-gray-300',
          'hover:bg-gray-100 dark:hover:bg-gray-700',
          'focus:outline-none focus:ring-2 focus:ring-blue-500'
        )}
        aria-label="Change language"
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm">{localeFlags[currentLocale]}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-40',
            'bg-white dark:bg-gray-800',
            'rounded-lg shadow-lg',
            'border border-gray-200 dark:border-gray-700',
            'py-1 z-50'
          )}
        >
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => handleLocaleChange(locale)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2',
                'text-sm transition-colors',
                currentLocale === locale
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <span className="flex items-center gap-2">
                <span>{localeFlags[locale]}</span>
                <span>{localeNames[locale]}</span>
              </span>
              {currentLocale === locale && (
                <Check className="h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
