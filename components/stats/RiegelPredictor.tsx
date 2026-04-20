"use client"
import { motion } from "framer-motion"
import type { Run } from "@/lib/types"
import { getRacePredictions } from "@/lib/calculations"
import { secondsToRaceTime, formatPace } from "@/lib/utils"
import GlassCard from "@/components/ui/GlassCard"

export default function RiegelPredictor({ runs }: { runs: Run[] }) {
  const predictions = getRacePredictions(runs)

  if (!predictions.length) {
    return (
      <GlassCard className="p-4 text-center">
        <p className="text-text-muted text-sm">Pas assez de données pour les prédictions</p>
        <p className="text-xs text-text-muted mt-1">Ajoutez au moins 1 run de 3km avec ressenti ≥ 6</p>
      </GlassCard>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <GlassCard className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
          Prédictions de course
        </p>
        <p className="text-xs text-text-muted mb-4">Formule Riegel · calibrée sur vos meilleures perfs</p>

        <div className="flex flex-col gap-3">
          {predictions.map((pred, i) => (
            <motion.div
              key={pred.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3"
            >
              {/* Distance label */}
              <div
                className="w-16 rounded-xl p-2 text-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <p className="text-xs font-extrabold text-primary">{pred.label}</p>
              </div>

              {/* Time */}
              <div className="flex-1">
                <p className="text-lg font-extrabold stat-num">{secondsToRaceTime(pred.time)}</p>
                <p className="text-[10px] text-text-muted">{formatPace(pred.pace)} /km</p>
              </div>

              {/* Confidence */}
              <div className="flex flex-col items-end gap-1">
                <p className="text-xs font-bold"
                  style={{ color: pred.confidence >= 80 ? "#27AE60" : pred.confidence >= 60 ? "#F4D03F" : "#E67E22" }}>
                  {pred.confidence}%
                </p>
                <div className="w-16 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pred.confidence}%`,
                      background: pred.confidence >= 80 ? "#27AE60" : pred.confidence >= 60 ? "#F4D03F" : "#E67E22",
                    }}
                  />
                </div>
                <p className="text-[8px] text-text-muted">confiance</p>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-[10px] text-text-muted mt-4 text-center">
          Basé sur T₂ = T₁ × (D₂/D₁)^1.06 — précision ±5%
        </p>
      </GlassCard>
    </motion.div>
  )
}
