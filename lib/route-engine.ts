// Route recommendation engine for PacePulse — Bordeaux routes

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export interface BordeauxRoute {
  id: string
  name: string
  distance_km: number
  elevation_gain_m: number
  terrain_type: string       // e.g. "quais" | "parc" | "forêt" | "urbain" | "mixte"
  surface: string            // "goudron" | "terre" | "mixte"
  difficulty: 'débutant' | 'intermédiaire' | 'avancé'
  loop: boolean
  start_coordinates: [number, number]  // [lng, lat]
  geojson_path: string
  points_of_interest: string[]
  zones: string[]
  scenic_score: number
  sunset_score: number
  sunrise_score: number
  wet_weather_compatible: boolean
  // compat aliases (optional)
  description?: string
  estimated_duration_min?: number
}

export interface RunHistoryEntry {
  route_id: string
  date_iso: string           // ISO 8601
  distance_km: number
  duration_min: number
  avg_hr?: number
}

export interface RecommendationResult {
  route: BordeauxRoute
  score: number
  reason: string             // French explanation of dominant scoring factor
  idealStartTime: string     // e.g. "18:30"
}

export interface SunData {
  sunrise: string                        // HH:mm (local French time)
  sunset: string                         // HH:mm (local French time)
  minutesToSunset: number | null         // null if already set today
  minutesToSunrise: number | null        // null if already risen
}

export interface WeatherData {
  temp: number
  description: string
  wind: number               // km/h
  humidity: number           // %
  icon: string               // OpenWeatherMap icon code e.g. "01d"
  conditions: string         // mapped condition string e.g. "sunny" | "rainy" | ...
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCALSTORAGE KEYS
// ─────────────────────────────────────────────────────────────────────────────

const RUN_HISTORY_KEY = 'vomero_run_history'

// ─────────────────────────────────────────────────────────────────────────────
// RUN HISTORY
// ─────────────────────────────────────────────────────────────────────────────

export function getRunHistory(): RunHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RUN_HISTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw) as RunHistoryEntry[]
  } catch {
    return []
  }
}

