"use client"
import { motion } from "framer-motion"
import { usePerformanceEngine, LEMON_COLORS } from "@/hooks/usePerformanceEngine"
import { formatPace, secondsToRaceTime } from "@/lib/utils"

// ── Gauge SVG arc ────────────────────────────────────────────────────────────
const R = 72
const STROKE = 10
const CENTER = 90
const START_DEG = 210
const END_DEG   = 330  // total arc = 300°
const TOTAL_ARC = END_DEG - (-START_DEG + 360) // nope, simple:
// arc goes from -150° to +150° (300° sweep), 0 = left bottom, pi = right bottom
const ARC_DEG = 300

function polarToXY(deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180
  return [CENTER + R * Math.cos(rad), CENTER + R * Math.sin(rad)]
}

function describeArc(startDeg: number, endDeg: number): string {
  const [sx, sy] = polarToXY(startDeg)
  const [ex, ey] = polarToXY(endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${sx} ${sy} A ${R} ${R} 0 ${large} 1 ${ex} ${ey}`
}

const GAUGE_START = 120   // bottom-left
const GAUGE_END   = 420   // = 60° on right (300° arc)

function GaugeArc({ ratio }: { ratio: number }) {
  // ratio: 0 = full fatigue (left), 1 = neutral (center), 3+ = peak form (right)
  const clampedRatio = Math.min(ratio, 4)
  const pct = Math.min(clampedRatio / 4, 1)  // 0→1 mapped to arc

  const fillEnd = GAUGE_START + ARC_DEG * pct

  // Color: interpolate lemon→fuchsia based on ratio
  const color = ratio >= 1.5
    ? LEMON_COLORS.z1
    : ratio >= 0.8
    ? LEMON_COLORS.z2
    : ratio >= 0.4
    ? LEMON_COLORS.z4
    : LEMON_COLORS.z5

  const bgPath   = describeArc(GAUGE_START, GAUGE_END)
  const fillPath = describeArc(GAUGE_START, Math.max(GAUGE_START + 1, fillEnd))

  // Circumference for dasharray trick
  const totalArcLen = (ARC_DEG / 360) * 2 * Math.PI * R
  const fillLen     = totalArcLen * pct

  return (
    <svg viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`} width={180} height={180}>
      {/* Track */}
      <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={STROKE} strokeLinecap="round" />
      {/* Fill */}
      <motion.path
        d={bgPath}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={`${totalArcLen}`}
        initial={{ strokeDashoffset: totalArcLen }}
        animate={{ strokeDashoffset: totalArcLen - fillLen }}
        transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
      />
      {/* Needle dot */}
      <motion.circle
        cx={CENTER}
        cy={CENTER}
        r={4}
        fill={color}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  )
}

// ── Sparkline 7j ─────────────────────────────────────────────────────────────
function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1)
  const w = 140, h = 32, pad = 4
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2)
    const y = h - pad - (v / max) * (h - pad * 2)
    return `${x},${y}`
  })
  const area = `M ${pts[0]} ` + pts.slice(1).map(p => `L ${p}`).join(" ") +
    ` L ${w - pad},${h} L ${pad},${h} Z`
  const line = `M ${pts[0]} ` + pts.slice(1).map(p => `L ${p}`).join(" ")

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#F4D03F" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#F4D03F" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <motion.path
        d={line}
        fill="none"
        stroke="#F4D03F"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
      />
    </svg>
  )
}

// ── Predictor cards ───────────────────────────────────────────────────────────
function PredictorCard({ label, predictedSeconds, predictedPace, deltaPct, confidence, color }: {
  label: string; predictedSeconds: number; predictedPace: number
  deltaPct: number; confidence: number; color: string
}) {
  return (
    <motion.div
      className="flex-1 rounded-2xl p-3 flex flex-col gap-1"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 8px 30px rgba(244,208,63,0.3)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(245,245,245,0.4)" }}>{label}</p>
      <p className="text-base font-extrabold stat-num" style={{ color: "#F5F5F5" }}>{secondsToRaceTime(predictedSeconds)}</p>
      <p className="text-[10px]" style={{ color: "rgba(245,245,245,0.5)" }}>{formatPace(predictedPace)}/km</p>
      {deltaPct !== 0 && (
        <p className="text-[10px] font-bold" style={{ color }}>
          {deltaPct > 0 ? `▲ +${deltaPct}%` : `▼ ${deltaPct}%`} vs PR
        </p>
      )}
      <div className="mt-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full" style={{ width: `${confidence}%`, background: "#F4D03F" }} />
      </div>
      <p className="text-[9px]" style={{ color: "rgba(245,245,245,0.3)" }}>Confiance {confidence}%</p>
    </motion.div>
  )
}

