"use client"
import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useRuns } from "@/hooks/useRuns"
import { calculateTSS } from "@/lib/calculations"
import { formatDurationShort } from "@/lib/utils"

const MAX_RECOVERY_H = 72

function calcRecoveryHours(tss: number): number {
  return Math.min(tss * 0.15, MAX_RECOVERY_H)
}

function elapsedHours(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / 3_600_000
}

// ── Circular countdown ────────────────────────────────────────────────────────
function RecoveryRing({ pct, color, label }: { pct: number; color: string; label: string }) {
  const R    = 48
  const CIRC = 2 * Math.PI * R
  const fill = CIRC * (1 - pct / 100)

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg viewBox="0 0 110 110" className="absolute inset-0" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={55} cy={55} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} />
        <motion.circle
          cx={55} cy={55} r={R}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          initial={{ strokeDashoffset: CIRC }}
          animate={{ strokeDashoffset: fill }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div className="flex flex-col items-center">
        <p className="text-base font-black stat-num leading-none" style={{ color }}>{label}</p>
        <p className="text-[9px] mt-0.5" style={{ color: "rgba(245,245,245,0.4)" }}>restant</p>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function RecoveryDashboard() {
  const { runs, loading } = useRuns()
  const [now, setNow]     = useState(Date.now())
  const timerRef          = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(Date.now()), 60_000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  if (loading) return <div className="rounded-3xl h-32 animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
  if (!runs.length) return null

  const lastRun      = [...runs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  const tss          = lastRun.tss ?? calculateTSS(lastRun)
  const recoveryH    = calcRecoveryHours(tss)
  const elapsed      = elapsedHours(lastRun.date)
  const remainingH   = Math.max(0, recoveryH - elapsed)
  const ready        = remainingH <= 0
  const pctElapsed   = Math.min(100, (elapsed / recoveryH) * 100)

  // Color: green > 50% done, orange 25-50%, red < 25%
  const color = pctElapsed > 50
    ? "#27AE60"
    : pctElapsed > 25
    ? "#E67E22"
    : "#E74C3C"

  const remainLabel = ready
    ? "✓"
    : remainingH >= 1
    ? `${Math.floor(remainingH)}h${Math.round((remainingH % 1) * 60).toString().padStart(2, "0")}`
    : `${Math.round(remainingH * 60)}min`

  return (
    <motion.div
      className="rounded-3xl p-4 relative overflow-hidden"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 8px 30px rgba(244,208,63,0.3)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{ background: `radial-gradient(ellipse at bottom right, ${color}10 0%, transparent 70%)` }} />

      <p className="text-[10px] font-bold uppercase tracking-widest mb-3 relative"
        style={{ color: "rgba(245,245,245,0.4)" }}>Récupération</p>

      <div className="flex items-center gap-4 relative">
        {ready ? (
          <motion.div
            className="w-28 h-28 rounded-full flex flex-col items-center justify-center flex-shrink-0"
            style={{ background: "rgba(39,174,96,0.12)", border: "2px solid rgba(39,174,96,0.4)" }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-3xl">🏃</span>
          </motion.div>
        ) : (
          <div className="flex-shrink-0">
            <RecoveryRing pct={pctElapsed} color={color} label={remainLabel} />
          </div>
        )}

        <div className="flex flex-col gap-1 flex-1">
          {ready ? (
            <>
              <p className="text-base font-black" style={{ color: "#27AE60" }}>Tu es prêt à courir !</p>
              <p className="text-xs" style={{ color: "rgba(245,245,245,0.5)" }}>
                Récupération complète après {recoveryH.toFixed(0)}h. Le moment idéal pour une séance qualitative.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold">{Math.round(pctElapsed)}% récupéré</p>
              <p className="text-xs" style={{ color: "rgba(245,245,245,0.5)" }}>
                Dernière séance : TSS {Math.round(tss)} · {recoveryH.toFixed(0)}h conseillées
              </p>
              <div className="mt-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pctElapsed}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                />
              </div>
              <p className="text-[10px]" style={{ color: "rgba(245,245,245,0.35)" }}>
                {remainLabel} encore · sortie légère tolérée
              </p>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
