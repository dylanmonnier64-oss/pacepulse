"use client"
import { use, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  ArrowLeft, TrendingUp, Clock, Mountain, Heart,
  Star, Trash2, ImageIcon, Edit2, Wind,
  Thermometer, Zap, Award,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  Tooltip, Cell, AreaChart, Area, ReferenceLine,
} from "recharts"
import { RaceCardGenerator } from "@/components/race/RaceCardGenerator"
import { useRuns } from "@/hooks/useRuns"
import type { Run } from "@/lib/types"
import {
  formatDistance, formatPace, formatDuration,
  formatDate, getRunTypeLabel, getRunTypeColor, getWeatherIcon,
} from "@/lib/utils"
import { toast } from "@/lib/toast"
import {
  glass, colors, transitions, runTypeTokens,
  gradients, shadows, metrics,
} from "@/lib/design-system"

// ── Tooltip glassmorphic ──────────────────────────────────────────
function GlassTooltip({ active, payload, formatter }: {
  active?: boolean; payload?: Array<{ value: number }>
  formatter: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-xl text-xs font-bold"
      style={{ ...glass.card, color: "#FAFAFA" }}>
      {formatter(payload[0].value)}
    </div>
  )
}

// ── Graphe des splits ─────────────────────────────────────────────
function SplitChart({ splits, typeColor }: { splits: Run["splits"]; typeColor: string }) {
  if (!splits?.length) return null
  const avgPace = splits.reduce((s, sp) => s + sp.pace, 0) / splits.length
  const best    = Math.min(...splits.map(s => s.pace))
  const worst   = Math.max(...splits.map(s => s.pace))

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28, ...transitions.reveal }}
      className="rounded-[22px] overflow-hidden p-4"
      style={glass.card}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.20em] mb-0.5" style={{ color: colors.text.label }}>
            Splits par kilomètre
          </p>
          <p className="text-xs font-semibold" style={{ color: colors.text.secondary }}>
            Allure moy. {formatPace(avgPace)}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px]" style={{ color: colors.text.subtle }}>
          <span>⚡ {formatPace(best)}</span>
          <span>🐢 {formatPace(worst)}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={110}>
        <BarChart data={splits} barSize={16} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="km"
            axisLine={false} tickLine={false}
            tick={{ fontSize: 9, fill: "rgba(250,250,250,0.38)" }}
          />
          <YAxis hide domain={["dataMin - 15", "dataMax + 15"]} />
          <ReferenceLine y={avgPace} stroke={typeColor} strokeDasharray="4 3" strokeOpacity={0.45} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)", radius: 6 }}
            content={<GlassTooltip formatter={v => `${formatPace(v)}/km`} />}
          />
          <Bar dataKey="pace" radius={[5, 5, 2, 2]}>
            {splits.map((sp, i) => (
              <Cell
                key={i}
                fill={sp.pace < avgPace * 0.97
                  ? "#22C55E"
                  : sp.pace > avgPace * 1.03
                  ? "#EF4444"
                  : typeColor}
                fillOpacity={0.9}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-2 text-[10px]" style={{ color: colors.text.subtle }}>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: "#22C55E" }} /> Rapide
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: typeColor }} /> Allure moy.
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: "#EF4444" }} /> Lent
        </span>
      </div>
    </motion.div>
  )
}

// ── Graphe de fréquence cardiaque par split ───────────────────────
function HRChart({ splits, typeColor }: { splits: Run["splits"]; typeColor: string }) {
  const hrSplits = splits?.filter(s => s.heartRate != null)
  if (!hrSplits?.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.34, ...transitions.reveal }}
      className="rounded-[22px] p-4"
      style={glass.card}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.20em] mb-3" style={{ color: colors.text.label }}>
        ❤️ Fréquence cardiaque / km
      </p>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={hrSplits} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="km" hide />
          <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
          <Tooltip
            cursor={false}
            content={<GlassTooltip formatter={v => `${Math.round(v)} bpm`} />}
          />
          <Area type="monotone" dataKey="heartRate" stroke="#EF4444" strokeWidth={2}
            fill="url(#hrGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

