"use client"
import { motion } from "framer-motion"
import { Flame, Route, Mountain, Clock, TrendingUp, Zap } from "lucide-react"
import type { Run } from "@/lib/types"
import { formatDistance, formatDurationShort, formatPace, isSameWeek, isSameMonth, isSameYear } from "@/lib/utils"
import { calculateStreak } from "@/lib/calculations"
import GlassCard from "@/components/ui/GlassCard"

function StatCard({
  label, value, unit, icon: Icon, color, delay
}: {
  label: string; value: string; unit?: string; icon: React.ElementType; color: string; delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <GlassCard className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: `${color}20` }}
          >
            <Icon size={16} style={{ color }} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold tracking-tight stat-num" style={{ color: "#F5F5F5" }}>
              {value}
            </span>
            {unit && (
              <span className="text-sm font-medium" style={{ color: "rgba(245,245,245,0.5)" }}>
                {unit}
              </span>
            )}
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: "rgba(245,245,245,0.4)" }}>
            {label}
          </p>
        </div>
      </GlassCard>
    </motion.div>
  )
}

export default function StatsGrid({ runs }: { runs: Run[] }) {
  const weekRuns = runs.filter((r) => isSameWeek(r.date))
  const monthRuns = runs.filter((r) => isSameMonth(r.date))
  const yearRuns = runs.filter((r) => isSameYear(r.date))

  const weekDist = weekRuns.reduce((s, r) => s + r.distance, 0)
  const monthDist = monthRuns.reduce((s, r) => s + r.distance, 0)
  const yearDist = yearRuns.reduce((s, r) => s + r.distance, 0)
  const totalElev = weekRuns.reduce((s, r) => s + r.elevation, 0)
  const totalTime = weekRuns.reduce((s, r) => s + r.duration, 0)
  const avgPace = weekRuns.length
    ? Math.round(weekRuns.reduce((s, r) => s + r.pace, 0) / weekRuns.length)
    : 0

  const streak = calculateStreak(runs)

  return (
    <div className="flex flex-col gap-3">
      {/* Streak banner */}
      {streak > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{
            background: "linear-gradient(135deg, rgba(244,208,63,0.15) 0%, rgba(230,126,34,0.1) 100%)",
            border: "1px solid rgba(244,208,63,0.25)",
          }}
        >
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-sm font-bold text-primary">
              {streak} jour{streak > 1 ? "s" : ""} de suite
            </p>
            <p className="text-[11px] text-text-muted">Série en cours — continuez !</p>
          </div>
        </motion.div>
      )}

      {/* Weekly stats */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 px-1">Cette semaine</p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Distance" value={formatDistance(weekDist)} unit="km" icon={Route} color="#F4D03F" delay={0.1} />
          <StatCard label="Sorties" value={String(weekRuns.length)} icon={Flame} color="#E67E22" delay={0.15} />
          <StatCard label="Dénivelé" value={String(totalElev)} unit="m" icon={Mountain} color="#9B59B6" delay={0.2} />
          <StatCard label="Temps" value={formatDurationShort(totalTime)} icon={Clock} color="#27AE60" delay={0.25} />
        </div>
      </div>

      {/* Month + Year mini row */}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1">Ce mois</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold stat-num">{formatDistance(monthDist)}</span>
            <span className="text-sm text-text-muted">km</span>
          </div>
          <p className="text-[10px] text-text-muted">{monthRuns.length} sorties</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1">Cette année</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold stat-num">{formatDistance(yearDist)}</span>
            <span className="text-sm text-text-muted">km</span>
          </div>
          <p className="text-[10px] text-text-muted">{yearRuns.length} sorties</p>
        </GlassCard>
      </div>

      {/* Avg pace */}
      {avgPace > 0 && (
        <GlassCard className="p-4 flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(52,152,219,0.2)" }}
          >
            <TrendingUp size={18} style={{ color: "#3498DB" }} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Allure moy. semaine</p>
            <p className="text-xl font-extrabold stat-num">{formatPace(avgPace)} <span className="text-sm font-medium text-text-muted">min/km</span></p>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
