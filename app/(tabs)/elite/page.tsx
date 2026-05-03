"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence, useSpring, useMotionValue } from "framer-motion"
import {
  BookOpen, Crown, Sparkles, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Minus, Heart, Moon, Footprints, Flame, Zap,
  Send, RotateCcw, Stethoscope,
} from "lucide-react"
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts"
import { useHealthLogs } from "@/hooks/useHealthLogs"
import DailyQuestionnaire from "@/components/health/DailyQuestionnaire"
import LogoPP from "@/components/ui/LogoPP"
import { hapticFeedback, lgStyle } from "@/lib/utils"
import type { HealthFormState, HealthLog } from "@/lib/types"
import type { MonthlyReport } from "@/app/api/ai/rapport/route"

/* ══════════════════════════════════════════════════════════════
   ANIMATED NUMBER
══════════════════════════════════════════════════════════════ */
function AnimatedNumber({ value }: { value: number }) {
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 60, damping: 18, mass: 1 })
  const [display, setDisplay] = useState(0)
  useEffect(() => { motionVal.set(value) }, [value, motionVal])
  useEffect(() => { const u = spring.on("change", v => setDisplay(Math.round(v))); return u }, [spring])
  return <>{display}</>
}

/* ══════════════════════════════════════════════════════════════
   VITALITY ORB
══════════════════════════════════════════════════════════════ */
function VitalityOrb({ score, color }: { score: number; color: string }) {
  const R = 72, C = 2 * Math.PI * R, arcLen = C * 0.75
  const offset = arcLen - (score / 100) * arcLen
  const dashOffset = useMotionValue(arcLen)
  const springArc = useSpring(dashOffset, { stiffness: 45, damping: 22, mass: 1.1 })
  useEffect(() => { const t = setTimeout(() => dashOffset.set(offset), 150); return () => clearTimeout(t) }, [offset, dashOffset])

  return (
    <div className="relative flex-shrink-0" style={{ width: 180, height: 180 }}>
      <motion.div className="absolute inset-0 rounded-full pointer-events-none"
        animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 3.5, repeat: Infinity }}
        style={{ background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`, filter: "blur(24px)", transform: "scale(1.3)" }}
      />
      <svg width={180} height={180} viewBox="0 0 180 180" className="absolute inset-0">
        <circle cx={90} cy={90} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={9} strokeLinecap="round"
          strokeDasharray={`${arcLen} ${C}`} transform="rotate(135 90 90)" />
        <g transform="rotate(135 90 90)">
          <motion.circle cx={90} cy={90} r={R} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round"
            strokeDasharray={`${arcLen} ${C}`}
            style={{ strokeDashoffset: springArc, filter: `drop-shadow(0 0 10px ${color}bb)` }} />
        </g>
        <circle cx={90} cy={90} r={R - 14} fill="none" stroke={`${color}12`} strokeWidth={1} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span className="data-mono font-black leading-none"
          initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{ fontSize: 46, color, textShadow: `0 0 28px ${color}99` }}>
          <AnimatedNumber value={score} />
        </motion.span>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] mt-1" style={{ color: "rgba(250,250,250,0.28)" }}>/100</span>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MINI CALENDAR
══════════════════════════════════════════════════════════════ */
const DAY_NAMES = ["L", "M", "M", "J", "V", "S", "D"]

function MiniCalendar({ selectedDate, onSelect, logDates }: {
  selectedDate: string; onSelect: (d: string) => void; logDates: Set<string>
}) {
  const todayStr = new Date().toISOString().split("T")[0]
  const [view, setView] = useState(() => {
    const s = new Date(selectedDate + "T12:00:00")
    return { year: s.getFullYear(), month: s.getMonth() }
  })
  const { year, month } = view
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = new Date(year, month).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const getStr = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
  const nextDisabled = new Date(year, month + 1) > new Date()

  return (
    <div className="rounded-[22px] p-4" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(212,175,55,0.1)" }}>
      <div className="flex items-center justify-between mb-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { hapticFeedback(); setView(v => { const d = new Date(v.year, v.month - 1); return { year: d.getFullYear(), month: d.getMonth() } }) }}
          className="w-8 h-8 flex items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
          <ChevronLeft size={14} style={{ color: "rgba(250,250,250,0.5)" }} />
        </motion.button>
        <span className="text-[11px] font-black uppercase tracking-[0.18em] capitalize" style={{ color: "rgba(250,250,250,0.7)" }}>{monthName}</span>
        <motion.button whileTap={{ scale: 0.9 }} disabled={nextDisabled}
          onClick={() => { if (!nextDisabled) { hapticFeedback(); setView(v => { const d = new Date(v.year, v.month + 1); return { year: d.getFullYear(), month: d.getMonth() } }) } }}
          className="w-8 h-8 flex items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.05)", opacity: nextDisabled ? 0.25 : 1 }}>
          <ChevronRight size={14} style={{ color: "rgba(250,250,250,0.5)" }} />
        </motion.button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d, i) => <div key={i} className="text-center text-[9px] font-bold py-1" style={{ color: "rgba(250,250,250,0.22)" }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const ds = getStr(day), isSel = ds === selectedDate, isToday = ds === todayStr, hasLog = logDates.has(ds), isFuture = ds > todayStr
          return (
            <motion.button key={ds} whileTap={isFuture ? undefined : { scale: 0.88 }}
              disabled={isFuture} onClick={() => { if (!isFuture) { hapticFeedback(); onSelect(ds) } }}
              className="flex flex-col items-center py-1.5 rounded-xl"
              style={{ background: isSel ? "var(--gold)" : isToday ? "rgba(212,175,55,0.1)" : "transparent", border: isToday && !isSel ? "1px solid rgba(212,175,55,0.28)" : "1px solid transparent", opacity: isFuture ? 0.18 : 1, transition: "background 0.15s" }}>
              <span className="data-mono text-[12px] font-black" style={{ color: isSel ? "#050505" : "rgba(250,250,250,0.82)" }}>{day}</span>
              <div className="h-1 flex items-center justify-center mt-0.5">
                {hasLog && <div className="w-1 h-1 rounded-full" style={{ background: isSel ? "rgba(5,5,5,0.45)" : "var(--gold)" }} />}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MONTHLY STATS CARDS
══════════════════════════════════════════════════════════════ */
function MonthlyStats({ logs }: { logs: HealthLog[] }) {
  const withSteps = logs.filter(l => (l.steps ?? 0) > 0)
  const avgSteps = withSteps.length ? Math.round(withSteps.reduce((s, l) => s + (l.steps ?? 0), 0) / withSteps.length) : 0
  const activeDays = logs.filter(l => (l.steps ?? 0) >= 5000).length
  const withHR = logs.filter(l => l.heart_rate_avg)
  const avgHR = withHR.length ? Math.round(withHR.reduce((s, l) => s + (l.heart_rate_avg ?? 0), 0) / withHR.length) : 0
  const withSleep = logs.filter(l => l.sleep_hours != null && l.sleep_hours > 0)
  const avgSleepH = withSleep.length ? withSleep.reduce((s, l) => s + (l.sleep_hours ?? 0) + (l.sleep_minutes ?? 0) / 60, 0) / withSleep.length : 0

  const items = [
    { label: "Pas moy./j", value: avgSteps > 0 ? avgSteps.toLocaleString("fr-FR") : "—", color: "#F4D03F", icon: <Footprints size={13} /> },
    { label: "Jours actifs", value: `${activeDays}`, sub: `/${logs.length}j`, color: "#22C55E", icon: <Zap size={13} /> },
    { label: "FC repos", value: avgHR > 0 ? `${avgHR}` : "—", sub: avgHR > 0 ? "bpm" : undefined, color: "#EF4444", icon: <Heart size={13} /> },
    { label: "Sommeil moy.", value: avgSleepH > 0 ? `${Math.floor(avgSleepH)}h${Math.round((avgSleepH % 1) * 60).toString().padStart(2, "0")}` : "—", color: "#3B82F6", icon: <Moon size={13} /> },
  ]

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.map(({ label, value, sub, color, icon }) => (
        <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-[18px] p-3.5"
          style={{ background: `${color}0d`, border: `1px solid ${color}22` }}>
          <div className="flex items-center gap-1.5 mb-2" style={{ color: `${color}99` }}>{icon}<span className="text-[9px] font-bold uppercase tracking-[0.15em]">{label}</span></div>
          <div className="flex items-baseline gap-1">
            <span className="data-mono text-[22px] font-black leading-none" style={{ color }}>{value}</span>
            {sub && <span className="text-[10px]" style={{ color: "rgba(250,250,250,0.35)" }}>{sub}</span>}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   30-DAY CHART WITH TABS
══════════════════════════════════════════════════════════════ */
type MetricTab = "steps" | "calories" | "hr" | "sleep"
const TABS: { id: MetricTab; label: string; color: string }[] = [
  { id: "steps",    label: "Pas",      color: "#F4D03F" },
  { id: "calories", label: "Calories", color: "#FF6B1A" },
  { id: "hr",       label: "FC",       color: "#EF4444" },
  { id: "sleep",    label: "Sommeil",  color: "#3B82F6" },
]

const tooltipStyle = {
  background: "rgba(5,5,5,0.95)", border: "1px solid rgba(212,175,55,0.2)",
  borderRadius: 12, fontSize: 11, fontFamily: "JetBrains Mono, monospace",
  color: "rgba(250,250,250,0.85)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
}

function TabChart({ logs }: { logs: HealthLog[] }) {
  const [tab, setTab] = useState<MetricTab>("steps")
  const last14 = [...logs].sort((a, b) => a.date.localeCompare(b.date)).slice(-14)
  const color = TABS.find(t => t.id === tab)!.color

  const data = last14.map(l => {
    const label = l.date.slice(5).replace("-", "/")
    const value =
      tab === "steps"    ? (l.steps ?? null)
      : tab === "calories" ? (l.calories ?? null)
      : tab === "hr"       ? (l.heart_rate_avg ?? null)
      : l.sleep_hours != null ? +(l.sleep_hours + (l.sleep_minutes ?? 0) / 60).toFixed(1) : null
    return { label, value }
  })

  const hasData = data.some(d => d.value !== null)
  const avgHR = tab === "hr" ? Math.round(data.filter(d => d.value).reduce((s, d) => s + (d.value ?? 0), 0) / Math.max(1, data.filter(d => d.value).length)) : 0

  return (
    <div className="rounded-[22px] p-4 space-y-4"
      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.015) 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {TABS.map(t => (
          <motion.button key={t.id} whileTap={{ scale: 0.92 }} onClick={() => { hapticFeedback(); setTab(t.id) }}
            className="flex-1 py-2 rounded-[12px] text-[9px] font-black uppercase tracking-[0.14em] touch-feedback"
            style={{
              background: tab === t.id ? `${t.color}18` : "rgba(255,255,255,0.04)",
              border: `1px solid ${tab === t.id ? t.color + "35" : "rgba(255,255,255,0.06)"}`,
              color: tab === t.id ? t.color : "rgba(250,250,250,0.35)",
              transition: "all 0.15s",
            }}>
            {t.label}
          </motion.button>
        ))}
      </div>

      {/* Chart */}
      {!hasData ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <span className="text-2xl">📊</span>
          <p className="text-[12px]" style={{ color: "rgba(250,250,250,0.3)" }}>Pas de données disponibles</p>
        </div>
      ) : tab === "steps" || tab === "calories" ? (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "rgba(250,250,250,0.25)", fontSize: 8, fontFamily: "JetBrains Mono, monospace" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "rgba(250,250,250,0.25)", fontSize: 8, fontFamily: "JetBrains Mono, monospace" }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} formatter={(v) => [(v as number)?.toLocaleString("fr-FR"), tab === "steps" ? "pas" : "kcal"]} />
            <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "rgba(250,250,250,0.25)", fontSize: 8, fontFamily: "JetBrains Mono, monospace" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "rgba(250,250,250,0.25)", fontSize: 8, fontFamily: "JetBrains Mono, monospace" }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "rgba(255,255,255,0.06)" }} formatter={(v) => [v, tab === "hr" ? "bpm" : "h"]} />
            {tab === "hr" && avgHR > 0 && <ReferenceLine y={avgHR} stroke={`${color}40`} strokeDasharray="4 4" />}
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: color }} connectNulls style={{ filter: `drop-shadow(0 0 6px ${color}66)` }} />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      <p className="text-[9px] text-center" style={{ color: "rgba(250,250,250,0.2)" }}>14 derniers jours</p>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   ACTIVITY HEATMAP
══════════════════════════════════════════════════════════════ */
function ActivityHeatmap({ logs }: { logs: HealthLog[] }) {
  const last30 = [...logs].sort((a, b) => a.date.localeCompare(b.date)).slice(-30)

  function stepColor(steps?: number): string {
    if (!steps || steps < 500) return "rgba(255,255,255,0.04)"
    if (steps < 3000) return "rgba(212,175,55,0.15)"
    if (steps < 6000) return "rgba(212,175,55,0.35)"
    if (steps < 10000) return "rgba(212,175,55,0.6)"
    return "#D4AF37"
  }

  return (
    <div className="rounded-[22px] p-4 space-y-3"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(212,175,55,0.08)" }}>
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(212,175,55,0.5)" }}>Activité · 30 jours</p>
        <div className="flex items-center gap-1">
          {["rgba(255,255,255,0.06)", "rgba(212,175,55,0.2)", "rgba(212,175,55,0.5)", "#D4AF37"].map((c, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
          ))}
          <span className="text-[9px] ml-1" style={{ color: "rgba(250,250,250,0.25)" }}>10k+</span>
        </div>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
        {last30.map(log => (
          <div key={log.date} title={`${log.date.slice(5)}: ${(log.steps ?? 0).toLocaleString("fr-FR")} pas`}
            style={{ aspectRatio: "1", borderRadius: 4, background: stepColor(log.steps), transition: "background 0.3s" }} />
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   SLEEP ANALYSIS
══════════════════════════════════════════════════════════════ */
function SleepAnalysis({ logs }: { logs: HealthLog[] }) {
  const withSleep = logs.filter(l => l.sleep_hours != null && l.sleep_hours > 0)
  if (withSleep.length === 0) return null

  const avgH = withSleep.reduce((s, l) => s + (l.sleep_hours ?? 0) + (l.sleep_minutes ?? 0) / 60, 0) / withSleep.length
  const best = withSleep.reduce((a, b) => (a.sleep_hours ?? 0) > (b.sleep_hours ?? 0) ? a : b)
  const worst = withSleep.reduce((a, b) => (a.sleep_hours ?? 0) < (b.sleep_hours ?? 0) ? a : b)

  const sleepColor = avgH >= 7.5 ? "#22C55E" : avgH >= 6 ? "#F4D03F" : "#EF4444"
  const sleepLabel = avgH >= 7.5 ? "Excellent" : avgH >= 6 ? "Correct" : "Insuffisant"

  const data = [...withSleep].sort((a, b) => a.date.localeCompare(b.date)).map(l => ({
    label: l.date.slice(5).replace("-", "/"),
    h: +(l.sleep_hours! + (l.sleep_minutes ?? 0) / 60).toFixed(1),
  }))

  return (
    <div className="rounded-[22px] p-4 space-y-4"
      style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(59,130,246,0.15)" }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(59,130,246,0.7)" }}>🌙 Analyse Sommeil</p>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(250,250,250,0.4)" }}>{withSleep.length} nuits enregistrées</p>
        </div>
        <div className="text-right">
          <p className="data-mono font-black text-[22px]" style={{ color: sleepColor }}>{Math.floor(avgH)}h{Math.round((avgH % 1) * 60).toString().padStart(2, "0")}</p>
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: `${sleepColor}18`, color: sleepColor }}>{sleepLabel}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={data} margin={{ top: 0, right: 4, left: -28, bottom: 0 }} barSize={16}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "rgba(250,250,250,0.25)", fontSize: 8, fontFamily: "JetBrains Mono, monospace" }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 12]} tick={{ fill: "rgba(250,250,250,0.25)", fontSize: 8 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}h`, "Sommeil"]} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <ReferenceLine y={8} stroke="rgba(59,130,246,0.3)" strokeDasharray="4 4" />
          <Bar dataKey="h" fill="#3B82F6" radius={[4, 4, 0, 0]} opacity={0.85} />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex gap-3">
        <div className="flex-1 rounded-[14px] px-3 py-2.5" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <p className="text-[9px] uppercase tracking-wider" style={{ color: "rgba(34,197,94,0.7)" }}>Meilleure nuit</p>
          <p className="data-mono font-black text-sm mt-0.5" style={{ color: "#22C55E" }}>{best.sleep_hours}h{(best.sleep_minutes ?? 0).toString().padStart(2, "0")}</p>
          <p className="text-[9px]" style={{ color: "rgba(250,250,250,0.3)" }}>{best.date.slice(5).replace("-", "/")}</p>
        </div>
        <div className="flex-1 rounded-[14px] px-3 py-2.5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <p className="text-[9px] uppercase tracking-wider" style={{ color: "rgba(239,68,68,0.7)" }}>Pire nuit</p>
          <p className="data-mono font-black text-sm mt-0.5" style={{ color: "#EF4444" }}>{worst.sleep_hours}h{(worst.sleep_minutes ?? 0).toString().padStart(2, "0")}</p>
          <p className="text-[9px]" style={{ color: "rgba(250,250,250,0.3)" }}>{worst.date.slice(5).replace("-", "/")}</p>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   HEART RATE ANALYSIS
