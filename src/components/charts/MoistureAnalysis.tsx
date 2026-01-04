'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus, Droplets, Calendar, BarChart3 } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { analyzeTrend } from '@/lib/analysis/trend';
import type { MoistureReading } from '@/types/database';

interface MoistureAnalysisProps {
  readings: MoistureReading[];
  threshold: number;
  loading?: boolean;
}

function formatChartData(readings: MoistureReading[]) {
  return readings
    .map(reading => ({
      date: reading.observation_date,
      moisture: reading.moisture_index * 100,
      formatted: format(parseISO(reading.observation_date), 'd MMM', { locale: pl }),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function MoistureAnalysis({ readings, threshold, loading }: MoistureAnalysisProps) {
  const analysis = useMemo(() => analyzeTrend(readings, threshold), [readings, threshold]);
  const chartData = useMemo(() => formatChartData(readings), [readings]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!analysis || readings.length < 3) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analiza historyczna</h3>
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Potrzeba minimum 3 odczytow do analizy trendow.</p>
          <p className="text-sm mt-1">Aktualnie: {readings.length} odczytow</p>
        </div>
      </div>
    );
  }

  const TrendIcon = analysis.direction === 'up' ? TrendingUp : analysis.direction === 'down' ? TrendingDown : Minus;
  const trendColor = analysis.direction === 'up' ? 'text-green-600' : analysis.direction === 'down' ? 'text-red-600' : 'text-gray-600';
  const trendBg = analysis.direction === 'up' ? 'bg-green-50' : analysis.direction === 'down' ? 'bg-red-50' : 'bg-gray-50';

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Trend */}
        <div className={`rounded-xl p-4 ${trendBg}`}>
          <div className="flex items-center gap-2 mb-2">
            <TrendIcon className={`h-5 w-5 ${trendColor}`} />
            <span className="text-sm font-medium text-gray-600">Trend</span>
          </div>
          <p className={`text-2xl font-bold ${trendColor}`}>
            {analysis.direction === 'up' ? 'Wzrost' : analysis.direction === 'down' ? 'Spadek' : 'Stabilny'}
          </p>
          <p className="text-sm text-gray-500">
            {analysis.changePercent > 0 ? '+' : ''}{analysis.changePercent.toFixed(1)}% zmiana
          </p>
        </div>

        {/* Average */}
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Srednia</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {(analysis.avgMoisture * 100).toFixed(0)}%
          </p>
          <p className="text-sm text-gray-500">
            Min: {(analysis.minMoisture * 100).toFixed(0)}% / Max: {(analysis.maxMoisture * 100).toFixed(0)}%
          </p>
        </div>

        {/* Days Analysis */}
        <div className="bg-green-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Powyzej progu</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {analysis.daysAboveThreshold}
          </p>
          <p className="text-sm text-gray-500">
            z {readings.length} odczytow
          </p>
        </div>

        {/* Prediction */}
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Prognoza</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {(analysis.prediction * 100).toFixed(0)}%
          </p>
          <p className="text-sm text-gray-500">
            nastepny odczyt
          </p>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Wykres trendu</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="formatted"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload[0]) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-200">
                      <p className="font-medium text-gray-900">{data.formatted}</p>
                      <p className="text-blue-600">Wilgotnosc: {data.moisture.toFixed(1)}%</p>
                    </div>
                  );
                }}
              />
              <ReferenceLine
                y={threshold * 100}
                stroke="#EF4444"
                strokeDasharray="5 5"
                label={{
                  value: `Prog: ${(threshold * 100).toFixed(0)}%`,
                  position: 'right',
                  fill: '#EF4444',
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="moisture"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#moistureGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Wnioski</h3>
        <div className="space-y-3">
          {analysis.direction === 'down' && analysis.daysBelowThreshold > readings.length / 2 && (
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Spadek wilgotnosci</p>
                <p className="text-sm text-red-600">
                  Wilgotnosc spada - rozważ nawadnianie. {analysis.daysBelowThreshold} z {readings.length} odczytow ponizej progu alertu.
                </p>
              </div>
            </div>
          )}

          {analysis.direction === 'up' && (
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Pozytywny trend</p>
                <p className="text-sm text-green-600">
                  Wilgotnosc rosnie - warunki sie poprawiaja.
                </p>
              </div>
            </div>
          )}

          {analysis.volatility > 0.15 && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Wysoka zmiennosc</p>
                <p className="text-sm text-yellow-600">
                  Wilgotnosc gleby znacznie sie waha. Monitoruj czesciej.
                </p>
              </div>
            </div>
          )}

          {analysis.avgMoisture >= threshold && analysis.daysBelowThreshold === 0 && (
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <Droplets className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Optymalna wilgotnosc</p>
                <p className="text-sm text-green-600">
                  Wszystkie odczyty powyzej progu alertu - pole w dobrej kondycji.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
