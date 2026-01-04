'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils/cn';

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown';
  className?: string;
}

export function ThemeToggle({ variant = 'icon', className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
          'dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800',
          className
        )}
        aria-label={resolvedTheme === 'dark' ? 'Wlacz tryb jasny' : 'Wlacz tryb ciemny'}
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>
    );
  }

  return (
    <div className={cn('flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg', className)}>
      <button
        onClick={() => setTheme('light')}
        className={cn(
          'p-2 rounded-md transition-colors',
          theme === 'light'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
        )}
        aria-label="Tryb jasny"
        title="Tryb jasny"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={cn(
          'p-2 rounded-md transition-colors',
          theme === 'system'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
        )}
        aria-label="Tryb systemowy"
        title="Tryb systemowy"
      >
        <Monitor className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          'p-2 rounded-md transition-colors',
          theme === 'dark'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
        )}
        aria-label="Tryb ciemny"
        title="Tryb ciemny"
      >
        <Moon className="h-4 w-4" />
      </button>
    </div>
  );
}
