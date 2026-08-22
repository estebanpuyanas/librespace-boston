import { useEffect, useState } from 'react';
import { getCurrentWeather } from '../services/weather';
import type { SearchLocation } from '../types/app';

export interface CurrentWeather {
  temperature: number;
  weatherCode: number;
}

interface WeatherState {
  data: CurrentWeather | null;
  failed: boolean;
  loading: boolean;
}

export const useCurrentWeather = (location: SearchLocation | null): WeatherState => {
  const [state, setState] = useState<WeatherState>({ data: null, failed: false, loading: false });
  const lat = location?.lat;
  const lon = location?.lon;

  useEffect(() => {
    if (lat === undefined || lon === undefined) {
      setState({ data: null, failed: false, loading: false });
      return;
    }

    let active = true;
    setState({ data: null, failed: false, loading: true });
    void getCurrentWeather(lat, lon)
      .then(data => {
        if (!active) return;
        setState({
          data: {
            temperature: data.temperature_fahrenheit,
            weatherCode: data.weather_code,
          },
          failed: false,
          loading: false,
        });
      })
      .catch(() => {
        if (active) setState({ data: null, failed: true, loading: false });
      });

    return () => {
      active = false;
    };
  }, [lat, lon]);

  return state;
};
