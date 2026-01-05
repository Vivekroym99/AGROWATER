'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Spinner } from '@/components/ui/Spinner';
import type { NDVIReading } from '@/types/database';

// NDVI thresholds for vegetation health
const NDVI_THRESHOLDS = {
  excellent: 0.6,
  good: 0.4,
  moderate: 0.2,
};

// NDVI Chart configuration
const NDVI_CHART_CONFIG = {
  lineColor: '#10B981', // Emerald for vegetation
  excellentColor: 'rgba(16, 185, 129, 0.15)',
  goodColor: 'rgba(34, 197, 94, 0.1)',
  moderateColor: 'rgba(234, 179, 8, 0.1)',
  poorColor: 'rgba(239, 68, 68, 0.1)',
  height: 300,
};

interface NDVIDataPoint {
  date: string;
  ndvi: number;
  formattedDate: string;
}

interface NDVIChartProps {
  data: NDVIDataPoint[];
  loading?: boolean;
  height?: number;
}

export function NDVIChart({
  data,
  loading = false,
  height = NDVI_CHART_CONFIG.height,
}: NDVIChartProps) {
  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg"
        style={{ height }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400"
        style={{ height }}
      >
        Brak danych NDVI do wyswietlenia
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

        {/* NDVI zone backgrounds */}
        <ReferenceArea
          y1={NDVI_THRESHOLDS.excellent}
          y2={1}
          fill={NDVI_CHART_CONFIG.excellentColor}
          fillOpacity={1}
        />
        <ReferenceArea
          y1={NDVI_THRESHOLDS.good}
          y2={NDVI_THRESHOLDS.excellent}
          fill={NDVI_CHART_CONFIG.goodColor}
          fillOpacity={1}
        />
        <ReferenceArea
          y1={NDVI_THRESHOLDS.moderate}
          y2={NDVI_THRESHOLDS.good}
          fill={NDVI_CHART_CONFIG.moderateColor}
          fillOpacity={1}
        />
        <ReferenceArea
          y1={-0.2}
          y2={NDVI_THRESHOLDS.moderate}
          fill={NDVI_CHART_CONFIG.poorColor}
          fillOpacity={1}
        />

        <XAxis
          dataKey="formattedDate"
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#9ca3af' }}
          axisLine={{ stroke: '#9ca3af' }}
        />

        <YAxis
          domain={[-0.2, 1]}
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#9ca3af' }}
          axisLine={{ stroke: '#9ca3af' }}
          tickFormatter={(value) => value.toFixed(1)}
        />

        <Tooltip content={<NDVITooltip />} />

        {/* Reference lines for thresholds */}
        <ReferenceLine
          y={NDVI_THRESHOLDS.excellent}
          stroke="#10B981"
          strokeDasharray="5 5"
          strokeWidth={1}
        />
        <ReferenceLine
          y={NDVI_THRESHOLDS.good}
          stroke="#22C55E"
          strokeDasharray="5 5"
          strokeWidth={1}
        />
        <ReferenceLine
          y={NDVI_THRESHOLDS.moderate}
          stroke="#EAB308"
          strokeDasharray="5 5"
          strokeWidth={1}
        />

        {/* NDVI line */}
        <Line
          type="monotone"
          dataKey="ndvi"
          stroke={NDVI_CHART_CONFIG.lineColor}
          strokeWidth={2}
          dot={{ fill: NDVI_CHART_CONFIG.lineColor, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface NDVITooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: NDVIDataPoint;
  }>;
}

function NDVITooltip({ active, payload }: NDVITooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;
  const ndvi = data.ndvi;

  // Determine status
  let status = 'Doskonaly';
  let statusColor = 'text-emerald-600';
  if (ndvi < NDVI_THRESHOLDS.moderate) {
    status = 'Slaby';
    statusColor = 'text-red-600';
  } else if (ndvi < NDVI_THRESHOLDS.good) {
    status = 'Umiarkowany';
    statusColor = 'text-yellow-600';
  } else if (ndvi < NDVI_THRESHOLDS.excellent) {
    status = 'Dobry';
    statusColor = 'text-green-600';
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
        {data.formattedDate}
      </p>
      <p className="text-lg font-semibold text-gray-900 dark:text-white">
        NDVI: {ndvi.toFixed(3)}
      </p>
      <p className={`text-sm font-medium ${statusColor}`}>{status}</p>
    </div>
  );
}

/**
 * Format NDVI reading data for the chart
 */
export function formatNDVIChartData(readings: NDVIReading[]): NDVIDataPoint[] {
  return readings
    .filter((r) => r.ndvi_mean !== null)
    .map((r) => ({
      date: r.observation_date,
      ndvi: r.ndvi_mean!,
      formattedDate: format(parseISO(r.observation_date), 'd MMM', {
        locale: pl,
      }),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