// ── Carte métrique ────────────────────────────────────────────────
function MetricCard({
  icon: Icon, label, value, unit, color, delay = 0
}: {
  icon: React.ElementType; label: string; value: string
  unit?: string; color: string; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ...transitions.reveal }}
      className="rounded-[20px] p-4 flex items-center gap-3"
      style={{ ...glass.card, background: `${color}08`, border: `1px solid ${color}20` }}
      whileHover={{ y: -2, boxShadow: shadows.hover(color) }}
    >
      <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-0.5" style={{ color: colors.text.label }}>
          {label}
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-[17px] font-black data-mono leading-tight" style={{ color: "#FAFAFA" }}>
            {value}
          </span>
          {unit && <span className="text-[10px] font-semibold" style={{ color }}>{unit}</span>}
        </div>
      </div>
    </motion.div>
  )
}

// ── Barre de ressenti ─────────────────────────────────────────────
function FeelingBar({ feeling, color }: { feeling: number; color: string }) {
  const emoji = feeling >= 8 ? "🔥" : feeling >= 6 ? "😊" : feeling >= 4 ? "😐" : "😓"
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, ...transitions.reveal }}
      className="rounded-[22px] p-4"
      style={glass.card}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.20em]" style={{ color: colors.text.label }}>
          {metrics.feeling.icon} Ressenti
        </p>
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="text-lg font-black data-mono" style={{ color }}>{feeling}</span>
          <span className="text-[11px]" style={{ color: colors.text.subtle }}>/10</span>
        </div>
      </div>
      <div className="relative h-2 w-full rounded-full overflow-hidden"
        style={{ background: colors.border.subtle }}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${feeling * 10}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[9px]" style={{ color: colors.text.subtle }}>Difficile</span>
        <span className="text-[9px]" style={{ color: colors.text.subtle }}>Excellent</span>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════
