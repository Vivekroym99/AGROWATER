/**
 * OpenWeatherMap API Integration
 * Free tier: 1,000 calls/day, current weather + 5-day forecast
 */

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_deg: number;
  clouds: number;
  visibility: number;
  weather: WeatherCondition;
  rain_1h?: number;
  rain_3h?: number;
  snow_1h?: number;
  snow_3h?: number;
  dt: number;
  sunrise: number;
  sunset: number;
}

export interface HourlyForecast {
  dt: number;
  temp: number;
  feels_like: number;
  humidity: number;
  weather: WeatherCondition;
  pop: number; // Probability of precipitation (0-1)
  rain_3h?: number;
  snow_3h?: number;
}

export interface DailyForecast {
  dt: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  weather: WeatherCondition;
  pop: number;
  rain?: number;
  snow?: number;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
  };
  timezone: string;
  fetched_at: string;
}

interface OpenWeatherMapCurrentResponse {
  coord: { lon: number; lat: number };
  weather: Array<{ id: number; main: string; description: string; icon: string }>;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  visibility: number;
  wind: { speed: number; deg: number };
  clouds: { all: number };
  rain?: { '1h'?: number; '3h'?: number };
  snow?: { '1h'?: number; '3h'?: number };
  dt: number;
  sys: { sunrise: number; sunset: number; country: string };
  name: string;
}

interface OpenWeatherMapForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      humidity: number;
      temp_min: number;
      temp_max: number;
    };
    weather: Array<{ id: number; main: string; description: string; icon: string }>;
    pop: number;
    rain?: { '3h'?: number };
    snow?: { '3h'?: number };
  }>;
  city: {
    name: string;
    country: string;
    coord: { lat: number; lon: number };
    timezone: number;
  };
}

const API_BASE = 'https://api.openweathermap.org/data/2.5';

/**
 * Check if OpenWeatherMap API is configured
 */
export function isWeatherConfigured(): boolean {
  return !!process.env.OPENWEATHERMAP_API_KEY;
}

/**
 * Get current weather and forecast for coordinates
 */
export async function getWeatherForLocation(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  if (!apiKey) {
    throw new Error('OpenWeatherMap API key not configured');
  }

  // Fetch current weather and 5-day forecast in parallel
  const [currentResponse, forecastResponse] = await Promise.all([
    fetch(
      `${API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pl`
    ),
    fetch(
      `${API_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pl`
    ),
  ]);

  if (!currentResponse.ok) {
    const error = await currentResponse.text();
    throw new Error(`Weather API error: ${error}`);
  }

  if (!forecastResponse.ok) {
    const error = await forecastResponse.text();
    throw new Error(`Forecast API error: ${error}`);
  }

  const currentData: OpenWeatherMapCurrentResponse = await currentResponse.json();
  const forecastData: OpenWeatherMapForecastResponse = await forecastResponse.json();

  // Transform current weather
  const current: CurrentWeather = {
    temp: currentData.main.temp,
    feels_like: currentData.main.feels_like,
    humidity: currentData.main.humidity,
    pressure: currentData.main.pressure,
    wind_speed: currentData.wind.speed,
    wind_deg: currentData.wind.deg,
    clouds: currentData.clouds.all,
    visibility: currentData.visibility,
    weather: currentData.weather[0],
    rain_1h: currentData.rain?.['1h'],
    rain_3h: currentData.rain?.['3h'],
    snow_1h: currentData.snow?.['1h'],
    snow_3h: currentData.snow?.['3h'],
    dt: currentData.dt,
    sunrise: currentData.sys.sunrise,
    sunset: currentData.sys.sunset,
  };

  // Transform hourly forecast (next 24 hours = 8 x 3h intervals)
  const hourly: HourlyForecast[] = forecastData.list.slice(0, 8).map((item) => ({
    dt: item.dt,
    temp: item.main.temp,
    feels_like: item.main.feels_like,
    humidity: item.main.humidity,
    weather: item.weather[0],
    pop: item.pop,
    rain_3h: item.rain?.['3h'],
    snow_3h: item.snow?.['3h'],
  }));

  // Aggregate daily forecast (5 days)
  const dailyMap = new Map<string, DailyForecast>();
  for (const item of forecastData.list) {
    const date = new Date(item.dt * 1000).toISOString().split('T')[0];
    const existing = dailyMap.get(date);

    if (!existing) {
      dailyMap.set(date, {
        dt: item.dt,
        temp_min: item.main.temp_min,
        temp_max: item.main.temp_max,
        humidity: item.main.humidity,
        weather: item.weather[0],
        pop: item.pop,
        rain: item.rain?.['3h'],
        snow: item.snow?.['3h'],
      });
    } else {
      // Update min/max temps and accumulate precipitation
      existing.temp_min = Math.min(existing.temp_min, item.main.temp_min);
      existing.temp_max = Math.max(existing.temp_max, item.main.temp_max);
      existing.pop = Math.max(existing.pop, item.pop);
      if (item.rain?.['3h']) {
        existing.rain = (existing.rain || 0) + item.rain['3h'];
      }
      if (item.snow?.['3h']) {
        existing.snow = (existing.snow || 0) + item.snow['3h'];
      }
      // Use midday weather as representative
      const itemHour = new Date(item.dt * 1000).getHours();
      if (itemHour >= 11 && itemHour <= 14) {
        existing.weather = item.weather[0];
      }
    }
  }

  const daily = Array.from(dailyMap.values()).slice(0, 5);

  return {
    current,
    hourly,
    daily,
    location: {
      name: currentData.name,
      country: currentData.sys.country,
      lat: currentData.coord.lat,
      lon: currentData.coord.lon,
    },
    timezone: `UTC${forecastData.city.timezone >= 0 ? '+' : ''}${forecastData.city.timezone / 3600}`,
    fetched_at: new Date().toISOString(),
  };
}