export function saveRunHistory(entries: RunHistoryEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(RUN_HISTORY_KEY, JSON.stringify(entries))
  } catch {
    // Silently ignore quota exceeded or other errors
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORING HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the number of days since a route was last run, or null if never. */
function daysSinceLastRun(routeId: string, runHistory: RunHistoryEntry[]): number | null {
  const entries = runHistory.filter(e => e.route_id === routeId)
  if (entries.length === 0) return null

  const latest = entries.reduce((best, e) =>
    new Date(e.date_iso) > new Date(best.date_iso) ? e : best
  )

  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((Date.now() - new Date(latest.date_iso).getTime()) / msPerDay)
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE ROUTE  (0-110)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score a single route out of 110 points.
 *
 * Breakdown:
 *  25 pts — distance match
 *  20 pts — weather compatibility
 *  20 pts — sun timing
 *  20 pts — anti-repeat freshness
 *  15 pts — recovery-aware difficulty
 *  10 pts — discovery bonus (never run)
 */
export function scoreRoute(
  route: BordeauxRoute,
  weather: WeatherData,
  sunData: SunData,
  weeklyKm: number,
  weeklyGoal: number,
  daysLeft: number,
  runHistory: RunHistoryEntry[],
  restHR: number,
  avgRestHR: number
): number {
  let total = 0

  // ── 1. Distance score (25 pts) ──────────────────────────────────────────
  const idealKm = (weeklyGoal - weeklyKm) / Math.max(daysLeft, 1)
  const distanceScore =
    idealKm > 0
      ? 25 * Math.max(0, 1 - Math.abs(route.distance_km - idealKm) / idealKm)
      : 12 // fallback mid-score when goal already met
  total += distanceScore

  // ── 2. Weather score (20 pts) ───────────────────────────────────────────
  const isRainy = weather.conditions === 'rainy' || weather.humidity > 80
  const isHot   = weather.temp > 28
  const isIdeal = weather.temp >= 15 && weather.temp <= 22 && !isRainy

  let weatherScore = 12 // default

  if (isRainy && route.wet_weather_compatible) {
    weatherScore = 20
  } else if (weather.wind > 30 && route.zones.some(z => z.toLowerCase().includes('quais'))) {
    weatherScore = Math.max(0, weatherScore - 10)
  } else if (isHot && ['forêt', 'parc'].includes(route.terrain_type.toLowerCase())) {
    weatherScore = 20
  } else if (isIdeal) {
    weatherScore = 20
  }

  total += weatherScore

  // ── 3. Sun score (20 pts) ───────────────────────────────────────────────
  let sunScore = 10 // default

  if (sunData.minutesToSunset !== null && sunData.minutesToSunset >= 0 && sunData.minutesToSunset <= 120) {
    sunScore = route.sunset_score * 2  // scale 0-10 → 0-20
  } else if (sunData.minutesToSunrise !== null && sunData.minutesToSunrise >= 0 && sunData.minutesToSunrise <= 60) {
    sunScore = route.sunrise_score * 2
  }

  total += sunScore

  // ── 4. Anti-repeat score (20 pts) ───────────────────────────────────────
  const days = daysSinceLastRun(route.id, runHistory)
  let freshScore: number

  if (days === null || days > 21) {
    freshScore = 20
  } else if (days >= 15) {
    freshScore = 15
  } else if (days >= 8) {
    freshScore = 10
  } else {
    freshScore = 0
  }

  total += freshScore

  // ── 5. Recovery score (15 pts) ──────────────────────────────────────────
  const isElevatedHR = avgRestHR > 0 && restHR > avgRestHR * 1.1
  const isAdvanced   = route.difficulty === 'avancé'

  total += isElevatedHR && isAdvanced ? 5 : 15

  // ── 6. Discovery bonus (10 pts) ─────────────────────────────────────────
  if (days === null) {
    total += 10
  }

  return Math.round(total)
}

// ─────────────────────────────────────────────────────────────────────────────
// REASON GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

function buildReason(
  route: BordeauxRoute,
  weather: WeatherData,
  sunData: SunData,
  weeklyKm: number,
  weeklyGoal: number,
  daysLeft: number,
  runHistory: RunHistoryEntry[],
  restHR: number,
  avgRestHR: number
): string {
  const days = daysSinceLastRun(route.id, runHistory)
  const idealKm = (weeklyGoal - weeklyKm) / Math.max(daysLeft, 1)
  const distanceDelta = Math.abs(route.distance_km - idealKm)
  const isRainy = weather.conditions === 'rainy' || weather.humidity > 80
  const isHot = weather.temp > 28
  const isIdeal = weather.temp >= 15 && weather.temp <= 22 && !isRainy
  const elevatedHR = avgRestHR > 0 && restHR > avgRestHR * 1.1
  const sunsetWindow = sunData.minutesToSunset !== null && sunData.minutesToSunset >= 0 && sunData.minutesToSunset <= 120
  const sunriseWindow = sunData.minutesToSunrise !== null && sunData.minutesToSunrise >= 0 && sunData.minutesToSunrise <= 60

  // Priority: discovery → sun timing → weather → recovery → freshness → distance
  if (days === null) {
    return `Nouveau parcours à découvrir — ${route.name} n'a encore jamais été couru.`
  }

  if (sunsetWindow && route.sunset_score >= 8) {
    const mins = sunData.minutesToSunset as number
    return `Coucher de soleil dans ${mins} min — itinéraire idéal pour profiter des lumières de Bordeaux.`
  }

  if (sunriseWindow && route.sunrise_score >= 8) {
    return `Lever du soleil imminent — parfait pour une sortie matinale sur ce parcours panoramique.`
  }

  if (elevatedHR && route.difficulty !== 'avancé') {
    return `Fréquence cardiaque de repos élevée détectée — parcours ${route.difficulty} recommandé pour la récupération.`
  }

  if (isRainy && route.wet_weather_compatible) {
    return `Temps pluvieux ou humidité forte — ce parcours est conçu pour les conditions humides.`
  }

  if (isHot && ['forêt', 'parc'].includes(route.terrain_type.toLowerCase())) {
    return `Fortes chaleurs (${weather.temp}°C) — les zones ombragées de ce parcours offrent un confort thermique optimal.`
  }

  if (isIdeal) {
    return `Conditions météo idéales (${weather.temp}°C, ${weather.description}) — excellent moment pour sortir.`
  }

  if (days > 21) {
    return `Ce parcours n'a pas été couru depuis ${days} jours — retour bienvenu pour varier les stimuli.`
  }

  if (distanceDelta <= 1) {
    return `Distance parfaitement alignée avec votre objectif hebdomadaire (${idealKm.toFixed(1)} km restants à planifier).`
  }

  return `Bon équilibre entre distance, terrain et conditions du jour pour atteindre votre objectif de ${weeklyGoal} km cette semaine.`
}

// ─────────────────────────────────────────────────────────────────────────────
// IDEAL START TIME
// ─────────────────────────────────────────────────────────────────────────────

function computeIdealStartTime(route: BordeauxRoute, sunData: SunData): string {
  const durationMin = route.estimated_duration_min ?? Math.round((route.distance_km / 10) * 60)

  // If there's a nice sunset coming up, start so that the run ends at sunset
  if (
    sunData.minutesToSunset !== null &&
    sunData.minutesToSunset >= 0 &&
    sunData.minutesToSunset <= 120 &&
    route.sunset_score >= 7
  ) {
    const startOffsetMin = Math.max(0, sunData.minutesToSunset - durationMin)
    const now = new Date()
    now.setMinutes(now.getMinutes() + startOffsetMin)
    const hh = now.getHours().toString().padStart(2, '0')
    const mm = now.getMinutes().toString().padStart(2, '0')
    return `${hh}:${mm}`
  }

  // Morning sunrise bonus
  if (
    sunData.minutesToSunrise !== null &&
    sunData.minutesToSunrise >= 0 &&
    sunData.minutesToSunrise <= 60 &&
    route.sunrise_score >= 7
  ) {
    const now = new Date()
    now.setMinutes(now.getMinutes() + (sunData.minutesToSunrise ?? 0))
    const hh = now.getHours().toString().padStart(2, '0')
    const mm = now.getMinutes().toString().padStart(2, '0')
    return `${hh}:${mm}`
  }

  // Default: suggest a run starting now rounded to nearest 15 min
  const now = new Date()
  const totalMin = now.getHours() * 60 + now.getMinutes()
  const rounded = Math.ceil(totalMin / 15) * 15
  const hh = Math.floor(rounded / 60) % 24
  const mm = rounded % 60
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`
}

// ─────────────────────────────────────────────────────────────────────────────
// RECOMMEND ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the top 3 recommended routes sorted by score descending.
 * 21-day rule: a route cannot be ranked #1 unless it was last run 21+ days ago,
 * OR its raw score exceeds 90.
 */
export function recommendRoutes(
  routes: BordeauxRoute[],
  weather: WeatherData,
  sunData: SunData,
  weeklyKm: number,
  weeklyGoal: number,
  daysLeft: number,
  restHR: number,
  avgRestHR: number
): RecommendationResult[] {
  const runHistory = getRunHistory()

  const scored = routes.map((route): RecommendationResult => {
    const score = scoreRoute(
      route, weather, sunData,
      weeklyKm, weeklyGoal, daysLeft,
      runHistory, restHR, avgRestHR
    )
    const reason = buildReason(
      route, weather, sunData,
      weeklyKm, weeklyGoal, daysLeft,
      runHistory, restHR, avgRestHR
    )
    const idealStartTime = computeIdealStartTime(route, sunData)
    return { route, score, reason, idealStartTime }
  })

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  // Apply 21-day rule: if #1 was run recently AND score <= 90, swap with next valid candidate
  if (scored.length >= 2) {
    const top = scored[0]
    const days = daysSinceLastRun(top.route.id, runHistory)
    const recentlyRun = days !== null && days < 21
    if (recentlyRun && top.score <= 90) {
      // Find the first candidate that satisfies the 21-day rule
      const altIdx = scored.findIndex((r, i) => {
        if (i === 0) return false
        const d = daysSinceLastRun(r.route.id, runHistory)
        return d === null || d >= 21
      })
      if (altIdx > 0) {
        // Swap #1 and the alt
        ;[scored[0], scored[altIdx]] = [scored[altIdx], scored[0]]
      }
    }
  }

  return scored.slice(0, 3)
}
