"use client"
import { useState, useEffect, useCallback, useRef } from 'react'
import type { BordeauxRoute, RecommendationResult, WeatherData, SunData } from '@/lib/route-engine'
import { recommendRoutes, getRunHistory } from '@/lib/route-engine'
import { fetchWeather, fetchSunData } from '@/lib/weather'
import { getProfile, getRuns } from '@/lib/storage'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface RouteEngineState {
  recommendations: RecommendationResult[]
  weather: WeatherData | null
  sunData: SunData | null
  loading: boolean
  selectedRoute: BordeauxRoute | null
  setSelectedRoute: (route: BordeauxRoute | null) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY STATS HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the Monday of the current week at 00:00 local time. */
function getWeekStart(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day // Monday-based
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

/** Returns how many days remain until Sunday (inclusive of today). */
function daysLeftInWeek(): number {
  const now   = new Date()
  const day   = now.getDay() // 0=Sun, 1=Mon … 6=Sat
  const daysMon = day === 0 ? 7 : day  // days since Monday (1-7)
  return Math.max(1, 8 - daysMon)
}

interface WeeklyStats {
  weeklyKm: number
  weeklyGoal: number
  daysLeft: number
}

function computeWeeklyStats(): WeeklyStats {
  const runs      = getRuns()
  const weekStart = getWeekStart()

  const weeklyKm = runs
    .filter(r => new Date(r.date) >= weekStart)
    .reduce((sum, r) => sum + r.distance, 0)

  // Read weekly goal from localStorage (stored by goals system under active profile)
  let weeklyGoal = 40 // sensible default
  if (typeof window !== 'undefined') {
    try {
      const activeProfile = localStorage.getItem('pp_active_profile') || 'dydz'
      const raw = localStorage.getItem(`pp_${activeProfile}_goals`)
      if (raw) {
        const goals = JSON.parse(raw) as Array<{ type: string; period: string; target: number }>
        const weekDistGoal = goals.find(g => g.type === 'distance' && g.period === 'week')
        if (weekDistGoal) weeklyGoal = weekDistGoal.target
      }
    } catch {
      // Use default
    }
  }

  return { weeklyKm, weeklyGoal, daysLeft: daysLeftInWeek() }
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

const REFRESH_INTERVAL_MS = 30 * 60 * 1000 // 30 minutes

export function useRouteEngine(): RouteEngineState {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([])
  const [weather,         setWeather]         = useState<WeatherData | null>(null)
  const [sunData,         setSunData]         = useState<SunData | null>(null)
  const [loading,         setLoading]         = useState(true)
  const [selectedRoute,   setSelectedRoute]   = useState<BordeauxRoute | null>(null)

  // Keep a ref to routes so the refresh timer can access the latest value
  const routesRef = useRef<BordeauxRoute[]>([])

  const buildRecommendations = useCallback(
    (w: WeatherData, s: SunData, routes: BordeauxRoute[]) => {
      const profile     = getProfile()
      const restHR      = profile?.restHR   ?? 50
      const { weeklyKm, weeklyGoal, daysLeft } = computeWeeklyStats()

      // Compute average resting HR from last 7 days of run history
      const history  = getRunHistory()
      const hrValues = history
        .filter(e => e.avg_hr !== undefined)
        .map(e => e.avg_hr as number)
      const avgRestHR = hrValues.length > 0
        ? hrValues.reduce((s, v) => s + v, 0) / hrValues.length
        : restHR

      const results = recommendRoutes(
        routes, w, s,
        weeklyKm, weeklyGoal, daysLeft,
        restHR, avgRestHR
      )

      setRecommendations(results)
    },
    []
  )

  const fetchAll = useCallback(async () => {
    const apiKey = process.env.NEXT_PUBLIC_OWM_API_KEY ?? ''

    // Fetch weather + sun in parallel
    const [w, s] = await Promise.all([
      fetchWeather(apiKey),
      fetchSunData(),
    ])

    setWeather(w)
    setSunData(s)

    // Load routes from static JSON
    let routes: BordeauxRoute[] = routesRef.current
    if (routes.length === 0) {
      try {
        const res = await fetch('/data/routes-bordeaux.json')
        if (res.ok) {
          routes = await res.json() as BordeauxRoute[]
          routesRef.current = routes
        }
      } catch {
        // Routes file not yet present — recommendations will be empty
      }
    }

    if (routes.length > 0) {
      buildRecommendations(w, s, routes)
    }

    setLoading(false)
  }, [buildRecommendations])

  // Initial fetch
  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Re-fetch weather every 30 minutes
  useEffect(() => {
    const timer = setInterval(fetchAll, REFRESH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [fetchAll])

  return {
    recommendations,
    weather,
    sunData,
    loading,
    selectedRoute,
    setSelectedRoute,
  }
}