══════════════════════════════════════════════════════════════ */
function HRAnalysis({ logs }: { logs: HealthLog[] }) {
  const withHR = logs.filter(l => l.heart_rate_avg).sort((a, b) => a.date.localeCompare(b.date))
  if (withHR.length === 0) return null

  const avg = Math.round(withHR.reduce((s, l) => s + (l.heart_rate_avg ?? 0), 0) / withHR.length)
  const min = Math.min(...withHR.map(l => l.heart_rate_avg!))
  const max = Math.max(...withHR.map(l => l.heart_rate_avg!))
  const hrColor = avg < 55 ? "#22C55E" : avg < 70 ? "#F4D03F" : "#EF4444"
  const hrLabel = avg < 55 ? "Athlète" : avg < 70 ? "Optimal" : "Élevé"

  const data = withHR.map(l => ({ label: l.date.slice(5).replace("-", "/"), bpm: l.heart_rate_avg }))

  return (
    <div className="rounded-[22px] p-4 space-y-4"
      style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(239,68,68,0.15)" }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(239,68,68,0.7)" }}>❤️ Fréquence Cardiaque</p>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(250,250,250,0.4)" }}>FC repos au réveil</p>
        </div>
        <div className="text-right">
          <p className="data-mono font-black text-[22px]" style={{ color: hrColor }}>{avg} <span className="text-sm font-medium" style={{ color: `${hrColor}88` }}>bpm</span></p>
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: `${hrColor}18`, color: hrColor }}>{hrLabel}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "rgba(250,250,250,0.25)", fontSize: 8, fontFamily: "JetBrains Mono, monospace" }} tickLine={false} axisLine={false} />
          <YAxis domain={["auto", "auto"]} tick={{ fill: "rgba(250,250,250,0.25)", fontSize: 8 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} bpm`, "FC repos"]} />
          <ReferenceLine y={avg} stroke="rgba(239,68,68,0.3)" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="bpm" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3, fill: "#EF4444", strokeWidth: 0 }}
            activeDot={{ r: 5 }} connectNulls style={{ filter: "drop-shadow(0 0 6px rgba(239,68,68,0.5))" }} />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex gap-3">
        {[{ label: "Min", val: min, color: "#22C55E" }, { label: "Moy.", val: avg, color: hrColor }, { label: "Max", val: max, color: "#EF4444" }].map(({ label, val, color }) => (
          <div key={label} className="flex-1 text-center">
            <p className="data-mono font-black text-lg" style={{ color }}>{val}</p>
            <p className="text-[9px]" style={{ color: "rgba(250,250,250,0.3)" }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MONTHLY AI REPORT
══════════════════════════════════════════════════════════════ */
const REPORT_KEY = "pp_monthly_report_dydz"

function MonthlyAIReport({ logs }: { logs: HealthLog[] }) {
  const [report, setReport] = useState<MonthlyReport | null>(() => {
    if (typeof window === "undefined") return null
    try { return JSON.parse(localStorage.getItem(REPORT_KEY) ?? "null") } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  async function analyze() {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/rapport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ healthLogs: logs, profile: "dydz" }),
      })
      if (res.ok) {
        const data: MonthlyReport = await res.json()
        setReport(data)
        localStorage.setItem(REPORT_KEY, JSON.stringify(data))
      }
    } finally {
      setLoading(false)
    }
  }

  const trendColor = report?.fatigue_trend === "amélioration" ? "#22C55E" : report?.fatigue_trend === "dégradation" ? "#EF4444" : "#F4D03F"
  const TrendIcon = report?.fatigue_trend === "amélioration" ? TrendingUp : report?.fatigue_trend === "dégradation" ? TrendingDown : Minus
  const scoreColor = (report?.global_score ?? 0) >= 70 ? "#22C55E" : (report?.global_score ?? 0) >= 45 ? "#F4D03F" : "#EF4444"

  if (loading) {
    return (
      <div className="rounded-[22px] p-5 flex items-center gap-3"
        style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.15)" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
          className="w-5 h-5 rounded-full border-2 flex-shrink-0"
          style={{ borderColor: "rgba(212,175,55,0.2)", borderTopColor: "var(--gold)" }} />
        <span className="text-sm font-medium" style={{ color: "rgba(250,250,250,0.4)" }}>Analyse IA du mois en cours…</span>
      </div>
    )
  }

  if (!report) {
    return (
      <motion.button whileTap={{ scale: 0.97 }} onClick={analyze}
        className="w-full py-4 rounded-[22px] flex items-center justify-center gap-2 font-bold text-sm touch-feedback"
        style={{ ...lgStyle("rgba(212,175,55,0.06)"), border: "1px solid rgba(212,175,55,0.2)", color: "var(--gold)" }}>
        <Sparkles size={15} />
        Générer mon bilan IA du mois
      </motion.button>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-[22px] overflow-hidden relative"
      style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(212,175,55,0.18)" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)" }} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--gold)" }}>Analyse IA · Bilan du mois</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="data-mono font-black text-[28px]" style={{ color: scoreColor }}>{report.global_score}</span>
              <div>
                <p className="text-[9px]" style={{ color: "rgba(250,250,250,0.3)" }}>score global</p>
                <div className="flex items-center gap-1 mt-0.5" style={{ color: trendColor }}>
                  <TrendIcon size={11} />
                  <span className="text-[9px] font-black">{report.fatigue_trend}</span>
                </div>
              </div>
            </div>
          </div>
          <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 4, repeat: Infinity }}
            className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.25)" }}>
            <Sparkles size={15} style={{ color: "var(--gold)" }} />
          </motion.div>
        </div>

        {/* Narrative */}
        <p className="text-[13px] leading-[1.7]" style={{ color: "rgba(250,250,250,0.72)" }}>{report.narrative}</p>

        {/* Highlight + Alert */}
        <div className="space-y-2">
          <div className="flex items-start gap-2.5 p-3 rounded-[14px]"
            style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.15)" }}>
            <span className="text-base flex-shrink-0">🏆</span>
            <p className="text-[11px] leading-relaxed" style={{ color: "rgba(250,250,250,0.65)" }}>{report.highlight}</p>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-[14px]"
            style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <span className="text-base flex-shrink-0">⚠️</span>
            <p className="text-[11px] leading-relaxed" style={{ color: "rgba(250,250,250,0.65)" }}>{report.alert}</p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(212,175,55,0.6)" }}>3 conseils pour progresser</p>
          {report.recommendations.map((r, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.2)" }}>
                <span className="data-mono text-[8px] font-black" style={{ color: "var(--gold)" }}>{i + 1}</span>
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: "rgba(250,250,250,0.6)" }}>{r}</p>
            </div>
          ))}
        </div>

        {/* Verdicts */}
        <div className="flex gap-3 pt-1" style={{ borderTop: "1px solid rgba(212,175,55,0.1)" }}>
          <div className="flex-1">
            <p className="text-[9px]" style={{ color: "rgba(250,250,250,0.3)" }}>🌙 {report.sleep_verdict}</p>
          </div>
        </div>
        <div>
          <p className="text-[9px]" style={{ color: "rgba(250,250,250,0.3)" }}>⚡ {report.activity_verdict}</p>
        </div>

        <button onClick={analyze} className="text-[10px] font-bold touch-feedback" style={{ color: "rgba(212,175,55,0.45)" }}>
          Actualiser l'analyse →
        </button>
      </div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════
   PHYSIO AI CHAT
══════════════════════════════════════════════════════════════ */
type PhysioMsg = { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "J'ai mal au genou depuis 2 jours",
  "Douleur au tendon d'Achille",
  "Crampes dans les mollets",
  "Comment récupérer après un semi ?",
]

const WELCOME: PhysioMsg = {
  role: "assistant",
  content: "Bonjour ! Je suis ton physio IA spécialisé en course à pied. Décris-moi ta douleur (localisation, intensité /10, depuis quand) et je te proposerai des exercices de kiné adaptés. Si la douleur est aiguë ou > 7/10, consulte un médecin.",
}

function PhysioChat() {
  const [messages, setMessages] = useState<PhysioMsg[]>([WELCOME])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    const userMsg: PhysioMsg = { role: "user", content: trimmed }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput("")
    setLoading(true)
    try {
      const res = await fetch("/api/ai/physio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.filter(m => m !== WELCOME) }),
      })
      const data = await res.json()
      setMessages([...history, { role: "assistant", content: data.reply ?? "Erreur de réponse." }])
    } catch {
      setMessages([...history, { role: "assistant", content: "Erreur de connexion. Réessaie dans un moment." }])
    } finally {
      setLoading(false)
    }
  }, [messages, loading])

  function reset() {
    hapticFeedback()
    setMessages([WELCOME])
    setInput("")
  }

  const showSuggestions = messages.length === 1

  return (
    <div className="rounded-[22px] overflow-hidden"
      style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.06) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(168,85,247,0.18)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3"
        style={{ borderBottom: "1px solid rgba(168,85,247,0.1)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.22)" }}>
            <Stethoscope size={14} style={{ color: "#A855F7" }} />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(168,85,247,0.7)" }}>Physio IA</p>
            <p className="text-[11px] font-black" style={{ color: "#FAFAFA" }}>Douleurs &amp; Kiné</p>
          </div>
        </div>
        {messages.length > 1 && (
          <motion.button whileTap={{ scale: 0.88 }} onClick={reset}
            className="w-7 h-7 rounded-xl flex items-center justify-center touch-feedback"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            <RotateCcw size={12} style={{ color: "rgba(250,250,250,0.35)" }} />
          </motion.button>
        )}
      </div>

      {/* Messages */}
      <div className="px-3 py-3 space-y-3 max-h-72 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-1.5"
                  style={{ background: "rgba(168,85,247,0.18)", border: "1px solid rgba(168,85,247,0.25)" }}>
                  <Stethoscope size={9} style={{ color: "#A855F7" }} />
                </div>
              )}
              <div className="max-w-[82%] px-3.5 py-2.5 rounded-[16px] text-[12px] leading-relaxed"
                style={{
                  background: m.role === "user"
                    ? "linear-gradient(135deg, rgba(168,85,247,0.22), rgba(168,85,247,0.14))"
                    : "rgba(255,255,255,0.05)",
                  border: m.role === "user"
                    ? "1px solid rgba(168,85,247,0.3)"
                    : "1px solid rgba(255,255,255,0.07)",
                  color: m.role === "user" ? "#FAFAFA" : "rgba(250,250,250,0.82)",
                  borderBottomRightRadius: m.role === "user" ? 4 : 16,
                  borderBottomLeftRadius: m.role === "assistant" ? 4 : 16,
                }}>
                {m.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading dots */}
        {loading && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(168,85,247,0.18)", border: "1px solid rgba(168,85,247,0.25)" }}>
              <Stethoscope size={9} style={{ color: "#A855F7" }} />
            </div>
            <div className="flex items-center gap-1 px-3.5 py-2.5 rounded-[16px]"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", borderBottomLeftRadius: 4 }}>
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.22 }}
                  style={{ background: "rgba(168,85,247,0.7)" }} />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map(s => (
            <motion.button key={s} whileTap={{ scale: 0.93 }} onClick={() => { hapticFeedback(); send(s) }}
              className="px-3 py-1.5 rounded-full text-[10px] font-bold touch-feedback"
              style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", color: "rgba(168,85,247,0.85)" }}>
              {s}
            </motion.button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-3 pb-3 pt-1">
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { hapticFeedback(); send(input) } }}
          placeholder="Décris ta douleur…"
          className="flex-1 bg-transparent text-[12px] outline-none"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(168,85,247,0.2)",
            borderRadius: 14,
            padding: "10px 14px",
            color: "#FAFAFA",
          }}
        />
        <motion.button whileTap={{ scale: 0.88 }}
          onClick={() => { hapticFeedback(); send(input) }}
          disabled={!input.trim() || loading}
          className="w-10 h-10 flex items-center justify-center rounded-2xl flex-shrink-0 touch-feedback"
          style={{
            background: input.trim() && !loading ? "rgba(168,85,247,0.22)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${input.trim() && !loading ? "rgba(168,85,247,0.35)" : "rgba(255,255,255,0.08)"}`,
            transition: "all 0.15s",
          }}>
          <Send size={14} style={{ color: input.trim() && !loading ? "#A855F7" : "rgba(250,250,250,0.2)" }} />
        </motion.button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   READINESS BADGE
