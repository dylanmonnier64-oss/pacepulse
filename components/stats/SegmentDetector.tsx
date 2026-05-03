"use client"
import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react"
import type { Run } from "@/lib/types"
import { formatPace } from "@/lib/utils"
import GlassCard from "@/components/ui/GlassCard"

interface Props {
  runs: Run[]
}

interface Segment {
  key: string
  label: string
  distanceRange: [number, number] // km
  runs: Run[]
  prPace: number   // sec/km — best (lowest)
  avgPace: number
  trend: "up" | "down" | "stable"
  prDate: string
  count: number
}

const DISTANCE_BUCKETS: { label: string; range: [number, number] }[] = [
  { label: "3–4 km", range: [3, 4.99] },
  { label: "5–6 km", range: [5, 6.99] },
  { label: "7–9 km", range: [7, 9.99] },
  { label: "10–12 km", range: [10, 12.99] },
  { label: "13–17 km", range: [13, 17.99] },
  { label: "18–22 km", range: [18, 22.99] },
  { label: "23+ km", range: [23, 999] },
]

function detectSegments(runs: Run[]): Segment[] {
  const segments: Segment[] = []

  for (const bucket of DISTANCE_BUCKETS) {
    const matching = runs.filter(
      r => r.distance >= bucket.range[0] && r.distance <= bucket.range[1] && r.pace > 0
    )
    if (matching.length < 2) continue

    const sorted = [...matching].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const paces = sorted.map(r => r.pace)
    const prRun = sorted.reduce((best, r) => r.pace < best.pace ? r : best)
    const avgPace = paces.reduce((s, p) => s + p, 0) / paces.length

    // Trend: compare last 3 vs previous 3
    let trend: Segment["trend"] = "stable"
    if (paces.length >= 4) {
      const recent = paces.slice(0, Math.ceil(paces.length / 2)).reduce((s, p) => s + p, 0) / Math.ceil(paces.length / 2)
      const older = paces.slice(Math.ceil(paces.length / 2)).reduce((s, p) => s + p, 0) / Math.floor(paces.length / 2)
      if (recent < older * 0.98) trend = "up"    // faster = improving
      else if (recent > older * 1.02) trend = "down"
    }

    segments.push({
      key: bucket.label,
      label: bucket.label,
      distanceRange: bucket.range,
      runs: sorted,
      prPace: prRun.pace,
      avgPace: Math.round(avgPace),
      trend,
      prDate: prRun.date,
      count: sorted.length,
    })
  }

  return segments.sort((a, b) => b.count - a.count)
}

function TrendIcon({ trend }: { trend: Segment["trend"] }) {
  if (trend === "up") return <TrendingUp size={12} style={{ color: "#27AE60" }} />
  if (trend === "down") return <TrendingDown size={12} style={{ color: "#E74C3C" }} />
  return <Minus size={12} style={{ color: "rgba(245,245,245,0.4)" }} />
}

export default function SegmentDetector({ runs }: Props) {
  const segments = useMemo(() => detectSegments(runs), [runs])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  if (segments.length === 0) {
    return (
      <GlassCard className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Segments récurrents</p>
        <p className="text-sm text-text-muted">
          Courez au moins 2 fois sur une même distance pour voir vos records par segment.
        </p>
      </GlassCard>
    )
  }

  const displayed = showAll ? segments : segments.slice(0, 3)

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-0.5">
              Segments récurrents
            </p>
            <p className="text-xs text-text-muted">Records automatiques par distance</p>
          </div>
          <Trophy size={16} style={{ color: "#F4D03F" }} />
        </div>

        <div className="flex flex-col gap-2">
          {displayed.map((seg, i) => {
            const isExpanded = expanded === seg.key
            const prDateStr = new Date(seg.prDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
            const improvement = seg.avgPace > 0
              ? Math.round(((seg.avgPace - seg.prPace) / seg.avgPace) * 100)
              : 0

            return (
              <motion.div
                key={seg.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : seg.key)}
                  className="w-full text-left rounded-2xl p-3 transition-all"
                  style={{
                    background: isExpanded ? "rgba(244,208,63,0.08)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isExpanded ? "rgba(244,208,63,0.3)" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Segment label */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black">{seg.label}</span>
                        <TrendIcon trend={seg.trend} />
                        <span className="text-[10px] text-text-muted">{seg.count} runs</span>
                      </div>
                    </div>

                    {/* PR */}
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black"
                          style={{ background: "rgba(244,208,63,0.2)", color: "#F4D03F" }}>
                          PR
                        </span>
                        <span className="text-sm font-black tabular-nums" style={{ color: "#F4D03F" }}>
                          {formatPace(seg.prPace)}
                        </span>
                        <span className="text-[10px] text-text-muted">/km</span>
                      </div>
                      <p className="text-[9px] text-text-muted">{prDateStr}</p>
                    </div>

                    {isExpanded ? <ChevronUp size={14} style={{ color: "rgba(245,245,245,0.4)" }} /> : <ChevronDown size={14} style={{ color: "rgba(245,245,245,0.4)" }} />}
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 flex gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                          <div>
                            <p className="text-[9px] text-text-muted uppercase tracking-wide">Moy.</p>
                            <p className="text-sm font-bold tabular-nums">{formatPace(seg.avgPace)}/km</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-text-muted uppercase tracking-wide">Gain vs moy.</p>
                            <p className="text-sm font-bold" style={{ color: improvement > 0 ? "#27AE60" : "#E74C3C" }}>
                              {improvement > 0 ? "-" : "+"}{Math.abs(improvement)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-text-muted uppercase tracking-wide">Tendance</p>
                            <p className="text-sm font-bold" style={{
                              color: seg.trend === "up" ? "#27AE60" : seg.trend === "down" ? "#E74C3C" : "rgba(245,245,245,0.5)"
                            }}>
                              {seg.trend === "up" ? "↗ Progression" : seg.trend === "down" ? "↘ Régression" : "→ Stable"}
                            </p>
                          </div>
                        </div>

                        {/* Mini history */}
                        <div className="mt-2 flex gap-1">
                          {seg.runs.slice(0, 8).map((r, ri) => {
                            const isPR = r.pace === seg.prPace
                            return (
                              <div key={r.id} className="flex-1 h-8 rounded-lg flex items-end overflow-hidden"
                                style={{ background: "rgba(255,255,255,0.05)" }}>
                                <motion.div
                                  className="w-full rounded-lg"
                                  initial={{ height: 0 }}
                                  animate={{ height: `${Math.round((seg.avgPace / r.pace) * 80)}%` }}
                                  transition={{ delay: ri * 0.04, duration: 0.4 }}
                                  style={{
                                    background: isPR ? "#F4D03F" : "rgba(244,208,63,0.35)",
                                    minHeight: 4,
                                  }}
                                />
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            )
          })}
        </div>

        {segments.length > 3 && (
          <button
            onClick={() => setShowAll(v => !v)}
            className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-text-muted"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {showAll ? "Voir moins" : `Voir ${segments.length - 3} autres segments`}
          </button>
        )}
      </GlassCard>
    </motion.div>
  )
}
