import React from 'react';
import { type HanoiWeatherState } from '../game/lifeSim/hanoiWeatherSystem';

interface WeatherHudBadgeProps {
  weather: HanoiWeatherState;
  className?: string;
}

export const WeatherHudBadge: React.FC<WeatherHudBadgeProps> = ({
  weather,
  className = '',
}) => {
  const icon =
    weather.condition === 'sunny_hot'
      ? '☀️'
      : weather.condition === 'sudden_rain'
      ? '🌧️'
      : weather.condition === 'overcast_humid'
      ? '⛅'
      : '🍂';

  const demandTag =
    weather.modifiers.hotDrinkPriceMultiplier > 1.1
      ? 'Trà nóng +35%'
      : weather.modifiers.icedDrinkPriceMultiplier > 1.1
      ? 'Trà đá giải nhiệt +35%'
      : 'Nhu cầu ổn định';

  return (
    <div
      className={`weather-hud-badge weather-${weather.condition} ${className}`}
      role="status"
      aria-label={`Thời tiết: ${weather.title}, ${weather.temperatureC}°C`}
    >
      <div className="weather-badge-icon" aria-hidden="true">
        {icon}
      </div>
      <div className="weather-badge-info">
        <div className="weather-temp-row">
          <span className="weather-temp">{weather.temperatureC}°C</span>
          <span className="weather-title">{weather.title}</span>
        </div>
        <small className="weather-demand">{demandTag}</small>
      </div>
    </div>
  );
};
