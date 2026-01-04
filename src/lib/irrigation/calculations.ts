/**
 * Irrigation calculation utilities
 * Based on FAO guidelines for crop water requirements
 */

// Crop coefficient (Kc) values for different growth stages
// Based on FAO-56 guidelines
export interface CropCoefficients {
  initial: number;   // Kc_ini - initial/planting stage
  mid: number;       // Kc_mid - mid-season/flowering
  end: number;       // Kc_end - late season/harvest
  rootDepth: number; // Effective root depth in meters
  waterNeed: number; // Base water need in mm/day during peak growth
}

export const CROP_WATER_COEFFICIENTS: Record<string, CropCoefficients> = {
  wheat: {
    initial: 0.3,
    mid: 1.15,
    end: 0.25,
    rootDepth: 1.5,
    waterNeed: 5.5,
  },
  winter_wheat: {
    initial: 0.3,
    mid: 1.15,
    end: 0.25,
    rootDepth: 1.5,
    waterNeed: 5.0,
  },
  maize: {
    initial: 0.3,
    mid: 1.2,
    end: 0.6,
    rootDepth: 1.7,
    waterNeed: 6.5,
  },
  rapeseed: {
    initial: 0.35,
    mid: 1.15,
    end: 0.35,
    rootDepth: 1.5,
    waterNeed: 5.0,
  },
  potatoes: {
    initial: 0.5,
    mid: 1.15,
    end: 0.75,
    rootDepth: 0.6,
    waterNeed: 5.5,
  },
  sugar_beet: {
    initial: 0.35,
    mid: 1.2,
    end: 0.7,
    rootDepth: 1.2,
    waterNeed: 6.0,
  },
  barley: {
    initial: 0.3,
    mid: 1.15,
    end: 0.25,
    rootDepth: 1.2,
    waterNeed: 5.0,
  },
  rye: {
    initial: 0.3,
    mid: 1.1,
    end: 0.25,
    rootDepth: 1.5,
    waterNeed: 4.5,
  },
  oats: {
    initial: 0.3,
    mid: 1.15,
    end: 0.25,
    rootDepth: 1.2,
    waterNeed: 5.0,
  },
  other: {
    initial: 0.35,
    mid: 1.1,
    end: 0.5,
    rootDepth: 1.0,
    waterNeed: 5.0,
  },
};

export interface IrrigationRecommendation {
  needsIrrigation: boolean;
  urgency: 'none' | 'low' | 'medium' | 'high' | 'critical';
  waterAmount: number; // mm of water needed
  waterVolume: number; // liters per hectare
  nextIrrigationDate: Date | null;
  message: string;
  factors: {
    soilMoisture: number; // current moisture 0-1
    optimalMoisture: number; // target moisture 0-1
    deficit: number; // moisture deficit 0-1
    cropStage: 'initial' | 'development' | 'mid' | 'late';
    dailyNeed: number; // mm/day
  };
}

export interface WeatherForecast {
  rainProbability: number; // 0-1
  expectedRainMm: number;
  temperature: number;
  humidity: number;
}

/**
 * Determine crop growth stage based on planting date and crop type
 */
