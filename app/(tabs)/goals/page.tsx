"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Target, TrendingUp, Mountain, Clock, Trophy, Route, Footprints, Plus, X, Zap, Check } from "lucide-react"
import { useRuns } from "@/hooks/useRuns"
import { getGoals, saveGoals, getActiveProfile } from "@/lib/storage"
import type { Goal, GoalType, GoalPeriod, Run } from "@/lib/types"
import { isSameWeek, isSameMonth, isSameYear, formatDistance, formatDurationShort } from "@/lib/utils"
import GlassCard from "@/components/ui/GlassCard"
import Confetti from "@/components/goals/Confetti"
import { generateId, hapticFeedback } from "@/lib/utils"
import { toast } from "@/lib/toast"

const iconMap: Record<string, React.ElementType> = {
  route: Route, footprints: Footprints, mountain: Mountain, trophy: Trophy, clock: Clock, zap: Zap
}

// --- Perf goal checker (all-time, not period filtered) ---
function checkPerfGoal(goal: Goal, runs: Run[]): { achieved: boolean; run?: Run } {
  if (!goal.perfCriteria) return { achieved: false }
  const match = runs.find((r) => {
    const distOk = r.distance >= goal.perfCriteria!.minDistance
    const durOk = !goal.perfCriteria!.maxDuration || r.duration <= goal.perfCriteria!.maxDuration
    const paceOk = !goal.perfCriteria!.maxPace || r.pace <= goal.perfCriteria!.maxPace
    return distOk && durOk && paceOk
  })
  return { achieved: !!match, run: match }
}

// --- Period goal progress ---
function getGoalProgress(goal: Goal, runs: Run[]) {
  const filtered = runs.filter((r) => {
    if (goal.period === "week") return isSameWeek(r.date)
    if (goal.period === "month") return isSameMonth(r.date)
    return isSameYear(r.date)
  })
  switch (goal.type) {
    case "distance": return filtered.reduce((s, r) => s + r.distance, 0)
    case "runs": return filtered.length
    case "elevation": return filtered.reduce((s, r) => s + r.elevation, 0)
    case "time": return filtered.reduce((s, r) => s + r.duration, 0) / 3600
    default: return 0
  }
}

function formatProgress(goal: Goal, value: number): string {
  if (goal.type === "time") return `${value.toFixed(1)}h`
  if (goal.type === "distance") return `${formatDistance(value)}km`
  return String(Math.round(value))
}

// --- Smart suggestions based on run history ---
function generateSuggestions(runs: Run[]): Omit<Goal, "id">[] {
  const suggestions: Omit<Goal, "id">[] = []
  const maxDist = runs.length ? Math.max(...runs.map((r) => r.distance)) : 0
  const avgWeekKm = (() => {
    if (!runs.length) return 0
    const weeks = new Set(runs.map((r) => {
      const d = new Date(r.date); return `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`
    })).size
    return runs.reduce((s, r) => s + r.distance, 0) / Math.max(weeks, 1)
  })()

  // Perf goals (always suggest if not already huge)
  if (maxDist < 10 || runs.length === 0) {
    suggestions.push({
      type: "perf", period: "year", target: 1, unit: "perf",
      label: "Courir 10km sans s'arrêter",
      icon: "route", color: "#F4D03F",
      perfCriteria: { minDistance: 10 },
    })
  }
  suggestions.push({
    type: "perf", period: "year", target: 1, unit: "perf",
    label: "10km en moins d'1h",
    icon: "clock", color: "#F4D03F",
    perfCriteria: { minDistance: 10, maxDuration: 3600 },
  })
  if (maxDist >= 8) {
    suggestions.push({
      type: "perf", period: "year", target: 1, unit: "perf",
      label: "Premier semi-marathon (21km)",
      icon: "trophy", color: "#9B59B6",
      perfCriteria: { minDistance: 21 },
    })
  }
  if (maxDist >= 18) {
    suggestions.push({
      type: "perf", period: "year", target: 1, unit: "perf",
      label: "Premier marathon (42km)",
      icon: "zap", color: "#E74C3C",
      perfCriteria: { minDistance: 42 },
    })
  }
  const best5k = runs.filter((r) => r.distance >= 4.9).sort((a, b) => a.pace - b.pace)[0]
  if (best5k && best5k.pace > 270) {
    suggestions.push({
      type: "perf", period: "year", target: 1, unit: "perf",
      label: `5km sous les ${Math.floor((best5k.pace - 20) / 60)}:${String((best5k.pace - 20) % 60).padStart(2, "0")}/km`,
      icon: "zap", color: "#E67E22",
      perfCriteria: { minDistance: 5, maxPace: best5k.pace - 20 },
    })
  }

  // Volume goals
  const weekTarget = Math.ceil(Math.max(avgWeekKm * 1.25, 20) / 5) * 5
  suggestions.push({
    type: "distance", period: "week", target: weekTarget, unit: "km",
    label: `${weekTarget}km cette semaine`,
    icon: "footprints", color: "#3498DB",
  })
  suggestions.push({
    type: "runs", period: "week", target: 3, unit: "sorties",
    label: "3 sorties par semaine",
    icon: "footprints", color: "#2ECC71",
  })
  const monthTarget = Math.ceil(Math.max(avgWeekKm * 4 * 1.2, 60) / 10) * 10
  suggestions.push({
    type: "distance", period: "month", target: monthTarget, unit: "km",
    label: `${monthTarget}km ce mois`,
    icon: "route", color: "#E67E22",
  })

  return suggestions
}

