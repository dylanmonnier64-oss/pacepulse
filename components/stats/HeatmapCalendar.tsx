"use client"
import { motion } from "framer-motion"
import type { Run } from "@/lib/types"
import GlassCard from "@/components/ui/GlassCard"

function getHeatmapData(runs: Run[]) {
  const map: Record<string, number> = {}
  runs.forEach((r) => {
    const day = r.date.split("T")[0]
    map[day] = (map[day] || 0) + r.distance
  })
  return map
}

function getIntensity(km: number): string {
  if (!km) return "rgba(255,255,255,0.06)"
  if (km < 5) return "rgba(244,208,63,0.25)"
  if (km < 10) return "rgba(244,208,63,0.5)"
  if (km < 20) return "#E67E22"
  return "#F4D03F"
}

export default function HeatmapCalendar({ runs }: { runs: Run[] }) {
  const distMap = getHeatmapData(runs)
  const today = new Date()
  const yearStart = new Date(today.getFullYear(), 0, 1)
  const dayOfWeek = yearStart.getDay() || 7 // Monday=1

  // Build 52 weeks × 7 days grid
  const days: Array<{ date: string; km: number; week: number; dow: number }> = []

  // Pad to start on Monday
  for (let pad = 1; pad < dayOfWeek; pad++) {
    days.push({ date: "", km: 0, week: 0, dow: pad })
  }

  const daysInYear = Math.floor((today.getTime() - yearStart.getTime()) / 86400000) + 1
  for (let i = 0; i < daysInYear; i++) {
    const d = new Date(yearStart)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split("T")[0]
    const week = Math.floor((i + dayOfWeek - 2) / 7)
    days.push({ date: dateStr, km: distMap[dateStr] || 0, week, dow: (d.getDay() || 7) })
  }

  // Group by week
  const weeks: typeof days[] = []
  days.forEach((d) => {
    if (!weeks[d.week]) weeks[d.week] = []
    weeks[d.week].push(d)
  })

  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]
  const totalDays = Object.keys(distMap).filter((d) => d.startsWith(today.getFullYear().toString())).length
  const totalKm = Object.entries(distMap)
    .filter(([d]) => d.startsWith(today.getFullYear().toString()))
    .reduce((s, [, v]) => s + v, 0)

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Activité {today.getFullYear()}</p>
            <p className="text-xs text-text-muted mt-0.5">{totalDays} jours · {totalKm.toFixed(0)} km</p>
          </div>
        </div>

        {/* Month labels */}
        <div className="flex gap-[3px] mb-1 overflow-x-auto">
          {months.map((m, i) => {
            const weekOfMonth = Math.floor(new Date(today.getFullYear(), i, 1).getDate() / 7)
            return (
              <div key={i} className="flex-shrink-0 text-[9px] text-text-muted" style={{ width: 11, textAlign: "center" }}>
                {i % 2 === 0 ? m : ""}
              </div>
            )
          })}
        </div>

        {/* Grid */}
        <div className="flex gap-[3px] overflow-x-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }).map((_, di) => {
                const day = week?.find((d) => d.dow === di + 1)
                return (
                  <div
                    key={di}
                    className="heatmap-cell rounded-[2px]"
                    style={{
                      width: 11,
                      height: 11,
                      background: day?.date ? getIntensity(day.km) : "rgba(255,255,255,0.04)",
                      flexShrink: 0,
                    }}
                    title={day?.date ? `${day.date}: ${day.km.toFixed(1)}km` : ""}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[9px] text-text-muted">Moins</span>
          {[0, 3, 7, 12, 25].map((v) => (
            <div key={v} className="w-2.5 h-2.5 rounded-sm" style={{ background: getIntensity(v) }} />
          ))}
          <span className="text-[9px] text-text-muted">Plus</span>
        </div>
      </GlassCard>
    </motion.div>
  )
}
