"use client"
import { motion } from "framer-motion"
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell
} from "recharts"
import type { Run } from "@/lib/types"
import { getWeeklyLoads } from "@/lib/calculations"
import GlassCard from "@/components/ui/GlassCard"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl p-3 text-xs"
      style={{
        background: "rgba(20,20,20,0.95)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(20px)",
      }}
    >
      <p className="text-text-muted mb-1">{label}</p>
      <p className="font-bold text-primary">{payload[0]?.value} km</p>
    </div>
  )
}

export default function WeeklyChart({ runs }: { runs: Run[] }) {
  const data = getWeeklyLoads(runs, 8)
  const maxDist = Math.max(...data.map((d) => d.distance), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <GlassCard className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
          Charge hebdo (8 semaines)
        </p>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={data} barSize={24} barCategoryGap="30%">
            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "rgba(245,245,245,0.4)" }}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="distance" radius={[6, 6, 2, 2]}>
              {data.map((entry, idx) => {
                const intensity = entry.distance / maxDist
                return (
                  <Cell
                    key={idx}
                    fill={
                      intensity > 0.8 ? "#E67E22" :
                      intensity > 0.5 ? "#F4D03F" :
                      "rgba(244,208,63,0.4)"
                    }
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>
    </motion.div>
  )
}
