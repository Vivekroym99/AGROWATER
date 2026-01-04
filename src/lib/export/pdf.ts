import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { FieldWithStatus, MoistureReading } from '@/types/database';

interface ExportField extends FieldWithStatus {
  readings?: MoistureReading[];
}

/**
 * Generate PDF-like HTML report that can be printed to PDF
 * Uses browser's print functionality for PDF generation
 */
export function generatePrintableReport(fields: ExportField[]): string {
  const totalArea = fields.reduce((sum, f) => sum + (f.area_hectares || 0), 0);
  const goodCount = fields.filter((f) => f.status === 'good').length;
  const warningCount = fields.filter((f) => f.status === 'warning').length;
  const criticalCount = fields.filter((f) => f.status === 'critical').length;

  const fieldsHtml = fields
    .map((field) => {
      const statusColor = getStatusColor(field.status);
      const statusLabel = translateStatus(field.status);
      const readings = field.readings || [];
      const latestReadings = readings.slice(0, 5);

      return `
        <div class="field-card">
          <div class="field-header">
            <h3>${escapeHtml(field.name)}</h3>
            <span class="status-badge" style="background-color: ${statusColor}20; color: ${statusColor}; border: 1px solid ${statusColor};">
              ${statusLabel}
            </span>
          </div>
          <div class="field-info">
            <div class="info-row">
              <span class="label">Uprawa:</span>
              <span class="value">${escapeHtml(field.crop_type || 'Nie podano')}</span>
            </div>
            <div class="info-row">
              <span class="label">Powierzchnia:</span>
              <span class="value">${field.area_hectares?.toFixed(2) || '-'} ha</span>
            </div>
            <div class="info-row">
              <span class="label">Aktualna wilgotnosc:</span>
              <span class="value" style="color: ${statusColor}; font-weight: 600;">
                ${field.current_moisture !== null ? `${(field.current_moisture * 100).toFixed(1)}%` : 'Brak danych'}
              </span>
            </div>
            <div class="info-row">
              <span class="label">Prog alertu:</span>
              <span class="value">${(field.alert_threshold * 100).toFixed(0)}%</span>
            </div>
          </div>
          ${
            latestReadings.length > 0
              ? `
            <div class="readings-table">
              <h4>Ostatnie odczyty</h4>
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Wilgotnosc</th>
                    <th>VV (dB)</th>
                  </tr>
                </thead>
                <tbody>
                  ${latestReadings
                    .map(
                      (r) => `
                    <tr>
                      <td>${format(new Date(r.observation_date), 'd MMM yyyy', { locale: pl })}</td>
                      <td>${(r.moisture_index * 100).toFixed(1)}%</td>
                      <td>${r.vv_backscatter?.toFixed(2) || '-'}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `
              : ''
          }
        </div>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Raport AgroWater - ${format(new Date(), 'd MMMM yyyy', { locale: pl })}</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          padding: 40px;
          max-width: 900px;
          margin: 0 auto;
        }
        @media print {
          body { padding: 20px; }
          .field-card { break-inside: avoid; }
          .no-print { display: none !important; }
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }
        .header h1 {
          font-size: 28px;
          color: #059669;
          margin-bottom: 8px;
        }
        .header p {
          color: #6b7280;
          font-size: 14px;
        }
        .summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 40px;
        }
        .summary-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }
        .summary-card .number {
          font-size: 24px;
          font-weight: 700;
        }
        .summary-card .label {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }
        .fields-section h2 {
          font-size: 20px;
          margin-bottom: 20px;
          color: #374151;
        }
        .field-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          background: #fff;
        }
        .field-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f3f4f6;
        }
        .field-header h3 {
          font-size: 18px;
          color: #111827;
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .field-info {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .info-row {
          display: flex;
          gap: 8px;
        }
        .info-row .label {
          color: #6b7280;
          font-size: 13px;
        }
        .info-row .value {
          font-size: 13px;
        }
        .readings-table h4 {
          font-size: 14px;
          color: #374151;
          margin-bottom: 12px;
        }
        .readings-table table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .readings-table th,
        .readings-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #f3f4f6;
        }
        .readings-table th {
          background: #f9fafb;
          font-weight: 600;
          color: #6b7280;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #9ca3af;
          font-size: 12px;
        }
        .print-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #059669;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .print-btn:hover {
          background: #047857;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Raport AgroWater</h1>
        <p>Wygenerowano: ${format(new Date(), 'd MMMM yyyy, HH:mm', { locale: pl })}</p>
      </div>

      <div class="summary">
        <div class="summary-card">
          <div class="number">${fields.length}</div>
          <div class="label">Pol ogolom</div>
        </div>
        <div class="summary-card">
          <div class="number">${totalArea.toFixed(1)} ha</div>
          <div class="label">Powierzchnia</div>
        </div>
        <div class="summary-card">
          <div class="number" style="color: #22c55e;">${goodCount}</div>
          <div class="label">W normie</div>
        </div>
        <div class="summary-card">
          <div class="number" style="color: #ef4444;">${warningCount + criticalCount}</div>
          <div class="label">Wymaga uwagi</div>
        </div>
      </div>

      <div class="fields-section">
        <h2>Szczegoly pol</h2>
        ${fieldsHtml}
      </div>

      <div class="footer">
        <p>AgroWater - Satelitarny monitoring wilgotnosci gleby</p>
        <p>Dane satelitarne: ESA Sentinel-1</p>
      </div>

      <button class="print-btn no-print" onclick="window.print()">
        Drukuj / Zapisz PDF
      </button>
    </body>
    </html>
  `;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'good':
      return '#22c55e';
    case 'warning':
      return '#eab308';
    case 'critical':
      return '#ef4444';
    default:
      return '#9ca3af';
  }
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

function escapeHtml(text: string): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Open printable report in new window
 */
export function openPrintableReport(fields: ExportField[]): void {
  const html = generatePrintableReport(fields);
  const printWindow = window.open('', '_blank');

  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
