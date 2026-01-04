import { describe, it, expect } from 'vitest';
import { analyzeTrend } from './trend';
import type { MoistureReading } from '@/types/database';

function createReading(date: string, moisture: number): MoistureReading {
  return {
    id: `r-${date}`,
    field_id: 'field-1',
    observation_date: date,
    moisture_index: moisture,
    vv_backscatter: -14,
    vh_backscatter: -18,
    source: 'sentinel1',
    processed_at: `${date}T12:00:00Z`,
    created_at: `${date}T12:00:00Z`,
  };
}

describe('analyzeTrend', () => {
  describe('basic validation', () => {
    it('should return null for empty readings', () => {
      expect(analyzeTrend([], 0.3)).toBeNull();
    });

    it('should return null for single reading', () => {
      const readings = [createReading('2024-01-15', 0.5)];
      expect(analyzeTrend(readings, 0.3)).toBeNull();
    });

    it('should return analysis for two readings', () => {
      const readings = [
        createReading('2024-01-14', 0.4),
        createReading('2024-01-15', 0.5),
      ];
      const result = analyzeTrend(readings, 0.3);
      expect(result).not.toBeNull();
    });
  });

  describe('statistical calculations', () => {
    it('should calculate correct average', () => {
      const readings = [
        createReading('2024-01-13', 0.4),
        createReading('2024-01-14', 0.5),
        createReading('2024-01-15', 0.6),
      ];
      const result = analyzeTrend(readings, 0.3);
      expect(result!.avgMoisture).toBe(0.5);
    });

    it('should calculate correct min and max', () => {
      const readings = [
        createReading('2024-01-13', 0.3),
        createReading('2024-01-14', 0.5),
        createReading('2024-01-15', 0.7),
      ];
      const result = analyzeTrend(readings, 0.3);
      expect(result!.minMoisture).toBe(0.3);
      expect(result!.maxMoisture).toBe(0.7);
    });

    it('should calculate volatility (standard deviation)', () => {
      // All same values = 0 volatility
      const readings = [
        createReading('2024-01-13', 0.5),
        createReading('2024-01-14', 0.5),
        createReading('2024-01-15', 0.5),
      ];
      const result = analyzeTrend(readings, 0.3);
      expect(result!.volatility).toBe(0);
    });

    it('should calculate non-zero volatility for varying values', () => {
      const readings = [
        createReading('2024-01-13', 0.3),
        createReading('2024-01-14', 0.5),
        createReading('2024-01-15', 0.7),
      ];
      const result = analyzeTrend(readings, 0.3);
      expect(result!.volatility).toBeGreaterThan(0);
    });
  });

  describe('trend direction detection', () => {
    it('should detect upward trend', () => {
      const readings = [
        createReading('2024-01-10', 0.2),
        createReading('2024-01-11', 0.3),
        createReading('2024-01-12', 0.4),
        createReading('2024-01-13', 0.5),
        createReading('2024-01-14', 0.6),
        createReading('2024-01-15', 0.7),
      ];
      const result = analyzeTrend(readings, 0.3);
      expect(result!.direction).toBe('up');
    });

    it('should detect downward trend', () => {
      const readings = [
        createReading('2024-01-10', 0.7),
        createReading('2024-01-11', 0.6),
        createReading('2024-01-12', 0.5),
        createReading('2024-01-13', 0.4),
        createReading('2024-01-14', 0.3),
        createReading('2024-01-15', 0.2),
      ];
      const result = analyzeTrend(readings, 0.3);
      expect(result!.direction).toBe('down');
    });

    it('should detect stable trend', () => {
      const readings = [
        createReading('2024-01-13', 0.5),
        createReading('2024-01-14', 0.501),
        createReading('2024-01-15', 0.499),
        createReading('2024-01-16', 0.5),
      ];
      const result = analyzeTrend(readings, 0.3);
      expect(result!.direction).toBe('stable');
    });

    it('should handle unsorted readings', () => {
      // Readings are out of order but should still detect upward trend
      const readings = [
        createReading('2024-01-15', 0.7),
        createReading('2024-01-10', 0.2),
        createReading('2024-01-12', 0.4),
        createReading('2024-01-13', 0.5),
      ];
      const result = analyzeTrend(readings, 0.3);
      expect(result!.direction).toBe('up');
    });
  });

  describe('change percent calculation', () => {
    it('should calculate positive change percent', () => {
      const readings = [
        createReading('2024-01-14', 0.4),
        createReading('2024-01-15', 0.6),
      ];
      const result = analyzeTrend(readings, 0.3);
      // (0.6 - 0.4) / 0.4 * 100 = 50%
      expect(result!.changePercent).toBeCloseTo(50, 5);
    });

    it('should calculate negative change percent', () => {
      const readings = [
        createReading('2024-01-14', 0.6),
        createReading('2024-01-15', 0.3),
      ];
      const result = analyzeTrend(readings, 0.3);
      // (0.3 - 0.6) / 0.6 * 100 = -50%
      expect(result!.changePercent).toBeCloseTo(-50, 5);
    });

    it('should handle zero first reading', () => {
      const readings = [
        createReading('2024-01-14', 0),
        createReading('2024-01-15', 0.5),
      ];
      const result = analyzeTrend(readings, 0.3);
      expect(result!.changePercent).toBe(0); // Avoid division by zero
    });
  });

  describe('threshold analysis', () => {
    it('should count days above threshold', () => {
      const readings = [
        createReading('2024-01-13', 0.2), // below 0.3
        createReading('2024-01-14', 0.4), // above 0.3
        createReading('2024-01-15', 0.5), // above 0.3
      ];
      const result = analyzeTrend(readings, 0.3);
      expect(result!.daysAboveThreshold).toBe(2);
      expect(result!.daysBelowThreshold).toBe(1);
    });

    it('should count threshold boundary correctly (>= threshold)', () => {
      const readings = [
        createReading('2024-01-14', 0.3), // exactly at threshold
        createReading('2024-01-15', 0.3),
      ];
      const result = analyzeTrend(readings, 0.3);
      expect(result!.daysAboveThreshold).toBe(2);
      expect(result!.daysBelowThreshold).toBe(0);
    });

    it('should handle all readings below threshold', () => {
      const readings = [
        createReading('2024-01-14', 0.1),
        createReading('2024-01-15', 0.2),
      ];
      const result = analyzeTrend(readings, 0.3);
      expect(result!.daysAboveThreshold).toBe(0);
      expect(result!.daysBelowThreshold).toBe(2);
    });
  });

  describe('prediction', () => {
    it('should predict higher value for upward trend', () => {
      const readings = [
        createReading('2024-01-12', 0.4),
        createReading('2024-01-13', 0.5),
        createReading('2024-01-14', 0.6),
        createReading('2024-01-15', 0.7),
      ];
      const result = analyzeTrend(readings, 0.3);
      expect(result!.prediction).toBeGreaterThan(0.7);
    });

    it('should predict lower value for downward trend', () => {
      const readings = [
        createReading('2024-01-12', 0.7),
        createReading('2024-01-13', 0.6),
        createReading('2024-01-14', 0.5),
        createReading('2024-01-15', 0.4),
      ];
      const result = analyzeTrend(readings, 0.3);
      expect(result!.prediction).toBeLessThan(0.4);
    });

    it('should clamp prediction to valid range [0, 1]', () => {
      // Strong upward trend from high value
      const readings = [
        createReading('2024-01-14', 0.8),
        createReading('2024-01-15', 0.95),
      ];
      const result = analyzeTrend(readings, 0.3);
      expect(result!.prediction).toBeLessThanOrEqual(1);
      expect(result!.prediction).toBeGreaterThanOrEqual(0);
    });

    it('should clamp prediction minimum to 0', () => {
      // Strong downward trend from low value
      const readings = [
        createReading('2024-01-14', 0.15),
        createReading('2024-01-15', 0.05),
      ];
      const result = analyzeTrend(readings, 0.3);
      expect(result!.prediction).toBeGreaterThanOrEqual(0);
    });
  });
});