// --- GoalCard ---
function GoalCard({
  goal, runs, onAchieve, onDelete,
}: {
  goal: Goal
  runs: Run[]
  onAchieve: (goalId: string, run: Run) => void
  onDelete: (goalId: string) => void
}) {
  const Icon = iconMap[goal.icon] || Target

  // Perf goal
  if (goal.type === "perf") {
    const { achieved, run } = checkPerfGoal(goal, runs)
    const wasAchieved = goal.achieved || achieved

    useEffect(() => {
      if (achieved && !goal.achieved && run) onAchieve(goal.id, run)
    }, [achieved])

    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard
          className="p-4 relative overflow-hidden"
          style={wasAchieved ? { border: `1px solid ${goal.color}80` } : undefined}
        >
          {wasAchieved && (
            <div className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ background: `radial-gradient(ellipse at top, ${goal.color}18 0%, transparent 70%)` }} />
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${goal.color}20` }}>
              <Icon size={18} style={{ color: goal.color }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{goal.label}</p>
              <p className="text-[10px] text-text-muted">Objectif de performance</p>
            </div>
            <div className="flex items-center gap-2">
              {wasAchieved ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  role="status"
                  style={{ background: `${goal.color}20`, border: `1px solid ${goal.color}60` }}>
                  <Check size={11} aria-hidden style={{ color: goal.color }} />
                  <span className="text-[10px] font-bold" style={{ color: goal.color }}>Atteint !</span>
                </div>
              ) : (
                <span className="text-[10px] text-text-muted">En cours…</span>
              )}
              <button onClick={() => { hapticFeedback(); onDelete(goal.id) }}
                aria-label={`Supprimer l'objectif : ${goal.label}`}
                className="w-6 h-6 flex items-center justify-center rounded-full opacity-40 hover:opacity-70"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                <X size={12} aria-hidden />
              </button>
            </div>
          </div>
          {wasAchieved && goal.achievedDate && (
            <p className="text-[10px] text-text-muted mt-2 pl-13">
              🏆 Validé le {new Date(goal.achievedDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </GlassCard>
      </motion.div>
    )
  }

  // Accumulation goal
  const current = getGoalProgress(goal, runs)
  const pct = Math.min(100, (current / goal.target) * 100)
  const achieved = pct >= 100

  const now = new Date()
  let totalDays = 7, elapsedDays = now.getDay() || 7
  if (goal.period === "month") { totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(); elapsedDays = now.getDate() }
  if (goal.period === "year") { totalDays = 365; elapsedDays = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000) }
  const projected = elapsedDays > 0 ? (current / elapsedDays) * totalDays : 0

  useEffect(() => { if (achieved) onAchieve(goal.id, runs[0]) }, [achieved])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="p-4 relative overflow-hidden"
        style={achieved ? { border: `1px solid ${goal.color}60` } : undefined}>
        {achieved && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: `radial-gradient(ellipse at top, ${goal.color}15 0%, transparent 70%)` }} />
        )}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${goal.color}20` }}>
            <Icon size={18} style={{ color: goal.color }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{goal.label}</p>
            <p className="text-[10px] text-text-muted capitalize">
              {goal.period === "week" ? "Semaine en cours" : goal.period === "month" ? "Ce mois" : "Cette année"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-lg font-extrabold stat-num" style={{ color: achieved ? goal.color : "#F5F5F5" }}>
                {formatProgress(goal, current)}
              </p>
              <p className="text-[10px] text-text-muted">/ {goal.target} {goal.unit}</p>
            </div>
            <button onClick={() => { hapticFeedback(); onDelete(goal.id) }}
              aria-label={`Supprimer l'objectif : ${goal.label}`}
              className="w-6 h-6 flex items-center justify-center rounded-full opacity-40 hover:opacity-70"
              style={{ background: "rgba(255,255,255,0.08)" }}>
              <X size={12} aria-hidden />
            </button>
          </div>
        </div>
        <div className="h-2 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.1)" }}>
          <motion.div className="h-full rounded-full"
            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
            style={{ background: achieved ? `linear-gradient(90deg, ${goal.color}, #F4D03F)` : `linear-gradient(90deg, #E67E22, #9B59B6)` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold" style={{ color: achieved ? goal.color : "rgba(245,245,245,0.6)" }}>
            {pct.toFixed(0)}%{achieved ? " ✓ Objectif atteint !" : ""}
          </p>
          {!achieved && projected > 0 && (
            <p className="text-[10px] text-text-muted">
              Projection : {formatProgress(goal, projected)} {goal.unit}{projected >= goal.target ? " ✓" : " ✗"}
            </p>
          )}
        </div>
      </GlassCard>
    </motion.div>
  )
}

