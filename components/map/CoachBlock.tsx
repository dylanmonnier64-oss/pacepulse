/**
 * CoachBlock — Bloc "Coach IA du Jour" avec message contextuel
 * Glassmorphism design, message dynamique basé sur les données du jour
 */
"use client"
import { motion, AnimatePresence } from "framer-motion"
import type { WeatherData, SunData, RecommendationResult } from "@/lib/route-engine"
import { useRuns } from "@/hooks/useRuns"
import { useMemo } from "react"

function buildCoachMessage(
  weather: WeatherData | null,
  sunData: SunData | null,
  weeklyKm: number,
  weeklyGoal: number,
  top: RecommendationResult | null
): string {
  const parts: string[] = []
  const daysLeft = 7 - new Date().getDay() || 7
  const remaining = Math.max(0, weeklyGoal - weeklyKm)

  if (weeklyKm > 0) {
    parts.push(`Tu as fait ${weeklyKm.toFixed(1)}km cette semaine`)
    if (remaining > 0) parts.push(`il reste ${remaining.toFixed(1)}km sur ${daysLeft} jours`)
  }

  if (sunData?.minutesToSunset !== null && sunData?.minutesToSunset !== undefined && sunData.minutesToSunset >= 0 && sunData.minutesToSunset <= 90) {
    parts.push(`Coucher de soleil dans ${sunData.minutesToSunset}min`)
    if (top) parts.push(`${top.route.name} est parfait maintenant`)
  } else if (sunData?.minutesToSunrise !== null && sunData?.minutesToSunrise !== undefined && sunData.minutesToSunrise >= 0 && sunData.minutesToSunrise <= 60) {
    parts.push(`Lever de soleil dans ${sunData.minutesToSunrise}min`)
    if (top) parts.push(`ce tracé va être magnifique`)
  } else if (weather) {
    if (weather.temp > 25) parts.push(`${weather.temp}°C dehors, hydrate-toi bien`)
    else if (weather.temp < 10) parts.push(`${weather.temp}°C, parfait pour pousser le rythme`)
    else parts.push(`${weather.temp}°C et ${weather.description}, conditions idéales`)
    if (top) parts.push(`${top.route.name} est recommandé aujourd'hui`)
  } else if (top) {
    parts.push(`${top.route.name} est le meilleur choix aujourd'hui`)
    parts.push(top.reason)
  }

  return parts.join(". ") + (parts.length ? "." : "Prêt à courir ?")
}

interface CoachBlockProps {
  weather: WeatherData | null
  sunData: SunData | null
  recommendations: RecommendationResult[]
  weeklyGoal: number
}

export default function CoachBlock({ weather, sunData, recommendations, weeklyGoal }: CoachBlockProps) {
  const { runs } = useRuns()

  const weeklyKm = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    const day = now.getDay()
    startOfWeek.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
    startOfWeek.setHours(0, 0, 0, 0)
    return runs
      .filter(r => new Date(r.date) >= startOfWeek)
      .reduce((s, r) => s + r.distance, 0)
  }, [runs])

  const top = recommendations[0] ?? null
  const message = buildCoachMessage(weather, sunData, weeklyKm, weeklyGoal, top)

  const isSunAlert =
    (sunData?.minutesToSunset !== null && sunData?.minutesToSunset !== undefined && sunData.minutesToSunset >= 0 && sunData.minutesToSunset <= 90) ||
    (sunData?.minutesToSunrise !== null && sunData?.minutesToSunrise !== undefined && sunData.minutesToSunrise >= 0 && sunData.minutesToSunrise <= 60)

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-3xl p-4"
      style={{
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(244,208,63,0.3)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <motion.span
          className="text-xl"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
        >
          🧠
        </motion.span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(244,208,63,0.6)" }}>
            Coach IA du Jour
          </p>
        </div>

        {/* Weekly progress pill */}
        {weeklyGoal > 0 && (
          <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
            style={{ background: "rgba(244,208,63,0.1)", border: "1px solid rgba(244,208,63,0.2)", color: "#F4D03F" }}>
            <span>{weeklyKm.toFixed(0)}</span>
            <span style={{ color: "rgba(244,208,63,0.5)" }}>/ {weeklyGoal}km</span>
          </div>
        )}
      </div>

      {/* Message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={message}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          className="text-sm leading-relaxed"
          style={{ color: "rgba(245,245,245,0.85)" }}
        >
          {message}
        </motion.p>
      </AnimatePresence>

      {/* Overload alert */}
      {isSunAlert && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-2xl"
          style={{
            background: "rgba(244,208,63,0.15)",
            border: "1px solid rgba(244,208,63,0.4)",
            color: "#F4D03F",
            transformOrigin: "left",
          }}
        >
          <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            {sunData?.minutesToSunset !== null && sunData?.minutesToSunset !== undefined && sunData.minutesToSunset >= 0
              ? "🌅"
              : "🌄"}
          </motion.span>
          <span>
            Fenêtre Dorée —{" "}
            {sunData?.minutesToSunset !== null && sunData?.minutesToSunset !== undefined && sunData.minutesToSunset >= 0 && sunData.minutesToSunset <= 90
              ? `Coucher dans ${sunData.minutesToSunset}min`
              : `Lever dans ${sunData?.minutesToSunrise}min`}
          </span>
        </motion.div>
      )}
    </motion.div>
  )
}
