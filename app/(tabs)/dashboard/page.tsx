"use client"
import { motion } from "framer-motion"
import Link from "next/link"
import { Plus, Bell } from "lucide-react"
import { useRuns } from "@/hooks/useRuns"
import HeroCard from "@/components/dashboard/HeroCard"
import StatsGrid from "@/components/dashboard/StatsGrid"
import WeeklyChart from "@/components/dashboard/WeeklyChart"
import { hapticFeedback } from "@/lib/utils"

export default function DashboardPage() {
  const { runs, loading } = useRuns()
  const lastRun = runs[0]

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-3xl h-32" style={{ background: "rgba(255,255,255,0.05)" }} />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col gap-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Bienvenue</p>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">
            PacePulse<span className="text-primary">.</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/runs/new"
            onClick={hapticFeedback}
            className="touch-feedback flex items-center gap-1.5 px-4 py-2 rounded-2xl font-bold text-sm text-app no-select"
            style={{ background: "#F4D03F", minHeight: 44 }}
          >
            <Plus size={16} />
            Run
          </Link>
        </div>
      </div>

      {/* Hero last run */}
      {lastRun ? (
        <Link href={`/runs/${lastRun.id}`}>
          <HeroCard run={lastRun} />
        </Link>
      ) : (
        <div
          className="rounded-3xl p-8 flex flex-col items-center justify-center gap-3 text-center"
          style={{ background: "rgba(255,255,255,0.04)", border: "2px dashed rgba(255,255,255,0.1)" }}
        >
          <span className="text-4xl">🏃</span>
          <p className="font-semibold text-text-primary">Aucune sortie enregistrée</p>
          <p className="text-sm text-text-muted">Ajoutez votre premier run pour commencer</p>
        </div>
      )}

      {/* Stats grid */}
      <StatsGrid runs={runs} />

      {/* Weekly chart */}
      <WeeklyChart runs={runs} />

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/stats" className="touch-feedback">
          <div
            className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: "rgba(155,89,182,0.12)", border: "1px solid rgba(155,89,182,0.25)" }}
          >
            <span className="text-2xl">📊</span>
            <p className="text-sm font-bold text-text-primary">Forme & Fatigue</p>
            <p className="text-xs text-text-muted">CTL · ATL · TSB</p>
          </div>
        </Link>
        <Link href="/goals" className="touch-feedback">
          <div
            className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: "rgba(244,208,63,0.08)", border: "1px solid rgba(244,208,63,0.2)" }}
          >
            <span className="text-2xl">🎯</span>
            <p className="text-sm font-bold text-text-primary">Objectifs</p>
            <p className="text-xs text-text-muted">Semaine · Mois · Année</p>
          </div>
        </Link>
      </div>
    </motion.div>
  )
}
