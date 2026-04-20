"use client"
import { motion } from "framer-motion"
import { useRuns } from "@/hooks/useRuns"
import FitnessFatigueChart from "@/components/stats/FitnessFatigueChart"
import RiegelPredictor from "@/components/stats/RiegelPredictor"
import HRZones from "@/components/stats/HRZones"
import HeatmapCalendar from "@/components/stats/HeatmapCalendar"
import WeeklyLoad from "@/components/stats/WeeklyLoad"

export default function StatsPage() {
  const { runs, loading } = useRuns()

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-3xl h-48" style={{ background: "rgba(255,255,255,0.05)" }} />
        ))}
      </div>
    )
  }

  return (
    <motion.div className="flex flex-col gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Analyse</p>
        <h1 className="text-2xl font-black tracking-tight">
          Statistiques<span className="text-primary">.</span>
        </h1>
      </div>

      <FitnessFatigueChart runs={runs} />
      <RiegelPredictor runs={runs} />
      <WeeklyLoad runs={runs} />
      <HRZones />
      <HeatmapCalendar runs={runs} />

      <div className="h-4" />
    </motion.div>
  )
}
