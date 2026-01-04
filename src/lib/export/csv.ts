import { format } from 'date-fns';
import type { FieldWithStatus, MoistureReading } from '@/types/database';

interface ExportField extends FieldWithStatus {
  readings?: MoistureReading[];
}

/**
 * Generate CSV content for fields overview
 */
export function generateFieldsCSV(fields: FieldWithStatus[]): string {
  const headers = [
    'Nazwa pola',
    'Uprawa',
    'Powierzchnia (ha)',
    'Aktualna wilgotnosc (%)',
    'Status',
    'Ostatni odczyt',
    'Prog alertu (%)',
    'Alerty wlaczone',
  ];

  const rows = fields.map((field) => [
    `"${field.name}"`,
    field.crop_type || '',
    field.area_hectares?.toFixed(2) || '',
    field.current_moisture !== null ? (field.current_moisture * 100).toFixed(1) : '',
    translateStatus(field.status),
    field.last_reading_date || '',
    (field.alert_threshold * 100).toFixed(0),
    field.alerts_enabled ? 'Tak' : 'Nie',
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Generate CSV content for moisture history of a single field
 */
export function generateMoistureHistoryCSV(
  field: FieldWithStatus,
  readings: MoistureReading[]
): string {
  const headers = [
    'Data',
    'Wilgotnosc (%)',
    'VV Backscatter (dB)',
    'VH Backscatter (dB)',
    'Zrodlo',
  ];

  const sortedReadings = [...readings].sort(
    (a, b) => new Date(b.observation_date).getTime() - new Date(a.observation_date).getTime()
  );

  const rows = sortedReadings.map((reading) => [
    reading.observation_date,
    (reading.moisture_index * 100).toFixed(1),
    reading.vv_backscatter?.toFixed(2) || '',
    reading.vh_backscatter?.toFixed(2) || '',
    reading.source || 'sentinel1',
  ]);

  const metadata = [
    `# Pole: ${field.name}`,
    `# Uprawa: ${field.crop_type || 'Nie podano'}`,
    `# Powierzchnia: ${field.area_hectares?.toFixed(2) || 'N/A'} ha`,
    `# Eksport: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
    '',
  ];

  return [...metadata, headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Generate detailed report CSV for all fields with their readings
 */
export function generateDetailedReportCSV(fields: ExportField[]): string {
  const headers = [
    'Pole',
    'Uprawa',
    'Powierzchnia (ha)',
    'Data odczytu',
    'Wilgotnosc (%)',
    'Status',
    'VV Backscatter (dB)',
  ];

  const rows: string[][] = [];

  fields.forEach((field) => {
    const readings = field.readings || [];

    if (readings.length === 0) {
      rows.push([
        `"${field.name}"`,
        field.crop_type || '',
        field.area_hectares?.toFixed(2) || '',
        '',
        '',
        translateStatus(field.status),
        '',
      ]);
    } else {
      readings.forEach((reading, index) => {
        const status = getMoistureStatus(reading.moisture_index, field.alert_threshold);
        rows.push([
          index === 0 ? `"${field.name}"` : '',
          index === 0 ? (field.crop_type || '') : '',
          index === 0 ? (field.area_hectares?.toFixed(2) || '') : '',
          reading.observation_date,
          (reading.moisture_index * 100).toFixed(1),
          translateStatus(status),
          reading.vv_backscatter?.toFixed(2) || '',
        ]);
      });
    }
  });

  const metadata = [
    `# Raport AgroWater`,
    `# Data eksportu: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
    `# Liczba pol: ${fields.length}`,
    '',
  ];

  return [...metadata, headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

function translateStatus(status: string): string {
  switch (status) {
    case 'good':
      return 'Optymalnie';
    case 'warning':
      return 'Monitoruj';
    case 'critical':
      return 'Uwaga!';
    default:
      return 'Brak danych';
  }
}

function getMoistureStatus(moisture: number, threshold: number): string {
  if (moisture >= 0.5) return 'good';
  if (moisture >= threshold) return 'warning';
  return 'critical';
}

/**
 * Trigger CSV download in browser
 */
export function downloadCSV(content: string, filename: string): void {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
