"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { CalendarDays, ChevronRight, ChevronDown, Activity, Shield, Target, Heart } from "lucide-react"
import { useRuns } from "@/hooks/useRuns"
import { PerformanceGauge } from "@/components/performance/PerformanceGauge"
import FitnessFatigueChart from "@/components/stats/FitnessFatigueChart"
import HeatmapCalendar from "@/components/stats/HeatmapCalendar"
import WeeklyLoad from "@/components/stats/WeeklyLoad"
import SegmentDetector from "@/components/stats/SegmentDetector"
import { lgStyle, hapticFeedback, secondsToRaceTime, formatPace } from "@/lib/utils"
import {
  estimateVO2max,
  calculateInjuryRisk,
  getRacePredictions,
  calculateHRZones,
} from "@/lib/calculations"
import type { Run } from "@/lib/types"

/* ═══════════════════════════════════════════════════════
   VO2MAX CARD
═══════════════════════════════════════════════════════ */
function VO2maxCard({ runs }: { runs: Run[] }) {
  const vo2 = estimateVO2max(runs)

  if (!vo2) {
    return (
      <div className="rounded-[18px] p-4 flex flex-col items-center gap-2"
        style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.12)" }}>
        <Activity size={22} style={{ color: "rgba(168,85,247,0.4)" }} />
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-center" style={{ color: "rgba(168,85,247,0.5)" }}>VO2 Max</p>
        <p className="text-[11px] text-center" style={{ color: "rgba(250,250,250,0.3)" }}>Enregistre des runs ≥ 3km (ressenti ≥ 5) pour estimer ton VO2max</p>
      </div>
    )
  }

  const level = vo2 >= 60 ? "Élite" : vo2 >= 55 ? "Expert" : vo2 >= 48 ? "Entraîné" : vo2 >= 40 ? "Intermédiaire" : "En progression"
  const color = vo2 >= 60 ? "#22C55E" : vo2 >= 55 ? "#A855F7" : vo2 >= 48 ? "#3B82F6" : vo2 >= 40 ? "#F4D03F" : "#FF6B1A"
  const pct = Math.min(100, Math.round(((vo2 - 25) / (75 - 25)) * 100))

  return (
    <div className="rounded-[18px] p-4 space-y-3"
      style={{ background: `${color}0a`, border: `1px solid ${color}20` }}>
      <div className="flex items-center gap-1.5" style={{ color: `${color}99` }}>
        <Activity size={11} />
        <p className="text-[9px] font-bold uppercase tracking-[0.18em]">VO2 Max</p>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="data-mono font-black text-[30px] leading-none" style={{ color }}>{vo2}</span>
        <span className="text-[10px]" style={{ color: "rgba(250,250,250,0.35)" }}>mL/kg/min</span>
      </div>
      {/* Bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
        style={{ background: `${color}15`, color }}>{level}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   INJURY RISK CARD
═══════════════════════════════════════════════════════ */
function InjuryRiskCard({ runs }: { runs: Run[] }) {
  const risk = calculateInjuryRisk(runs)
  const R = 28, C = 2 * Math.PI * R

  return (
    <div className="rounded-[18px] p-4 space-y-3"
      style={{ background: `${risk.color}0a`, border: `1px solid ${risk.color}20` }}>
      <div className="flex items-center gap-1.5" style={{ color: `${risk.color}99` }}>
        <Shield size={11} />
        <p className="text-[9px] font-bold uppercase tracking-[0.18em]">Risque blessure</p>
      </div>
      <div className="flex items-center gap-3">
        <svg width={64} height={64} viewBox="0 0 64 64" className="flex-shrink-0">
          <circle cx={32} cy={32} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={7} />
          <motion.circle cx={32} cy={32} r={R} fill="none" stroke={risk.color} strokeWidth={7}
            strokeLinecap="round" strokeDasharray={`${C} ${C}`}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C - (risk.score / 100) * C }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            transform="rotate(-90 32 32)"
            style={{ filter: `drop-shadow(0 0 4px ${risk.color}88)` }} />
          <text x={32} y={36} textAnchor="middle" fontSize={14} fontWeight={900}
            fill={risk.color} fontFamily="JetBrains Mono, monospace">{risk.score}</text>
        </svg>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-black uppercase tracking-[0.12em]" style={{ color: risk.color }}>{risk.label}</span>
          <p className="text-[10px] leading-snug" style={{ color: "rgba(250,250,250,0.42)" }}>{risk.reason}</p>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   RACE PREDICTIONS CARD
═══════════════════════════════════════════════════════ */
function RacePredictionsCard({ runs }: { runs: Run[] }) {
  const preds = getRacePredictions(runs)
  if (!preds.length) return null

  return (
    <div className="rounded-[22px] p-4 space-y-4"
      style={{ background: "linear-gradient(135deg, rgba(244,208,63,0.05) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(244,208,63,0.15)" }}>
      <div className="flex items-center gap-2">
        <Target size={13} style={{ color: "rgba(244,208,63,0.7)" }} />
        <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(244,208,63,0.7)" }}>Prédictions Course · Formule Riegel</p>
      </div>

      <div className="space-y-2">
        {preds.map((p) => {
          const confColor = p.confidence >= 75 ? "#22C55E" : p.confidence >= 55 ? "#F4D03F" : "#FF6B1A"
          return (
            <div key={p.label} className="flex items-center gap-3 py-2.5 px-3 rounded-[14px]"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="w-12 flex-shrink-0">
                <span className="text-[11px] font-black" style={{ color: "#FAFAFA" }}>{p.label}</span>
              </div>
              <div className="flex-1">
                <span className="data-mono font-black text-[15px]" style={{ color: "#F4D03F" }}>
                  {secondsToRaceTime(p.time)}
                </span>
                <span className="text-[9px] ml-2" style={{ color: "rgba(250,250,250,0.35)" }}>
                  {formatPace(p.pace)}/km
                </span>
              </div>
              {/* Confidence bar */}
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[8px] font-bold" style={{ color: confColor }}>{p.confidence}%</span>
                <div className="w-14 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                    animate={{ width: `${p.confidence}%` }}
                    transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    style={{ background: confColor }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-[9px]" style={{ color: "rgba(250,250,250,0.18)" }}>
        Basé sur ton meilleur run récent · confiance selon l&apos;extrapolation
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   HR ZONES CARD
═══════════════════════════════════════════════════════ */
function HRZonesCard() {
  const [expanded, setExpanded] = useState(false)
  const zones = calculateHRZones(185, 55)

  return (
    <div className="rounded-[22px] overflow-hidden"
      style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.05) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(239,68,68,0.15)" }}>

      <motion.button whileTap={{ scale: 0.98 }} onClick={() => { hapticFeedback(); setExpanded(e => !e) }}
        className="w-full flex items-center justify-between p-4 touch-feedback">
        <div className="flex items-center gap-2">
          <Heart size={13} style={{ color: "rgba(239,68,68,0.7)" }} />
          <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(239,68,68,0.7)" }}>Zones FC · Karvonen</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px]" style={{ color: "rgba(250,250,250,0.25)" }}>FC max 185 · repos 55</span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown size={14} style={{ color: "rgba(250,250,250,0.3)" }} />
          </motion.div>
        </div>
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <div className="px-4 pb-4 space-y-2">
              {zones.map((z) => (
                <div key={z.zone} className="flex items-center gap-3 py-2.5 px-3 rounded-[14px]"
                  style={{ background: `${z.color}08`, border: `1px solid ${z.color}18` }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${z.color}20`, border: `1px solid ${z.color}35` }}>
                    <span className="data-mono text-[8px] font-black" style={{ color: z.color }}>{z.zone}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black truncate" style={{ color: z.color }}>{z.name}</p>
                    <p className="text-[9px]" style={{ color: "rgba(250,250,250,0.35)" }}>{z.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="data-mono text-[11px] font-black" style={{ color: "#FAFAFA" }}>{z.minBpm}–{z.maxBpm}</p>
                    <p className="text-[9px]" style={{ color: "rgba(250,250,250,0.3)" }}>bpm</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="data-mono text-[10px]" style={{ color: "rgba(250,250,250,0.5)" }}>{z.maxPaceStr}–{z.minPaceStr}</p>
                    <p className="text-[9px]" style={{ color: "rgba(250,250,250,0.25)" }}>/km</p>
                  </div>
                </div>
              ))}
              <p className="text-[9px] pt-1" style={{ color: "rgba(250,250,250,0.18)" }}>
                Méthode Karvonen · allures approximatives basées sur niveau intermédiaire
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════ */
function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(212,175,55,0.2), transparent)" }} />
      <span className="text-[8px] font-bold uppercase tracking-[0.25em]" style={{ color: "rgba(212,175,55,0.38)" }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(270deg, rgba(212,175,55,0.2), transparent)" }} />
    </div>
  )
}

export default function StatsPage() {
  const { runs, loading } = useRuns()

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-3xl h-48" style={{ background: "rgba(255,255,255,0.05)" }} />
        ))}
      </div>
    )
  }

  return (
    <motion.div className="flex flex-col gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em]"
          style={{ color: "rgba(250,250,250,0.38)" }}>Analyse</p>
        <h1 className="text-[26px] font-black tracking-tight" style={{ color: "#FAFAFA" }}>
          Statistiques<span style={{ color: "#F4D03F" }}>.</span>
        </h1>
      </div>

      {/* Training planner shortcut */}
      <Link href="/training">
        <motion.div whileTap={{ scale: 0.97 }}
          className="flex items-center gap-4 rounded-3xl p-4 touch-feedback"
          style={lgStyle("rgba(244,208,63,0.07)")}>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(244,208,63,0.14)", border: "1px solid rgba(244,208,63,0.25)" }}>
            <CalendarDays size={20} style={{ color: "#F4D03F" }} />
          </div>
          <div className="flex-1">
            <p className="font-black text-sm" style={{ color: "#FAFAFA" }}>Planning d&apos;entraînement</p>
            <p className="text-[11px]" style={{ color: "rgba(250,250,250,0.42)" }}>Plan 4 semaines · Dylan &amp; Manon</p>
          </div>
          <ChevronRight size={16} style={{ color: "rgba(250,250,250,0.3)" }} />
        </motion.div>
      </Link>

      {/* Existing sections */}
      <PerformanceGauge />
      <FitnessFatigueChart runs={runs} />
      <WeeklyLoad runs={runs} />

      {/* Premium analytics */}
      <Divider label="Analytics Premium" />

      <div className="grid grid-cols-2 gap-3">
        <VO2maxCard runs={runs} />
        <InjuryRiskCard runs={runs} />
      </div>

      <RacePredictionsCard runs={runs} />
      <HRZonesCard />

      {/* Calendar & segments */}
      <Divider label="Historique" />
      <HeatmapCalendar runs={runs} />
      <SegmentDetector runs={runs} />

      <div className="h-4" />
    </motion.div>
  )
}
