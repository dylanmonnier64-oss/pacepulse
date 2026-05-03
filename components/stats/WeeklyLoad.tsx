"use client"
import { motion } from "framer-motion"
import {
  ComposedChart, Bar, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, ReferenceLine
} from "recharts"
import type { Run } from "@/lib/types"
import { getWeeklyLoads } from "@/lib/calculations"
import GlassCard from "@/components/ui/GlassCard"

export default function WeeklyLoad({ runs }: { runs: Run[] }) {
  const data = getWeeklyLoads(runs, 12)

  // Detect overloads: >10% increase for 3 consecutive weeks
  const warnings: number[] = []
  for (let i = 2; i < data.length; i++) {
    const w0 = data[i - 2].distance
    const w1 = data[i - 1].distance
    const w2 = data[i].distance
    if (w0 > 0 && w1 > 0 && w2 > 0) {
      const g1 = (w1 - w0) / w0
      const g2 = (w2 - w1) / w1
      if (g1 > 0.1 && g2 > 0.1) warnings.push(i)
    }
  }

  const avgDistances = data.map((_, i) => {
    if (i < 2) return 0
    return (data.slice(i - 2, i + 1).reduce((s, d) => s + d.distance, 0) / 3)
  })

  const displayData = data.map((d, i) => ({ ...d, avg: Math.round(avgDistances[i] * 10) / 10 }))

  // Current week cursor: Monday=0, Sunday=6 → progress 1/7 to 7/7
  const todayDay = new Date().getDay()
  const mondayBased = todayDay === 0 ? 6 : todayDay - 1
  const weekProgress = (mondayBased + 1) / 7
  const currentWeekLabel = displayData[displayData.length - 1]?.week

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
      <GlassCard className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
          Charge d'entraînement
        </p>
        <p className="text-xs text-text-muted mb-4">12 semaines · moy. glissante 3 sem.</p>

        {warnings.length > 0 && (
          <div
            className="rounded-xl p-3 mb-4 flex items-center gap-2"
            style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)" }}
          >
            <span>⚠️</span>
            <p className="text-xs text-danger font-medium">
              Progression &gt;10% détectée sur plusieurs semaines — risque de blessure
            </p>
          </div>
        )}

        <ResponsiveContainer width="100%" height={130}>
          <ComposedChart data={displayData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "rgba(245,245,245,0.4)" }}
              interval={2}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "rgba(245,245,245,0.4)" }} />
            <Tooltip
              formatter={(val: unknown, name: unknown) => [
                `${val} km`,
                name === "distance" ? "Volume" : "Moy. glissante"
              ]}
              contentStyle={{
                background: "rgba(20,20,20,0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                fontSize: 11,
              }}
            />
            <ReferenceLine
              x={currentWeekLabel}
              stroke="#F4D03F"
              strokeWidth={2}
              strokeDasharray="4 3"
              label={{
                value: `${["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"][mondayBased]} · ${Math.round(weekProgress * 100)}%`,
                position: "top",
                fill: "#F4D03F",
                fontSize: 9,
                fontWeight: "bold",
              }}
            />
            <Bar dataKey="distance" radius={[4, 4, 2, 2]}>
              {displayData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={warnings.includes(idx) ? "rgba(231,76,60,0.8)" : "rgba(244,208,63,0.6)"}
                />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="avg"
              stroke="#E67E22"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 2"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </GlassCard>
    </motion.div>
  )
}
