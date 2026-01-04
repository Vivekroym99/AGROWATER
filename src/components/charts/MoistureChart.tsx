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
import { CHART_CONFIG, MOISTURE_THRESHOLDS } from '@/lib/constants';
import { Spinner } from '@/components/ui/Spinner';

interface MoistureDataPoint {
  date: string;
  moisture: number;
  formattedDate: string;
}

interface MoistureChartProps {
  data: MoistureDataPoint[];
  threshold?: number;
  loading?: boolean;
  height?: number;
}

export function MoistureChart({
  data,
  threshold = 0.3,
  loading = false,
  height = CHART_CONFIG.height,
}: MoistureChartProps) {
  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ height }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg text-gray-500"
        style={{ height }}
      >
        Brak danych do wyświetlenia
      </div>
    );
  }

  // Convert moisture to percentage for display
  const chartData = data.map((d) => ({
    ...d,
    moisturePercent: Math.round(d.moisture * 100),
  }));

  // Threshold in percentage
  const thresholdPercent = threshold * 100;
  const goodThresholdPercent = MOISTURE_THRESHOLDS.good * 100;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

        {/* Optimal zone (green background) */}
        <ReferenceArea
          y1={goodThresholdPercent}
          y2={100}
          fill={CHART_CONFIG.optimalZoneColor}
          fillOpacity={1}
        />

        {/* Danger zone (red background below threshold) */}
        <ReferenceArea
          y1={0}
          y2={thresholdPercent}
          fill="rgba(239, 68, 68, 0.1)"
          fillOpacity={1}
        />

        <XAxis
          dataKey="formattedDate"
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#9ca3af' }}
          axisLine={{ stroke: '#9ca3af' }}
        />

        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#9ca3af' }}
          axisLine={{ stroke: '#9ca3af' }}
          tickFormatter={(value) => `${value}%`}
        />

        <Tooltip content={<CustomTooltip />} />

        {/* Threshold reference line */}
        <ReferenceLine
          y={thresholdPercent}
          stroke={CHART_CONFIG.thresholdColor}
          strokeDasharray="5 5"
          strokeWidth={2}
          label={{
            value: `Próg alertu: ${thresholdPercent}%`,
            position: 'right',
            fill: CHART_CONFIG.thresholdColor,
            fontSize: 11,
          }}
        />

        {/* Moisture line */}
        <Line
          type="monotone"
          dataKey="moisturePercent"
          stroke={CHART_CONFIG.lineColor}
          strokeWidth={2}
          dot={{ fill: CHART_CONFIG.lineColor, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: MoistureDataPoint & { moisturePercent: number };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;
  const moisturePercent = data.moisturePercent;

  // Determine status
  let status = 'Optymalnie';
  let statusColor = 'text-green-600';
  if (moisturePercent < 30) {
    status = 'Uwaga!';
    statusColor = 'text-red-600';
  } else if (moisturePercent < 50) {
    status = 'Monitoruj';
    statusColor = 'text-yellow-600';
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm text-gray-600 mb-1">{data.formattedDate}</p>
      <p className="text-lg font-semibold text-gray-900">
        {moisturePercent}% wilgotności
      </p>
      <p className={`text-sm font-medium ${statusColor}`}>{status}</p>
    </div>
  );
}

/**
 * Format moisture reading data for the chart
 */
export function formatChartData(
  readings: Array<{ observation_date: string; moisture_index: number }>
): MoistureDataPoint[] {
  return readings
    .map((r) => ({
      date: r.observation_date,
      moisture: r.moisture_index,
      formattedDate: format(parseISO(r.observation_date), 'd MMM', {
        locale: pl,
      }),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
