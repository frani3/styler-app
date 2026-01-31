import { useState, useEffect } from "react";

export function useWeather() {
  const [weather, setWeather] = useState<string>("Buscando clima...");
  const [temp, setTemp] = useState<number | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Usamos Open-Meteo (Gratis, sin API Key)
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`
          );
          const data = await response.json();
          
          const temperature = data.current.temperature_2m;
          const code = data.current.weather_code;
          
          // Traducir código WMO a texto simple
          const condition = getWeatherDescription(code);
          
          setTemp(temperature);
          setWeather(`${temperature}°C, ${condition}`);
          
        } catch (error) {
          console.error("Error obteniendo clima:", error);
          setWeather("Clima no disponible");
        }
      });
    } else {
      setWeather("Ubicación no permitida");
    }
  }, []);

  return { weatherText: weather, temperature: temp };
}

// Helper simple para traducir códigos numéricos de clima
function getWeatherDescription(code: number): string {
  if (code === 0) return "Despejado";
  if (code >= 1 && code <= 3) return "Parcialmente nublado";
  if (code >= 45 && code <= 48) return "Neblina";
  if (code >= 51 && code <= 67) return "Lluvia ligera";
  if (code >= 71 && code <= 77) return "Nieve";
  if (code >= 80 && code <= 82) return "Lluvia fuerte";
  if (code >= 95) return "Tormenta";
  return "Variable";
}