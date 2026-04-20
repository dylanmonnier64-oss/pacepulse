"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { calculateHRZones } from "@/lib/calculations"
import GlassCard from "@/components/ui/GlassCard"
import { hapticFeedback } from "@/lib/utils"

export default function HRZones() {
  const [maxHR, setMaxHR] = useState(192)
  const [restHR, setRestHR] = useState(48)
  const [editing, setEditing] = useState(false)

  const zones = calculateHRZones(maxHR, restHR)

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Zones de FC</p>
            <p className="text-xs text-text-muted">Méthode Karvonen</p>
          </div>
          <button
            onClick={() => { hapticFeedback(); setEditing((e) => !e) }}
            className="touch-feedback text-xs font-bold px-3 py-1.5 rounded-xl"
            style={{ background: "rgba(244,208,63,0.15)", color: "#F4D03F", border: "1px solid rgba(244,208,63,0.3)" }}
          >
            {editing ? "Fermer" : "Modifier"}
          </button>
        </div>

        {/* FC inputs */}
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="grid grid-cols-2 gap-3 mb-4"
          >
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-1">FC max</label>
              <input
                type="number"
                value={maxHR}
                onChange={(e) => setMaxHR(parseInt(e.target.value) || 190)}
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-1">FC repos</label>
              <input
                type="number"
                value={restHR}
                onChange={(e) => setRestHR(parseInt(e.target.value) || 50)}
                inputMode="numeric"
              />
            </div>
          </motion.div>
        )}

        {/* Zones */}
        <div className="flex flex-col gap-2.5">
          {zones.map((zone, i) => (
            <motion.div
              key={zone.zone}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3"
            >
              {/* Zone number */}
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black"
                style={{ background: `${zone.color}30`, color: zone.color }}
              >
                {zone.zone}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold truncate">{zone.name}</p>
                  <p className="text-xs font-bold stat-num" style={{ color: zone.color, flexShrink: 0, marginLeft: 4 }}>
                    {zone.minBpm}–{zone.maxBpm}
                    <span className="text-[9px] font-normal text-text-muted"> bpm</span>
                  </p>
                </div>
                {/* Progress bar representing zone range */}
                <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${zone.percentage}%`,
                      background: zone.color,
                      marginLeft: `${(zone.minBpm - restHR) / (maxHR - restHR) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-0.5">
                  <p className="text-[9px] text-text-muted">{zone.maxPaceStr} → {zone.minPaceStr}</p>
                  <p className="text-[9px] text-text-muted">{zone.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  )
}