// --- Add Goal Modal ---
function AddGoalModal({
  runs, existingGoals, onAdd, onClose,
}: {
  runs: Run[]
  existingGoals: Goal[]
  onAdd: (goal: Goal) => void
  onClose: () => void
}) {
  const suggestions = generateSuggestions(runs).filter(
    (s) => !existingGoals.some((g) => g.label === s.label)
  )

  const [tab, setTab] = useState<"suggest" | "custom">("suggest")
  const [customType, setCustomType] = useState<GoalType>("distance")
  const [customPeriod, setCustomPeriod] = useState<GoalPeriod>("month")
  const [customTarget, setCustomTarget] = useState("")
  const [customLabel, setCustomLabel] = useState("")

  const addSuggestion = (s: Omit<Goal, "id">) => {
    hapticFeedback()
    onAdd({ ...s, id: generateId() })
  }

  const addCustom = () => {
    if (!customTarget || !customLabel) return
    hapticFeedback()
    const units: Record<GoalType, string> = {
      distance: "km", runs: "sorties", elevation: "m", time: "h", perf: "perf"
    }
    const icons: Record<GoalType, string> = {
      distance: "footprints", runs: "footprints", elevation: "mountain", time: "clock", perf: "trophy"
    }
    const colors = ["#F4D03F", "#E67E22", "#9B59B6", "#3498DB", "#2ECC71", "#E74C3C"]
    onAdd({
      id: generateId(),
      type: customType,
      period: customPeriod,
      target: parseFloat(customTarget),
      unit: units[customType],
      label: customLabel,
      icon: icons[customType],
      color: colors[Math.floor(Math.random() * colors.length)],
    })
  }

  const SuggIcon = ({ icon }: { icon: string }) => {
    const I = iconMap[icon] || Target
    return <I size={16} />
  }

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      aria-hidden="false"
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-goal-title"
        className="relative w-full rounded-t-3xl flex flex-col max-h-[85vh]"
        style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.1)", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)" }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1" aria-hidden>
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <h2 id="add-goal-title" className="text-lg font-black">Nouvel objectif</h2>
          <button onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <X size={16} aria-hidden />
          </button>
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label="Mode d'ajout d'objectif" className="flex mx-5 mb-4 rounded-2xl p-1" style={{ background: "rgba(255,255,255,0.06)" }}>
          {(["suggest", "custom"] as const).map((t) => (
            <button key={t} role="tab" onClick={() => setTab(t)}
              aria-selected={tab === t}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: tab === t ? "#F4D03F" : "transparent",
                color: tab === t ? "#0A0A0A" : "rgba(245,245,245,0.5)",
              }}>
              {t === "suggest" ? "✨ Suggestions" : "⚙️ Personnalisé"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div role="tabpanel" className="flex-1 overflow-y-auto px-5 pb-8 flex flex-col gap-3">
          {tab === "suggest" ? (
            suggestions.length === 0 ? (
              <p className="text-center text-text-muted py-8">Tous les objectifs suggérés sont déjà ajoutés !</p>
            ) : (
              suggestions.map((s, i) => {
                const Icon = iconMap[s.icon] || Target
                return (
                  <motion.button
                    key={i}
                    onClick={() => addSuggestion(s)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-left"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${s.color}20` }}>
                      <Icon size={16} style={{ color: s.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{s.label}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        {s.type === "perf" ? "Performance unique" :
                          `${s.period === "week" ? "Semaine" : s.period === "month" ? "Mois" : "Année"} · ${s.target} ${s.unit}`}
                      </p>
                    </div>
                    <Plus size={16} style={{ color: s.color }} />
                  </motion.button>
                )
              })
            )
          ) : (
            <div className="flex flex-col gap-4">
              {/* Type */}
              <fieldset>
                <legend className="text-xs font-bold text-text-muted mb-2 uppercase tracking-widest">Type</legend>
                <div className="grid grid-cols-2 gap-2" role="group">
                  {([
                    { v: "distance", l: "Distance (km)" },
                    { v: "runs", l: "Nombre de sorties" },
                    { v: "elevation", l: "Dénivelé (m)" },
                    { v: "time", l: "Temps de course (h)" },
                  ] as const).map(({ v, l }) => (
                    <button key={v} type="button" onClick={() => setCustomType(v)}
                      aria-pressed={customType === v}
                      className="py-2.5 px-3 rounded-xl text-xs font-bold text-left"
                      style={{
                        background: customType === v ? "#F4D03F20" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${customType === v ? "#F4D03F60" : "rgba(255,255,255,0.08)"}`,
                        color: customType === v ? "#F4D03F" : "rgba(245,245,245,0.7)",
                      }}>
                      {l}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Period */}
              <fieldset>
                <legend className="text-xs font-bold text-text-muted mb-2 uppercase tracking-widest">Période</legend>
                <div className="flex gap-2" role="group">
                  {(["week", "month", "year"] as const).map((p) => (
                    <button key={p} type="button" onClick={() => setCustomPeriod(p)}
                      aria-pressed={customPeriod === p}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                      style={{
                        background: customPeriod === p ? "#F4D03F20" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${customPeriod === p ? "#F4D03F60" : "rgba(255,255,255,0.08)"}`,
                        color: customPeriod === p ? "#F4D03F" : "rgba(245,245,245,0.7)",
                      }}>
                      {p === "week" ? "Semaine" : p === "month" ? "Mois" : "Année"}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Target */}
              <div>
                <label htmlFor="goal-target" className="text-xs font-bold text-text-muted mb-2 uppercase tracking-widest block">Objectif</label>
                <input
                  id="goal-target"
                  type="number"
                  inputMode="decimal"
                  placeholder={customType === "distance" ? "ex: 50" : customType === "runs" ? "ex: 3" : customType === "elevation" ? "ex: 500" : "ex: 5"}
                  value={customTarget}
                  onChange={(e) => setCustomTarget(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm font-bold outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F5F5" }}
                />
              </div>

              {/* Label */}
              <div>
                <label htmlFor="goal-label" className="text-xs font-bold text-text-muted mb-2 uppercase tracking-widest block">Nom</label>
                <input
                  id="goal-label"
                  type="text"
                  placeholder="ex: 50km ce mois-ci"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F5F5" }}
                />
              </div>

              <button
                type="button"
                onClick={addCustom}
                disabled={!customTarget || !customLabel}
                className="w-full py-3.5 rounded-2xl font-black text-sm mt-2"
                style={{
                  background: customTarget && customLabel ? "#F4D03F" : "rgba(255,255,255,0.06)",
                  color: customTarget && customLabel ? "#0A0A0A" : "rgba(245,245,245,0.3)",
                }}>
                Ajouter l'objectif
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// --- Main Page ---
export default function GoalsPage() {
  const { runs, loading } = useRuns()
  const [goals, setGoals] = useState<Goal[]>([])
  const [confetti, setConfetti] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const stored = getGoals()
    if (stored.length === 0 && getActiveProfile() === "dydz") {
      const seed: Goal = {
        id: "dydz_10k_1h",
        type: "perf",
        period: "year",
        target: 1,
        unit: "perf",
        label: "10km en moins d'1h",
        icon: "clock",
        color: "#F4D03F",
        perfCriteria: { minDistance: 10, maxDuration: 3600 },
      }
      saveGoals([seed])
      setGoals([seed])
    } else {
      setGoals(stored)
    }
  }, [])

  const handleAchieve = (goalId: string, run: Run) => {
    setGoals((prev) => {
      const updated = prev.map((g) =>
        g.id === goalId ? { ...g, achieved: true, achievedDate: run.date, achievedRunId: run.id } : g
      )
      saveGoals(updated)
      return updated
    })
    setConfetti(true)
    setTimeout(() => setConfetti(false), 4000)
  }

  const handleDelete = (goalId: string) => {
    setGoals((prev) => {
      const updated = prev.filter((g) => g.id !== goalId)
      saveGoals(updated)
      return updated
    })
    toast.info("Objectif supprimé")
  }

  const handleAdd = (goal: Goal) => {
    setGoals((prev) => {
      const updated = [...prev, goal]
      saveGoals(updated)
      return updated
    })
    toast.success("Objectif ajouté !")
    setShowModal(false)
  }

  const perfGoals = goals.filter((g) => g.type === "perf")
  const periodGoals = goals.filter((g) => g.type !== "perf")

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl h-28" style={{ background: "rgba(255,255,255,0.05)" }} />
        ))}
      </div>
    )
  }

  return (
    <>
      <Confetti active={confetti} />
      <AnimatePresence>
        {showModal && (
          <AddGoalModal
            runs={runs}
            existingGoals={goals}
            onAdd={handleAdd}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>

      <motion.div className="flex flex-col gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Progression</p>
            <h1 className="text-2xl font-black tracking-tight">
              Objectifs<span className="text-primary">.</span>
            </h1>
          </div>
          <button
            type="button"
            onClick={() => { hapticFeedback(); setShowModal(true) }}
            aria-label="Ajouter un nouvel objectif"
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl font-bold text-sm text-app no-select"
            style={{ background: "#F4D03F", color: "#0A0A0A", minHeight: 44 }}
          >
            <Plus size={16} aria-hidden />
            Ajouter
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl">🎯</span>
            <p className="text-text-muted mt-3">Aucun objectif pour l'instant</p>
            <button
              type="button"
              onClick={() => { hapticFeedback(); setShowModal(true) }}
              className="mt-4 px-6 py-3 rounded-2xl font-bold text-sm"
              style={{ background: "#F4D03F", color: "#0A0A0A" }}
            >
              Créer mon premier objectif
            </button>
          </div>
        ) : (
          <>
            {/* Perf goals */}
            {perfGoals.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 px-1">
                  🏆 Performances
                </p>
                <div className="flex flex-col gap-3">
                  {perfGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} runs={runs} onAchieve={handleAchieve} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            )}

            {/* Period goals grouped */}
            {(["week", "month", "year"] as const).map((period) => {
              const pg = periodGoals.filter((g) => g.period === period)
              if (!pg.length) return null
              const labels = { week: "Cette semaine", month: "Ce mois", year: "Cette année" }
              return (
                <div key={period}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 px-1">
                    {labels[period]}
                  </p>
                  <div className="flex flex-col gap-3">
                    {pg.map((goal) => (
                      <GoalCard key={goal.id} goal={goal} runs={runs} onAchieve={handleAchieve} onDelete={handleDelete} />
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}

        <div className="h-4" />
      </motion.div>
    </>
  )
}
