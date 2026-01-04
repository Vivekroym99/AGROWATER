export {
  CROP_WATER_COEFFICIENTS,
  getCropStage,
  getCropCoefficient,
  calculateEvapotranspiration,
  calculateIrrigationNeed,
  generateIrrigationSchedule,
  formatWaterVolume,
} from './calculations';

export type {
  CropCoefficients,
  IrrigationRecommendation,
  WeatherForecast,
  ScheduleDay,
} from './calculations';