export function getCropStage(
  cropType: string,
  plantingDate?: Date
): 'initial' | 'development' | 'mid' | 'late' {
  if (!plantingDate) {
    // Assume mid-season if no planting date
    return 'mid';
  }

  const now = new Date();
  const daysSincePlanting = Math.floor(
    (now.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Simplified growth stage calculation
  // In production, this would vary by crop type
  if (daysSincePlanting < 20) return 'initial';
  if (daysSincePlanting < 50) return 'development';
  if (daysSincePlanting < 100) return 'mid';
  return 'late';
}

/**
 * Get crop coefficient for current growth stage
 */
export function getCropCoefficient(cropType: string, stage: 'initial' | 'development' | 'mid' | 'late'): number {
  const coefficients = CROP_WATER_COEFFICIENTS[cropType] || CROP_WATER_COEFFICIENTS.other;

  switch (stage) {
    case 'initial':
      return coefficients.initial;
    case 'development':
      return (coefficients.initial + coefficients.mid) / 2;
    case 'mid':
      return coefficients.mid;
    case 'late':
      return coefficients.end;
  }
}

/**
 * Calculate evapotranspiration (ET) based on temperature
 * Simplified Hargreaves method
 */
export function calculateEvapotranspiration(
  temperature: number,
  humidity: number
): number {
  // Base ET0 calculation (simplified)
  // In production, use Penman-Monteith with more parameters
  const baseET = 0.0023 * (temperature + 17.8) * Math.sqrt(Math.max(0, 30 - humidity / 3));
  return Math.max(0, Math.min(10, baseET)); // Clamp between 0-10 mm/day
}

/**
 * Calculate irrigation recommendation
 */
export function calculateIrrigationNeed(
  cropType: string,
  soilMoisture: number, // 0-1
  areaHectares: number,
  weather?: WeatherForecast,
  plantingDate?: Date
): IrrigationRecommendation {
  const coefficients = CROP_WATER_COEFFICIENTS[cropType] || CROP_WATER_COEFFICIENTS.other;
  const stage = getCropStage(cropType, plantingDate);
  const kc = getCropCoefficient(cropType, stage);

  // Optimal soil moisture varies by crop and stage
  const optimalMoisture = stage === 'mid' ? 0.6 : stage === 'initial' ? 0.5 : 0.45;
  const deficit = Math.max(0, optimalMoisture - soilMoisture);

  // Calculate daily water need
  let dailyNeed = coefficients.waterNeed * kc;

  // Adjust for weather if available
  if (weather) {
    const et = calculateEvapotranspiration(weather.temperature, weather.humidity);
    dailyNeed = et * kc;
  }

  // Calculate water amount needed to restore optimal moisture
  // Assume soil water holding capacity of ~150mm per meter of root depth
  const soilCapacity = coefficients.rootDepth * 150;
  const waterNeeded = deficit * soilCapacity;

  // Adjust for expected rainfall
  let effectiveWaterNeeded = waterNeeded;
  if (weather && weather.rainProbability > 0.5 && weather.expectedRainMm > 5) {
    effectiveWaterNeeded = Math.max(0, waterNeeded - weather.expectedRainMm * 0.7);
  }

  // Determine urgency
  let urgency: IrrigationRecommendation['urgency'] = 'none';
  let message = '';

  if (soilMoisture < 0.2) {
    urgency = 'critical';
    message = 'Krytycznie niski poziom wilgotnosci - natychmiastowe nawodnienie wymagane!';
  } else if (soilMoisture < 0.3) {
    urgency = 'high';
    message = 'Niski poziom wilgotnosci - zalecane pilne nawodnienie.';
  } else if (deficit > 0.15) {
    urgency = 'medium';
    message = 'Umiarkowany deficyt wody - rozważ nawodnienie w ciągu 2-3 dni.';
  } else if (deficit > 0.05) {
    urgency = 'low';
    message = 'Niewielki deficyt wody - monitoruj sytuację.';
  } else {
    message = 'Poziom wilgotnosci optymalny - nawodnienie nie jest wymagane.';
  }

  // Adjust for expected rain
  if (weather && weather.rainProbability > 0.7 && weather.expectedRainMm > 10) {
    if (urgency !== 'critical') {
      message += ' Prognozowane opady mogą uzupełnić niedobór.';
      if (urgency === 'high') urgency = 'medium';
      if (urgency === 'medium') urgency = 'low';
    }
  }

  // Calculate next irrigation date
  let nextIrrigationDate: Date | null = null;
  if (urgency !== 'none') {
    const daysUntilCritical = Math.max(0, (soilMoisture - 0.2) / (dailyNeed / soilCapacity));
    nextIrrigationDate = new Date();
    nextIrrigationDate.setDate(nextIrrigationDate.getDate() + Math.min(daysUntilCritical, 7));
  }

  return {
    needsIrrigation: urgency !== 'none',
    urgency,
    waterAmount: Math.round(effectiveWaterNeeded * 10) / 10,
    waterVolume: Math.round(effectiveWaterNeeded * areaHectares * 10000), // liters
    nextIrrigationDate,
    message,
    factors: {
      soilMoisture,
      optimalMoisture,
      deficit,
      cropStage: stage,
      dailyNeed: Math.round(dailyNeed * 10) / 10,
    },
  };
}

/**
 * Generate irrigation schedule for the next 7 days
 */
export interface ScheduleDay {
  date: Date;
  recommended: boolean;
  waterAmount: number;
  reason: string;
  weatherNote?: string;
}

export function generateIrrigationSchedule(
  recommendation: IrrigationRecommendation,
  weatherForecast?: Array<{ date: Date; rainProbability: number; expectedRainMm: number }>
): ScheduleDay[] {
  const schedule: ScheduleDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let remainingWater = recommendation.waterAmount;
  const dailyCapacity = 25; // Max mm per irrigation session

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    const dayForecast = weatherForecast?.find(
      (f) => f.date.toDateString() === date.toDateString()
    );

    let recommended = false;
    let waterAmount = 0;
    let reason = '';
    let weatherNote: string | undefined;

    // Check for rain
    if (dayForecast && dayForecast.rainProbability > 0.6) {
      weatherNote = `Prognoza: ${Math.round(dayForecast.rainProbability * 100)}% szans na opady (${dayForecast.expectedRainMm.toFixed(1)} mm)`;
      remainingWater = Math.max(0, remainingWater - dayForecast.expectedRainMm * 0.7);
    }

    if (remainingWater > 0 && (!dayForecast || dayForecast.rainProbability < 0.5)) {
      recommended = true;
      waterAmount = Math.min(remainingWater, dailyCapacity);
      remainingWater -= waterAmount;
      reason = waterAmount >= dailyCapacity
        ? 'Maksymalna dawka dzienna'
        : 'Uzupelnienie niedoboru wody';
    } else if (remainingWater <= 0) {
      reason = 'Brak potrzeby nawadniania';
    } else {
      reason = 'Oczekuj na opady';
    }

    schedule.push({
      date,
      recommended,
      waterAmount: Math.round(waterAmount * 10) / 10,
      reason,
      weatherNote,
    });
  }

  return schedule;
}

/**
 * Format water volume for display
 */
export function formatWaterVolume(liters: number): string {
  if (liters >= 1000000) {
    return `${(liters / 1000000).toFixed(1)} tys. m³`;
  } else if (liters >= 1000) {
    return `${(liters / 1000).toFixed(1)} m³`;
  }
  return `${liters} l`;
}
