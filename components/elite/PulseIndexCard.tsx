"use client"
import { useEffect, useState } from "react"
import { calculatePulseIndex, pulseColor, pulseLevel } from "@/lib/elite/pulseAlgorithm"

const R = 80
const C = 2 * Math.PI * R // ≈ 502.65

interface Props {
  /** Pourcentages de temps en zone (total = 100) */
  zones: { z1: number; z2: number; z3: number; z4: number; z5: number }
  /** Nom de la séance */
  label: string
}

export default function PulseIndexCard({ zones, label }: Props) {
  const score = calculatePulseIndex(zones)
  const color = pulseColor(score)
  const level = pulseLevel(score)
  const targetOffset = C * (1 - score / 100)

  const [offset, setOffset] = useState(C)

  useEffect(() => {
    const t = setTimeout(() => setOffset(targetOffset), 80)
    return () => clearTimeout(t)
  }, [targetOffset])

  const zoneRows = [
    { key: "z5", label: "Z5 VO2max", pct: zones.z5, color: "#FF2D78" },
    { key: "z4", label: "Z4 Seuil",  pct: zones.z4, color: "#FF6B35" },
    { key: "z3", label: "Z3 Tempo",  pct: zones.z3, color: "#D4AF37" },
    { key: "z2", label: "Z2 Endur.", pct: zones.z2, color: "#F5E642" },
    { key: "z1", label: "Z1 Récup.", pct: zones.z1, color: "rgba(245,245,245,0.4)" },
  ]

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-5">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "#D4AF37" }}>
          Pulse Index
        </p>
        <p className="text-sm text-white/50 mt-0.5 truncate">{label}</p>
      </div>

      {/* Ring + score */}
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width={200} height={200} viewBox="0 0 200 200">
            {/* Track */}
            <circle cx={100} cy={100} r={R} fill="none"
              stroke="rgba(255,255,255,0.07)" strokeWidth={14} />
            {/* Progress */}
            <circle cx={100} cy={100} r={R} fill="none"
              stroke={color}
              strokeWidth={14}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "100px 100px",
                transition: "stroke-dashoffset 1.2s ease-out, stroke 0.4s ease",
                filter: `drop-shadow(0 0 8px ${color}88)`,
              }}
            />
            {/* Glow outer ring */}
            <circle cx={100} cy={100} r={R} fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
              opacity={0.25}
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "100px 100px",
                transition: "stroke-dashoffset 1.2s ease-out",
              }}
            />
          </svg>

          {/* Score centré */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-6xl leading-none tabular-nums"
              style={{ fontFamily: "'Bebas Neue', sans-serif", color }}
            >
              {score}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest mt-1"
              style={{ color: "rgba(255,255,255,0.45)" }}>
              / 100
            </span>
          </div>
        </div>
      </div>

      {/* Level badge */}
      <div className="flex justify-center">
        <span
          className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
          style={{ background: `${color}22`, border: `1px solid ${color}55`, color }}
        >
          {level}
        </span>
      </div>

      {/* Zone breakdown */}
      <div className="flex flex-col gap-1.5">
        {zoneRows.map(z => (
          <div key={z.key} className="flex items-center gap-2">
            <span className="text-[10px] w-16 text-white/40 flex-shrink-0">{z.label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${z.pct}%`,
                  background: z.color,
                  transition: "width 1s ease-out",
                }}
              />
            </div>
            <span className="text-[10px] w-6 text-right tabular-nums" style={{ color: z.color }}>
              {z.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
