// src/pages/guest/hooks/useWeather.ts
import { useEffect, useState } from 'react';

export interface WeatherData {
  temp: number;
  description: string;
  emoji: string;
}

// Open-Meteo weather code mapping
const WEATHER_EMOJI: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌦️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '❄️', 73: '❄️', 75: '❄️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  95: '⚡', 96: '⚡', 99: '⚡',
};

const WEATHER_DESC: Record<number, string> = {
  0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Fog',
  51: 'Drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Showers', 81: 'Showers', 82: 'Heavy showers',
  95: 'Storm', 96: 'Hail storm', 99: 'Severe storm',
};

const DEFAULT_WEATHER: WeatherData = {
  temp: 15,
  description: 'Loading...',
  emoji: '⏳',
};


export const useWeather = (city: string = 'Tashkent'): WeatherData => {
  const [weather, setWeather] = useState<WeatherData>(DEFAULT_WEATHER);

  useEffect(() => {
    let cancelled = false;

    const loadWeather = async () => {
      try {
        // 1-qadam: Shahar nomidan koordinatalar olish (geocoding)
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
        );
        const geo = await geoRes.json();

        // Default — Tashkent koordinatalari
        let lat = 41.3;
        let lon = 69.3;

        if (geo.results && geo.results.length) {
          lat = geo.results[0].latitude;
          lon = geo.results[0].longitude;
        }

        // 2-qadam: Ob-havo ma'lumotini olish
        const wRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`,
        );
        const w = await wRes.json();

        if (cancelled) return;

        if (w.current) {
          const code = w.current.weather_code;
          setWeather({
            temp: Math.round(w.current.temperature_2m),
            description: WEATHER_DESC[code] || 'Unknown',
            emoji: WEATHER_EMOJI[code] || '☀️',
          });
        }
      } catch (err) {
        console.warn('Weather fetch failed:', err);
        // Default qoladi
      }
    };

    loadWeather();

    return () => {
      cancelled = true;
    };
  }, [city]);

  return weather;
};