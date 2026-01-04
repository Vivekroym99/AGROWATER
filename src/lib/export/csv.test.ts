import { describe, it, expect } from 'vitest';
import {
  generateFieldsCSV,
  generateMoistureHistoryCSV,
  generateDetailedReportCSV,
} from './csv';
import type { FieldWithStatus, MoistureReading } from '@/types/database';

const mockFields: FieldWithStatus[] = [
  {
    id: '1',
    user_id: 'user-1',
    name: 'Pole testowe 1',
    boundary: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
    area_hectares: 25.5,
    crop_type: 'wheat',
    alert_threshold: 0.3,
    alerts_enabled: true,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    current_moisture: 0.65,
    last_reading_date: '2024-01-15',
    status: 'good',
  },
  {
    id: '2',
    user_id: 'user-1',
    name: 'Pole testowe 2',
    boundary: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
    area_hectares: 10.0,
    crop_type: 'maize',
    alert_threshold: 0.25,
    alerts_enabled: false,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    current_moisture: 0.25,
    last_reading_date: '2024-01-14',
    status: 'critical',
  },
];

const mockReadings: MoistureReading[] = [
  {
    id: 'r1',
    field_id: '1',
    observation_date: '2024-01-15',
    moisture_index: 0.65,
    vv_backscatter: -12.5,
    vh_backscatter: -18.2,
    source: 'sentinel1',
    processed_at: '2024-01-15T12:00:00Z',
    created_at: '2024-01-15T12:00:00Z',
  },
  {
    id: 'r2',
    field_id: '1',
    observation_date: '2024-01-12',
    moisture_index: 0.58,
    vv_backscatter: -13.0,
    vh_backscatter: -18.5,
    source: 'sentinel1',
    processed_at: '2024-01-12T12:00:00Z',
    created_at: '2024-01-12T12:00:00Z',
  },
];

describe('generateFieldsCSV', () => {
  it('should generate CSV with headers', () => {
    const csv = generateFieldsCSV(mockFields);
    const lines = csv.split('\n');

    expect(lines[0]).toContain('Nazwa pola');
    expect(lines[0]).toContain('Uprawa');
    expect(lines[0]).toContain('Powierzchnia');
    expect(lines[0]).toContain('wilgotnosc');
    expect(lines[0]).toContain('Status');
  });

  it('should include all fields', () => {
    const csv = generateFieldsCSV(mockFields);
    const lines = csv.split('\n');

    // Header + 2 data rows
    expect(lines.length).toBe(3);
  });

  it('should properly escape field names with quotes', () => {
    const csv = generateFieldsCSV(mockFields);

    expect(csv).toContain('"Pole testowe 1"');
    expect(csv).toContain('"Pole testowe 2"');
  });

  it('should translate status to Polish', () => {
    const csv = generateFieldsCSV(mockFields);

    expect(csv).toContain('Optymalnie');
    expect(csv).toContain('Uwaga!');
  });

  it('should format moisture as percentage', () => {
    const csv = generateFieldsCSV(mockFields);

    expect(csv).toContain('65.0'); // 0.65 * 100
    expect(csv).toContain('25.0'); // 0.25 * 100
  });

  it('should handle empty fields array', () => {
    const csv = generateFieldsCSV([]);
    const lines = csv.split('\n');

    // Should still have headers
    expect(lines[0]).toContain('Nazwa pola');
    expect(lines.length).toBe(1);
  });
});

describe('generateMoistureHistoryCSV', () => {
  it('should include metadata comments', () => {
    const csv = generateMoistureHistoryCSV(mockFields[0], mockReadings);

    expect(csv).toContain('# Pole: Pole testowe 1');
    expect(csv).toContain('# Uprawa:');
    expect(csv).toContain('# Powierzchnia:');
    expect(csv).toContain('# Eksport:');
  });

  it('should include headers', () => {
    const csv = generateMoistureHistoryCSV(mockFields[0], mockReadings);

    expect(csv).toContain('Data');
    expect(csv).toContain('Wilgotnosc');
    expect(csv).toContain('VV Backscatter');
    expect(csv).toContain('VH Backscatter');
  });

  it('should include all readings', () => {
    const csv = generateMoistureHistoryCSV(mockFields[0], mockReadings);
    const lines = csv.split('\n').filter(l => !l.startsWith('#') && l.trim());

    // Header + 2 readings
    expect(lines.length).toBe(3);
  });

  it('should sort readings by date descending', () => {
    const csv = generateMoistureHistoryCSV(mockFields[0], mockReadings);
    const dataLines = csv.split('\n').filter(l => !l.startsWith('#') && l.trim() && !l.includes('Data'));

    // First reading should be most recent
    expect(dataLines[0]).toContain('2024-01-15');
  });

  it('should format moisture as percentage', () => {
    const csv = generateMoistureHistoryCSV(mockFields[0], mockReadings);

    expect(csv).toContain('65.0');
    expect(csv).toContain('58.0');
  });
});

describe('generateDetailedReportCSV', () => {
  it('should include metadata', () => {
    const csv = generateDetailedReportCSV(mockFields);

    expect(csv).toContain('# Raport AgroWater');
    expect(csv).toContain('# Liczba pol:');
  });

  it('should include headers', () => {
    const csv = generateDetailedReportCSV(mockFields);

    expect(csv).toContain('Pole');
    expect(csv).toContain('Uprawa');
    expect(csv).toContain('Powierzchnia');
    expect(csv).toContain('Status');
  });

  it('should handle fields without readings', () => {
    const csv = generateDetailedReportCSV(mockFields);

    // Should still include the fields
    expect(csv).toContain('"Pole testowe 1"');
    expect(csv).toContain('"Pole testowe 2"');
  });

  it('should include readings when available', () => {
    const fieldsWithReadings = [
      { ...mockFields[0], readings: mockReadings },
    ];

    const csv = generateDetailedReportCSV(fieldsWithReadings);

    expect(csv).toContain('2024-01-15');
    expect(csv).toContain('65.0');
  });
});
