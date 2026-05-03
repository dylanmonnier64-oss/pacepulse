"use client"
import { useMemo } from "react"
import { motion } from "framer-motion"
import { useRuns } from "@/hooks/useRuns"
import { usePerformanceEngine } from "@/hooks/usePerformanceEngine"
import { getGear } from "@/lib/storage"
import { getWeeklyLoads, calculateTSS } from "@/lib/calculations"
import { isSameWeek, daysAgo } from "@/lib/utils"

const STORAGE_KEY = "vomero_weekly_coach"

interface CoachState {
  message: string
  alert:   string
  week:    number  // ISO week number for cache invalidation
}

function getISOWeek(): number {
  const d   = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const w = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d.getTime() - w.getTime()) / 86400000 - 3 + (w.getDay() + 6) % 7) / 7)
}

function buildCoachMessage(
  runs: ReturnType<typeof useRuns>["runs"],
  formeFatigue: ReturnType<typeof usePerformanceEngine>["formeFatigue"],
): { message: string; alert: string } {
  const thisWeek  = runs.filter(r => isSameWeek(r.date))
  const weekKm    = thisWeek.reduce((s, r) => s + r.distance, 0)
  const weekTSS   = thisWeek.reduce((s, r) => s + (r.tss ?? calculateTSS(r)), 0)

  const loads        = getWeeklyLoads(runs, 3)
  const prevWeekTSS  = loads[loads.length - 2]?.tss ?? 0
  const thisWeekTSS  = loads[loads.length - 1]?.tss ?? weekTSS

  const gear    = getGear()
  const fastest = [...thisWeek].sort((a, b) => a.pace - b.pace)[0]

  const parts: string[] = []
  let alert = ""

  // ── Règle 1 : surcharge ──────────────────────────────────────────────────
  if (prevWeekTSS > 0 && thisWeekTSS > prevWeekTSS * 1.15) {
    alert = `Charge +${Math.round(((thisWeekTSS / prevWeekTSS) - 1) * 100)}% vs semaine passée. Intègre une journée de récupération.`
  }

  // ── Règle 2 : bonne semaine ───────────────────────────────────────────────
  if (thisWeek.length >= 3) {
    parts.push(`${thisWeek.length} sorties cette semaine, ${weekKm.toFixed(0)} km au compteur. Bonne régularité.`)
  } else if (thisWeek.length === 0) {
    parts.push("Aucune sortie cette semaine. L'endurance s'entretient avec la constance — une sortie courte suffit.")
  } else {
    parts.push(`${thisWeek.length} sortie${thisWeek.length > 1 ? "s" : ""} cette semaine pour ${weekKm.toFixed(0)} km.`)
  }

  // ── Règle 3 : mention chaussures ─────────────────────────────────────────
  if (fastest?.gearId) {
    const shoe = gear.find(g => g.id === fastest.gearId)
    if (shoe) {
      parts.push(`Ta séance la plus rapide a été faite avec les ${shoe.name} — continue comme ça.`)
    }
  }

  // ── Règle 4 : forme/fatigue ───────────────────────────────────────────────
  const { formeRatio, statusLabel } = formeFatigue
  if (formeRatio >= 1.5) {
    parts.push(`Ton ratio Forme/Fatigue est à ${formeRatio.toFixed(1)} — tu es prêt pour une séance exigeante.`)
  } else if (formeRatio < 0.6) {
    parts.push(`Forme/Fatigue à ${formeRatio.toFixed(1)} — ton corps demande du repos. Écoute-le.`)
  } else {
    parts.push(`Statut actuel : ${statusLabel}. Entraînement modéré recommandé.`)
  }

  // ── Règle 5 : récupération récente ───────────────────────────────────────
  const lastRun = runs[0]
  if (lastRun && daysAgo(lastRun.date) === 0) {
    parts.push("Tu viens de courir aujourd'hui. Hydratation et sommeil pour consolider les adaptations.")
  } else if (lastRun && daysAgo(lastRun.date) > 4) {
    parts.push(`Dernière sortie il y a ${daysAgo(lastRun.date)} jours — remettre les baskets dès que possible.`)
  }

  return {
    message: parts.join(" "),
    alert,
  }
}

// ── Animated coach icon ───────────────────────────────────────────────────────
function CoachIcon() {
  return (
    <motion.div
      className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
      style={{ background: "rgba(244,208,63,0.12)", border: "1px solid rgba(244,208,63,0.25)" }}
      animate={{ rotate: [0, -6, 6, -4, 4, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
    >
      🧠
    </motion.div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function WeeklyCoachCard() {
  const { runs, loading }   = useRuns()
  const { formeFatigue }    = usePerformanceEngine()

  const { message, alert } = useMemo(() => {
    if (runs.length === 0) return { message: "Ajoute tes premières sorties pour que je puisse analyser ta forme.", alert: "" }
    return buildCoachMessage(runs, formeFatigue)
  }, [runs, formeFatigue])

  if (loading) return <div className="rounded-3xl h-24 animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />

  return (
    <motion.div
      className="rounded-3xl p-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(244,208,63,0.06) 0%, rgba(155,89,182,0.06) 100%)",
        border: "1px solid rgba(244,208,63,0.18)",
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -4, boxShadow: "0 8px 30px rgba(244,208,63,0.3)" }}
    >
      {/* Background orb */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: "#F4D03F" }} />

      <div className="flex items-start gap-3 relative">
        <CoachIcon />
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
            style={{ color: "rgba(244,208,63,0.7)" }}>Coach IA · Semaine</p>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(245,245,245,0.85)" }}>
            {message}
          </p>
          {alert && (
            <motion.div
              className="mt-3 flex items-start gap-2 px-3 py-2 rounded-xl"
              style={{ background: "rgba(230,126,34,0.12)", border: "1px solid rgba(230,126,34,0.3)" }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-sm">⚠️</span>
              <p className="text-xs" style={{ color: "#E67E22" }}>{alert}</p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
