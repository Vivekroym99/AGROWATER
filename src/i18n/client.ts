'use client';

import { useEffect, useState } from 'react';
import { locales, defaultLocale, type Locale } from './config';

/**
 * Get current locale from cookie on client side
 */
export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const match = document.cookie.match(/locale=([^;]+)/);
    const cookieLocale = match?.[1] as Locale;
    if (locales.includes(cookieLocale)) {
      setLocale(cookieLocale);
    }
  }, []);

  return locale;
}

/**
 * Set locale cookie
 */
export function setLocaleCookie(locale: Locale): void {
  document.cookie = `locale=${locale};path=/;max-age=31536000`;
}