export default function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }            = use(params)
  const { runs, removeRun } = useRuns()
  const run               = useMemo(() => runs.find(r => r.id === id), [runs, id])

  if (!run) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="text-5xl">🔍</span>
        <p className="text-sm" style={{ color: colors.text.muted }}>Sortie introuvable</p>
        <Link href="/runs"
          className="text-sm font-semibold px-4 py-2 rounded-2xl"
          style={{ ...glass.card, color: "#F4D03F" }}>
          ← Retour aux runs
        </Link>
      </div>
    )
  }

  const typeColor = getRunTypeColor(run.type)
  const token     = runTypeTokens[run.type as keyof typeof runTypeTokens]
  const isPR      = run.isPersonalRecord && Object.keys(run.isPersonalRecord).length > 0

  const keyMetrics = [
    { icon: TrendingUp, label: metrics.pace.label,      value: formatPace(run.pace),          unit: "/km",   color: "#F4D03F",  delay: 0.14 },
    { icon: Clock,      label: metrics.duration.label,  value: formatDuration(run.duration),  unit: "",      color: "#3B82F6",  delay: 0.18 },
    { icon: Mountain,   label: metrics.elevation.label, value: `${run.elevation}`,            unit: "m D+",  color: "#9B59B6",  delay: 0.22 },
    run.heartRate
      ? { icon: Heart,  label: metrics.heartRate.label, value: String(run.heartRate.avg),     unit: "bpm",   color: "#EF4444",  delay: 0.26 }
      : { icon: Star,   label: metrics.feeling.label,   value: `${run.feeling}`,             unit: "/10",   color: "#F4D03F",  delay: 0.26 },
    ...(run.tss ? [{ icon: Zap, label: metrics.tss.label, value: String(run.tss), unit: "TSS", color: "#A855F7", delay: 0.30 }] : []),
  ]

  return (
    <motion.div
      className="flex flex-col gap-4 pb-4"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/runs"
          aria-label="Retour à la liste des sorties"
          className="touch-feedback w-10 h-10 rounded-2xl flex items-center justify-center"
          style={glass.card}
        >
          <ArrowLeft size={18} style={{ color: colors.text.secondary }} />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/runs/${run.id}/edit`}
            aria-label="Modifier ce run"
            className="touch-feedback w-10 h-10 rounded-2xl flex items-center justify-center"
            style={glass.card}
          >
            <Edit2 size={15} style={{ color: colors.text.secondary }} />
          </Link>
          <button
            onClick={() => {
              if (confirm("Supprimer définitivement cette sortie ?")) {
                removeRun(run.id)
                toast.success("Sortie supprimée")
                window.history.back()
              }
            }}
            aria-label="Supprimer ce run"
            className="touch-feedback w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ ...glass.card, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}
          >
            <Trash2 size={15} style={{ color: "#EF4444" }} />
          </button>
        </div>
      </div>

      {/* ── Hero card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, ...transitions.reveal }}
        className="rounded-[24px] p-5 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${typeColor}22, ${typeColor}08)`, border: `1px solid ${typeColor}35` }}
      >
        {/* Reflet haut */}
        <div className="absolute top-0 inset-x-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${typeColor}50, transparent)` }} />
        {/* Lueur fond */}
        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 rounded-full pointer-events-none"
          style={{ background: `${typeColor}18`, filter: "blur(32px)" }} />

        <div className="relative">
          {/* Badge type + PR */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ background: `${typeColor}22`, color: typeColor, border: `1px solid ${typeColor}35` }}>
              {token?.emoji} {getRunTypeLabel(run.type)}
            </span>
            {isPR && (
              <motion.span
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 16 }}
                className="text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1"
                style={{ background: "rgba(244,208,63,0.9)", color: "#050505" }}
              >
                <Award size={10} /> Record perso
              </motion.span>
            )}
          </div>

          {/* Date */}
          <p className="text-[11px] font-semibold mb-3" style={{ color: `${typeColor}90` }}>
            {formatDate(run.date)}
          </p>

          {/* Distance — grande valeur */}
          <div className="flex items-baseline gap-2">
            <motion.span
              className="text-[64px] font-black tracking-tight data-mono leading-none"
              style={{ color: "#FAFAFA" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, ...transitions.reveal }}
            >
              {formatDistance(run.distance)}
            </motion.span>
            <span className="text-[28px] font-bold" style={{ color: "rgba(250,250,250,0.45)" }}>km</span>
          </div>

          {/* Notes inline si courtes */}
          {run.notes && run.notes.length < 80 && (
            <p className="mt-2 text-[12px] italic leading-relaxed" style={{ color: "rgba(250,250,250,0.5)" }}>
              « {run.notes} »
            </p>
          )}
        </div>
      </motion.div>

      {/* ── Métriques clés ── */}
      <div className="grid grid-cols-2 gap-2.5">
        {keyMetrics.map((m, i) => (
          <MetricCard key={i} {...m} />
        ))}
      </div>

      {/* ── Ressenti ── */}
      <FeelingBar feeling={run.feeling} color={typeColor} />

      {/* ── Splits chart ── */}
      <AnimatePresence>
        {run.splits && <SplitChart key="splits" splits={run.splits} typeColor={typeColor} />}
      </AnimatePresence>

      {/* ── HR chart ── */}
      <AnimatePresence>
        {run.splits && <HRChart key="hr" splits={run.splits} typeColor={typeColor} />}
      </AnimatePresence>

      {/* ── Météo ── */}
      {run.weather && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, ...transitions.reveal }}
          className="rounded-[22px] p-4"
          style={glass.card}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.20em] mb-3" style={{ color: colors.text.label }}>
            ☁️ Météo
          </p>
          <div className="flex items-center gap-5">
            <span className="text-4xl">{getWeatherIcon(run.weather.conditions)}</span>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <Thermometer size={13} style={{ color: "#EF4444" }} />
                <span className="font-bold text-sm" style={{ color: "#FAFAFA" }}>{run.weather.temp}°C</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wind size={13} style={{ color: "#3B82F6" }} />
                <span className="font-semibold text-sm" style={{ color: colors.text.secondary }}>
                  {run.weather.wind} km/h
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Notes longues ── */}
      {run.notes && run.notes.length >= 80 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, ...transitions.reveal }}
          className="rounded-[22px] p-4"
          style={glass.card}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.20em] mb-2" style={{ color: colors.text.label }}>
            📝 Notes
          </p>
          <p className="text-[12px] leading-relaxed" style={{ color: colors.text.secondary }}>{run.notes}</p>
        </motion.div>
      )}

      {/* ── Race Card generator ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.46, ...transitions.reveal }}
        className="rounded-[24px] p-4"
        style={{ ...glass.card, background: "rgba(255,255,255,0.03)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon size={13} style={{ color: "#F4D03F" }} />
          <p className="text-[9px] font-bold uppercase tracking-[0.20em]" style={{ color: colors.text.label }}>
            Race Card — Partage ta sortie
          </p>
        </div>
        <RaceCardGenerator run={run} />
      </motion.div>

      <div className="h-2" />
    </motion.div>
  )
}
