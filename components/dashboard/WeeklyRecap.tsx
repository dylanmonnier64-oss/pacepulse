"use client"
import { motion } from "framer-motion"
import type { Run } from "@/lib/types"
import { colors } from "@/lib/design-tokens"
import { getRunTypeColor } from "@/lib/utils"

interface Props {
  runs: Run[]
}

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"]

function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split("T")[0])
  }
  return days
}

export default function WeeklyRecap({ runs }: Props) {
  const days = getLast7Days()
  const today = new Date().toISOString().split("T")[0]

  // Build map: date → runs
  const runsByDay: Record<string, Run[]> = {}
  runs.forEach(r => {
    const d = r.date.split("T")[0]
    if (!runsByDay[d]) runsByDay[d] = []
    runsByDay[d].push(r)
  })

  const dayData = days.map(date => ({
    date,
    label: DAY_LABELS[new Date(date + "T12:00:00").getDay() === 0 ? 6 : new Date(date + "T12:00:00").getDay() - 1],
    runs: runsByDay[date] ?? [],
    km: (runsByDay[date] ?? []).reduce((s, r) => s + r.distance, 0),
    isToday: date === today,
  }))

  const maxKm = Math.max(...dayData.map(d => d.km), 1)
  const totalKm = dayData.reduce((s, d) => s + d.km, 0)
  const activeDays = dayData.filter(d => d.runs.length > 0).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-3xl p-4"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Cette semaine</p>
          <p className="text-base font-black">
            <span style={{ color: colors.gold }}>{totalKm.toFixed(1)}</span>
            <span className="text-text-muted text-xs font-normal ml-1">km · {activeDays}j actifs</span>
          </p>
        </div>
        <div className="text-[10px] text-text-muted text-right">
          <p>7 derniers jours</p>
        </div>
      </div>

      {/* Sparkline bars */}
      <div className="flex items-end gap-1.5" style={{ height: 64 }}>
        {dayData.map(({ date, label, runs: dayRuns, km, isToday }, i) => {
          const heightPct = km > 0 ? Math.max((km / maxKm) * 100, 8) : 0
          const barColor = dayRuns.length > 0 ? getRunTypeColor(dayRuns[0].type) : "transparent"

          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-1" style={{ height: 64 }}>
              {/* Bar container */}
              <div className="flex-1 flex items-end w-full">
                {km > 0 ? (
                  <motion.div
                    className="w-full rounded-t-lg"
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05, ease: [0, 0, 0.2, 1] }}
                    style={{
                      background: barColor,
                      opacity: isToday ? 1 : 0.75,
                      boxShadow: isToday ? `0 0 10px ${barColor}60` : "none",
                    }}
                  />
                ) : (
                  <div className="w-full" style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }} />
                )}
              </div>
              {/* Day label */}
              <span
                className="text-[10px] font-bold"
                style={{ color: isToday ? colors.gold : "rgba(245,245,245,0.35)" }}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* km labels row */}
      <div className="flex gap-1.5 mt-1">
        {dayData.map(({ date, km }) => (
          <div key={date} className="flex-1 text-center">
            <span className="text-[9px] text-text-muted">
              {km > 0 ? `${km.toFixed(0)}` : ""}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
