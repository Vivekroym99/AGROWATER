/**
 * Application constants and Polish language strings for AgroWater
 */

// Map configuration
export const MAP_CONFIG = {
  defaultCenter: [52.0, 19.0] as [number, number], // Poland center
  defaultZoom: 6,
  maxZoom: 18,
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
} as const;

// Moisture status thresholds
export const MOISTURE_THRESHOLDS = {
  good: 0.50,     // >= 50% is good
  warning: 0.30,  // 30-49% is warning
  // < 30% is critical
} as const;

// Crop types with Polish labels
export const CROP_TYPES = [
  { value: 'wheat', label: 'Pszenica' },
  { value: 'winter_wheat', label: 'Pszenica ozima' },
  { value: 'maize', label: 'Kukurydza' },
  { value: 'rapeseed', label: 'Rzepak' },
  { value: 'potatoes', label: 'Ziemniaki' },
  { value: 'sugar_beet', label: 'Burak cukrowy' },
  { value: 'barley', label: 'Jęczmień' },
  { value: 'rye', label: 'Żyto' },
  { value: 'oats', label: 'Owies' },
  { value: 'other', label: 'Inne' },
] as const;

// Polish UI text strings
export const UI_TEXT = {
  // Navigation
  nav: {
    dashboard: 'Panel główny',
    fields: 'Moje pola',
    addField: 'Dodaj pole',
    settings: 'Ustawienia',
    logout: 'Wyloguj',
  },

  // Auth
  auth: {
    login: 'Zaloguj się',
    register: 'Zarejestruj się',
    email: 'Email',
    password: 'Hasło',
    fullName: 'Imię i nazwisko',
    phone: 'Telefon (opcjonalnie)',
    noAccount: 'Nie masz konta?',
    hasAccount: 'Masz już konto?',
    acceptTerms: 'Akceptuję regulamin i politykę prywatności',
    checkEmail: 'Sprawdź swoją skrzynkę email i kliknij link weryfikacyjny.',
    forgotPassword: 'Zapomniałeś hasła?',
  },

  // Dashboard
  dashboard: {
    title: 'Panel główny',
    totalFields: 'Wszystkie pola',
    totalArea: 'Łączna powierzchnia',
    needsAttention: 'Wymaga uwagi',
    fieldsOk: 'W normie',
    noFields: 'Nie masz jeszcze żadnych pól.',
    addFirst: 'Dodaj pierwsze pole, aby rozpocząć monitorowanie.',
  },

  // Fields
  fields: {
    title: 'Moje pola',
    add: 'Dodaj pole',
    addNew: 'Dodaj nowe pole',
    name: 'Nazwa pola',
    namePlaceholder: 'np. Pole za stodołą',
    cropType: 'Rodzaj uprawy',
    selectCrop: 'Wybierz uprawę',
    area: 'Powierzchnia',
    save: 'Zapisz pole',
    cancel: 'Anuluj',
    delete: 'Usuń pole',
    edit: 'Edytuj',
    confirmDelete: 'Czy na pewno chcesz usunąć to pole?',
    back: 'Powrót',
    viewAll: 'Zobacz wszystkie',
  },

  // Map
  map: {
    draw: 'Rysuj',
    clear: 'Wyczyść',
    instructions: 'Kliknij aby dodać punkty, kliknij dwukrotnie aby zakończyć',
    drawBoundary: 'Narysuj granicę pola na mapie',
  },

  // Moisture
  moisture: {
    current: 'Aktualna wilgotność',
    history: 'Historia wilgotności',
    lastUpdate: 'Ostatnia aktualizacja',
    noData: 'Brak danych',
    days7: '7 dni',
    days30: '30 dni',
    days90: '90 dni',
  },

  // Status
  status: {
    good: 'Optymalnie',
    warning: 'Monitoruj',
    critical: 'Uwaga!',
    unknown: 'Brak danych',
    goodDesc: 'Pole w dobrym stanie - wilgotność optymalna',
    warningDesc: 'Monitoruj sytuację - wilgotność spada',
    criticalDesc: 'Uwaga! Niska wilgotność - rozważ nawadnianie',
    unknownDesc: 'Brak danych - poczekaj na pierwsze odczyty satelitarne',
  },

  // Alerts
  alerts: {
    settings: 'Ustawienia alertów',
    enable: 'Włącz powiadomienia email',
    threshold: 'Próg alertu',
    thresholdDesc: 'Powiadom gdy wilgotność spadnie poniżej:',
  },

  // Common
  common: {
    save: 'Zapisz',
    cancel: 'Anuluj',
    delete: 'Usuń',
    edit: 'Edytuj',
    loading: 'Ładowanie...',
    error: 'Wystąpił błąd',
    success: 'Zapisano pomyślnie',
    hectares: 'ha',
  },

  // Errors
  errors: {
    required: 'To pole jest wymagane',
    invalidEmail: 'Nieprawidłowy adres email',
    passwordMin: 'Hasło musi mieć minimum 8 znaków',
    generic: 'Coś poszło nie tak. Spróbuj ponownie.',
    notFound: 'Nie znaleziono',
    unauthorized: 'Brak autoryzacji',
  },

  // Landing page
  landing: {
    headline: 'Monitoruj wilgotność gleby z satelity',
    subheadline: 'Bez czujników. Bez instalacji. Za darmo.',
    cta: 'Załóż konto za darmo',
    howItWorks: 'Jak to działa?',
    step1: 'Narysuj pole na mapie',
    step2: 'Otrzymuj dane satelitarne',
    step3: 'Dostaj alerty o suszy',
    features: {
      satellite: 'Dane z satelity Sentinel-1',
      updates: 'Aktualizacja co kilka dni',
      alerts: 'Alerty email o niskiej wilgotności',
      mobile: 'Działa na telefonie i komputerze',
    },
    startMonitoring: 'Zacznij monitorować swoje pola',
  },
} as const;

