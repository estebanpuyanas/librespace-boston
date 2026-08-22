import { getLibreSpaceBostonAPI } from 'shared';
import type { WeatherConditions } from 'shared';

export const getCurrentWeather = (lat: number, lon: number): Promise<WeatherConditions> =>
  getLibreSpaceBostonAPI().getWeather({ lat, lon });