══════════════════════════════════════════════════════════════ */
const READINESS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  optimal:           { label: "Optimal",          color: "#22C55E", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.25)" },
  normal:            { label: "Normal",            color: "#D4AF37", bg: "rgba(212,175,55,0.08)", border: "rgba(212,175,55,0.2)" },
  fatigué:           { label: "Fatigué",           color: "#FF6B1A", bg: "rgba(255,107,26,0.1)",  border: "rgba(255,107,26,0.22)" },
  "repos recommandé":{ label: "Repos recommandé",  color: "#EF4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.22)" },
}
function ReadinessBadge({ readiness }: { readiness: string }) {
  const c = READINESS_CFG[readiness] ?? READINESS_CFG.normal
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <motion.div className="w-1.5 h-1.5 rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
        transition={{ duration: 2, repeat: Infinity }} style={{ background: c.color }} />
      <span className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: c.color }}>{c.label}</span>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════ */
function scoreColor(s: number) { return s >= 70 ? "#22C55E" : s >= 45 ? "#F4D03F" : "#EF4444" }

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] } } }

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(212,175,55,0.2), transparent)" }} />
      <span className="text-[8px] font-bold uppercase tracking-[0.25em]" style={{ color: "rgba(212,175,55,0.38)" }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(270deg, rgba(212,175,55,0.2), transparent)" }} />
    </div>
  )
}