// Status colors for UI
export const STATUS_COLORS = {
  good: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-500',
    fill: '#22c55e',
  },
  warning: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-500',
    fill: '#eab308',
  },
  critical: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-500',
    fill: '#ef4444',
  },
  unknown: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-400',
    fill: '#9ca3af',
  },
} as const;

// Chart configuration
export const CHART_CONFIG = {
  lineColor: '#3B82F6',
  fillColor: 'rgba(59, 130, 246, 0.2)',
  thresholdColor: '#EF4444',
  optimalZoneColor: 'rgba(34, 197, 94, 0.1)',
  height: 300,
} as const;

// NDVI thresholds for vegetation health
export const NDVI_THRESHOLDS = {
  excellent: 0.6, // >= 0.6 is excellent
  good: 0.4,      // 0.4-0.59 is good
  moderate: 0.2,  // 0.2-0.39 is moderate
  // < 0.2 is poor
} as const;

// NDVI status colors for UI
export const NDVI_STATUS_COLORS = {
  excellent: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-500',
    fill: '#10b981',
  },
  good: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-500',
    fill: '#22c55e',
  },
  moderate: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-500',
    fill: '#eab308',
  },
  poor: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-500',
    fill: '#ef4444',
  },
  unknown: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-400',
    fill: '#9ca3af',
  },
} as const;

// NDVI Chart configuration
export const NDVI_CHART_CONFIG = {
  lineColor: '#10B981',
  excellentColor: 'rgba(16, 185, 129, 0.15)',
  goodColor: 'rgba(34, 197, 94, 0.1)',
  moderateColor: 'rgba(234, 179, 8, 0.1)',
  poorColor: 'rgba(239, 68, 68, 0.1)',
  height: 300,
} as const;

// NDVI Polish UI text
export const NDVI_TEXT = {
  title: 'Indeks wegetacji NDVI',
  history: 'Historia NDVI',
  current: 'Aktualny NDVI',
  noData: 'Brak danych NDVI',
  statusExcellent: 'Doskonaly',
  statusGood: 'Dobry',
  statusModerate: 'Umiarkowany',
  statusPoor: 'Slaby',
  statusUnknown: 'Brak danych',
  trend: 'Trend',
  trendImproving: 'Poprawia sie',
  trendDeclining: 'Pogarsza sie',
  trendStable: 'Stabilny',
  excellentDesc: 'Roslinnosc w doskonalym stanie',
  goodDesc: 'Roslinnosc w dobrym stanie',
  moderateDesc: 'Roslinnosc wymaga uwagi',
  poorDesc: 'Roslinnosc w slabym stanie - mozliwy stres',
  unknownDesc: 'Brak danych - poczekaj na synchronizacje z Agro API',
  notSynced: 'Pole nie zsynchronizowane z Agro API',
  syncRequired: 'Wymagana synchronizacja',
  syncButton: 'Synchronizuj z Agro API',
  syncPending: 'Synchronizacja w toku...',
  syncError: 'Blad synchronizacji',
} as const;

// Agronomic data Polish UI text
export const AGRONOMIC_TEXT = {
  title: 'Dane agronomiczne',
  gdd: 'Suma temperatur (GDD)',
  gddUnit: 'stopniodni',
  gddDesc: 'Stopniodni powyzej 10°C od poczatku sezonu',
  precipitation: 'Suma opadow',
  precipitationUnit: 'mm',
  precipitationDesc: 'Laczne opady od poczatku sezonu',
  soilMoisture: 'Wilgotnosc gleby (API)',
  soilTemp: 'Temp. gleby (10cm)',
  seasonStart: 'Poczatek sezonu',
  notConfigured: 'Agro API nie skonfigurowane',
  loading: 'Ladowanie danych agronomicznych...',
} as const;

