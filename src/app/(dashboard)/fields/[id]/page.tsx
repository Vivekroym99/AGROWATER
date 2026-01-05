'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { useTranslations } from 'next-intl';
import { useLocale } from '@/i18n';
import { useField, useFields } from '@/hooks/useFields';
import { useMoistureHistory } from '@/hooks/useMoistureHistory';
import { useNDVIHistory } from '@/hooks/useNDVIHistory';
import { MoistureChart, formatChartData, TimeRangeSelector, MoistureAnalysis, NDVIChart, formatNDVIChartData } from '@/components/charts';
import type { TimeRange } from '@/components/charts';
import type { MoistureReading } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ExportMenu } from '@/components/export';
import { WeatherWidget } from '@/components/weather';
import { IrrigationPlanner } from '@/components/irrigation';
import { AgronomicWidget } from '@/components/dashboard/AgronomicWidget';
import { SatelliteMap } from '@/components/map';
import type { GeoJSONPolygon } from '@/types/database';
import {
  STATUS_COLORS,
  NDVI_STATUS_COLORS,
  CROP_MOISTURE_THRESHOLDS,
  CROP_RECOMMENDATION_TEXT,
  getRecommendedThreshold,
  getThresholdRangeText,
} from '@/lib/constants';
import { cn } from '@/lib/utils/cn';

const dateLocales = { pl, en: enUS };

