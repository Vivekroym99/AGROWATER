import type { MoistureReading } from '@/types/database';

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
  avgMoisture: number;
  minMoisture: number;
  maxMoisture: number;
  volatility: number;
  daysAboveThreshold: number;
  daysBelowThreshold: number;
  prediction: number;
}

/**
 * Analyze moisture trend from readings
 * @param readings Array of moisture readings
 * @param threshold Alert threshold for moisture level
 * @returns Trend analysis or null if insufficient data
 */
export function analyzeTrend(readings: MoistureReading[], threshold: number): TrendAnalysis | null {
  if (readings.length < 2) return null;

  const moistureValues = readings.map(r => r.moisture_index);
  const sortedByDate = [...readings].sort(
    (a, b) => new Date(a.observation_date).getTime() - new Date(b.observation_date).getTime()
  );

  // Calculate basic stats
  const avgMoisture = moistureValues.reduce((a, b) => a + b, 0) / moistureValues.length;
  const minMoisture = Math.min(...moistureValues);
  const maxMoisture = Math.max(...moistureValues);

  // Calculate volatility (standard deviation)
  const variance = moistureValues.reduce((sum, val) => sum + Math.pow(val - avgMoisture, 2), 0) / moistureValues.length;
  const volatility = Math.sqrt(variance);

  // Calculate trend using linear regression
  const n = sortedByDate.length;
  const xMean = (n - 1) / 2;
  const yMean = avgMoisture;

  let numerator = 0;
  let denominator = 0;

  sortedByDate.forEach((reading, i) => {
    numerator += (i - xMean) * (reading.moisture_index - yMean);
    denominator += Math.pow(i - xMean, 2);
  });

  const slope = denominator !== 0 ? numerator / denominator : 0;

  // Determine direction
  let direction: 'up' | 'down' | 'stable' = 'stable';
  if (slope > 0.005) direction = 'up';
  else if (slope < -0.005) direction = 'down';

  // Calculate change percent (first vs last reading)
  const firstReading = sortedByDate[0].moisture_index;
  const lastReading = sortedByDate[sortedByDate.length - 1].moisture_index;
  const changePercent = firstReading !== 0 ? ((lastReading - firstReading) / firstReading) * 100 : 0;

  // Count days above/below threshold
  const daysAboveThreshold = readings.filter(r => r.moisture_index >= threshold).length;
  const daysBelowThreshold = readings.filter(r => r.moisture_index < threshold).length;

  // Simple prediction (linear extrapolation for next reading)
  const prediction = Math.max(0, Math.min(1, lastReading + slope));

  return {
    direction,
    changePercent,
    avgMoisture,
    minMoisture,
    maxMoisture,
    volatility,
    daysAboveThreshold,
    daysBelowThreshold,
    prediction,
  };
}