// Crop-specific moisture thresholds based on agronomic requirements
// Values represent the moisture level below which the crop may experience stress
export const CROP_MOISTURE_THRESHOLDS: Record<string, { min: number; max: number; default: number; sensitivity: string }> = {
  potatoes: { min: 0.45, max: 0.50, default: 0.47, sensitivity: 'very_high' },
  sugar_beet: { min: 0.40, max: 0.45, default: 0.42, sensitivity: 'high' },
  maize: { min: 0.40, max: 0.45, default: 0.42, sensitivity: 'high' },
  wheat: { min: 0.35, max: 0.40, default: 0.37, sensitivity: 'medium' },
  winter_wheat: { min: 0.35, max: 0.40, default: 0.37, sensitivity: 'medium' },
  rapeseed: { min: 0.35, max: 0.40, default: 0.37, sensitivity: 'medium' },
  oats: { min: 0.35, max: 0.40, default: 0.37, sensitivity: 'medium' },
  barley: { min: 0.30, max: 0.35, default: 0.32, sensitivity: 'low' },
  rye: { min: 0.30, max: 0.35, default: 0.32, sensitivity: 'low' },
  other: { min: 0.30, max: 0.35, default: 0.32, sensitivity: 'default' },
} as const;

// Default threshold when no crop is selected
export const DEFAULT_MOISTURE_THRESHOLD = 0.30;

/**
 * Get the recommended moisture threshold for a crop type
 * @param cropType - The crop type key (e.g., 'potatoes', 'wheat')
 * @returns The recommended threshold value (0-1)
 */
export function getRecommendedThreshold(cropType: string | null | undefined): number {
  if (!cropType) return DEFAULT_MOISTURE_THRESHOLD;
  return CROP_MOISTURE_THRESHOLDS[cropType]?.default ?? DEFAULT_MOISTURE_THRESHOLD;
}

/**
 * Get the recommended threshold range text for a crop type
 * @param cropType - The crop type key
 * @returns Formatted range string (e.g., "45-50%") or null if no crop
 */
export function getThresholdRangeText(cropType: string | null | undefined): string | null {
  if (!cropType) return null;
  const thresholds = CROP_MOISTURE_THRESHOLDS[cropType];
  if (!thresholds) return null;
  return `${Math.round(thresholds.min * 100)}-${Math.round(thresholds.max * 100)}%`;
}

/**
 * Get the crop label in Polish for a crop type
 * @param cropType - The crop type key
 * @returns Polish label or null
 */
export function getCropLabel(cropType: string | null | undefined): string | null {
  if (!cropType) return null;
  const crop = CROP_TYPES.find(c => c.value === cropType);
  return crop?.label ?? null;
}

// Crop recommendation UI text
export const CROP_RECOMMENDATION_TEXT = {
  title: 'Zalecenia dla uprawy',
  recommended: 'Zalecane dla',
  range: 'Zalecany zakres',
  applyRecommended: 'Zastosuj zalecany prog',
  sensitivityLabel: 'Wrazliwosc na susza',
  sensitivityVeryHigh: 'Bardzo wysoka',
  sensitivityHigh: 'Wysoka',
  sensitivityMedium: 'Srednia',
  sensitivityLow: 'Niska',
  sensitivityDefault: 'Standardowa',
  infoText: 'Rozne uprawy maja rozne wymagania wodne. Ponizej znajdziesz zalecany prog alertu dla wybranej uprawy.',
} as const;

// Satellite imagery configuration
export const SATELLITE_CONFIG = {
  maxCloudCoverage: 30, // Max cloud coverage percentage to show
  defaultPreset: 'ndvi' as const,
  presets: ['truecolor', 'falsecolor', 'ndvi', 'evi'] as const,
  maxZoomSentinel: 14,
  maxZoomLandsat: 13,
} as const;

// Satellite imagery Polish UI text
export const SATELLITE_TEXT = {
  title: 'Zdjecia satelitarne',
  selectDate: 'Wybierz date',
  selectLayer: 'Wybierz warstwe',
  layerOsm: 'Mapa',
  layerTrueColor: 'Kolor naturalny',
  layerFalseColor: 'Fałszywy kolor',
  layerNdvi: 'NDVI',
  layerEvi: 'EVI',
  source: 'Zrodlo',
  cloudCoverage: 'Zachmurzenie',
  noImages: 'Brak dostepnych zdjec satelitarnych',
  notSynced: 'Synchronizacja z Agro API wymagana',
  syncFirst: 'Zsynchronizuj pole z Agro API, aby zobaczyc zdjecia satelitarne',
  loading: 'Ladowanie zdjec...',
  imageDate: 'Data zdjecia',
} as const;
