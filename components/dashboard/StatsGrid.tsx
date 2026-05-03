"use client"
import { motion } from "framer-motion"
import { Flame, Route, Mountain, Clock, TrendingUp } from "lucide-react"
import type { Run } from "@/lib/types"
import { formatDistance, formatDurationShort, formatPace, isSameWeek, isSameMonth, isSameYear } from "@/lib/utils"
import { calculateStreak } from "@/lib/calculations"

/* ── Premium stat card with animated halo ── */
function StatCard({
  label, value, unit, icon: Icon, color, delay,
}: {
  label: string; value: string; unit?: string
  icon: React.ElementType; color: string; delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, boxShadow: `0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color}28` }}
      className="relative rounded-[22px] overflow-hidden p-4 flex flex-col gap-3"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Animated halo orb */}
      <motion.div
        animate={{ top: ["12%", "65%", "12%"], left: ["8%", "72%", "8%"] }}
        transition={{ duration: 14 + delay * 4, repeat: Infinity, ease: "linear" }}
        className="absolute w-16 h-16 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color}28 0%, transparent 70%)`,
          filter: "blur(12px)",
        }}
      />

      {/* Rotating ray accent */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-2 right-2 w-6 h-6 opacity-20 pointer-events-none"
        style={{
          background: `conic-gradient(from 0deg, ${color}, transparent 60deg, transparent 100%)`,
          borderRadius: "50%",
          filter: `blur(1px)`,
        }}
      />

      {/* Icon */}
      <div
        className="relative z-10 w-9 h-9 rounded-2xl flex items-center justify-center"
        style={{ background: `${color}18`, border: `1px solid ${color}28` }}
      >
        <Icon size={16} style={{ color }} />
      </div>

      {/* Value */}
      <div className="relative z-10">
        <div className="flex items-baseline gap-1">
          <span
            className="data-mono text-[26px] font-black tracking-tight leading-none"
            style={{ color: "#FAFAFA" }}
          >
            {value}
          </span>
          {unit && (
            <span className="text-sm font-semibold" style={{ color: "rgba(250,250,250,0.4)" }}>
              {unit}
            </span>
          )}
        </div>
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.12em] mt-1"
          style={{ color: "rgba(250,250,250,0.35)" }}
        >
          {label}
        </p>
      </div>
    </motion.div>
  )
}

/* ── Mini summary card ── */
function MiniCard({
  title, dist, count, delay,
}: {
  title: string; dist: number; count: number; delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[22px] p-4"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] mb-1.5"
        style={{ color: "rgba(250,250,250,0.35)" }}>
        {title}
      </p>
      <div className="flex items-baseline gap-1">
        <span className="data-mono text-[22px] font-black" style={{ color: "#FAFAFA" }}>
          {formatDistance(dist)}
        </span>
        <span className="text-sm font-medium" style={{ color: "rgba(250,250,250,0.4)" }}>km</span>
      </div>
      <p className="text-[10px] mt-0.5" style={{ color: "rgba(250,250,250,0.35)" }}>
        {count} sorties
      </p>
    </motion.div>
  )
}

export default function StatsGrid({ runs }: { runs: Run[] }) {
  const weekRuns  = runs.filter((r) => isSameWeek(r.date))
  const monthRuns = runs.filter((r) => isSameMonth(r.date))
  const yearRuns  = runs.filter((r) => isSameYear(r.date))

  const weekDist  = weekRuns.reduce((s, r) => s + r.distance, 0)
  const monthDist = monthRuns.reduce((s, r) => s + r.distance, 0)
  const yearDist  = yearRuns.reduce((s, r) => s + r.distance, 0)
  const totalElev = weekRuns.reduce((s, r) => s + r.elevation, 0)
  const totalTime = weekRuns.reduce((s, r) => s + r.duration, 0)
  const avgPace   = weekRuns.length
    ? Math.round(weekRuns.reduce((s, r) => s + r.pace, 0) / weekRuns.length)
    : 0
  const streak = calculateStreak(runs)

  return (
    <div className="flex flex-col gap-4">

      {/* Streak banner */}
      {streak > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, duration: 0.4 }}
          className="relative overflow-hidden rounded-[22px] p-4 flex items-center gap-3"
          style={{
            background: "linear-gradient(135deg, rgba(244,208,63,0.12) 0%, rgba(255,107,26,0.08) 100%)",
            border: "1px solid rgba(244,208,63,0.22)",
          }}
        >
          {/* Gold glow */}
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(244,208,63,0.2) 0%, transparent 70%)", filter: "blur(16px)" }} />
          <span className="text-3xl relative z-10">🔥</span>
          <div className="relative z-10">
            <p className="text-sm font-black" style={{ color: "#F4D03F" }}>
              {streak} jour{streak > 1 ? "s" : ""} de suite
            </p>
            <p className="text-[11px]" style={{ color: "rgba(250,250,250,0.45)" }}>
              Série en cours — continuez !
            </p>
          </div>
        </motion.div>
      )}

      {/* Section label */}
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] px-1"
        style={{ color: "rgba(250,250,250,0.35)" }}>
        Cette semaine
      </p>

      {/* 2×2 stat grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Distance"  value={formatDistance(weekDist)} unit="km"    icon={Route}    color="#F4D03F" delay={0.08} />
        <StatCard label="Sorties"   value={String(weekRuns.length)}              icon={Flame}    color="#FF6B1A" delay={0.14} />
        <StatCard label="Dénivelé"  value={String(totalElev)}       unit="m"     icon={Mountain} color="#A855F7" delay={0.20} />
        <StatCard label="Temps"     value={formatDurationShort(totalTime)}       icon={Clock}    color="#22C55E" delay={0.26} />
      </div>

      {/* Month + Year */}
      <div className="grid grid-cols-2 gap-3">
        <MiniCard title="Ce mois"    dist={monthDist} count={monthRuns.length} delay={0.30} />
        <MiniCard title="Cette année" dist={yearDist}  count={yearRuns.length}  delay={0.34} />
      </div>

      {/* Avg pace — full width */}
      {avgPace > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.4 }}
          className="relative overflow-hidden rounded-[22px] p-4 flex items-center gap-4"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <motion.div
            animate={{ top: ["20%", "70%", "20%"], left: ["10%", "80%", "10%"] }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            className="absolute w-20 h-20 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)", filter: "blur(16px)" }}
          />
          <div
            className="relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)" }}
          >
            <TrendingUp size={18} style={{ color: "#3B82F6" }} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: "rgba(250,250,250,0.38)" }}>
              Allure moy. semaine
            </p>
            <p className="text-xl font-black stat-num" style={{ color: "#FAFAFA" }}>
              {formatPace(avgPace)}{" "}
              <span className="text-sm font-semibold" style={{ color: "rgba(250,250,250,0.4)" }}>min/km</span>
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
