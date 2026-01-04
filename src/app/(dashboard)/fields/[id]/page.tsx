'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useField, useFields } from '@/hooks/useFields';
import { useMoistureHistory } from '@/hooks/useMoistureHistory';
import { MoistureChart, formatChartData, TimeRangeSelector } from '@/components/charts';
import type { TimeRange } from '@/components/charts';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { UI_TEXT, STATUS_COLORS, CROP_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils/cn';

export default function FieldDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fieldId = params.id as string;

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
          {fieldError || UI_TEXT.errors.notFound}
        </div>
        <Link href="/fields" className="text-green-600 hover:underline mt-4 inline-block">
          {UI_TEXT.fields.back}
        </Link>
      </div>
    );
  }

  const statusColors = STATUS_COLORS[field.status];
  const cropLabel = CROP_TYPES.find((c) => c.value === field.crop_type)?.label || field.crop_type;
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
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            &larr; {UI_TEXT.fields.back}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{field.name}</h1>
          <p className="text-gray-600 mt-1">
            {cropLabel && <span>{cropLabel} &bull; </span>}
            {field.area_hectares?.toFixed(2)} {UI_TEXT.common.hectares}
            {field.last_reading_date && (
              <span>
                {' '}
                &bull; {UI_TEXT.moisture.lastUpdate}:{' '}
                {format(parseISO(field.last_reading_date), 'd MMM yyyy', { locale: pl })}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFetchMoisture}
            disabled={fetchingMoisture}
          >
            {fetchingMoisture ? <Spinner size="sm" /> : 'Odśwież dane'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            {UI_TEXT.fields.delete}
          </Button>
        </div>
      </div>

      {/* Current Status */}
      <div className={cn('rounded-lg p-6', statusColors.bg)}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{UI_TEXT.moisture.current}</p>
            <p className={cn('text-4xl font-bold mt-1', statusColors.text)}>
              {field.current_moisture !== null
                ? `${Math.round(field.current_moisture * 100)}%`
                : UI_TEXT.moisture.noData}
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
            {UI_TEXT.status[field.status]}
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          {UI_TEXT.status[`${field.status}Desc` as keyof typeof UI_TEXT.status]}
        </p>
      </div>

      {/* Moisture Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{UI_TEXT.moisture.history}</h2>
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

      {/* Alert Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{UI_TEXT.alerts.settings}</h2>

        <div className="space-y-4">
          {/* Enable alerts toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={alertSettings.alerts_enabled}
              onChange={(e) =>
                setAlertSettings((prev) => ({ ...prev, alerts_enabled: e.target.checked }))
              }
              className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-gray-700">{UI_TEXT.alerts.enable}</span>
          </label>

          {/* Threshold slider */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-600">
              {UI_TEXT.alerts.thresholdDesc}{' '}
              <span className="font-semibold text-gray-900">
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
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>10%</span>
              <span>50%</span>
            </div>
          </div>

          <Button
            onClick={handleSaveAlertSettings}
            disabled={savingAlerts}
            size="sm"
          >
            {savingAlerts ? <Spinner size="sm" /> : UI_TEXT.common.save}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {UI_TEXT.fields.confirmDelete}
            </h3>
            <p className="text-gray-600 mb-4">
              Pole &quot;{field.name}&quot; zostanie usunięte wraz ze wszystkimi danymi.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {UI_TEXT.common.cancel}
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <Spinner size="sm" /> : UI_TEXT.common.delete}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