export default function ElitePage() {
  const { logs, loading, saveLog, updateAnalysis } = useHealthLogs()
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0])

  const logDates = new Set(logs.map(l => l.date))
  const selectedLog = logs.find(l => l.date === selectedDate) ?? null
  const todayStr = new Date().toISOString().split("T")[0]
  const isToday = selectedDate === todayStr

  function formatSelectedDate(d: string) {
    return new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
  }

  async function handleSave(data: HealthFormState) {
    setAnalyzing(true)
    try {
      const logEntry = {
        date: selectedDate,
        steps: Number(data.steps),
        calories: Number(data.calories),
        active_minutes: Number(data.active_minutes),
        active_breaks: Number(data.active_breaks),
        heart_rate_avg: Number(data.heart_rate_avg),
        sleep_hours: Number(data.sleep_hours),
        sleep_minutes: Number(data.sleep_minutes),
        sport_type: data.sport_type ?? null,
      }
      await saveLog(logEntry)
      try {
        const allLogs = [{ ...logEntry, user_profile: "dydz" }, ...logs.filter(l => l.date !== selectedDate)]
        const res = await fetch("/api/ai/analyse", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ healthLogs: allLogs, runs: [], profile: "dydz" }),
        })
        if (res.ok) { const analysis = await res.json(); await updateAnalysis(selectedDate, analysis) }
      } catch { /* best-effort */ }
    } finally { setAnalyzing(false) }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-5 animate-pulse">
        {[56, 8, 260, 180, 220, 120, 200].map((h, i) => (
          <div key={i} className="rounded-3xl" style={{ height: h, background: "rgba(255,255,255,0.04)", borderRadius: h < 20 ? 999 : 22 }} />
        ))}
      </div>
    )
  }

  const vitalityScore = selectedLog?.ai_analysis?.vitality_score ?? (logs.find(l => l.ai_analysis)?.ai_analysis?.vitality_score ?? 50)
  const readiness = selectedLog?.ai_analysis?.readiness ?? (logs.find(l => l.ai_analysis)?.ai_analysis?.readiness ?? "normal")
  const narrative = selectedLog?.ai_analysis?.narrative ?? null
  const recommendation = selectedLog?.ai_analysis?.recommendation ?? null
  const color = scoreColor(vitalityScore)
  const last30 = logs.slice(0, 30)

  return (
    <motion.div className="flex flex-col gap-5" variants={stagger} initial="hidden" animate="show">

      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoPP size={30} />
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--gold)" }}>Heritage Elite OS</p>
            <h1 className="text-[20px] font-black tracking-tight leading-none" style={{ color: "#FAFAFA" }}>
              Elite<span style={{ color: "var(--gold)" }}>.</span>
            </h1>
          </div>
        </div>
        <div className="w-10 h-10 flex items-center justify-center rounded-2xl"
          style={{ ...lgStyle("rgba(212,175,55,0.08)"), border: "1px solid rgba(212,175,55,0.18)" }}>
          <Crown size={17} style={{ color: "var(--gold)" }} />
        </div>
      </motion.div>

      {/* ── Stats du mois ── */}
      <motion.div variants={fadeUp}><Divider label="Bilan du mois" /></motion.div>
      <motion.div variants={fadeUp}><MonthlyStats logs={last30} /></motion.div>

      {/* ── Heatmap ── */}
      <motion.div variants={fadeUp}><ActivityHeatmap logs={last30} /></motion.div>

      {/* ── Courbes ── */}
      <motion.div variants={fadeUp}><Divider label="Tendances 14 jours" /></motion.div>
      <motion.div variants={fadeUp}><TabChart logs={last30} /></motion.div>

      {/* ── Analyse Sommeil ── */}
      {last30.some(l => l.sleep_hours) && (
        <motion.div variants={fadeUp}><SleepAnalysis logs={last30} /></motion.div>
      )}

      {/* ── Analyse FC ── */}
      {last30.some(l => l.heart_rate_avg) && (
        <motion.div variants={fadeUp}><HRAnalysis logs={last30} /></motion.div>
      )}

      {/* ── IA Mensuelle ── */}
      <motion.div variants={fadeUp}><Divider label="Intelligence artificielle" /></motion.div>
      <motion.div variants={fadeUp}><MonthlyAIReport logs={last30} /></motion.div>

      {/* ── Physio IA ── */}
      <motion.div variants={fadeUp}><Divider label="Physio IA · Douleurs &amp; Kiné" /></motion.div>
      <motion.div variants={fadeUp}><PhysioChat /></motion.div>

      {/* ── Journal quotidien ── */}
      <motion.div variants={fadeUp}><Divider label="Journal quotidien" /></motion.div>

      {/* Calendar */}
      <motion.div variants={fadeUp}>
        <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} logDates={logDates} />
      </motion.div>

      {/* Selected date label */}
      <motion.p variants={fadeUp} className="text-[11px] font-semibold px-1 capitalize" style={{ color: "rgba(250,250,250,0.32)" }}>
        {formatSelectedDate(selectedDate)}
        {isToday && <span className="ml-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--gold)" }}>• Aujourd'hui</span>}
      </motion.p>

      {/* Vitality orb */}
      <motion.div variants={fadeUp} className="flex justify-center">
        <AnimatePresence mode="wait">
          <motion.div key={selectedDate} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            {selectedLog ? (
              <VitalityOrb score={vitalityScore} color={color} />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3" style={{ width: 180, height: 180 }}>
                <div className="w-14 h-14 flex items-center justify-center rounded-[24px]"
                  style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.12)" }}>
                  <BookOpen size={22} style={{ color: "rgba(212,175,55,0.4)" }} />
                </div>
                <p className="text-[12px] text-center font-medium" style={{ color: "rgba(250,250,250,0.28)" }}>Aucune entrée<br />pour ce jour</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Readiness + badge */}
      {selectedLog && (
        <div className="flex flex-col items-center gap-2">
          <ReadinessBadge readiness={readiness} />
          {selectedLog.sport_type && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
              style={{ background: selectedLog.sport_type === "running" ? "rgba(34,197,94,0.06)" : "rgba(168,85,247,0.06)", border: `1px solid ${selectedLog.sport_type === "running" ? "rgba(34,197,94,0.15)" : "rgba(168,85,247,0.15)"}` }}>
              <span>{selectedLog.sport_type === "running" ? "🏃" : "🎾"}</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.18em]"
                style={{ color: selectedLog.sport_type === "running" ? "rgba(34,197,94,0.8)" : "rgba(168,85,247,0.8)" }}>
                {selectedLog.sport_type === "running" ? "Course à pied" : "Padel"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Journal button */}
      <motion.button variants={fadeUp} whileTap={{ scale: 0.97 }}
        onClick={() => { hapticFeedback(); setShowQuestionnaire(true) }}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[22px] font-bold text-sm touch-feedback"
        style={{ ...lgStyle("rgba(212,175,55,0.06)"), border: "1px solid rgba(212,175,55,0.2)", color: "var(--gold)" }}>
        <BookOpen size={15} />
        {selectedLog ? "Modifier ce jour" : "Remplir ce jour"}
      </motion.button>

      {/* AI Narrative du jour */}
      <AnimatePresence mode="wait">
        {analyzing ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-3 py-6">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 rounded-full border-2 flex-shrink-0"
              style={{ borderColor: "rgba(212,175,55,0.2)", borderTopColor: "var(--gold)" }} />
            <span className="text-sm font-medium" style={{ color: "rgba(250,250,250,0.4)" }}>Analyse IA en cours…</span>
          </motion.div>
        ) : narrative ? (
          <motion.div key={`n-${selectedDate}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="relative rounded-[22px] px-5 py-5"
            style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.05) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(212,175,55,0.12)" }}>
            <div className="absolute top-2 left-4 text-4xl font-black select-none" style={{ color: "rgba(212,175,55,0.12)" }}>"</div>
            <p className="text-[13px] leading-[1.7] pl-3" style={{ color: "rgba(250,250,250,0.72)" }}>{narrative}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Recommendation */}
      {recommendation && !analyzing && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 px-4 py-4 rounded-[18px]"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-7 h-7 flex items-center justify-center rounded-xl flex-shrink-0 mt-0.5"
            style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}>
            <Sparkles size={13} style={{ color: "var(--gold)" }} />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: "var(--gold)" }}>Conseil pour demain</p>
            <p className="text-[12px] leading-relaxed" style={{ color: "rgba(250,250,250,0.6)" }}>{recommendation}</p>
          </div>
        </motion.div>
      )}

      {/* Heritage footer */}
      <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 py-2">
        <div className="h-px flex-1" style={{ background: "rgba(212,175,55,0.08)" }} />
        <span className="text-[8px] uppercase tracking-[0.3em]" style={{ color: "rgba(212,175,55,0.2)" }}>PacePulse Heritage Elite OS</span>
        <div className="h-px flex-1" style={{ background: "rgba(212,175,55,0.08)" }} />
      </motion.div>

      <DailyQuestionnaire open={showQuestionnaire} onClose={() => setShowQuestionnaire(false)}
        onSave={handleSave} existingData={selectedLog} date={selectedDate} />
    </motion.div>
  )
}
