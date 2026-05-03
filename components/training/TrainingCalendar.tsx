"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, MapPin, Clock, TrendingUp } from "lucide-react"
import type { TrainingPlan, TrainingSession, SessionType } from "@/lib/trainingPlanner"
import { SESSION_COLORS, DAY_LABELS } from "@/lib/trainingPlanner"

interface Props {
  plan: TrainingPlan
  profileColor: string
}

const TYPE_ICONS: Record<SessionType, string> = {
  endurance: "🏃",
  threshold: "⚡",
  interval: "🔥",
  long: "🛤️",
  recovery: "💚",
  rest: "😴",
}

function getMonthGrid(startDate: string): string[][] {
  // Build a 4-week grid from startDate (a Monday)
  const start = new Date(startDate + "T12:00:00")
  const weeks: string[][] = []
  for (let w = 0; w < 4; w++) {
    const week: string[] = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(start)
      date.setDate(start.getDate() + w * 7 + d)
      week.push(date.toISOString().split("T")[0])
    }
    weeks.push(week)
  }
  return weeks
}

export default function TrainingCalendar({ plan, profileColor }: Props) {
  const [selected, setSelected] = useState<TrainingSession | null>(null)
  const weeks = getMonthGrid(plan.startDate)
  const today = new Date().toISOString().split("T")[0]

  const sessionMap: Record<string, TrainingSession> = {}
  plan.sessions.forEach(s => { sessionMap[s.date] = s })

  return (
    <div className="flex flex-col gap-3">
      {/* Week header */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold uppercase tracking-widest text-text-muted py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: `${profileColor}15`, color: profileColor }}>
              Sem. {wi + 1}
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {week.map(date => {
              const session = sessionMap[date]
              const isToday = date === today
              const isPast = date < today
              const color = session ? SESSION_COLORS[session.type] : "transparent"
              const dayNum = new Date(date + "T12:00:00").getDate()

              return (
                <motion.button
                  key={date}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => session && setSelected(session)}
                  className="relative flex flex-col items-center justify-center rounded-xl transition-all"
                  style={{
                    height: 52,
                    background: session ? `${color}18` : "rgba(255,255,255,0.03)",
                    border: isToday
                      ? `1.5px solid ${profileColor}`
                      : session
                      ? `1px solid ${color}40`
                      : "1px solid rgba(255,255,255,0.07)",
                    opacity: isPast && !session ? 0.4 : 1,
                  }}
                >
                  <span className="text-[10px] font-semibold"
                    style={{ color: isToday ? profileColor : "rgba(245,245,245,0.5)" }}>
                    {dayNum}
                  </span>
                  {session && (
                    <>
                      <span className="text-[14px] leading-none">{TYPE_ICONS[session.type]}</span>
                      <span className="text-[8px] font-bold mt-0.5" style={{ color }}>
                        {session.targetKm}km
                      </span>
                    </>
                  )}
                  {isToday && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full" style={{ background: profileColor }} />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-2">
        {(["endurance", "threshold", "interval", "long", "recovery"] as SessionType[]).map(t => (
          <div key={t} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: SESSION_COLORS[t] }} />
            <span className="text-[10px] text-text-muted capitalize">
              {t === "endurance" ? "Endurance" : t === "threshold" ? "Seuil" : t === "interval" ? "Fractionné" : t === "long" ? "Longue" : "Récup."}
            </span>
          </div>
        ))}
      </div>

      {/* Session detail drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full rounded-t-3xl p-6 flex flex-col gap-4"
              style={{ background: "#0D1B2A", border: "1px solid rgba(255,255,255,0.1)" }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full mx-auto" style={{ background: "rgba(255,255,255,0.2)" }} />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: `${SESSION_COLORS[selected.type]}20` }}>
                    {TYPE_ICONS[selected.type]}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: SESSION_COLORS[selected.type] }}>
                      Semaine {selected.week}
                    </p>
                    <h3 className="font-black text-base">{selected.name}</h3>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.07)" }}>
                  <X size={16} />
                </button>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 rounded-2xl p-3 flex items-center gap-2"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <MapPin size={14} style={{ color: SESSION_COLORS[selected.type] }} />
                  <div>
                    <p className="text-[10px] text-text-muted">Distance</p>
                    <p className="text-base font-black">{selected.targetKm} km</p>
                  </div>
                </div>
                {selected.targetPaceStr && (
                  <div className="flex-1 rounded-2xl p-3 flex items-center gap-2"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <TrendingUp size={14} style={{ color: SESSION_COLORS[selected.type] }} />
                    <div>
                      <p className="text-[10px] text-text-muted">Allure cible</p>
                      <p className="text-base font-black">{selected.targetPaceStr}</p>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-sm text-text-muted leading-relaxed" style={{ opacity: 0.85 }}>
                {selected.description}
              </p>

              <div className="h-2" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
