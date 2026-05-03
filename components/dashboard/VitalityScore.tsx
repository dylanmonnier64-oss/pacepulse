"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion"
import type { Run } from "@/lib/types"
import { vitality } from "@/lib/design-tokens"

/* ── Animated counter (spring) ────────────────────────────────── */
function AnimatedNumber({ value }: { value: number }) {
  const motionVal = useMotionValue(0)
  const spring    = useSpring(motionVal, { stiffness: 55, damping: 20, mass: 1 })
  const [display, setDisplay] = useState(0)
  useEffect(() => { const t = setTimeout(() => motionVal.set(value), 200); return () => clearTimeout(t) }, [value, motionVal])
  useEffect(() => { const unsub = spring.on("change", v => setDisplay(Math.round(v))); return unsub }, [spring])
  return <>{display}</>
}

interface Props { runs: Run[] }

function computeVitality(runs: Run[]): {
  score: number; label: string; sublabel: string; color: string
  breakdown: { label: string; pts: number; max: number }[]
} {
  const now = Date.now()
  const day  = 86_400_000

  const runs7  = runs.filter(r => now - new Date(r.date).getTime() < 7  * day).length
  const runs30 = runs.filter(r => now - new Date(r.date).getTime() < 30 * day).length
  const lastRun = runs[0]

  const freqPts        = Math.min(runs7  / 5,  1) * 35
  const consistencyPts = Math.min(runs30 / 20, 1) * 30

  let freshnessPts = 18
  if (lastRun) {
    const daysSince = (now - new Date(lastRun.date).getTime()) / day
    if      (daysSince <= 1) freshnessPts = Math.round((1 - lastRun.feeling / 10) * 25)
    else if (daysSince <= 3) freshnessPts = 20
  }

  let trendPts = 5
  if (runs.length >= 3) {
    const recent = runs[0].pace
    const prev   = runs.slice(1, 6).reduce((s, r) => s + r.pace, 0) / Math.min(5, runs.length - 1)
    if      (recent < prev * 0.98) trendPts = 10
    else if (recent > prev * 1.05) trendPts = 2
  }

  const clamped = Math.max(0, Math.min(100, Math.round(freqPts + consistencyPts + freshnessPts + trendPts)))

  let label = "Faible";       let sublabel = "Repos recommandé";        let color: string = vitality.colorLow
  if      (clamped >= vitality.excellent) { label = "Excellent";  sublabel = "Prêt à performer";          color = vitality.colorExcellent }
  else if (clamped >= vitality.good)      { label = "Bon";        sublabel = "Condition optimale";        color = vitality.colorGood }
  else if (clamped >= vitality.moderate)  { label = "Modéré";     sublabel = "Entraînement léger conseillé"; color = vitality.colorModerate }

  return {
    score: clamped, label, sublabel, color,
    breakdown: [
      { label: "Fréquence 7j",    pts: Math.round(freqPts),        max: 35 },
      { label: "Régularité 30j",  pts: Math.round(consistencyPts), max: 30 },
      { label: "Fraîcheur",       pts: Math.round(freshnessPts),    max: 25 },
      { label: "Progression",     pts: trendPts,                     max: 10 },
    ],
  }
}

/* Simulated live HR — fluctuates realistically around resting HR */
function useLiveHR(): number {
  const [hr, setHR] = useState(62)
  useEffect(() => {
    const interval = setInterval(() => {
      setHR(prev => {
        const delta = Math.round((Math.random() - 0.5) * 4)
        return Math.max(54, Math.min(78, prev + delta))
      })
    }, 2200)
    return () => clearInterval(interval)
  }, [])
  return hr
}

