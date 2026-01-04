'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils/cn';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatWaterVolume } from '@/lib/irrigation';
import type { IrrigationRecommendation, ScheduleDay } from '@/lib/irrigation';
import type { IrrigationEvent } from '@/types/database';
import {
  Droplets,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Plus,
  History,
  CloudRain,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface IrrigationPlannerProps {
  fieldId: string;
  className?: string;
}

interface IrrigationData {
  fieldId: string;
  fieldName: string;
  cropType: string;
  areaHectares: number;
  currentMoisture: number;
  recommendation: IrrigationRecommendation;
  suggestedSchedule: ScheduleDay[];
  history: IrrigationEvent[];
  stats: {
    totalWaterThisYear: number;
    irrigationCountThisYear: number;
  };
}

const urgencyColors = {
  none: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const urgencyLabels = {
  none: 'Brak potrzeby',
  low: 'Niska',
  medium: 'Umiarkowana',
  high: 'Wysoka',
  critical: 'Krytyczna',
};

export function IrrigationPlanner({ fieldId, className }: IrrigationPlannerProps) {
  const [data, setData] = useState<IrrigationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state for logging irrigation
  const [formData, setFormData] = useState({
    irrigation_date: new Date().toISOString().split('T')[0],
    water_amount_mm: '',
    duration_minutes: '',
    method: 'manual',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/irrigation/${fieldId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch irrigation data');
      }

      const irrigationData = await response.json();
      setData(irrigationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Irrigation fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fieldId]);

  const handleLogIrrigation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/irrigation/${fieldId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          water_amount_mm: parseFloat(formData.water_amount_mm),
          duration_minutes: formData.duration_minutes
            ? parseInt(formData.duration_minutes)
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log irrigation');
      }

      // Reset form and refresh data
      setFormData({
        irrigation_date: new Date().toISOString().split('T')[0],
        water_amount_mm: '',
        duration_minutes: '',
        method: 'manual',
        notes: '',
      });
      setShowLogForm(false);
      fetchData();
    } catch (err) {
      console.error('Log irrigation error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center h-48">
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex flex-col items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <AlertTriangle className="h-8 w-8 mb-2" />
          <p className="text-sm text-center">{error}</p>
          <button
            onClick={fetchData}
            className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Spróbuj ponownie
          </button>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const { recommendation, suggestedSchedule, history, stats } = data;

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Planowanie nawadniania
            </h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowLogForm(!showLogForm)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Dodaj nawodnienie
          </Button>
        </div>
      </div>

      {/* Log Irrigation Form */}
      {showLogForm && (
        <form
          onSubmit={handleLogIrrigation}
          className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data
              </label>
              <input
                type="date"
                value={formData.irrigation_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, irrigation_date: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ilość wody (mm)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.water_amount_mm}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, water_amount_mm: e.target.value }))
                }
                placeholder={recommendation.waterAmount.toString()}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Czas trwania (min)
              </label>
              <input
                type="number"
                min="0"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, duration_minutes: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Metoda
              </label>
              <select
                value={formData.method}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, method: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="manual">Ręczne</option>
                <option value="sprinkler">Zraszacze</option>
                <option value="drip">Kroplowe</option>
                <option value="flood">Zalewowe</option>
                <option value="other">Inne</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notatki
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Opcjonalne notatki..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? <Spinner size="sm" /> : 'Zapisz'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowLogForm(false)}
            >
              Anuluj
            </Button>
          </div>
        </form>
      )}

      {/* Recommendation */}
      <div className="px-6 py-4">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'p-3 rounded-lg',
              recommendation.urgency === 'none'
                ? 'bg-green-100 dark:bg-green-900/30'
                : recommendation.urgency === 'critical'
                ? 'bg-red-100 dark:bg-red-900/30'
                : 'bg-blue-100 dark:bg-blue-900/30'
            )}
          >
            {recommendation.urgency === 'none' ? (
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            ) : recommendation.urgency === 'critical' ? (
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            ) : (
              <Droplets className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium',
                  urgencyColors[recommendation.urgency]
                )}
              >
                {urgencyLabels[recommendation.urgency]}
              </span>
              {recommendation.nextIrrigationDate && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Następne: {format(recommendation.nextIrrigationDate, 'd MMM', { locale: pl })}
                </span>
              )}
            </div>
            <p className="text-gray-700 dark:text-gray-300">{recommendation.message}</p>
            {recommendation.needsIrrigation && (
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  <strong>{recommendation.waterAmount} mm</strong> ({formatWaterVolume(recommendation.waterVolume)})
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  Deficyt: <strong>{Math.round(recommendation.factors.deficit * 100)}%</strong>
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  Dzienna potrzeba: <strong>{recommendation.factors.dailyNeed} mm/dzien</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7-day Schedule */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Harmonogram 7 dni
        </h4>
        <div className="grid grid-cols-7 gap-2">
          {suggestedSchedule.map((day, index) => (
            <div
              key={index}
              className={cn(
                'p-2 rounded-lg text-center text-sm',
                day.recommended
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  : 'bg-gray-50 dark:bg-gray-800'
              )}
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {format(day.date, 'EEE', { locale: pl })}
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {format(day.date, 'd', { locale: pl })}
              </p>
              {day.recommended ? (
                <div className="mt-1">
                  <Droplets className="h-4 w-4 mx-auto text-blue-500" />
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    {day.waterAmount} mm
                  </p>
                </div>
              ) : day.weatherNote ? (
                <div className="mt-1">
                  <CloudRain className="h-4 w-4 mx-auto text-gray-400" />
                </div>
              ) : (
                <div className="mt-1 h-9" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Ten rok: </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats.totalWaterThisYear} mm
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Nawodnien: </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats.irrigationCountThisYear}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <History className="h-4 w-4" />
            Historia
            {showHistory ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* History */}
      {showHistory && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Ostatnie nawodnienia
          </h4>
          {history.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Brak zapisanych nawodnień
            </p>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {format(parseISO(event.irrigation_date), 'd MMMM yyyy', { locale: pl })}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {event.method === 'manual'
                          ? 'Ręczne'
                          : event.method === 'sprinkler'
                          ? 'Zraszacze'
                          : event.method === 'drip'
                          ? 'Kroplowe'
                          : event.method}
                        {event.duration_minutes && ` • ${event.duration_minutes} min`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {event.water_amount_mm} mm
                    </p>
                    {event.water_volume_liters && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatWaterVolume(event.water_volume_liters)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
