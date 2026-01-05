/**
 * Low moisture alert email template (Polish)
 */

export interface LowMoistureEmailData {
  recipientName: string;
  fieldName: string;
  currentMoisture: number; // percentage
  threshold: number; // percentage
  fieldUrl: string;
  cropType?: string | null; // e.g., 'potatoes', 'wheat'
  cropLabel?: string | null; // Polish label e.g., 'Ziemniaki', 'Pszenica'
}

/**
 * Generate the subject line for low moisture alert
 */
export function getLowMoistureSubject(fieldName: string): string {
  return `Uwaga! Niska wilgotność na polu: ${fieldName}`;
}

/**
 * Generate the HTML email body for low moisture alert
 */
export function getLowMoistureHtml(data: LowMoistureEmailData): string {
  const { recipientName, fieldName, currentMoisture, threshold, fieldUrl, cropLabel } = data;

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alert wilgotności - AgroWater</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td style="padding: 24px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #dc2626; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ⚠️ Alert wilgotności
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <p style="margin: 0 0 16px; font-size: 16px; color: #374151;">
                Cześć ${recipientName || 'Użytkowniku'},
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; color: #374151;">
                Wilgotność gleby na Twoim polu spadła poniżej ustawionego progu alertu.
              </p>

              <!-- Alert Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px; font-size: 14px; color: #991b1b; font-weight: 600;">
                      Pole: ${fieldName}${cropLabel ? ` (${cropLabel})` : ''}
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="width: 50%; padding-right: 8px;">
                          <p style="margin: 0; font-size: 12px; color: #6b7280;">Aktualna wilgotność</p>
                          <p style="margin: 4px 0 0; font-size: 28px; font-weight: 700; color: #dc2626;">
                            ${currentMoisture.toFixed(0)}%
                          </p>
                        </td>
                        <td style="width: 50%; padding-left: 8px;">
                          <p style="margin: 0; font-size: 12px; color: #6b7280;">Próg alertu</p>
                          <p style="margin: 4px 0 0; font-size: 28px; font-weight: 700; color: #374151;">
                            ${threshold.toFixed(0)}%
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Recommendations -->
              <p style="margin: 0 0 16px; font-size: 16px; color: #374151; font-weight: 600;">
                Zalecenia:
              </p>
              <ul style="margin: 0 0 24px; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.6;">
                <li>Sprawdź warunki na polu</li>
                <li>Rozważ nawadnianie, jeśli jest dostępne</li>
                <li>Monitoruj prognozę pogody na najbliższe dni</li>
                <li>Dostosuj próg alertu w ustawieniach, jeśli to konieczne</li>
              </ul>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 8px; background-color: #16a34a;">
                    <a href="${fieldUrl}" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">
                      Zobacz szczegóły pola
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
                Możesz wyłączyć powiadomienia w ustawieniach pola.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                AgroWater - Monitorowanie wilgotności gleby
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate the plain text email body for low moisture alert
 */
export function getLowMoistureText(data: LowMoistureEmailData): string {
  const { recipientName, fieldName, currentMoisture, threshold, fieldUrl, cropLabel } = data;

  return `
ALERT WILGOTNOŚCI - AgroWater

Cześć ${recipientName || 'Użytkowniku'},

Wilgotność gleby na Twoim polu spadła poniżej ustawionego progu alertu.

POLE: ${fieldName}${cropLabel ? ` (${cropLabel})` : ''}
Aktualna wilgotność: ${currentMoisture.toFixed(0)}%
Próg alertu: ${threshold.toFixed(0)}%

ZALECENIA:
- Sprawdź warunki na polu
- Rozważ nawadnianie, jeśli jest dostępne
- Monitoruj prognozę pogody na najbliższe dni
- Dostosuj próg alertu w ustawieniach, jeśli to konieczne

Zobacz szczegóły pola: ${fieldUrl}

---
Możesz wyłączyć powiadomienia w ustawieniach pola.
AgroWater - Monitorowanie wilgotności gleby
  `.trim();
}
