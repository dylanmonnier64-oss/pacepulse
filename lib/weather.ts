// Fetches weather and sun data for Bordeaux.
// Caches in localStorage with 1h TTL for weather, 24h for sun.
// Keys: vomero_weather_cache, vomero_sun_cache

import type { WeatherData, SunData } from './route-engine'

const BORDEAUX = { lat: 44.837, lon: -0.579 } as const

const CACHE_KEY_WEATHER = 'vomero_weather_cache'
const CACHE_KEY_SUN     = 'vomero_sun_cache'

const TTL_WEATHER_MS = 60 * 60 * 1000        // 1 hour
const TTL_SUN_MS     = 24 * 60 * 60 * 1000   // 24 hours

// ─────────────────────────────────────────────────────────────────────────────
// CACHE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T
  cachedAt: number  // Date.now() timestamp
}

function readCache<T>(key: string, ttlMs: number): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (Date.now() - entry.cachedAt > ttlMs) return null
    return entry.data
  } catch {
    return null
  }
}

function writeCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  try {
    const entry: CacheEntry<T> = { data, cachedAt: Date.now() }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // Silently ignore quota exceeded or other errors
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WEATHER CONDITION MAPPING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps an OpenWeatherMap weather ID + icon to a simplified conditions string
 * compatible with WeatherData.conditions.
 */
function mapConditions(weatherId: number, icon: string): string {
  if (weatherId >= 200 && weatherId < 300) return 'rainy'  // thunderstorm
  if (weatherId >= 300 && weatherId < 600) return 'rainy'  // drizzle + rain
  if (weatherId >= 600 && weatherId < 700) return 'snow'
  if (weatherId >= 700 && weatherId < 800) return 'cloudy' // atmosphere (mist, fog…)
  if (weatherId === 800) return icon.endsWith('d') ? 'sunny' : 'sunny' // clear sky
  if (weatherId === 801 || weatherId === 802) return 'cloudy'
  if (weatherId >= 803) return 'cloudy'
  return 'sunny'
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT WEATHER (fallback on error)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_WEATHER: WeatherData = {
  temp: 18,
  description: 'Dégagé',
  wind: 10,
  humidity: 50,
  icon: '01d',
  conditions: 'sunny',
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCH WEATHER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches current weather for Bordeaux from OpenWeatherMap.
 * Caches result in localStorage for 1 hour.
 * Falls back to DEFAULT_WEATHER on any error.
 */
export async function fetchWeather(apiKey: string): Promise<WeatherData> {
  // Return cached data if still valid
  const cached = readCache<WeatherData>(CACHE_KEY_WEATHER, TTL_WEATHER_MS)
  if (cached) return cached

  try {
    const url =
      `https://api.openweathermap.org/data/2.5/weather` +
      `?lat=${BORDEAUX.lat}&lon=${BORDEAUX.lon}` +
      `&appid=${apiKey}&units=metric&lang=fr`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`OWM HTTP ${res.status}`)

    const json = await res.json()

    const weatherId: number = json.weather?.[0]?.id ?? 800
    const icon: string      = json.weather?.[0]?.icon ?? '01d'

    const data: WeatherData = {
      temp:        Math.round(json.main?.temp ?? DEFAULT_WEATHER.temp),
      description: json.weather?.[0]?.description ?? DEFAULT_WEATHER.description,
      wind:        Math.round((json.wind?.speed ?? DEFAULT_WEATHER.wind / 3.6) * 3.6), // m/s → km/h
      humidity:    json.main?.humidity ?? DEFAULT_WEATHER.humidity,
      icon,
      conditions:  mapConditions(weatherId, icon),
    }

    writeCache(CACHE_KEY_WEATHER, data)
    return data
  } catch {
    return DEFAULT_WEATHER
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCH SUN DATA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches sunrise/sunset times for Bordeaux from sunrise-sunset.org.
 * Caches result in localStorage for 24 hours.
 * Computes minutesToSunset and minutesToSunrise relative to the current time.
 */
export async function fetchSunData(): Promise<SunData> {
  const cached = readCache<SunData>(CACHE_KEY_SUN, TTL_SUN_MS)
  if (cached) {
    // Recompute minute deltas from current time since times are still valid today
    return recomputeDeltas(cached)
  }

  try {
    const url =
      `https://api.sunrise-sunset.org/json` +
      `?lat=${BORDEAUX.lat}&lng=${BORDEAUX.lon}&formatted=0`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`Sunrise API HTTP ${res.status}`)

    const json = await res.json()
    if (json.status !== 'OK') throw new Error('Sunrise API returned non-OK status')

    // API returns ISO UTC strings (formatted=0)
    const sunriseUTC = new Date(json.results.sunrise)
    const sunsetUTC  = new Date(json.results.sunset)

    const sunrise = toLocalTimeString(sunriseUTC)
    const sunset  = toLocalTimeString(sunsetUTC)

    const data: SunData = {
      sunrise,
      sunset,
      ...computeDeltas(sunriseUTC, sunsetUTC),
    }

    writeCache(CACHE_KEY_SUN, data)
    return data
  } catch {
    // Fallback: reasonable Bordeaux defaults (summer equinox range)
    return {
      sunrise: '07:00',
      sunset:  '21:00',
      minutesToSunset:  null,
      minutesToSunrise: null,
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TIME HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Formats a Date object to a "HH:mm" string in the user's local timezone. */
function toLocalTimeString(date: Date): string {
  const hh = date.getHours().toString().padStart(2, '0')
  const mm = date.getMinutes().toString().padStart(2, '0')
  return `${hh}:${mm}`
}

interface Deltas {
  minutesToSunset: number | null
  minutesToSunrise: number | null
}

/**
 * Computes how many minutes remain until sunset/sunrise from now.
 * Returns null if the event has already passed today.
 */
function computeDeltas(sunriseDate: Date, sunsetDate: Date): Deltas {
  const now = Date.now()

  const minsToSunset  = Math.round((sunsetDate.getTime()  - now) / 60_000)
  const minsToSunrise = Math.round((sunriseDate.getTime() - now) / 60_000)

  return {
    minutesToSunset:  minsToSunset  > 0 ? minsToSunset  : null,
    minutesToSunrise: minsToSunrise > 0 ? minsToSunrise : null,
  }
}

/**
 * Re-derives live minute deltas from the cached HH:mm strings (today's date assumed).
 */
function recomputeDeltas(cached: SunData): SunData {
  const todayStr = new Date().toISOString().split('T')[0]

  const sunriseDate = new Date(`${todayStr}T${cached.sunrise}:00`)
  const sunsetDate  = new Date(`${todayStr}T${cached.sunset}:00`)

  return {
    ...cached,
    ...computeDeltas(sunriseDate, sunsetDate),
  }
}
