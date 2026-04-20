"use client"
import { motion } from "framer-motion"
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip,
  ReferenceLine, Area, AreaChart, CartesianGrid
} from "recharts"
import type { Run } from "@/lib/types"
import { buildFitnessTimeline, getTrainingStatus } from "@/lib/calculations"
import GlassCard from "@/components/ui/GlassCard"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const ctl = payload.find((p: any) => p.dataKey === "ctl")?.value
  const atl = payload.find((p: any) => p.dataKey === "atl")?.value
  const tsb = payload.find((p: any) => p.dataKey === "tsb")?.value
  return (
    <div className="rounded-xl p-3 text-xs"
      style={{ background: "rgba(15,15,15,0.95)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(20px)" }}>
      <p className="text-text-muted mb-2 font-medium">{label}</p>
      <div className="flex flex-col gap-1">
        <p style={{ color: "#3498DB" }}>CTL (Forme) : <strong>{ctl?.toFixed(1)}</strong></p>
        <p style={{ color: "#E67E22" }}>ATL (Fatigue) : <strong>{atl?.toFixed(1)}</strong></p>
        <p style={{ color: tsb >= 0 ? "#27AE60" : "#E74C3C" }}>TSB (Balance) : <strong>{tsb?.toFixed(1)}</strong></p>
      </div>
    </div>
  )
}

export default function FitnessFatigueChart({ runs }: { runs: Run[] }) {
  const data = buildFitnessTimeline(runs, 90)
  const today = data[data.length - 1]
  const status = getTrainingStatus(today?.tsb ?? 0)

  // Sample every 3 days for display
  const displayed = data.filter((_, i) => i % 3 === 0 || i === data.length - 1)

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <GlassCard className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Forme & Fatigue</p>
            <p className="text-sm font-semibold mt-0.5">90 derniers jours</p>
          </div>
          <div
            className="px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: `${status.color}20`, color: status.color, border: `1px solid ${status.color}40` }}
          >
            {status.label}
          </div>
        </div>

        {/* Today's values */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "CTL", value: today?.ctl.toFixed(1), sub: "Forme", color: "#3498DB" },
            { label: "ATL", value: today?.atl.toFixed(1), sub: "Fatigue", color: "#E67E22" },
            { label: "TSB", value: today?.tsb.toFixed(1), sub: "Balance", color: today?.tsb >= 0 ? "#27AE60" : "#E74C3C" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="rounded-2xl p-3 text-center"
              style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
              <p className="text-xl font-extrabold stat-num" style={{ color }}>{value}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mt-0.5">{label}</p>
              <p className="text-[9px] text-text-muted">{sub}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={displayed} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "rgba(245,245,245,0.35)" }}
              tickFormatter={(v) => v.slice(5)}
              interval={Math.floor(displayed.length / 4)}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "rgba(245,245,245,0.35)" }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="ctl" stroke="#3498DB" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="atl" stroke="#E67E22" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="tsb" stroke="#27AE60" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3">
          {[
            { color: "#3498DB", label: "CTL (forme)" },
            { color: "#E67E22", label: "ATL (fatigue)" },
            { color: "#27AE60", label: "TSB (balance)" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded" style={{ background: color }} />
              <span className="text-[10px] text-text-muted">{label}</span>
            </div>
          ))}
        </div>

        {/* Recommendation */}
        <div
          className="rounded-2xl p-3 mt-4"
          style={{ background: `${status.color}12`, border: `1px solid ${status.color}25` }}
        >
          <p className="text-xs font-medium" style={{ color: status.color }}>
            💡 {status.recommendation}
          </p>
        </div>
      </GlassCard>
    </motion.div>
  )
}
