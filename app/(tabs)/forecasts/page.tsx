"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  Zap, ChevronRight, ChevronDown,
  RefreshCw, TrendingUp, BookOpen, Target,
  Info, Flame, Gauge, Activity,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts"
import { lgStyle, hapticFeedback } from "@/lib/utils"
import { glass, colors, transitions, shadows } from "@/lib/design-system"
import {
  useForecasts, fmtSeconds,
} from "@/hooks/useForecasts"
import type { ConfidenceMode, ContributingRun } from "@/app/api/forecasts/route"

// ── Design tokens locaux ──────────────────────────────────────────
const GOLD   = colors.gold.DEFAULT
const GOLD_Y = colors.gold.bright
const PURPLE = "#A855F7"
const BLUE   = "#6366F1"
const RED    = "#EF4444"
const GREEN  = "#22C55E"

const DIST_META: Record<string, { label: string; emoji: string; color: string; distKm: string; km: number }> = {
  "10km":     { label: "10 km",        emoji: "🏃", color: BLUE,   distKm: "10,0 km", km: 10 },
  "semi":     { label: "Semi-marathon", emoji: "🌓", color: PURPLE, distKm: "21,1 km", km: 21.1 },
  "marathon": { label: "Marathon",      emoji: "🏆", color: GOLD,   distKm: "42,2 km", km: 42.2 },
}

const MODES: Array<{ value: ConfidenceMode; label: string; desc: string; color: string }> = [
  { value: "conservateur", label: "Conservateur", desc: "+2,5%",  color: BLUE   },
  { value: "réaliste",     label: "Réaliste",     desc: "Base",   color: GOLD_Y },
  { value: "ambitieux",    label: "Ambitieux",    desc: "−2,5%",  color: RED    },
]

// ── Barre de confiance ────────────────────────────────────────────
function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 75 ? GREEN : value >= 65 ? GOLD_Y : RED
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="text-[10px] font-bold tabular-nums" style={{ color, minWidth: 28 }}>{value}%</span>
    </div>
  )
}

// ── Tooltip glassmorphic ──────────────────────────────────────────
function PaceTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { paceStr: string } }> }) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold"
      style={{ ...glass.card, color: "#FAFAFA" }}>
      {payload[0].payload.paceStr}/km
    </div>
  )
}

