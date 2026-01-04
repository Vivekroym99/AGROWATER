import { describe, it, expect } from 'vitest';
import { vvToMoistureIndex, calculateMoistureStats, getDateRange } from './moisture';
import type { MoistureResult } from './types';

describe('vvToMoistureIndex', () => {
  it('should return 0 for VV at minimum (-20 dB)', () => {
    expect(vvToMoistureIndex(-20)).toBe(0);
  });

  it('should return 1 for VV at maximum (-8 dB)', () => {
    expect(vvToMoistureIndex(-8)).toBe(1);
  });

  it('should return 0.5 for VV at midpoint (-14 dB)', () => {
    expect(vvToMoistureIndex(-14)).toBe(0.5);
  });

  it('should clamp values below minimum', () => {
    expect(vvToMoistureIndex(-25)).toBe(0);
    expect(vvToMoistureIndex(-100)).toBe(0);
  });

  it('should clamp values above maximum', () => {
    expect(vvToMoistureIndex(-5)).toBe(1);
    expect(vvToMoistureIndex(0)).toBe(1);
  });

  it('should return correct intermediate values', () => {
    // -17 dB is 25% of the way from -20 to -8
    expect(vvToMoistureIndex(-17)).toBe(0.25);
    // -11 dB is 75% of the way
    expect(vvToMoistureIndex(-11)).toBe(0.75);
  });

  it('should round to 3 decimal places', () => {
    const result = vvToMoistureIndex(-15);
    expect(result.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(3);
  });
});

describe('calculateMoistureStats', () => {
  it('should return null for empty readings', () => {
    expect(calculateMoistureStats([])).toBeNull();
  });

  it('should calculate correct stats for single reading', () => {
    const readings: MoistureResult[] = [
      {
        observation_date: '2024-01-15',
        moisture_index: 0.5,
        vv_backscatter: -14,
        vh_backscatter: null,
        source: 'sentinel1',
      },
    ];

    const stats = calculateMoistureStats(readings);
    expect(stats).not.toBeNull();
    expect(stats!.average).toBe(0.5);
    expect(stats!.min).toBe(0.5);
    expect(stats!.max).toBe(0.5);
    expect(stats!.count).toBe(1);
    expect(stats!.trend).toBe('stable');
  });

  it('should calculate correct average, min, max', () => {
    const readings: MoistureResult[] = [
      { observation_date: '2024-01-15', moisture_index: 0.6, vv_backscatter: -13, vh_backscatter: null, source: 'sentinel1' },
      { observation_date: '2024-01-12', moisture_index: 0.4, vv_backscatter: -15, vh_backscatter: null, source: 'sentinel1' },
      { observation_date: '2024-01-10', moisture_index: 0.5, vv_backscatter: -14, vh_backscatter: null, source: 'sentinel1' },
    ];

    const stats = calculateMoistureStats(readings);
    expect(stats!.average).toBe(0.5);
    expect(stats!.min).toBe(0.4);
    expect(stats!.max).toBe(0.6);
    expect(stats!.count).toBe(3);
  });

  it('should detect upward trend', () => {
    const readings: MoistureResult[] = [
      { observation_date: '2024-01-15', moisture_index: 0.8, vv_backscatter: -10, vh_backscatter: null, source: 'sentinel1' },
      { observation_date: '2024-01-12', moisture_index: 0.7, vv_backscatter: -11, vh_backscatter: null, source: 'sentinel1' },
      { observation_date: '2024-01-10', moisture_index: 0.6, vv_backscatter: -12, vh_backscatter: null, source: 'sentinel1' },
      { observation_date: '2024-01-08', moisture_index: 0.3, vv_backscatter: -16, vh_backscatter: null, source: 'sentinel1' },
      { observation_date: '2024-01-05', moisture_index: 0.2, vv_backscatter: -17, vh_backscatter: null, source: 'sentinel1' },
    ];

    const stats = calculateMoistureStats(readings);
    expect(stats!.trend).toBe('up');
  });

  it('should detect downward trend', () => {
    const readings: MoistureResult[] = [
      { observation_date: '2024-01-15', moisture_index: 0.2, vv_backscatter: -17, vh_backscatter: null, source: 'sentinel1' },
      { observation_date: '2024-01-12', moisture_index: 0.3, vv_backscatter: -16, vh_backscatter: null, source: 'sentinel1' },
      { observation_date: '2024-01-10', moisture_index: 0.3, vv_backscatter: -16, vh_backscatter: null, source: 'sentinel1' },
      { observation_date: '2024-01-08', moisture_index: 0.7, vv_backscatter: -11, vh_backscatter: null, source: 'sentinel1' },
      { observation_date: '2024-01-05', moisture_index: 0.8, vv_backscatter: -10, vh_backscatter: null, source: 'sentinel1' },
    ];

    const stats = calculateMoistureStats(readings);
    expect(stats!.trend).toBe('down');
  });

  it('should detect stable trend', () => {
    const readings: MoistureResult[] = [
      { observation_date: '2024-01-15', moisture_index: 0.5, vv_backscatter: -14, vh_backscatter: null, source: 'sentinel1' },
      { observation_date: '2024-01-12', moisture_index: 0.51, vv_backscatter: -14, vh_backscatter: null, source: 'sentinel1' },
      { observation_date: '2024-01-10', moisture_index: 0.49, vv_backscatter: -14, vh_backscatter: null, source: 'sentinel1' },
      { observation_date: '2024-01-08', moisture_index: 0.5, vv_backscatter: -14, vh_backscatter: null, source: 'sentinel1' },
    ];

    const stats = calculateMoistureStats(readings);
    expect(stats!.trend).toBe('stable');
  });
});

describe('getDateRange', () => {
  it('should return correct format for dates', () => {
    const { startDate, endDate } = getDateRange(30);

    // Check format YYYY-MM-DD
    expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should return correct range for 30 days', () => {
    const { startDate, endDate } = getDateRange(30);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    expect(diffDays).toBe(30);
  });

  it('should return correct range for 7 days', () => {
    const { startDate, endDate } = getDateRange(7);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    expect(diffDays).toBe(7);
  });

  it('should return correct range for 90 days', () => {
    const { startDate, endDate } = getDateRange(90);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    expect(diffDays).toBe(90);
  });

  it('should default to 30 days when no argument provided', () => {
    const { startDate, endDate } = getDateRange();

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    expect(diffDays).toBe(30);
  });
});
