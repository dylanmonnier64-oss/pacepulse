"use client"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRuns } from "@/hooks/useRuns"
import type { ForecastInput, ForecastResponse, ConfidenceMode, ContributingRun } from "@/app/api/forecasts/route"

export type { ForecastInput, ForecastResponse, ConfidenceMode, ContributingRun }

// ── Formatage secondes → "H:MM:SS" / "MM:SS" ─────────────────────
export function fmtSeconds(sec: number | null): string {
  if (!sec || sec <= 0) return "--"
  const s = Math.round(sec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
  return `${m}:${String(ss).padStart(2, "0")}`
}

// ── Parse "H:MM:SS" / "MM:SS" → secondes ─────────────────────────
export function parseTime(str: string): number | null {
  const clean = str.trim()
  const hms = clean.match(/^(\d+):(\d{1,2}):(\d{2})$/)
  if (hms) return parseInt(hms[1]) * 3600 + parseInt(hms[2]) * 60 + parseInt(hms[3])
  const ms = clean.match(/^(\d+):(\d{2})$/)
  if (ms) return parseInt(ms[1]) * 60 + parseInt(ms[2])
  return null
}

// ── Hook ──────────────────────────────────────────────────────────
export function useForecasts() {
  const { runs } = useRuns()

  const [mode, setMode]     = useState<ConfidenceMode>("réaliste")
  const [result, setResult] = useState<ForecastResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Convertir les runs pour l'API (≥ 3 km, duration > 0)
  const runsForForecast = useMemo(() =>
    runs
      .filter(r => r.distance >= 3 && r.duration > 0)
      .map(r => ({
        id:       r.id,
        distance: r.distance,
        duration: r.duration,
        date:     r.date,
        type:     r.type,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [runs.length, runs.map(r => r.id).join(",")]
  )

  const calculate = useCallback(async (
    runsData: typeof runsForForecast,
    currentMode: ConfidenceMode,
  ) => {
    if (runsData.length === 0) { setResult(null); return }

    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/forecasts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ runs: runsData, mode: currentMode }),
        signal:  abortRef.current.signal,
      })
      if (!res.ok) throw new Error("Erreur API")
      const data: ForecastResponse = await res.json()
      setResult(data)
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError("Impossible de calculer les prévisions pour l'instant.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Recalcul automatique dès que runs ou mode changent
  useEffect(() => {
    calculate(runsForForecast, mode)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runsForForecast.length, mode])

  return {
    mode,
    setMode,
    result,
    loading,
    error,
    runsCount:       runsForForecast.length,
    contributingRuns: result?.contributingRuns ?? [],
    runsAnalyzed:    result?.runsAnalyzed ?? 0,
    analysisMethod:  result?.analysisMethod ?? "training_runs",
    refresh: () => calculate(runsForForecast, mode),
  }
}