// ── Graphe distribution allure ────────────────────────────────────
function PaceChart({ distKey, color, distribution }: {
  distKey: string
  color: string
  distribution: Array<{ km: number; pace: number; paceStr: string }>
}) {
  if (!distribution.length) return null
  return (
    <div className="mt-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "rgba(250,250,250,0.32)" }}>
        Distribution allure prévisionnelle
      </p>
      <ResponsiveContainer width="100%" height={70}>
        <AreaChart data={distribution} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`grad-${distKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="km" hide />
          <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} reversed />
          <Tooltip cursor={false} content={<PaceTooltip />} />
          <Area type="monotone" dataKey="pace" stroke={color} strokeWidth={1.5}
            fill={`url(#grad-${distKey})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Card : sorties contributives ──────────────────────────────────
function ContributingRunsCard({
  runs, runsAnalyzed,
}: {
  runs: ContributingRun[]
  runsAnalyzed: number
}) {
  const [expanded, setExpanded] = useState(false)
  const displayed = expanded ? runs : runs.slice(0, 3)

  function ageFr(date: string) {
    const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
    if (d === 0) return "aujourd'hui"
    if (d === 1) return "hier"
    if (d < 7)  return `il y a ${d}j`
    if (d < 31) return `il y a ${Math.floor(d / 7)} sem.`
    return `il y a ${Math.floor(d / 30)} mois`
  }

  function fmtDur(sec: number) {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    if (h > 0) return `${h}h${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    return `${m}:${String(s).padStart(2, "0")}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, ...transitions.reveal }}
      className="rounded-2xl p-4"
      style={lgStyle("rgba(168,85,247,0.06)")}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.28)" }}>
            <Activity size={14} style={{ color: PURPLE }} />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.20em]" style={{ color: "rgba(250,250,250,0.35)" }}>
              Analyse automatique
            </p>
            <p className="text-sm font-bold" style={{ color: "#FAFAFA" }}>
              {runsAnalyzed} sortie{runsAnalyzed !== 1 ? "s" : ""} analysée{runsAnalyzed !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-xl text-[10px] font-bold"
          style={{ background: "rgba(168,85,247,0.14)", border: "1px solid rgba(168,85,247,0.26)", color: PURPLE }}>
          VDOT auto
        </div>
      </div>

      {/* Liste des sorties */}
      <div className="flex flex-col gap-1.5">
        {displayed.map((run, i) => (
          <div key={run.id}
            className="flex items-center justify-between py-2.5 px-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-sm flex-shrink-0">🏃</span>
              <div className="min-w-0">
                <p className="text-[12px] font-bold leading-tight" style={{ color: "#FAFAFA" }}>
                  <span className="data-mono">{run.distance.toFixed(1)} km</span>
                  <span style={{ color: "rgba(250,250,250,0.4)" }}> · </span>
                  <span className="data-mono">{fmtDur(run.duration)}</span>
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(250,250,250,0.35)" }}>
                  {ageFr(run.date)}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[12px] font-black data-mono" style={{ color: PURPLE }}>
                {run.vdot}
              </p>
              {i === 0 ? (
                <p className="text-[9px] font-bold" style={{ color: "rgba(168,85,247,0.65)" }}>meilleur</p>
              ) : (
                <p className="text-[9px]" style={{ color: "rgba(250,250,250,0.25)" }}>VDOT</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Voir plus */}
      {runs.length > 3 && (
        <button
          onClick={() => { hapticFeedback(); setExpanded(e => !e) }}
          className="touch-feedback w-full flex items-center justify-center gap-1.5 mt-2 py-2 text-[11px] font-semibold rounded-xl"
          style={{ color: "rgba(250,250,250,0.38)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.22 }}>
            <ChevronDown size={13} />
          </motion.div>
          {expanded ? "Voir moins" : `Voir ${runs.length - 3} sortie${runs.length - 3 > 1 ? "s" : ""} de plus`}
        </button>
      )}

      {/* Info */}
      <p className="text-[10px] mt-3 leading-relaxed" style={{ color: "rgba(250,250,250,0.30)" }}>
        💡 Tes {runs.length} meilleures sorties sont utilisées. Plus tu cours, plus les prévisions s'affinent.
      </p>
    </motion.div>
  )
}

// ── Carte de prévision ────────────────────────────────────────────
function ForecastCard({ idx, distance, label, emoji, color, distKm,
  predictedSec, low, high, confidence, pace, vdot, sourcedFrom, paceDistribution,
}: {
  idx: number; distance: string; label: string; emoji: string; color: string; distKm: string
  predictedSec: number; low: number; high: number; confidence: number
  pace: string; vdot: number
  sourcedFrom: string[]
  paceDistribution: Array<{ km: number; pace: number; paceStr: string }>
}) {
  const [showChart, setShowChart] = useState(false)
  const [showSrc,   setShowSrc]   = useState(false)
  const h = Math.floor(predictedSec / 3600)
  const m = Math.floor((predictedSec % 3600) / 60)
  const s = predictedSec % 60

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08, ...transitions.reveal }}
      className="rounded-2xl overflow-hidden"
      style={lgStyle("rgba(255,255,255,0.04)")}
      whileHover={{ y: -3, boxShadow: shadows.hover(color) }}
    >
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}44)` }} />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">{emoji}</span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.20em]" style={{ color: "rgba(250,250,250,0.35)" }}>{distKm}</p>
              <p className="text-sm font-bold" style={{ color: "#FAFAFA" }}>{label}</p>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded-xl" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
            <span className="text-[10px] font-bold" style={{ color }}>VDOT {vdot}</span>
          </div>
        </div>

        {/* Temps prédit */}
        <div className="flex items-baseline gap-0.5 mb-1">
          {h > 0 && (
            <>
              <span className="text-[32px] font-black data-mono leading-none" style={{ color: "#FAFAFA" }}>{h}</span>
              <span className="text-lg font-bold mb-1" style={{ color: "rgba(250,250,250,0.45)" }}>h</span>
            </>
          )}
          <span className="text-[32px] font-black data-mono leading-none" style={{ color: "#FAFAFA" }}>
            {String(m).padStart(h > 0 ? 2 : 1, "0")}
          </span>
          <span className="text-lg font-bold mb-1" style={{ color: "rgba(250,250,250,0.45)" }}>:</span>
          <span className="text-[32px] font-black data-mono leading-none" style={{ color: "#FAFAFA" }}>
            {String(s).padStart(2, "0")}
          </span>
        </div>
        <p className="text-[11px] font-semibold mb-3" style={{ color: "rgba(250,250,250,0.45)" }}>{pace}</p>

        {/* Confiance */}
        <ConfidenceBar value={confidence} />
        <div className="flex justify-between mt-2">
          <span className="text-[10px]" style={{ color: "rgba(250,250,250,0.35)" }}>🔽 {fmtSeconds(low)}</span>
          <span className="text-[10px]" style={{ color: "rgba(250,250,250,0.35)" }}>🔼 {fmtSeconds(high)}</span>
        </div>

        {/* Graphe allure */}
        <AnimatePresence>
          {showChart && (
            <motion.div key="chart"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden" }}>
              <PaceChart distKey={distance} color={color} distribution={paceDistribution} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 pt-2.5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex gap-3">
            <button onClick={() => { hapticFeedback(); setShowChart(v => !v) }}
              className="touch-feedback text-[10px] font-semibold flex items-center gap-1"
              style={{ color: showChart ? color : "rgba(250,250,250,0.32)" }}>
              <Gauge size={11} /> {showChart ? "Masquer" : "Allure/km"}
            </button>
            {sourcedFrom.length > 0 && (
              <button onClick={() => { hapticFeedback(); setShowSrc(v => !v) }}
                className="touch-feedback text-[10px] font-semibold flex items-center gap-1"
                style={{ color: "rgba(250,250,250,0.28)" }}>
                <Info size={10} />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showSrc && (
            <motion.p key="src"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-[10px] mt-1.5 leading-relaxed"
              style={{ color: "rgba(250,250,250,0.38)", overflow: "hidden" }}>
              Basé sur : {sourcedFrom.join(", ")} — VDOT Jack Daniels. Confiance {confidence}%.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ── Allures d'entraînement ────────────────────────────────────────
function TrainingPacesCard({ paces }: { paces: { easy: string; marathon: string; threshold: string; interval: string; repetition: string } }) {
  const zones = [
    { label: "Footing (E)",     pace: paces.easy,       color: GREEN,      desc: "Aérobie facile — 60–79% VO₂max" },
    { label: "Allure Marathon",  pace: paces.marathon,   color: GOLD,       desc: "Ton allure cible sur 42 km" },
    { label: "Seuil (T)",       pace: paces.threshold,  color: "#E67E22",  desc: "Seuil lactique — ~88% VO₂max" },
    { label: "Fractionné (I)",  pace: paces.interval,   color: RED,        desc: "VO₂max — ~97,5% — intervalles" },
    { label: "Répétitions (R)", pace: paces.repetition, color: PURPLE,     desc: "Vitesse — >100% — courtes reps" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, ...transitions.reveal }}
      className="rounded-2xl overflow-hidden"
      style={lgStyle("rgba(255,255,255,0.03)")}
    >
      <div className="p-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.25)" }}>
            <TrendingUp size={13} style={{ color: GOLD }} />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.20em]" style={{ color: "rgba(250,250,250,0.35)" }}>Jack Daniels</p>
            <p className="text-sm font-bold" style={{ color: "#FAFAFA" }}>Allures d'entraînement</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {zones.map(({ label, pace, color, desc }) => (
            <div key={label} className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl"
              style={{ background: `${color}08`, border: `1px solid ${color}18` }}>
              <div className="min-w-0">
                <p className="text-[11px] font-bold" style={{ color: "#FAFAFA" }}>{label}</p>
                <p className="text-[9px]" style={{ color: "rgba(250,250,250,0.38)" }}>{desc}</p>
              </div>
              <span className="text-[13px] font-black data-mono flex-shrink-0" style={{ color }}>{pace}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ── Sélecteur de mode ─────────────────────────────────────────────
function ModeSelector({ mode, onChange }: { mode: ConfidenceMode; onChange: (m: ConfidenceMode) => void }) {
  return (
    <div className="rounded-2xl p-3" style={lgStyle("rgba(255,255,255,0.03)")}>
      <p className="text-[9px] font-bold uppercase tracking-[0.20em] mb-2.5 px-1"
        style={{ color: "rgba(250,250,250,0.35)" }}>
        Mode de prédiction
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {MODES.map(({ value, label, desc, color }) => {
          const active = mode === value
          return (
            <button
              key={value}
              onClick={() => { hapticFeedback(); onChange(value) }}
              aria-pressed={active}
              className="touch-feedback flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl font-semibold transition-all"
              style={{
                ...(active ? lgStyle(`${color}15`) : lgStyle()),
                border: active ? `1px solid ${color}38` : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span className="text-[11px] font-bold" style={{ color: active ? color : "rgba(250,250,250,0.5)" }}>{label}</span>
              <span className="text-[9px]" style={{ color: active ? `${color}cc` : "rgba(250,250,250,0.28)" }}>{desc}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Visualiseur potentiel ─────────────────────────────────────────
function PotentialVisualizer({ forecasts, strongestAt, avgVDOT }: {
  forecasts: Array<{ distance: string; vdot: number }>
  strongestAt: string; avgVDOT: number
}) {
  const maxVDOT = Math.max(...forecasts.map(f => f.vdot), 1)
  return (
    <div className="rounded-2xl p-4" style={lgStyle("rgba(255,255,255,0.03)")}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold" style={{ color: "#FAFAFA" }}>Force relative</p>
        <div className="px-2.5 py-1 rounded-xl text-[10px] font-bold"
          style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.25)", color: GOLD }}>
          VDOT moy. {avgVDOT}
        </div>
      </div>
      {forecasts.map(f => {
        const meta = DIST_META[f.distance]
        const pct  = (f.vdot / maxVDOT) * 100
        const isStrongest = f.distance === strongestAt
        return (
          <div key={f.distance} className="mb-3">
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-2">
                <span>{meta.emoji}</span>
                <span className="text-[11px] font-semibold" style={{ color: isStrongest ? meta.color : "rgba(250,250,250,0.65)" }}>
                  {meta.label}
                </span>
                {isStrongest && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-lg font-bold"
                    style={{ background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}35` }}>
                    + fort
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold data-mono" style={{ color: meta.color }}>{f.vdot}</span>
            </div>
            <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${meta.color}88, ${meta.color})` }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Comment c'est calculé ─────────────────────────────────────────
function HowCalculated() {
  const [open, setOpen] = useState(false)
  const items = [
    { icon: "🏃", title: "Toutes tes sorties comptent", desc: "Le VDOT est calculé pour chaque sortie ≥ 3 km. Les meilleures performances déterminent ton potentiel réel." },
    { icon: "🔬", title: "VDOT (Jack Daniels)", desc: "Équivalent VO₂max calculé depuis ton allure d'entraînement. Plus le VDOT est élevé, plus ton niveau est fort." },
    { icon: "📅", title: "Récence pondérée", desc: "Tes sorties des 30 derniers jours comptent 3× plus. Les plus récentes reflètent mieux ta forme actuelle." },
    { icon: "🎯", title: "Modes de confiance", desc: "Conservateur (+2,5%), Réaliste (base), Ambitieux (−2,5%) sur le temps prédit." },
  ]
  return (
    <div className="rounded-2xl overflow-hidden" style={lgStyle("rgba(255,255,255,0.03)")}>
      <button onClick={() => { hapticFeedback(); setOpen(o => !o) }}
        className="touch-feedback w-full flex items-center justify-between p-4" aria-expanded={open}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}>
            <BookOpen size={14} style={{ color: BLUE }} />
          </div>
          <div className="text-left">
            <p className="text-[9px] font-bold uppercase tracking-[0.20em]" style={{ color: "rgba(250,250,250,0.35)" }}>Transparence</p>
            <p className="text-sm font-bold" style={{ color: "#FAFAFA" }}>Comment c'est calculé ?</p>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }}>
          <ChevronDown size={16} style={{ color: "rgba(250,250,250,0.4)" }} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
            style={{ overflow: "hidden" }}>
            <div className="px-4 pb-4 flex flex-col gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {items.map(item => (
                <div key={item.title} className="flex gap-3 pt-3">
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-xs font-bold mb-0.5" style={{ color: "#FAFAFA" }}>{item.title}</p>
                    <p className="text-[11px] leading-relaxed" style={{ color: "rgba(250,250,250,0.5)" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── État vide ─────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center gap-4 py-10 rounded-2xl px-6"
      style={lgStyle("rgba(255,255,255,0.03)")}>
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-16 h-16 rounded-3xl flex items-center justify-center"
        style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}>
        <Target size={28} style={{ color: GOLD }} />
      </motion.div>
      <div>
        <h3 className="text-base font-bold mb-2" style={{ color: "#FAFAFA" }}>Commence à courir !</h3>
        <p className="text-[12px] leading-relaxed" style={{ color: "rgba(250,250,250,0.45)" }}>
          Enregistre au moins une sortie de <strong style={{ color: "#FAFAFA" }}>3 km ou plus</strong> pour voir tes prévisions de performance automatiques.
        </p>
      </div>
      <Link href="/runs/new"
        className="touch-feedback flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm"
        onClick={hapticFeedback}
        style={{ ...lgStyle("rgba(244,208,63,0.10)"), color: GOLD_Y, border: `1px solid rgba(244,208,63,0.28)` }}>
        <Flame size={15} /> Ajouter un run
      </Link>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════
export default function ForecastsPage() {
  const {
    mode, setMode,
    result, loading, error,
    runsCount, contributingRuns, runsAnalyzed,
    refresh,
  } = useForecasts()

  return (
    <motion.div className="flex flex-col gap-5 pb-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

      {/* Orbe décoratif */}
      <div aria-hidden className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-80 h-48 opacity-20"
        style={{ background: "radial-gradient(ellipse, #A855F7 0%, transparent 70%)", filter: "blur(40px)", zIndex: 0 }} />

      {/* Header */}
      <div className="relative z-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-0.5" style={{ color: "rgba(250,250,250,0.38)" }}>
          Analyses avancées
        </p>
        <h1 className="text-[24px] font-black tracking-tight leading-tight" style={{ color: "#FAFAFA" }}>
          Le Petit Plus<span style={{ color: GOLD_Y }}>.</span>
        </h1>
        <p className="text-[13px] font-semibold mt-0.5" style={{ color: PURPLE }}>Prévisions de performance</p>
      </div>

      {/* Info card */}
      <motion.div className="rounded-2xl p-4" style={lgStyle("rgba(168,85,247,0.06)")}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.28)" }}>
            <Zap size={14} style={{ color: PURPLE }} />
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: "rgba(250,250,250,0.65)" }}>
            PacePulse analyse <strong style={{ color: "#FAFAFA" }}>automatiquement toutes tes sorties</strong> pour prédire tes temps sur 10 km, semi et marathon — même sans avoir couru ces distances.
          </p>
        </div>
      </motion.div>

      {/* ── Sorties contributives ── */}
      {contributingRuns.length > 0 && (
        <ContributingRunsCard runs={contributingRuns} runsAnalyzed={runsAnalyzed} />
      )}

      {/* ── Mode ── */}
      <ModeSelector mode={mode} onChange={setMode} />

      {/* ── Prévisions ── */}
      <section aria-label="Prévisions de temps">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold" style={{ color: "#FAFAFA" }}>Temps prédits</h2>
          <button onClick={() => { hapticFeedback(); refresh() }} disabled={loading}
            className="touch-feedback flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl"
            style={{ ...lgStyle("rgba(255,255,255,0.06)"), color: "rgba(250,250,250,0.6)" }}>
            <motion.div
              animate={loading ? { rotate: 360 } : { rotate: 0 }}
              transition={loading ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}>
              <RefreshCw size={11} />
            </motion.div>
            {loading ? "Calcul…" : "Recalculer"}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-44 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
              ))}
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <span style={{ color: RED }}>✕</span>
              <p className="text-[12px]" style={{ color: "rgba(250,250,250,0.7)" }}>{error}</p>
            </motion.div>
          ) : result ? (
            <motion.div key="results" className="flex flex-col gap-3">
              {result.forecasts.map((f, i) => {
                const meta = DIST_META[f.distance]
                return <ForecastCard key={f.distance} idx={i} {...f} {...meta} />
              })}
            </motion.div>
          ) : runsCount === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <EmptyState />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      {/* ── Allures d'entraînement ── */}
      <AnimatePresence>
        {result?.trainingPaces && (
          <motion.section key="paces"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ delay: 0.2 }}
            aria-label="Allures d'entraînement">
            <h2 className="text-[13px] font-bold mb-3" style={{ color: "#FAFAFA" }}>Allures d'entraînement</h2>
            <TrainingPacesCard paces={result.trainingPaces} />
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Potentiel ── */}
      <AnimatePresence>
        {result && (
          <motion.section key="potential"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ delay: 0.28 }}
            aria-label="Potentiel de croissance">
            <h2 className="text-[13px] font-bold mb-3" style={{ color: "#FAFAFA" }}>Potentiel de croissance</h2>
            <PotentialVisualizer
              forecasts={result.forecasts.map(f => ({ distance: f.distance, vdot: f.vdot }))}
              strongestAt={result.strongestAt}
              avgVDOT={result.avgVDOT}
            />
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Explication ── */}
      <HowCalculated />

      {/* ── CTAs ── */}
      <section aria-label="Prochaines étapes">
        <h2 className="text-[13px] font-bold mb-3" style={{ color: "#FAFAFA" }}>Prochaines étapes</h2>
        <div className="flex flex-col gap-2">
          {[
            { href: "/runs",     color: GREEN,  icon: TrendingUp, cat: "Analyse",     label: "Voir mes runs" },
            { href: "/races",    color: GOLD,   icon: Flame,      cat: "Compétition", label: "Courses & Marathons" },
            { href: "/training", color: BLUE,   icon: BookOpen,   cat: "Plan",        label: "Plans d'entraînement" },
          ].map(({ href, color, icon: Icon, cat, label }) => (
            <Link key={href} href={href} onClick={hapticFeedback}
              className="touch-feedback flex items-center justify-between p-4 rounded-2xl"
              style={lgStyle(`${color}06`)}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}14`, border: `1px solid ${color}25` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(250,250,250,0.35)" }}>{cat}</p>
                  <p className="text-sm font-bold" style={{ color: "#FAFAFA" }}>{label}</p>
                </div>
              </div>
              <ChevronRight size={16} style={{ color: "rgba(250,250,250,0.3)" }} />
            </Link>
          ))}
        </div>
      </section>
    </motion.div>
  )
}
