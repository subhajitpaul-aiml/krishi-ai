import React, { useEffect, useState } from "react";
import { fetchWeather } from "./api";

const icons = {
  "01d": "☀️", "01n": "🌙", "02d": "⛅", "02n": "⛅",
  "03d": "☁️", "03n": "☁️", "04d": "☁️", "04n": "☁️",
  "09d": "🌧️", "09n": "🌧️", "10d": "🌦️", "10n": "🌦️",
  "11d": "⛈️", "11n": "⛈️", "13d": "❄️", "13n": "❄️",
  "50d": "🌫️", "50n": "🌫️",
};

export default function WeatherWidget({ lat = 23.55, lon = 87.32 }) {
  const [weather, setWeather] = useState(null);
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeather(lat, lon)
      .then(r => setWeather(r.data))
      .catch(() => setError("Could not fetch weather."))
      .finally(() => setLoading(false));
  }, [lat, lon]);

  if (loading) return <div className="weather-card loading">Fetching weather…</div>;
  if (error)   return <div className="weather-card error">{error}</div>;

  const emoji = icons[weather.icon] || "🌡️";

  return (
    <div className="weather-card">
      <div className="weather-top">
        <span className="weather-emoji">{emoji}</span>
        <div>
          <div className="weather-location">{weather.location}</div>
          <div className="weather-desc">{weather.description}</div>
        </div>
      </div>
      <div className="weather-grid">
        <Stat label="Temp"      value={`${weather.temperature}°C`} />
        <Stat label="Humidity"  value={`${weather.humidity}%`}     />
        <Stat label="Wind"      value={`${weather.wind_speed} km/h`} />
        <Stat label="Rainfall"  value={`${weather.rainfall} mm`}   />
      </div>
      {weather.mock && <div className="mock-badge">⚠ Mock data</div>}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="weather-stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}
