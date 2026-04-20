"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Target, TrendingUp, Mountain, Clock, Trophy, Route, Footprints } from "lucide-react"
import { useRuns } from "@/hooks/useRuns"
import { getGoals } from "@/lib/storage"
import type { Goal } from "@/lib/types"
import { isSameWeek, isSameMonth, isSameYear, formatDistance, formatDurationShort } from "@/lib/utils"
import GlassCard from "@/components/ui/GlassCard"
import Confetti from "@/components/goals/Confetti"

const iconMap: Record<string, React.ElementType> = {
  route: Route, footprints: Footprints, mountain: Mountain, trophy: Trophy, clock: Clock
}

function getGoalProgress(goal: Goal, runs: { distance: number; elevation: number; duration: number; date: string }[]) {
  const filtered = runs.filter((r) => {
    if (goal.period === "week") return isSameWeek(r.date)
    if (goal.period === "month") return isSameMonth(r.date)
    return isSameYear(r.date)
  })

  switch (goal.type) {
    case "distance": return filtered.reduce((s, r) => s + r.distance, 0)
    case "runs": return filtered.length
    case "elevation": return filtered.reduce((s, r) => s + r.elevation, 0)
    case "time": return filtered.reduce((s, r) => s + r.duration, 0) / 3600 // hours
    default: return 0
  }
}

function formatProgress(goal: Goal, value: number): string {
  if (goal.type === "time") return `${value.toFixed(1)}h`
  if (goal.type === "distance") return `${formatDistance(value)}km`
  return String(Math.round(value))
}

function GoalCard({ goal, runs, onComplete }: {
  goal: Goal
  runs: { distance: number; elevation: number; duration: number; date: string }[]
  onComplete: () => void
}) {
  const current = getGoalProgress(goal, runs)
  const pct = Math.min(100, (current / goal.target) * 100)
  const achieved = pct >= 100
  const Icon = iconMap[goal.icon] || Target

  // Project end-of-period pace
  const now = new Date()
  let totalDays = 7, elapsedDays = now.getDay() || 7
  if (goal.period === "month") { totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(); elapsedDays = now.getDate() }
  if (goal.period === "year") { totalDays = 365; elapsedDays = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000) }
  const projected = elapsedDays > 0 ? (current / elapsedDays) * totalDays : 0

  useEffect(() => {
    if (achieved) onComplete()
  }, [achieved])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <GlassCard
        className="p-4 relative overflow-hidden"
        style={achieved ? { border: `1px solid ${goal.color}60` } : undefined}
      >
        {achieved && (
          <div className="absolute top-3 right-3 text-xl">🏆</div>
        )}

        {/* Glow when achieved */}
        {achieved && (
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: `radial-gradient(ellipse at top, ${goal.color}15 0%, transparent 70%)` }}
          />
        )}

        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${goal.color}20` }}
          >
            <Icon size={18} style={{ color: goal.color }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{goal.label}</p>
            <p className="text-[10px] text-text-muted capitalize">{goal.period === "week" ? "Semaine" : goal.period === "month" ? "Mois" : "Année"}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-extrabold stat-num" style={{ color: achieved ? goal.color : "#F5F5F5" }}>
              {formatProgress(goal, current)}
            </p>
            <p className="text-[10px] text-text-muted">/ {goal.target} {goal.unit}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.1)" }}>
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
            style={{
              background: achieved
                ? `linear-gradient(90deg, ${goal.color}, #F4D03F)`
                : `linear-gradient(90deg, #E67E22, #9B59B6)`,
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs font-bold" style={{ color: achieved ? goal.color : "rgba(245,245,245,0.6)" }}>
            {pct.toFixed(0)}%{achieved ? " ✓ Objectif atteint !" : ""}
          </p>
          {!achieved && projected > 0 && (
            <p className="text-[10px] text-text-muted">
              Projection : {formatProgress(goal, projected)} {goal.unit}
              {projected >= goal.target ? " ✓" : " ✗"}
            </p>
          )}
        </div>
      </GlassCard>
    </motion.div>
  )
}

export default function GoalsPage() {
  const { runs, loading } = useRuns()
  const [goals, setGoals] = useState<Goal[]>([])
  const [confetti, setConfetti] = useState(false)

  useEffect(() => {
    setGoals(getGoals())
  }, [])

  const simpleRuns = runs.map((r) => ({ distance: r.distance, elevation: r.elevation, duration: r.duration, date: r.date }))

  const handleComplete = () => {
    setConfetti(true)
    setTimeout(() => setConfetti(false), 4000)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl h-28" style={{ background: "rgba(255,255,255,0.05)" }} />
        ))}
      </div>
    )
  }

  return (
    <>
      <Confetti active={confetti} />
      <motion.div className="flex flex-col gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Progression</p>
          <h1 className="text-2xl font-black tracking-tight">
            Objectifs<span className="text-primary">.</span>
          </h1>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl">🎯</span>
            <p className="text-text-muted mt-3">Aucun objectif configuré</p>
          </div>
        ) : (
          <>
            {/* Group by period */}
            {(["week", "month", "year"] as const).map((period) => {
              const periodGoals = goals.filter((g) => g.period === period)
              if (!periodGoals.length) return null
              const labels = { week: "Cette semaine", month: "Ce mois", year: "Cette année" }
              return (
                <div key={period}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 px-1">
                    {labels[period]}
                  </p>
                  <div className="flex flex-col gap-3">
                    {periodGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        runs={simpleRuns}
                        onComplete={handleComplete}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}

        <div className="h-4" />
      </motion.div>
    </>
  )
}
