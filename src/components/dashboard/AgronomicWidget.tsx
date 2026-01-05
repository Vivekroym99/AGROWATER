'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils/cn';

interface GDDData {
  gdd: number;
  tempSum: number;
  daysCount: number;
  startDate: string;
  endDate: string;
}

interface PrecipitationData {
  totalMm: number;
  daysCount: number;
  startDate: string;
  endDate: string;
}

interface SoilData {
  moisture: number | null;
  tempSurface: number | null;
  temp10cm: number | null;
  timestamp: string;
}

interface AgronomicData {
  fieldId: string;
  fieldName: string;
  configured: boolean;
  seasonStart: string;
  gdd: GDDData | null;
  precipitation: PrecipitationData | null;
  soil: SoilData | null;
  hasSoilData: boolean;
  errors: {
    gdd: string | null;
    precipitation: string | null;
    soil: string | null;
  };
}

interface AgronomicWidgetProps {
  fieldId: string;
  className?: string;
}

export function AgronomicWidget({ fieldId, className }: AgronomicWidgetProps) {
  const t = useTranslations();
  const [data, setData] = useState<AgronomicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!fieldId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/agronomic/${fieldId}`);
        const result = await response.json();

        if (!response.ok) {
          if (result.configured === false) {
            setConfigured(false);
            return;
          }
          throw new Error(result.error || 'Failed to fetch agronomic data');
        }

        setConfigured(true);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [fieldId]);

  // Don't render if not configured
  if (!configured) {
    return null;
  }

  if (loading) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6', className)}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('agronomic.title')}
        </h2>
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6', className)}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('agronomic.title')}
        </h2>
        <p className="text-red-500 dark:text-red-400 text-center">{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('agronomic.title')}
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {t('agronomic.seasonStart')}: {data.seasonStart}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* GDD */}
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('agronomic.gdd')}
            </span>
          </div>
          {data.gdd ? (
            <>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {data.gdd.gdd.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('agronomic.gddUnit')}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {data.errors.gdd || t('moisture.noData')}
            </p>
          )}
        </div>

        {/* Precipitation */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('agronomic.precipitation')}
            </span>
          </div>
          {data.precipitation ? (
            <>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {data.precipitation.totalMm.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('agronomic.precipitationUnit')}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {data.errors.precipitation || t('moisture.noData')}
            </p>
          )}
        </div>

        {/* Soil */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('agronomic.soilTemp')}
            </span>
          </div>
          {data.hasSoilData && data.soil ? (
            <>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {data.soil.temp10cm !== null ? `${data.soil.temp10cm}°C` : '-'}
              </p>
              {data.soil.moisture !== null && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('agronomic.soilMoisture')}: {Math.round(data.soil.moisture * 100)}%
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {!data.hasSoilData
                ? t('ndvi.syncRequired')
                : data.errors.soil || t('moisture.noData')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
