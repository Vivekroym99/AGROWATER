'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  UI_TEXT,
  CROP_TYPES,
  CROP_MOISTURE_THRESHOLDS,
  CROP_RECOMMENDATION_TEXT,
  getRecommendedThreshold,
  getThresholdRangeText,
  getCropLabel,
} from '@/lib/constants';
import type { GeoJSONPolygon } from '@/types/database';

const fieldSchema = z.object({
  name: z.string().min(1, UI_TEXT.errors.required),
  crop_type: z.string().optional(),
  alert_threshold: z.number().min(0.1).max(0.5),
  alerts_enabled: z.boolean(),
});

export type FieldFormData = z.infer<typeof fieldSchema>;

interface FieldFormProps {
  initialData?: Partial<FieldFormData>;
  polygon: GeoJSONPolygon | null;
  onSubmit: (data: FieldFormData) => void;
  onCancel?: () => void;
  loading?: boolean;
  submitLabel?: string;
}

export function FieldForm({
  initialData,
  polygon,
  onSubmit,
  onCancel,
  loading,
  submitLabel = UI_TEXT.fields.save,
}: FieldFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FieldFormData>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      name: initialData?.name || '',
      crop_type: initialData?.crop_type || '',
      alert_threshold: initialData?.alert_threshold || 0.3,
      alerts_enabled: initialData?.alerts_enabled ?? true,
    },
  });

  const alertThreshold = watch('alert_threshold');
  const cropType = watch('crop_type');
  const hasPolygon = polygon !== null;

  // Get crop recommendation info
  const recommendedThreshold = getRecommendedThreshold(cropType);
  const thresholdRange = getThresholdRangeText(cropType);
  const cropLabel = getCropLabel(cropType);
  const cropThresholds = cropType ? CROP_MOISTURE_THRESHOLDS[cropType] : null;

  // Get sensitivity label
  const getSensitivityLabel = (sensitivity: string | undefined): string => {
    switch (sensitivity) {
      case 'very_high': return CROP_RECOMMENDATION_TEXT.sensitivityVeryHigh;
      case 'high': return CROP_RECOMMENDATION_TEXT.sensitivityHigh;
      case 'medium': return CROP_RECOMMENDATION_TEXT.sensitivityMedium;
      case 'low': return CROP_RECOMMENDATION_TEXT.sensitivityLow;
      default: return CROP_RECOMMENDATION_TEXT.sensitivityDefault;
    }
  };

  // Handler to apply recommended threshold
  const handleApplyRecommended = () => {
    setValue('alert_threshold', recommendedThreshold, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Polygon status */}
      <div className={`p-3 rounded-lg ${hasPolygon ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
        {hasPolygon ? (
          <p className="text-sm font-medium">Granica pola narysowana</p>
        ) : (
          <p className="text-sm font-medium">{UI_TEXT.map.drawBoundary}</p>
        )}
      </div>

      {/* Field name */}
      <Input
        label={UI_TEXT.fields.name}
        placeholder={UI_TEXT.fields.namePlaceholder}
        error={errors.name?.message}
        required
        {...register('name')}
      />

      {/* Crop type */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {UI_TEXT.fields.cropType}
        </label>
        <select
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          {...register('crop_type')}
        >
          <option value="">{UI_TEXT.fields.selectCrop}</option>
          {CROP_TYPES.map((crop) => (
            <option key={crop.value} value={crop.value}>
              {crop.label}
            </option>
          ))}
        </select>
      </div>

      {/* Alert threshold slider */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {UI_TEXT.alerts.threshold}
        </label>
        <p className="text-xs text-gray-500 mb-2">
          {UI_TEXT.alerts.thresholdDesc}
        </p>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0.1"
            max="0.5"
            step="0.01"
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            {...register('alert_threshold', { valueAsNumber: true })}
          />
          <span className="w-16 text-center font-medium text-gray-900">
            {Math.round(alertThreshold * 100)}%
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>10%</span>
          <span>50%</span>
        </div>
      </div>

      {/* Crop-specific recommendation */}
      {cropType && thresholdRange && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">
                {CROP_RECOMMENDATION_TEXT.recommended} {cropLabel}: {thresholdRange}
              </p>
              {cropThresholds && (
                <p className="text-xs text-blue-600 mt-0.5">
                  {CROP_RECOMMENDATION_TEXT.sensitivityLabel}: {getSensitivityLabel(cropThresholds.sensitivity)}
                </p>
              )}
              <button
                type="button"
                onClick={handleApplyRecommended}
                className="mt-2 text-sm font-medium text-blue-700 hover:text-blue-800 underline"
              >
                {CROP_RECOMMENDATION_TEXT.applyRecommended}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts enabled checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="alerts_enabled"
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          {...register('alerts_enabled')}
        />
        <label htmlFor="alerts_enabled" className="text-sm text-gray-700">
          {UI_TEXT.alerts.enable}
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          className="flex-1"
          loading={loading}
          disabled={!hasPolygon || loading}
        >
          {submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {UI_TEXT.common.cancel}
          </Button>
        )}
      </div>
    </form>
  );
}