/**
 * Get centroid of a GeoJSON polygon for weather lookup
 */
export function getPolygonCentroid(coordinates: number[][][]): { lat: number; lon: number } {
  const ring = coordinates[0]; // Outer ring
  let sumLat = 0;
  let sumLon = 0;

  for (const point of ring) {
    sumLon += point[0];
    sumLat += point[1];
  }

  return {
    lat: sumLat / ring.length,
    lon: sumLon / ring.length,
  };
}

/**
 * Get weather icon URL
 */
export function getWeatherIconUrl(iconCode: string, size: '1x' | '2x' | '4x' = '2x'): string {
  const sizeMap = { '1x': '', '2x': '@2x', '4x': '@4x' };
  return `https://openweathermap.org/img/wn/${iconCode}${sizeMap[size]}.png`;
}

/**
 * Map weather conditions to moisture impact
 * Returns a factor indicating how weather affects soil moisture
 * Positive = increases moisture, Negative = decreases moisture
 */
export function calculateMoistureImpact(weather: WeatherData): {
  impact: 'increasing' | 'decreasing' | 'stable';
  factor: number; // -1 to +1
  reasons: string[];
} {
  const reasons: string[] = [];
  let factor = 0;

  // Rain increases moisture
  if (weather.current.rain_1h || weather.current.rain_3h) {
    const rainAmount = weather.current.rain_1h || (weather.current.rain_3h || 0) / 3;
    if (rainAmount > 5) {
      factor += 0.8;
      reasons.push('Intensywne opady deszczu');
    } else if (rainAmount > 1) {
      factor += 0.5;
      reasons.push('Umiarkowane opady deszczu');
    } else {
      factor += 0.2;
      reasons.push('Lekkie opady deszczu');
    }
  }

  // Check forecast for rain
  const rainForecast = weather.hourly.some((h) => h.pop > 0.5);
  if (rainForecast) {
    factor += 0.2;
    reasons.push('Prognozowane opady w ciagu 24h');
  }

  // High temperature decreases moisture
  if (weather.current.temp > 30) {
    factor -= 0.6;
    reasons.push('Bardzo wysoka temperatura');
  } else if (weather.current.temp > 25) {
    factor -= 0.3;
    reasons.push('Wysoka temperatura');
  }

  // Wind increases evaporation
  if (weather.current.wind_speed > 10) {
    factor -= 0.3;
    reasons.push('Silny wiatr zwieksza parowanie');
  } else if (weather.current.wind_speed > 5) {
    factor -= 0.1;
    reasons.push('Umiarkowany wiatr');
  }

  // Low humidity decreases moisture
  if (weather.current.humidity < 40) {
    factor -= 0.3;
    reasons.push('Niska wilgotnosc powietrza');
  } else if (weather.current.humidity > 80) {
    factor += 0.1;
    reasons.push('Wysoka wilgotnosc powietrza');
  }

  // Cloud cover reduces evaporation
  if (weather.current.clouds > 80) {
    factor += 0.1;
    reasons.push('Duze zachmurzenie ogranicza parowanie');
  } else if (weather.current.clouds < 20) {
    factor -= 0.1;
    reasons.push('Bezchmurne niebo');
  }

  // Normalize factor to -1 to +1
  factor = Math.max(-1, Math.min(1, factor));

  let impact: 'increasing' | 'decreasing' | 'stable';
  if (factor > 0.2) {
    impact = 'increasing';
  } else if (factor < -0.2) {
    impact = 'decreasing';
  } else {
    impact = 'stable';
  }

  if (reasons.length === 0) {
    reasons.push('Stabilne warunki pogodowe');
  }

  return { impact, factor, reasons };
}
