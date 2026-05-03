/**
 * MapPage — Page principale Cartographie IA PacePulse
 * Modules: Coach IA, WeatherBar, MapView Mapbox, RunCards, HeatmapToggle
 */
"use client"
import dynamic from "next/dynamic"
import { useState, useCallback, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Layers } from "lucide-react"
import { useRouteEngine } from "@/hooks/useRouteEngine"
import { getRunHistory, saveRunHistory } from "@/lib/route-engine"
import type { RecommendationResult } from "@/lib/route-engine"
import CoachBlock from "@/components/map/CoachBlock"
import WeatherBar from "@/components/map/WeatherBar"
import RunCards from "@/components/map/RunCards"
import SyncWidget from "@/components/health/SyncWidget"

// Mapbox GL JS must be loaded client-side only (WebGL + browser APIs)
const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center rounded-3xl"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
        <p className="text-xs text-text-muted">Chargement de la carte...</p>
      </div>
    </div>
  ),
})

export default function MapPage() {
  const {
    recommendations,
    weather,
    sunData,
    loading,
    selectedRoute,
    setSelectedRoute,
  } = useRouteEngine()

  const [showHeatmap, setShowHeatmap] = useState(false)
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [runTimer, setRunTimer] = useState(0)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)
  const [kmToast, setKmToast] = useState<string | null>(null)

  // GPS km tracking
  const gpsWatchRef = useRef<number | null>(null)
  const lastPosRef = useRef<GeolocationPosition | null>(null)
  const kmDistRef = useRef(0)
  const lastKmRef = useRef(0)
  const runTimerRef = useRef(0)

  useEffect(() => { runTimerRef.current = runTimer }, [runTimer])

  function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  function showKmNotification(km: number, paceStr: string) {
    const msg = `Km ${km} — Allure : ${paceStr} min/km`
    setKmToast(msg)
    setTimeout(() => setKmToast(null), 4000)
    if ("vibrate" in navigator) navigator.vibrate([200, 100, 200])
    if (Notification.permission === "granted") {
      new Notification("PacePulse 🏃", { body: msg, icon: "/icons/icon-192.png" })
    }
  }

  function startGpsTracking() {
    if (!navigator.geolocation) return
    if (Notification.permission === "default") Notification.requestPermission()
    kmDistRef.current = 0
    lastKmRef.current = 0
    lastPosRef.current = null

    gpsWatchRef.current = navigator.geolocation.watchPosition(pos => {
      if (lastPosRef.current) {
        const d = haversineKm(
          lastPosRef.current.coords.latitude, lastPosRef.current.coords.longitude,
          pos.coords.latitude, pos.coords.longitude
        )
        if (d < 0.5) { // ignore GPS jumps > 500m
          kmDistRef.current += d
          const newKm = Math.floor(kmDistRef.current)
          if (newKm > lastKmRef.current) {
            lastKmRef.current = newKm
            const elapsed = runTimerRef.current
            const pacePerKm = elapsed > 0 ? Math.round(elapsed / kmDistRef.current) : 0
            const m = Math.floor(pacePerKm / 60), s = pacePerKm % 60
            showKmNotification(newKm, `${m}:${String(s).padStart(2, "0")}`)
          }
        }
      }
      lastPosRef.current = pos
    }, undefined, { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 })
  }

  function stopGpsTracking() {
    if (gpsWatchRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchRef.current)
      gpsWatchRef.current = null
    }
  }

  const handleSelect = useCallback((rec: RecommendationResult) => {
    setSelectedRoute(rec.route)
  }, [setSelectedRoute])

  const handleLaunch = useCallback((rec: RecommendationResult) => {
    setSelectedRoute(rec.route)
    setActiveRunId(rec.route.id)
    setRunTimer(0)

    if (timerInterval) clearInterval(timerInterval)
    const iv = setInterval(() => setRunTimer(t => t + 1), 1000)
    setTimerInterval(iv)
    startGpsTracking()
  }, [setSelectedRoute, timerInterval])

  const handleFinishRun = useCallback(() => {
    if (!activeRunId || !timerInterval) return
    clearInterval(timerInterval)
    setTimerInterval(null)

    const route = recommendations.find(r => r.route.id === activeRunId)?.route
    if (route) {
      const history = getRunHistory()
      history.push({
        route_id: activeRunId,
        date_iso: new Date().toISOString(),
        distance_km: route.distance_km,
        duration_min: Math.round(runTimer / 60),
      })
      saveRunHistory(history)
    }
    stopGpsTracking()
    setActiveRunId(null)
    setRunTimer(0)
  }, [activeRunId, timerInterval, runTimer, recommendations])

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
  }

  const runHistory = getRunHistory()

  return (
    <>
    {/* Km toast notification */}
    <AnimatePresence>
      {kmToast && (
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          className="fixed top-16 left-4 right-4 z-50 flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: "rgba(10,10,10,0.95)", border: "1px solid rgba(244,208,63,0.5)", backdropFilter: "blur(12px)" }}
        >
          <span className="text-lg">📍</span>
          <p className="text-sm font-bold" style={{ color: "#F4D03F" }}>{kmToast}</p>
        </motion.div>
      )}
    </AnimatePresence>
    <motion.div
      className="flex flex-col gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Bordeaux</p>
          <h1 className="text-2xl font-black tracking-tight">
            Carte<span className="text-primary">.</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <SyncWidget />
          <button
            onClick={() => setShowHeatmap(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold touch-feedback"
            style={{
              background: showHeatmap ? "rgba(155,89,182,0.2)" : "rgba(255,255,255,0.06)",
              border: showHeatmap ? "1px solid rgba(155,89,182,0.5)" : "1px solid rgba(255,255,255,0.1)",
              color: showHeatmap ? "#9B59B6" : "rgba(245,245,245,0.6)",
            }}
          >
            <Layers size={13} />
            <span>Territoires</span>
          </button>
        </div>
      </div>

      {/* Weather bar */}
      <WeatherBar weather={weather} sunData={sunData} />

      {/* Coach IA */}
      {!loading && (
        <CoachBlock
          weather={weather}
          sunData={sunData}
          recommendations={recommendations}
          weeklyGoal={50}
        />
      )}

      {/* Map (70% screen height) */}
      <div style={{ height: "calc(70vh - 80px)", minHeight: 280 }}>
        <MapView
          selectedRoute={selectedRoute}
          runHistory={runHistory}
          showHeatmap={showHeatmap}
        />
      </div>

      {/* Active run timer */}
      {activeRunId && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-3xl p-4"
          style={{ background: "rgba(244,208,63,0.1)", border: "1px solid rgba(244,208,63,0.4)" }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(244,208,63,0.6)" }}>Run en cours</p>
            <p className="text-2xl font-black tabular-nums" style={{ color: "#F4D03F" }}>{formatTimer(runTimer)}</p>
            <p className="text-xs text-text-muted">{recommendations.find(r => r.route.id === activeRunId)?.route.name}</p>
          </div>
          <button
            onClick={handleFinishRun}
            className="px-4 py-2.5 rounded-2xl text-sm font-black touch-feedback"
            style={{ background: "#F4D03F", color: "#0A0A0A" }}
          >
            Terminer
          </button>
        </motion.div>
      )}

      {/* Run cards */}
      {loading ? (
        <div className="flex gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-shrink-0 rounded-3xl animate-pulse"
              style={{ width: 220, height: 200, background: "rgba(255,255,255,0.05)" }} />
          ))}
        </div>
      ) : (
        <RunCards
          recommendations={recommendations}
          selectedId={selectedRoute?.id ?? null}
          onSelect={handleSelect}
          onLaunch={handleLaunch}
        />
      )}


      <div className="h-4" />
    </motion.div>
    </>
  )
}
