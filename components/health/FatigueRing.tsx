"use client"
import { useState, useEffect } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

/* ── Animated counter (spring) ────────────────────────────────── */
function AnimatedNumber({ value }: { value: number }) {
  const motionVal = useMotionValue(0)
  const spring    = useSpring(motionVal, { stiffness: 55, damping: 20, mass: 1 })
  const [display, setDisplay] = useState(0)
  useEffect(() => { const t = setTimeout(() => motionVal.set(value), 200); return () => clearTimeout(t) }, [value, motionVal])
  useEffect(() => { const unsub = spring.on("change", v => setDisplay(Math.round(v))); return unsub }, [spring])
  return <>{display}</>
}

interface FatigueRingProps {
  vitalityScore: number
  fatigueScore: number
  readiness: string
  size?: number
}

const READINESS_LABEL: Record<string, string> = {
  optimal: "Prêt à performer",
  normal: "Condition normale",
  tired: "Repos recommandé",
  overreached: "Surmenage détecté",
}

function scoreColor(score: number): string {
  if (score >= 70) return "#22C55E"
  if (score >= 45) return "#F4D03F"
  return "#EF4444"
}

export default function FatigueRing({ vitalityScore, fatigueScore, readiness, size = 160 }: FatigueRingProps) {
  const color = scoreColor(vitalityScore)
  const R = size / 2 - 14
  const C = 2 * Math.PI * R
  const ARC_FRAC = 0.75
  const arcLen = C * ARC_FRAC
  const offset = arcLen - (vitalityScore / 100) * arcLen

  /* Spring arc animation */
  const dashOffset = useMotionValue(arcLen)
  const springArc  = useSpring(dashOffset, { stiffness: 45, damping: 22, mass: 1.1 })
  useEffect(() => { const t = setTimeout(() => dashOffset.set(offset), 150); return () => clearTimeout(t) }, [offset, dashOffset])
  const sublabel = READINESS_LABEL[readiness] ?? "En analyse…"
  const readinessLabel =
    readiness === "optimal" ? "Optimal"
    : readiness === "tired" ? "Fatigué"
    : readiness === "overreached" ? "Surmenage"
    : "Normal"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl w-full"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
      }}
    >
      {/* Ambient color glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -40, left: -40, width: 240, height: 240,
          background: `radial-gradient(circle, ${color}18 0%, transparent 65%)`,
          filter: "blur(30px)",
          transition: "background 0.8s ease",
        }}
      />
      {/* Top-right gold accent */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -20, right: -20, width: 120, height: 120,
          background: "radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--gold)" }}>
              Heritage Elite OS
            </p>
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: "rgba(250,250,250,0.45)" }}>
              Indice de vitalité
            </p>
          </div>
          {/* Fatigue badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: `${color}18`, border: `1px solid ${color}30` }}
          >
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: color }}
            />
            <span className="data-mono text-[12px] font-bold" style={{ color }}>
              {vitalityScore}
            </span>
            <span className="text-[9px]" style={{ color: `${color}bb` }}>/100</span>
          </div>
        </div>

        {/* Ring + info */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
              <circle cx={size / 2} cy={size / 2} r={R + 10} fill="none" stroke={color} strokeWidth={1} opacity={0.08} />
              <circle
                cx={size / 2} cy={size / 2} r={R}
                fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={11} strokeLinecap="round"
                strokeDasharray={`${arcLen} ${C}`} strokeDashoffset={0}
                transform={`rotate(135 ${size / 2} ${size / 2})`}
              />
              <g transform={`rotate(135 ${size / 2} ${size / 2})`}>
                <motion.circle
                  cx={size / 2} cy={size / 2} r={R}
                  fill="none" stroke={color} strokeWidth={11} strokeLinecap="round"
                  strokeDasharray={`${arcLen} ${C}`}
                  style={{ strokeDashoffset: springArc, filter: `drop-shadow(0 0 14px ${color}cc)` }}
                />
              </g>
              <circle cx={size / 2} cy={size / 2} r={R - 8} fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth={1} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="data-mono leading-none font-black"
                style={{ fontSize: 44, color, textShadow: `0 0 28px ${color}99, 0 0 56px ${color}44` }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <AnimatedNumber value={vitalityScore} />
              </motion.span>
              <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "rgba(250,250,250,0.3)" }}>
                / 100
              </span>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <div>
              <motion.p
                className="text-[22px] font-black leading-tight"
                style={{ color, textShadow: `0 0 20px ${color}55` }}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {readinessLabel}
              </motion.p>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(250,250,250,0.42)" }}>
                {sublabel}
              </p>
            </div>

            {[
              { label: "Fatigue", val: fatigueScore, max: 10 },
              { label: "Vitalité", val: vitalityScore, max: 100 },
            ].map(({ label, val, max }, i) => (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <span className="text-[9px] font-medium" style={{ color: "rgba(250,250,250,0.35)" }}>{label}</span>
                  <span className="data-mono text-[9px] font-bold" style={{ color: "rgba(250,250,250,0.5)" }}>
                    {val}<span style={{ color: "rgba(250,250,250,0.25)" }}>/{max}</span>
                  </span>
                </div>
                <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(val / max) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    style={{ background: `linear-gradient(90deg, ${color}cc, ${color}66)` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom gold divider */}
        <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(212,175,55,0.1)" }}>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--gold)", boxShadow: "0 0 6px var(--gold-glow)" }} />
            <p className="text-[10px]" style={{ color: "rgba(250,250,250,0.35)" }}>
              Score calculé sur vitalité · fatigue · sommeil · activité
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
