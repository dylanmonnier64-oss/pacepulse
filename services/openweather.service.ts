/**
 * openweather.service.ts — Clean facade over weather.ts with additional UV support.
 * API key read from NEXT_PUBLIC_OPENWEATHER_KEY env var.
 */

export { fetchWeather, fetchSunData } from "@/lib/weather"
export type { WeatherData, SunData } from "@/lib/route-engine"

const BORDEAUX = { lat: 44.837, lon: -0.579 }
const OWM_BASE = "https://api.openweathermap.org/data/2.5"

export interface UVData {
  uvi: number          // UV Index 0–11+
  risk: "low" | "moderate" | "high" | "very_high" | "extreme"
  recommendation: string
}

function uvRisk(uvi: number): UVData["risk"] {
  if (uvi < 3) return "low"
  if (uvi < 6) return "moderate"
  if (uvi < 8) return "high"
  if (uvi < 11) return "very_high"
  return "extreme"
}

const UV_ADVICE: Record<UVData["risk"], string> = {
  low: "Protection non nécessaire",
  moderate: "Crème SPF 30 recommandée",
  high: "Évitez 12h–15h, SPF 50+",
  very_high: "Protection maximale requise",
  extreme: "Restez à l'ombre — report recommandé",
}

export async function fetchUVIndex(apiKey?: string): Promise<UVData | null> {
  const key = apiKey ?? process.env.NEXT_PUBLIC_OPENWEATHER_KEY
  if (!key) return null

  try {
    const res = await fetch(
      `${OWM_BASE}/uvi?lat=${BORDEAUX.lat}&lon=${BORDEAUX.lon}&appid=${key}`
    )
    if (!res.ok) return null
    const data = await res.json()
    const uvi = Math.round(data.value ?? 0)
    const risk = uvRisk(uvi)
    return { uvi, risk, recommendation: UV_ADVICE[risk] }
  } catch {
    return null
  }
}

export function getRunningConditionsAdvice(tempC: number, windKmh: number, uvi: number): string {
  if (tempC < 0) return "Attention au verglas — réduisez l'allure"
  if (tempC < 5) return "Froid vif — couvrez extrémités et respirez par le nez"
  if (tempC > 30) return "Chaleur extrême — réduisez l'intensité de 15%"
  if (tempC > 25 && uvi > 6) return "Chaud + UV élevé — hydratez et portez une casquette"
  if (windKmh > 40) return "Vent fort — favorisez les zones abritées"
  if (windKmh > 25) return "Vent modéré — attendez-vous à −5% de performance"
  return "Conditions favorables pour courir"
}
