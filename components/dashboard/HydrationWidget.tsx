"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Droplets } from "lucide-react"
import type { Run } from "@/lib/types"
import { hydration as H } from "@/lib/design-tokens"

interface Props {
  runs: Run[]
  tempCelsius?: number // from weather API, defaults to 20°C
}

function computeHydration(run: Run, tempC: number) {
  const durationHr = run.duration / 3600
  const mult = H.intensityMultiplier[run.type] ?? 1.2
  const tempCorrection = Math.max(0, (tempC - 15) * H.tempCorrectionMlPerDegAbove15)
  const sweatRateTotal = H.baseSweatRateMlPerHr * mult + tempCorrection
  const totalLossMl = sweatRateTotal * durationHr
  const rehydTargetMl = Math.round(totalLossMl * H.rehydrationFactor)
  return { totalLossMl: Math.round(totalLossMl), rehydTargetMl }
}

function getReminderMsg(hoursSinceRun: number, targetL: number): string {
  if (hoursSinceRun < 0.5) return `Buvez ${targetL}L maintenant — récupération immédiate`
  if (hoursSinceRun < 2) return `Vous devriez avoir bu ${(targetL * 0.6).toFixed(1)}L depuis votre run`
  if (hoursSinceRun < 6) return `Continuez à vous réhydrater — objectif ${targetL}L`
  return `Prochaine séance : restez bien hydraté`
}

export default function HydrationWidget({ runs, tempCelsius = 20 }: Props) {
  const [progress, setProgress] = useState(0)
  const lastRun = runs[0]

  useEffect(() => {
    const t = setTimeout(() => setProgress(1), 300)
    return () => clearTimeout(t)
  }, [])

  if (!lastRun) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-4 flex items-center gap-3"
        style={{ background: "rgba(52,152,219,0.08)", border: "1px solid rgba(52,152,219,0.2)" }}
      >
        <Droplets size={20} style={{ color: "#3498DB" }} />
        <div>
          <p className="text-xs font-black" style={{ color: "#3498DB" }}>Hydratation</p>
          <p className="text-[11px] text-text-muted">Ajoutez un run pour voir vos besoins</p>
        </div>
      </motion.div>
    )
  }

  const { totalLossMl, rehydTargetMl } = computeHydration(lastRun, tempCelsius)
  const targetL = (rehydTargetMl / 1000).toFixed(1)
  const lossL = (totalLossMl / 1000).toFixed(1)
  const hoursSince = (Date.now() - new Date(lastRun.date).getTime()) / 3_600_000

  // Urgency color: recent run = blue-cyan, old = muted
  const isRecent = hoursSince < 4
  const accentColor = isRecent ? "#3498DB" : "rgba(52,152,219,0.5)"

  // Fill pct: assumes user drinks over 2h post-run
  const fillPct = Math.min(100, isRecent ? (hoursSince / 2) * 100 * progress : 100 * progress)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-3xl p-4"
      style={{ background: "rgba(52,152,219,0.06)", border: `1px solid rgba(52,152,219,0.18)` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets size={16} style={{ color: accentColor }} />
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accentColor }}>
            Hydratation
          </p>
        </div>
        <span className="text-[10px] text-text-muted">
          {tempCelsius}°C
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-end gap-4 mb-3">
        <div>
          <p className="text-2xl font-black tabular-nums" style={{ color: "#3498DB" }}>{targetL}</p>
          <p className="text-[9px] text-text-muted uppercase tracking-wide">litres cible</p>
        </div>
        <div className="pb-0.5">
          <p className="text-sm font-bold text-text-muted">−{lossL}L</p>
          <p className="text-[9px] text-text-muted uppercase">perte estimée</p>
        </div>
        <div className="pb-0.5 ml-auto text-right">
          <p className="text-sm font-bold" style={{ color: accentColor }}>
            {lastRun.type === "interval" ? "⚡ Intense" : lastRun.type === "recovery" ? "💚 Léger" : "🏃 Modéré"}
          </p>
          <p className="text-[9px] text-text-muted uppercase">intensité</p>
        </div>
      </div>

      {/* Progress water fill */}
      <div className="relative h-2 rounded-full overflow-hidden mb-3"
        style={{ background: "rgba(52,152,219,0.12)" }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${fillPct}%` }}
          transition={{ duration: 1.2, ease: [0, 0, 0.2, 1] }}
          style={{ background: "linear-gradient(90deg, #3498DB, #74B9FF)" }}
        />
      </div>

      <p className="text-[11px] text-text-muted leading-tight">
        {getReminderMsg(hoursSince, parseFloat(targetL))}
      </p>
    </motion.div>
  )
}
