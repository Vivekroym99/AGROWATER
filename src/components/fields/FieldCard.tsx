'use client';

import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { UI_TEXT, STATUS_COLORS, CROP_TYPES } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { MoistureStatus } from '@/types/database';

interface FieldCardProps {
  field: {
    id: string;
    name: string;
    area_hectares: number | null;
    crop_type: string | null;
    current_moisture: number | null;
    status: MoistureStatus;
    last_reading_date: string | null;
  };
  onClick: (id: string) => void;
}

export function FieldCard({ field, onClick }: FieldCardProps) {
  const statusColors = STATUS_COLORS[field.status];
  const cropLabel = CROP_TYPES.find((c) => c.value === field.crop_type)?.label;

  const moisturePercent = field.current_moisture !== null
    ? Math.round(field.current_moisture * 100)
    : null;

  const lastUpdate = field.last_reading_date
    ? formatDistanceToNow(new Date(field.last_reading_date), {
        addSuffix: true,
        locale: pl,
      })
    : null;

  return (
    <button
      onClick={() => onClick(field.id)}
      className="w-full text-left bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all overflow-hidden"
    >
      <div className="flex">
        {/* Status color bar */}
        <div className={cn('w-2', statusColors.bg)} style={{ backgroundColor: statusColors.fill }} />

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Field name */}
              <h3 className="font-semibold text-gray-900 truncate">
                {field.name}
              </h3>

              {/* Details row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-600">
                {field.area_hectares && (
                  <span>{field.area_hectares.toFixed(1)} {UI_TEXT.common.hectares}</span>
                )}
                {cropLabel && (
                  <span>{cropLabel}</span>
                )}
              </div>

              {/* Status row */}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    statusColors.bg,
                    statusColors.text
                  )}
                >
                  {UI_TEXT.status[field.status]}
                </span>
                {lastUpdate && (
                  <span className="text-xs text-gray-500">
                    {lastUpdate}
                  </span>
                )}
              </div>
            </div>

            {/* Moisture value and chevron */}
            <div className="flex items-center gap-2 ml-4">
              {moisturePercent !== null ? (
                <span
                  className={cn(
                    'text-2xl font-bold',
                    statusColors.text
                  )}
                >
                  {moisturePercent}%
                </span>
              ) : (
                <span className="text-lg text-gray-400">—</span>
              )}
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