// ── HR Zone bar ───────────────────────────────────────────────────────────────
function ZoneBars({ distribution, colors }: { distribution: number[]; colors: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {distribution.map((pct, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] font-bold w-6 text-right" style={{ color: colors[i] }}>Z{i + 1}</span>
          <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: colors[i], transformOrigin: "left" }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: pct / 100 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.07 }}
            />
          </div>
          <span className="text-[10px] w-7" style={{ color: "rgba(245,245,245,0.4)" }}>{pct}%</span>
        </div>
      ))}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function PerformanceGauge() {
  const { formeFatigue, predictions, bestBaseRuns, zones, loading } = usePerformanceEngine()

  if (loading) return (
    <div className="rounded-3xl h-64 animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
  )

  const { forme, fatigue, formeRatio, tss7Days, statusLabel, statusColor } = formeFatigue

  return (
    <div className="flex flex-col gap-4">

      {/* Gauge card */}
      <motion.div
        className="rounded-3xl p-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        whileHover={{ y: -4, boxShadow: "0 8px 30px rgba(244,208,63,0.3)" }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: statusColor }} />

        <p className="text-[10px] font-bold uppercase tracking-widest mb-4"
          style={{ color: "rgba(245,245,245,0.4)" }}>Forme · Fatigue</p>

        <div className="flex items-center justify-between">
          {/* Gauge */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <GaugeArc ratio={formeRatio} />
              <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: 16 }}>
                <p className="text-2xl font-black stat-num" style={{ color: statusColor }}>
                  {formeRatio.toFixed(1)}
                </p>
                <p className="text-[10px] font-bold" style={{ color: "rgba(245,245,245,0.5)" }}>F/F</p>
              </div>
            </div>
            <p className="text-xs font-bold mt-1" style={{ color: statusColor }}>{statusLabel}</p>
          </div>

          {/* Stats + sparkline */}
          <div className="flex flex-col gap-3 flex-1 pl-4">
            <div className="flex gap-4">
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wide">Forme</p>
                <p className="text-xl font-extrabold stat-num" style={{ color: "#F4D03F" }}>{forme}</p>
                <p className="text-[9px] text-text-muted">TSS J-7→J-2</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wide">Fatigue</p>
                <p className="text-xl font-extrabold stat-num" style={{ color: "#E67E22" }}>{fatigue}</p>
                <p className="text-[9px] text-text-muted">TSS J-1+J0×1.3</p>
              </div>
            </div>
            <div>
              <p className="text-[9px] text-text-muted mb-1">7 derniers jours</p>
              <Sparkline values={tss7Days} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Predictor Pro */}
      {predictions.length > 0 && (
        <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(245,245,245,0.4)" }}>
              Predictor Pro · Riegel
            </p>
            {bestBaseRuns[0] && (
              <p className="text-[10px]" style={{ color: "rgba(245,245,245,0.35)" }}>
                Base {bestBaseRuns[0].distance.toFixed(1)} km · {formatPace(bestBaseRuns[0].pace)}/km
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {predictions.map(p => (
              <PredictorCard key={p.label} {...p} />
            ))}
          </div>
        </div>
      )}

      {/* HR Zones */}
      <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(245,245,245,0.4)" }}>
            Zones FC · Dernière sortie
          </p>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full"
            style={{ background: `${zones.zoneColors[zones.lastRunZone - 1]}20`, border: `1px solid ${zones.zoneColors[zones.lastRunZone - 1]}40` }}>
            <span className="text-[10px] font-bold" style={{ color: zones.zoneColors[zones.lastRunZone - 1] }}>
              Z{zones.lastRunZone} dominant
            </span>
          </div>
        </div>
        <ZoneBars distribution={zones.zoneDistribution} colors={zones.zoneColors} />
        <div className="grid grid-cols-5 gap-1 mt-4">
          {zones.hrZones.map(z => (
            <div key={z.zone} className="text-center">
              <p className="text-[9px] font-bold" style={{ color: zones.zoneColors[z.zone - 1] }}>Z{z.zone}</p>
              <p className="text-[8px]" style={{ color: "rgba(245,245,245,0.4)" }}>{z.minBpm}–{z.maxBpm}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
