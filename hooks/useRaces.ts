"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import type { RaceEvent, RaceType, RacesResponse } from "@/app/api/races/route"

export type { RaceEvent, RaceType }

export interface RaceFilters {
  type:     RaceType | "all"
  distance: number | "all"    // km (5, 10, 21.1, 42.195 ou "all")
  month:    number | "all"    // 1-12 ou "all"
  search:   string
}

const DEFAULT_FILTERS: RaceFilters = {
  type: "all", distance: "all", month: "all", search: "",
}

// ── Noms des mois en français ─────────────────────────────────────
export const MONTHS_FR: Record<number, string> = {
  1: "Janvier", 2: "Février",  3: "Mars",     4: "Avril",
  5: "Mai",     6: "Juin",     7: "Juillet",  8: "Août",
  9: "Septembre", 10: "Octobre", 11: "Novembre", 12: "Décembre",
}

// ── Labels des types ─────────────────────────────────────────────
export const TYPE_LABELS: Record<string, string> = {
  all: "Tous",
  route: "Route",
  trail: "Trail",
  marathon: "Marathon",
  cross: "Cross",
  urban: "Urbaine",
}

export const DISTANCE_LABELS: Record<string | number, string> = {
  "all": "Toutes",
  5: "5 km",
  10: "10 km",
  21.1: "Semi-marathon",
  42.195: "Marathon",
}

// ── Couleurs par type ─────────────────────────────────────────────
export const TYPE_COLORS: Record<string, string> = {
  route:    "#3B82F6",
  trail:    "#22C55E",
  marathon: "#D4AF37",
  cross:    "#F97316",
  urban:    "#A855F7",
}

export const TYPE_EMOJIS: Record<string, string> = {
  route:    "🏃",
  trail:    "🌲",
  marathon: "🏆",
  cross:    "🌿",
  urban:    "🌃",
}

// ── Format date en français ───────────────────────────────────────
export function formatDateFr(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
}

export function formatDateShortFr(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
}

export function daysUntil(dateStr: string): number {
  const now  = new Date(); now.setHours(0, 0, 0, 0)
  const date = new Date(dateStr + "T00:00:00")
  return Math.ceil((date.getTime() - now.getTime()) / 86400000)
}

// ── Hook ──────────────────────────────────────────────────────────
export function useRaces() {
  const [events, setEvents]     = useState<RaceEvent[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [filters, setFilters]   = useState<RaceFilters>(DEFAULT_FILTERS)
  const [availableMonths, setAvailableMonths] = useState<number[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const fetchRaces = useCallback(async (f: RaceFilters) => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (f.type     !== "all") params.set("type",       f.type)
      if (f.distance !== "all") params.set("distanceKm", String(f.distance))
      if (f.month    !== "all") params.set("month",      String(f.month))
      if (f.search)             params.set("search",     f.search)

      const res = await fetch(`/api/races?${params}`, { signal: abortRef.current.signal })
      if (!res.ok) throw new Error("Erreur de chargement")
      const data: RacesResponse = await res.json()
      setEvents(data.events)
      setTotal(data.total)
      setAvailableMonths(data.filters.months)
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError("Impossible de charger les courses. Réessaye dans un instant.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRaces(filters)
  }, [filters, fetchRaces])

  const updateFilter = useCallback(<K extends keyof RaceFilters>(key: K, value: RaceFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  const hasActiveFilters = filters.type !== "all" || filters.distance !== "all" ||
    filters.month !== "all" || filters.search !== ""

  return {
    events, total, loading, error,
    filters, updateFilter, resetFilters, hasActiveFilters,
    availableMonths,
    refresh: () => fetchRaces(filters),
  }
}
