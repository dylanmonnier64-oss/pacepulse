"use client"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface HealthMetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  unit?: string
  color?: string
  trend?: "up" | "down" | "stable"
  delta?: string
  delay?: number
}

const trendConfig = {
  up:     { Icon: TrendingUp,   color: "#22C55E" },
  down:   { Icon: TrendingDown, color: "#EF4444" },
  stable: { Icon: Minus,        color: "rgba(255,255,255,0.35)" },
}

export default function HealthMetricCard({
  icon, label, value, unit, color = "#F4D03F", trend, delta, delay = 0,
}: HealthMetricCardProps) {
  const trendInfo = trend ? trendConfig[trend] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, boxShadow: `0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color}28` }}
      className="relative rounded-[22px] overflow-hidden p-4 flex flex-col gap-3"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Animated halo orb */}
      <motion.div
        animate={{ top: ["12%", "65%", "12%"], left: ["8%", "72%", "8%"] }}
        transition={{ duration: 14 + delay * 4, repeat: Infinity, ease: "linear" }}
        className="absolute w-16 h-16 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${color}28 0%, transparent 70%)`, filter: "blur(12px)" }}
      />

      {/* Rotating ray accent */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-2 right-2 w-6 h-6 opacity-20 pointer-events-none"
        style={{
          background: `conic-gradient(from 0deg, ${color}, transparent 60deg, transparent 100%)`,
          borderRadius: "50%",
          filter: "blur(1px)",
        }}
      />

      {/* Icon */}
      <div
        className="relative z-10 w-9 h-9 rounded-2xl flex items-center justify-center"
        style={{ background: `${color}18`, border: `1px solid ${color}28` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>

      {/* Value */}
      <div className="relative z-10 flex items-baseline gap-1">
        <span className="data-mono text-[26px] font-black tracking-tight leading-none" style={{ color: "#FAFAFA" }}>
          {value}
        </span>
        {unit && (
          <span className="text-sm font-semibold" style={{ color: "rgba(250,250,250,0.4)" }}>
            {unit}
          </span>
        )}
      </div>

      {/* Label + trend */}
      <div className="relative z-10 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] mt-1" style={{ color: "rgba(250,250,250,0.35)" }}>
          {label}
        </p>
        {trendInfo && (
          <div className="flex items-center gap-1">
            <trendInfo.Icon size={11} style={{ color: trendInfo.color }} />
            {delta && (
              <span className="data-mono text-[10px] font-bold" style={{ color: trendInfo.color }}>{delta}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
