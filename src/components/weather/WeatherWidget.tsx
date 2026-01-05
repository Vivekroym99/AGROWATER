'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from '@/i18n';
import { cn } from '@/lib/utils/cn';
import { Card } from '@/components/ui/Card';
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  Wind,
  Droplets,
  Thermometer,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type { WeatherData } from '@/lib/weather';

interface WeatherWidgetProps {
  fieldId: string;
  className?: string;
}

interface WeatherResponse {
  fieldId: string;
  fieldName: string;
  weather: WeatherData;
  moistureImpact: {
    impact: 'increasing' | 'decreasing' | 'stable';
    factor: number;
    reasons: string[];
  };
  configured: boolean;
  cached?: boolean;
}

// Map weather condition codes to icons
function getWeatherIcon(conditionId: number, className?: string) {
  // Thunderstorm: 2xx, Drizzle: 3xx, Rain: 5xx, Snow: 6xx, Atmosphere: 7xx, Clear: 800, Clouds: 80x
  if (conditionId >= 200 && conditionId < 600) {
    return <CloudRain className={className} />;
  } else if (conditionId >= 600 && conditionId < 700) {
    return <CloudSnow className={className} />;
  } else if (conditionId === 800) {
    return <Sun className={className} />;
  } else {
    return <Cloud className={className} />;
  }
}