export default function FieldDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fieldId = params.id as string;
  const locale = useLocale();
  const t = useTranslations();

  const { field, loading: fieldLoading, error: fieldError, refetch } = useField(fieldId);
  const { deleteField, updateField } = useFields();
  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const { readings, loading: historyLoading } = useMoistureHistory(fieldId, timeRange);
  const {
    readings: ndviReadings,
    loading: ndviLoading,
    configured: ndviConfigured,
    needsSync,
    syncStatus,
    currentNDVI,
    currentStatus: ndviStatus,
    refetch: refetchNDVI,
  } = useNDVIHistory(fieldId, timeRange);

  const [deleting, setDeleting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fetchingMoisture, setFetchingMoisture] = useState(false);
  const [alertSettings, setAlertSettings] = useState({
    alerts_enabled: field?.alerts_enabled ?? true,
    alert_threshold: field?.alert_threshold ?? 0.3,
  });
  const [savingAlerts, setSavingAlerts] = useState(false);

  const dateLocale = dateLocales[locale as keyof typeof dateLocales] || enUS;

  // Handle delete
  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteField(fieldId);
    if (result.success) {
      router.push('/fields');
    }
    setDeleting(false);
  };

  // Handle manual moisture fetch
  const handleFetchMoisture = async () => {
    setFetchingMoisture(true);
    try {
      const response = await fetch('/api/moisture/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field_id: fieldId, days: 14 }),
      });
      const result = await response.json();
      if (response.ok) {
        refetch();
      } else {
        console.error('Moisture fetch error:', result.error);
      }
    } catch (error) {
      console.error('Moisture fetch failed:', error);
    } finally {
      setFetchingMoisture(false);
    }
  };

  // Handle alert settings save
  const handleSaveAlertSettings = async () => {
    setSavingAlerts(true);
    await updateField(fieldId, {
      alerts_enabled: alertSettings.alerts_enabled,
      alert_threshold: alertSettings.alert_threshold,
    });
    setSavingAlerts(false);
  };

  // Handle Agro API sync
  const handleSyncAgro = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`/api/fields/${fieldId}/sync-agro`, {
        method: 'POST',
      });
      const result = await response.json();
      if (response.ok) {
        refetchNDVI();
      } else {
        console.error('Sync error:', result.error);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Handle Agro API unsync
  const handleUnsyncAgro = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`/api/fields/${fieldId}/sync-agro`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (response.ok) {
        refetchNDVI();
      } else {
        console.error('Unsync error:', result.error);
      }
    } catch (error) {
      console.error('Unsync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (fieldLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (fieldError || !field) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {fieldError || t('errors.notFound')}
        </div>
        <Link href="/fields" className="text-green-600 hover:underline mt-4 inline-block">
          {t('fields.back')}
        </Link>
      </div>
    );
  }

  const statusColors = STATUS_COLORS[field.status];
  const cropLabel = field.crop_type ? t(`crops.${field.crop_type}`) : null;
  const chartData = formatChartData(
    readings.map((r) => ({
      observation_date: r.observation_date,
      moisture_index: r.moisture_index,
    }))
  );
  const ndviChartData = formatNDVIChartData(ndviReadings);
  const ndviStatusColors = NDVI_STATUS_COLORS[ndviStatus] || NDVI_STATUS_COLORS.unknown;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/fields"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-2 inline-block"
          >
            &larr; {t('fields.back')}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{field.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {cropLabel && <span>{cropLabel} &bull; </span>}
            {field.area_hectares?.toFixed(2)} {t('common.hectares')}
            {field.last_reading_date && (
              <span>
                {' '}
                &bull; {t('moisture.lastUpdate')}:{' '}
                {format(parseISO(field.last_reading_date), 'd MMM yyyy', { locale: dateLocale })}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            fields={[field]}
            readings={readings as MoistureReading[]}
            currentField={field}
            variant="compact"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleFetchMoisture}
            disabled={fetchingMoisture}
          >
            {fetchingMoisture ? <Spinner size="sm" /> : t('moisture.refresh')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            {t('fields.delete')}
          </Button>
        </div>
      </div>

      {/* Current Status and Weather - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Status */}
        <div className={cn('rounded-lg p-6', statusColors.bg)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('moisture.current')}</p>
              <p className={cn('text-4xl font-bold mt-1', statusColors.text)}>
                {field.current_moisture !== null
                  ? `${Math.round(field.current_moisture * 100)}%`
                  : t('moisture.noData')}
              </p>
            </div>
            <div
              className={cn(
                'px-4 py-2 rounded-full text-sm font-semibold',
                statusColors.bg,
                statusColors.text,
                'border-2',
                statusColors.border
              )}
            >
              {t(`status.${field.status}`)}
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
            {t(`status.${field.status}Desc`)}
          </p>
        </div>

        {/* Weather Widget */}
        <WeatherWidget fieldId={fieldId} />
      </div>

      {/* Moisture Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('moisture.history')}</h2>
          <TimeRangeSelector
            value={timeRange}
            onChange={setTimeRange}
            disabled={historyLoading}
          />
        </div>
        <MoistureChart
          data={chartData}
          threshold={field.alert_threshold}
          loading={historyLoading}
          height={350}
        />
      </div>

      {/* Historical Analysis */}
      <MoistureAnalysis
        readings={readings as MoistureReading[]}
        threshold={field.alert_threshold}
        loading={historyLoading}
      />

      {/* NDVI Vegetation Index - Only show if Agro API is configured */}
      {ndviConfigured && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('ndvi.title')}
              </h2>
              {currentNDVI !== null && (
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-sm font-medium',
                      ndviStatusColors.bg,
                      ndviStatusColors.text
                    )}
                  >
                    NDVI: {currentNDVI.toFixed(2)} - {t(`ndvi.status.${ndviStatus}`)}
                  </span>
                </div>
              )}
            </div>
            {/* Sync controls */}
            <div className="flex items-center gap-2">
              {needsSync || syncStatus === 'not_synced' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncAgro}
                  disabled={syncing}
                >
                  {syncing ? <Spinner size="sm" /> : t('ndvi.syncButton')}
                </Button>
              ) : syncStatus === 'synced' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUnsyncAgro}
                  disabled={syncing}
                  className="text-gray-500 hover:text-red-500"
                >
                  {syncing ? <Spinner size="sm" /> : t('common.delete')}
                </Button>
              ) : syncStatus === 'pending' ? (
                <span className="text-sm text-yellow-600 dark:text-yellow-400">
                  {t('ndvi.syncPending')}
                </span>
              ) : syncStatus === 'error' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncAgro}
                  disabled={syncing}
                  className="border-red-500 text-red-500"
                >
                  {syncing ? <Spinner size="sm" /> : t('common.tryAgain')}
                </Button>
              ) : null}
            </div>
          </div>
          {syncStatus === 'synced' ? (
            <>
              <NDVIChart
                data={ndviChartData}
                loading={ndviLoading}
                height={300}
              />
              {ndviChartData.length === 0 && !ndviLoading && (
                <p className="text-center text-gray-500 dark:text-gray-400 mt-4 text-sm">
                  {t('ndvi.noData')}
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {t('ndvi.syncRequired')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                {t('ndvi.statusDesc.unknown')}
              </p>
              {!syncing && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSyncAgro}
                >
                  {t('ndvi.syncButton')}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Agronomic Data Widget */}
      <AgronomicWidget fieldId={fieldId} />

      {/* Satellite Imagery Map - Only show if Agro API is configured */}
      {ndviConfigured && (
        <SatelliteMap
          fieldId={fieldId}
          boundary={field.boundary as unknown as GeoJSONPolygon}
          onSyncRequest={handleSyncAgro}
        />
      )}

      {/* Irrigation Planner */}
      <IrrigationPlanner fieldId={fieldId} />

      {/* Alert Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('alerts.settings')}</h2>

        <div className="space-y-4">
          {/* Enable alerts toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={alertSettings.alerts_enabled}
              onChange={(e) =>
                setAlertSettings((prev) => ({ ...prev, alerts_enabled: e.target.checked }))
              }
              className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500 dark:bg-gray-700"
            />
            <span className="text-gray-700 dark:text-gray-300">{t('alerts.enable')}</span>
          </label>

          {/* Threshold slider */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-600 dark:text-gray-400">
              {t('alerts.thresholdDesc')}{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {Math.round(alertSettings.alert_threshold * 100)}%
              </span>
            </label>
            <input
              type="range"
              min="10"
              max="50"
              value={alertSettings.alert_threshold * 100}
              onChange={(e) =>
                setAlertSettings((prev) => ({
                  ...prev,
                  alert_threshold: parseInt(e.target.value) / 100,
                }))
              }
              disabled={!alertSettings.alerts_enabled}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>10%</span>
              <span>50%</span>
            </div>
          </div>

          {/* Crop-specific recommendation */}
          {field.crop_type && getThresholdRangeText(field.crop_type) && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {CROP_RECOMMENDATION_TEXT.recommended} {cropLabel}: {getThresholdRangeText(field.crop_type)}
                  </p>
                  {CROP_MOISTURE_THRESHOLDS[field.crop_type] && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                      {CROP_RECOMMENDATION_TEXT.sensitivityLabel}:{' '}
                      {CROP_MOISTURE_THRESHOLDS[field.crop_type].sensitivity === 'very_high'
                        ? CROP_RECOMMENDATION_TEXT.sensitivityVeryHigh
                        : CROP_MOISTURE_THRESHOLDS[field.crop_type].sensitivity === 'high'
                        ? CROP_RECOMMENDATION_TEXT.sensitivityHigh
                        : CROP_MOISTURE_THRESHOLDS[field.crop_type].sensitivity === 'medium'
                        ? CROP_RECOMMENDATION_TEXT.sensitivityMedium
                        : CROP_MOISTURE_THRESHOLDS[field.crop_type].sensitivity === 'low'
                        ? CROP_RECOMMENDATION_TEXT.sensitivityLow
                        : CROP_RECOMMENDATION_TEXT.sensitivityDefault}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setAlertSettings((prev) => ({
                        ...prev,
                        alert_threshold: getRecommendedThreshold(field.crop_type),
                      }))
                    }
                    disabled={!alertSettings.alerts_enabled}
                    className="mt-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 underline disabled:opacity-50"
                  >
                    {CROP_RECOMMENDATION_TEXT.applyRecommended}
                  </button>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleSaveAlertSettings}
            disabled={savingAlerts}
            size="sm"
          >
            {savingAlerts ? <Spinner size="sm" /> : t('common.save')}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('fields.confirmDelete')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              &quot;{field.name}&quot; {t('fields.deleteWarning')}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <Spinner size="sm" /> : t('common.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
