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
