// src/pages/guest/components/GuestHeader.tsx
import React, { useEffect, useState } from 'react';
import { Hotel as HotelIcon, DoorOpen } from 'lucide-react';
import type { GuestHotel, GuestRoom, GuestSettings, WeatherData } from '@apptypes/guest';

interface Props {
  hotel: GuestHotel;
  room: GuestRoom;
  settings: GuestSettings;
}

const WEATHER_ICONS: Record<number, string> = {
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

const GuestHeader: React.FC<Props> = ({ hotel, room, settings }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Fetch weather (Open-Meteo, no API key)
  useEffect(() => {
    const search = hotel.city || hotel.address || 'Tashkent';

    const loadWeather = async () => {
      try {
        // Geocode
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(search)}&count=1`,
        );
        const geo = await geoRes.json();

        let lat = 41.3, lon = 69.3; // Tashkent fallback
        if (geo.results && geo.results.length) {
          lat = geo.results[0].latitude;
          lon = geo.results[0].longitude;
        }

        // Weather
        const wRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`,
        );
        const w = await wRes.json();

        if (w.current) {
          const code = w.current.weather_code;
          setWeather({
            temp: Math.round(w.current.temperature_2m),
            description: WEATHER_DESC[code] || '',
            icon: WEATHER_ICONS[code] || '☀️',
          });
        }
      } catch (err) {
        // Silently fail
      }
    };

    loadWeather();
  }, [hotel.city, hotel.address]);

  const hasHero = !!settings.hero_photo;

  return (
    <div className={hasHero ? 'guest-hero-banner' : 'guest-header-simple'}>
      {hasHero && (
        <>
          <img className="guest-hero-img" src={settings.hero_photo} alt={hotel.name} />
          <div className="guest-hero-overlay" />
          <div className="guest-hero-content">
            <div className="guest-hero-logo">
              {hotel.logo ? (
                <img src={hotel.logo} alt={hotel.name} />
              ) : (
                <HotelIcon size={22} />
              )}
            </div>
            <div className="guest-hero-info">
              <div className="guest-hero-hotel">{hotel.name}</div>
              {weather && (
                <div className="guest-weather">
                  <span className="guest-weather-icon">{weather.icon}</span>
                  <span className="guest-weather-temp">{weather.temp}°C</span>
                  <span className="guest-weather-sep">·</span>
                  <span className="guest-weather-desc">{weather.description}</span>
                </div>
              )}
              <div className="guest-hero-room">
                <DoorOpen size={12} strokeWidth={2.4} />
                Room {room.number}
              </div>
            </div>
          </div>
        </>
      )}

      {!hasHero && (
        <>
          <div className="guest-header-logo">
            {hotel.logo ? (
              <img src={hotel.logo} alt={hotel.name} />
            ) : (
              <HotelIcon size={26} />
            )}
          </div>
          <div className="guest-header-name">{hotel.name}</div>
          {weather && (
            <div className="guest-weather guest-weather-simple">
              <span className="guest-weather-icon">{weather.icon}</span>
              <span className="guest-weather-temp">{weather.temp}°C</span>
              <span className="guest-weather-sep">·</span>
              <span className="guest-weather-desc">{weather.description}</span>
            </div>
          )}
          <div className="guest-header-room">
            <DoorOpen size={12} strokeWidth={2.4} />
            Room {room.number}
          </div>
          <div className="guest-header-ornament" />
        </>
      )}
    </div>
  );
};

export default GuestHeader;