export default function VitalityScore({ runs }: Props) {
  const { score, label, sublabel, color, breakdown } = computeVitality(runs)
  const liveHR = useLiveHR()

  /* SVG arc — 270° sweep + spring animation */
  const R        = 72
  const C        = 2 * Math.PI * R
  const ARC_FRAC = 0.75
  const arcLen   = C * ARC_FRAC
  const offset   = arcLen - (score / 100) * arcLen
  const dashOffset  = useMotionValue(arcLen)
  const springArc   = useSpring(dashOffset, { stiffness: 45, damping: 22, mass: 1.1 })
  useEffect(() => { const t = setTimeout(() => dashOffset.set(offset), 150); return () => clearTimeout(t) }, [offset, dashOffset])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
      }}
    >
      {/* Ambient color glow behind ring */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -40, left: -40, width: 240, height: 240,
          background: `radial-gradient(circle, ${color}18 0%, transparent 65%)`,
          filter: "blur(30px)",
          transition: "background 0.8s ease",
        }}
      />
      {/* Top-right corner accent */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -20, right: -20, width: 120, height: 120,
          background: "radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      <div className="relative z-10 p-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p
              className="text-[9px] font-bold uppercase tracking-[0.22em]"
              style={{ color: "var(--gold)", letterSpacing: "0.22em" }}
            >
              Heritage Elite OS
            </p>
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: "rgba(250,250,250,0.45)" }}>
              Indice de disponibilité
            </p>
          </div>
          {/* Live HR badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(231,76,60,0.12)",
              border: "1px solid rgba(231,76,60,0.3)",
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: "#E74C3C" }}
            />
            <AnimatePresence mode="popLayout">
              <motion.span
                key={liveHR}
                initial={{ y: -6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 6, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="data-mono text-[12px] font-bold"
                style={{ color: "#E74C3C" }}
              >
                {liveHR}
              </motion.span>
            </AnimatePresence>
            <span className="text-[9px]" style={{ color: "rgba(231,76,60,0.7)" }}>bpm</span>
          </div>
        </div>

        {/* ── Ring + Content ── */}
        <div className="flex items-center gap-4">

          {/* Big SVG ring */}
          <div className="relative flex-shrink-0" style={{ width: 160, height: 160 }}>
            <svg width={160} height={160} viewBox="0 0 160 160" aria-hidden>
              {/* Outer glow ring */}
              <circle
                cx={80} cy={80} r={R + 10}
                fill="none"
                stroke={color}
                strokeWidth={1}
                opacity={0.08}
              />
              {/* Track */}
              <circle
                cx={80} cy={80} r={R}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={11}
                strokeLinecap="round"
                strokeDasharray={`${arcLen} ${C}`}
                strokeDashoffset={0}
                transform="rotate(135 80 80)"
              />
              {/* Progress fill — spring */}
              <g transform="rotate(135 80 80)">
                <motion.circle
                  cx={80} cy={80} r={R}
                  fill="none"
                  stroke={color}
                  strokeWidth={11}
                  strokeLinecap="round"
                  strokeDasharray={`${arcLen} ${C}`}
                  style={{
                    strokeDashoffset: springArc,
                    filter: `drop-shadow(0 0 14px ${color}cc)`,
                  }}
                />
              </g>
              {/* Thin champagne gold outer highlight */}
              <circle
                cx={80} cy={80} r={R - 8}
                fill="none"
                stroke="rgba(212,175,55,0.12)"
                strokeWidth={1}
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="data-mono leading-none font-black"
                style={{
                  fontSize: 44,
                  color,
                  textShadow: `0 0 28px ${color}99, 0 0 56px ${color}44`,
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <AnimatedNumber value={score} />
              </motion.span>
              <span
                className="text-[9px] font-bold uppercase tracking-wider mt-0.5"
                style={{ color: "rgba(250,250,250,0.3)" }}
              >
                / 100
              </span>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            {/* Score label */}
            <div>
              <motion.p
                className="text-[22px] font-black leading-tight"
                style={{ color, textShadow: `0 0 20px ${color}55` }}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {label}
              </motion.p>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(250,250,250,0.42)" }}>
                {sublabel}
              </p>
            </div>

            {/* Breakdown mini bars */}
            <div className="flex flex-col gap-2">
              {breakdown.map(({ label: l, pts, max }, i) => (
                <div key={l}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[9px] font-medium" style={{ color: "rgba(250,250,250,0.35)" }}>{l}</span>
                    <span className="data-mono text-[9px] font-bold" style={{ color: "rgba(250,250,250,0.5)" }}>
                      {pts}<span style={{ color: "rgba(250,250,250,0.25)" }}>/{max}</span>
                    </span>
                  </div>
                  <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(pts / max) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      style={{ background: `linear-gradient(90deg, ${color}cc, ${color}66)` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom gold divider ── */}
        <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(212,175,55,0.1)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: "var(--gold)", boxShadow: "0 0 6px var(--gold-glow)" }}
            />
            <p className="text-[10px]" style={{ color: "rgba(250,250,250,0.35)" }}>
              Score calculé sur fréquence · régularité · fraîcheur · progression
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