function formatTime(timestamp: number, locale: string): string {
  return new Date(timestamp * 1000).toLocaleTimeString(locale === 'pl' ? 'pl-PL' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDay(timestamp: number, locale: string): string {
  return new Date(timestamp * 1000).toLocaleDateString(locale === 'pl' ? 'pl-PL' : 'en-US', {
    weekday: 'short',
  });
}

// Loading skeleton component
function WeatherSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header skeleton */}
      <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-white/30 rounded animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="h-10 w-20 bg-white/30 rounded animate-pulse" />
              <div className="h-10 w-10 bg-white/30 rounded-full animate-pulse" />
            </div>
            <div className="h-4 w-32 bg-white/30 rounded animate-pulse" />
          </div>
          <div className="space-y-2 text-right">
            <div className="h-3 w-24 bg-white/30 rounded animate-pulse ml-auto" />
            <div className="h-3 w-20 bg-white/30 rounded animate-pulse ml-auto" />
            <div className="h-3 w-20 bg-white/30 rounded animate-pulse ml-auto" />
          </div>
        </div>

        {/* Weather details skeleton */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/20">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="h-5 w-5 bg-white/30 rounded mx-auto animate-pulse" />
              <div className="h-5 w-12 bg-white/30 rounded mx-auto animate-pulse" />
              <div className="h-3 w-16 bg-white/30 rounded mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Moisture impact skeleton */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-48 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
            <div className="h-3 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* 5-day forecast skeleton */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded mb-3 animate-pulse" />
        <div className="grid grid-cols-5 gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-2">
              <div className="h-3 w-8 bg-gray-300 dark:bg-gray-600 rounded mx-auto animate-pulse" />
              <div className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded mx-auto animate-pulse" />
              <div className="h-4 w-8 bg-gray-300 dark:bg-gray-600 rounded mx-auto animate-pulse" />
              <div className="h-3 w-6 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function getWindDirection(deg: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}

export function WeatherWidget({ fieldId, className }: WeatherWidgetProps) {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('weather');
  const locale = useLocale();

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/weather/${fieldId}`);

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.configured === false) {
          setError(t('notConfigured'));
        } else {
          setError(errorData.error || t('fetchError'));
        }
        return;
      }

      const weatherData = await response.json();
      setData(weatherData);
    } catch (err) {
      setError(t('fetchError'));
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fieldId]);

  if (loading) {
    return <WeatherSkeleton className={className} />;
  }

  if (error) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex flex-col items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p className="text-sm text-center">{error}</p>
          <button
            onClick={fetchWeather}
            className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            {t('fetchError') === error ? t('fetchError') : t('fetchError')}
          </button>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const { weather, moistureImpact } = data;
  const current = weather.current;

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header with current weather */}
      <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-80">{weather.location.name}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-4xl font-bold">{Math.round(current.temp)}°C</span>
              {getWeatherIcon(current.weather.id, 'h-10 w-10')}
            </div>
            <p className="text-sm mt-1 capitalize">{current.weather.description}</p>
          </div>
          <div className="text-right text-sm opacity-80">
            <p>{t('temperature')}: {Math.round(current.feels_like)}°C</p>
            <p className="mt-1">
              {t('sunrise')}: {formatTime(current.sunrise, locale)}
            </p>
            <p>{t('sunset')}: {formatTime(current.sunset, locale)}</p>
          </div>
        </div>

        {/* Weather details */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/20">
          <div className="text-center">
            <Droplets className="h-5 w-5 mx-auto opacity-80" />
            <p className="text-lg font-semibold mt-1">{current.humidity}%</p>
            <p className="text-xs opacity-80">{t('humidity')}</p>
          </div>
          <div className="text-center">
            <Wind className="h-5 w-5 mx-auto opacity-80" />
            <p className="text-lg font-semibold mt-1">{current.wind_speed.toFixed(1)} m/s</p>
            <p className="text-xs opacity-80">{getWindDirection(current.wind_deg)}</p>
          </div>
          <div className="text-center">
            <Cloud className="h-5 w-5 mx-auto opacity-80" />
            <p className="text-lg font-semibold mt-1">{current.clouds}%</p>
            <p className="text-xs opacity-80">{t('clouds')}</p>
          </div>
          <div className="text-center">
            <Thermometer className="h-5 w-5 mx-auto opacity-80" />
            <p className="text-lg font-semibold mt-1">{current.pressure}</p>
            <p className="text-xs opacity-80">{t('pressure')}</p>
          </div>
        </div>
      </div>

      {/* Moisture Impact */}
      <div
        className={cn(
          'px-6 py-4 flex items-center gap-3',
          moistureImpact.impact === 'increasing' && 'bg-green-50 dark:bg-green-900/20',
          moistureImpact.impact === 'decreasing' && 'bg-orange-50 dark:bg-orange-900/20',
          moistureImpact.impact === 'stable' && 'bg-gray-50 dark:bg-gray-800'
        )}
      >
        {moistureImpact.impact === 'increasing' ? (
          <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
        ) : moistureImpact.impact === 'decreasing' ? (
          <TrendingDown className="h-6 w-6 text-orange-600 dark:text-orange-400 flex-shrink-0" />
        ) : (
          <Minus className="h-6 w-6 text-gray-600 dark:text-gray-400 flex-shrink-0" />
        )}
        <div>
          <p
            className={cn(
              'font-medium',
              moistureImpact.impact === 'increasing' && 'text-green-700 dark:text-green-300',
              moistureImpact.impact === 'decreasing' && 'text-orange-700 dark:text-orange-300',
              moistureImpact.impact === 'stable' && 'text-gray-700 dark:text-gray-300'
            )}
          >
            {t(`moistureImpact.${moistureImpact.impact}`)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {moistureImpact.reasons.slice(0, 2).join(' • ')}
          </p>
        </div>
      </div>

      {/* 5-day forecast */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t('forecast')}
        </h4>
        <div className="grid grid-cols-5 gap-2">
          {weather.daily.map((day) => (
            <div
              key={day.dt}
              className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
            >
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {formatDay(day.dt, locale)}
              </p>
              <div className="my-2">
                {getWeatherIcon(day.weather.id, 'h-6 w-6 mx-auto text-gray-600 dark:text-gray-400')}
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {Math.round(day.temp_max)}°
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {Math.round(day.temp_min)}°
              </p>
              {day.pop > 0.1 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {Math.round(day.pop * 100)}%
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Precipitation info if any */}
      {(current.rain_1h || current.rain_3h || current.snow_1h || current.snow_3h) && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <CloudRain className="h-4 w-4" />
            <span>
              {t('precipitation')}:{' '}
              {current.rain_1h
                ? `${current.rain_1h.toFixed(1)} mm/h`
                : current.rain_3h
                ? `${current.rain_3h.toFixed(1)} mm/3h`
                : current.snow_1h
                ? `${current.snow_1h.toFixed(1)} mm/h`
                : `${current.snow_3h?.toFixed(1)} mm/3h`}
            </span>
          </div>
        </div>
      )}

      {/* Cache indicator */}
      {data.cached && (
        <div className="px-6 pb-4 text-xs text-gray-400 dark:text-gray-500 text-right">
          {t('cached')}
        </div>
      )}
    </Card>
  );
}
