"use client"
import { useState, useMemo } from "react"
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts"
import { adjustedPace, formatPace } from "@/lib/elite/gapCalculator"

interface DataPoint { distance: number; realPace: number; gradient: number }

interface Props {
  /** Points de données avec pace réel et gradient */
  dataPoints: DataPoint[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: {value: number; name: string; color: string}[]; label?: number }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl p-3 text-xs"
      style={{ background: "rgba(10,10,15,0.95)", border: "1px solid #D4AF37", backdropFilter: "blur(12px)" }}>
      <p className="font-bold mb-1.5" style={{ color: "#D4AF37" }}>{label} km</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name} : {formatPace(p.value)}</p>
      ))}
    </div>
  )
}

export default function SmartSlopeChart({ dataPoints }: Props) {
  const [showGap, setShowGap] = useState(false)

  const data = useMemo(() =>
    dataPoints.map(d => ({
      distance: d.distance,
      realPace: d.realPace,
      gap: Math.round(adjustedPace(d.realPace, d.gradient)),
      gradient: d.gradient,
    })),
    [dataPoints]
  )

  // Y domain : min/max pace + padding. Axis inverted (lower = faster = higher on chart)
  const allPaces = data.flatMap(d => [d.realPace, d.gap])
  const minP = Math.min(...allPaces) - 20
  const maxP = Math.max(...allPaces) + 20

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
      {/* Header + toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "#D4AF37" }}>
            Smart Slope Chart
          </p>
          <p className="text-sm text-white/50 mt-0.5">GAP — Allure ajustée au dénivelé</p>
        </div>

        {/* Toggle */}
        <button
          onClick={() => setShowGap(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: showGap ? "rgba(255,45,120,0.15)" : "rgba(212,175,55,0.15)",
            border: `1px solid ${showGap ? "#FF2D78" : "#D4AF37"}55`,
            color: showGap ? "#FF2D78" : "#D4AF37",
            transition: "all 0.2s ease",
          }}
        >
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: showGap ? "#FF2D78" : "#D4AF37" }}
          />
          {showGap ? "GAP" : "Réel"}
        </button>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="distance"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.35)" }}
            tickFormatter={v => `${v}km`}
          />
          <YAxis
            reversed
            domain={[minP, maxP]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.35)" }}
            tickFormatter={v => formatPace(v).replace(" /km", "")}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            dataKey={showGap ? "gap" : "realPace"}
            name={showGap ? "GAP" : "Pace réel"}
            stroke={showGap ? "#FF2D78" : "#D4AF37"}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: showGap ? "#FF2D78" : "#D4AF37" }}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${showGap ? "#FF2D78" : "#D4AF37"}88)` }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-white/40">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 rounded-full inline-block" style={{ background: "#D4AF37" }} />
          Pace réel
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 rounded-full inline-block" style={{ background: "#FF2D78" }} />
          GAP ajusté
        </span>
        <span className="ml-auto">↑ plus rapide en haut</span>
      </div>
    </div>
  )
}
