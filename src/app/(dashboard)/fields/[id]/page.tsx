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
import { MoistureChart, formatChartData, TimeRangeSelector, MoistureAnalysis } from '@/components/charts';
import type { TimeRange } from '@/components/charts';
import type { MoistureReading } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ExportMenu } from '@/components/export';
import { WeatherWidget } from '@/components/weather';
import { IrrigationPlanner } from '@/components/irrigation';
import { STATUS_COLORS } from '@/lib/constants';
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

  const [deleting, setDeleting] = useState(false);
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
