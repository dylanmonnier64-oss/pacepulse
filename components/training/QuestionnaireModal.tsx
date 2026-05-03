"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check } from "lucide-react"
import type { RunLevel, RunObjective, TrainingProfile, ProfileId } from "@/lib/trainingPlanner"
import {
  LEVEL_LABELS, OBJECTIVE_LABELS, OBJECTIVE_ICONS, DAY_LABELS,
} from "@/lib/trainingPlanner"

interface Props {
  profileId: ProfileId
  profileName: string
  profileColor: string
  onSubmit: (partial: Pick<TrainingProfile, "level" | "objective" | "availableDays">) => void
  onClose: () => void
}

const levels: RunLevel[] = ["débutant", "intermédiaire", "avancé", "elite"]
const objectives: RunObjective[] = ["forme", "10k", "semi", "marathon", "trail", "vitesse"]

export default function QuestionnaireModal({ profileId, profileName, profileColor, onSubmit, onClose }: Props) {
  const [step, setStep] = useState<"level" | "objective" | "days">("level")
  const [level, setLevel] = useState<RunLevel>("intermédiaire")
  const [objective, setObjective] = useState<RunObjective>("semi")
  const [days, setDays] = useState<number[]>([1, 3, 5])

  const toggleDay = (d: number) => {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())
  }

  const handleSubmit = () => {
    onSubmit({ level, objective, availableDays: days })
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          className="w-full rounded-t-3xl p-6 flex flex-col gap-5"
          style={{ background: "#0D1B2A", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "85vh", overflowY: "auto", paddingBottom: "calc(var(--safe-bottom) + 1.5rem)" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="w-10 h-1 rounded-full mx-auto" style={{ background: "rgba(255,255,255,0.2)" }} />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Questionnaire mensuel</p>
              <h2 className="text-lg font-black">
                Plan pour{" "}
                <span style={{ color: profileColor }}>{profileName}</span>
              </h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.07)" }}>
              <X size={16} />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex gap-2">
            {(["level", "objective", "days"] as const).map((s, i) => (
              <div key={s} className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{ background: step === s ? profileColor : i < ["level","objective","days"].indexOf(step) ? `${profileColor}60` : "rgba(255,255,255,0.1)" }} />
            ))}
          </div>

          {/* Step: Level */}
          {step === "level" && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-text-muted">Quel est ton niveau actuel ?</p>
              <div className="grid grid-cols-2 gap-2">
                {levels.map(l => (
                  <button key={l} onClick={() => setLevel(l)}
                    className="py-3 px-4 rounded-2xl text-sm font-bold text-left transition-all"
                    style={{
                      background: level === l ? `${profileColor}20` : "rgba(255,255,255,0.05)",
                      border: `1px solid ${level === l ? profileColor : "rgba(255,255,255,0.1)"}`,
                      color: level === l ? profileColor : "rgba(245,245,245,0.7)",
                    }}>
                    {LEVEL_LABELS[l]}
                  </button>
                ))}
              </div>
              <button onClick={() => setStep("objective")}
                className="w-full py-3 rounded-2xl font-black text-sm mt-1"
                style={{ background: profileColor, color: "#0A0A0A" }}>
                Continuer →
              </button>
            </div>
          )}

          {/* Step: Objective */}
          {step === "objective" && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-text-muted">Quel est ton objectif ce mois ?</p>
              <div className="grid grid-cols-2 gap-2">
                {objectives.map(o => (
                  <button key={o} onClick={() => setObjective(o)}
                    className="py-3 px-4 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all"
                    style={{
                      background: objective === o ? `${profileColor}20` : "rgba(255,255,255,0.05)",
                      border: `1px solid ${objective === o ? profileColor : "rgba(255,255,255,0.1)"}`,
                      color: objective === o ? profileColor : "rgba(245,245,245,0.7)",
                    }}>
                    <span>{OBJECTIVE_ICONS[o]}</span>
                    <span>{OBJECTIVE_LABELS[o]}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-1">
                <button onClick={() => setStep("level")} className="flex-1 py-3 rounded-2xl font-bold text-sm"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(245,245,245,0.6)" }}>
                  ← Retour
                </button>
                <button onClick={() => setStep("days")} className="flex-1 py-3 rounded-2xl font-black text-sm"
                  style={{ background: profileColor, color: "#0A0A0A" }}>
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* Step: Days */}
          {step === "days" && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-text-muted">Quels jours es-tu disponible ?</p>
              <div className="flex gap-2">
                {DAY_LABELS.map((label, i) => (
                  <button key={i} onClick={() => toggleDay(i)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: days.includes(i) ? `${profileColor}25` : "rgba(255,255,255,0.05)",
                      border: `1px solid ${days.includes(i) ? profileColor : "rgba(255,255,255,0.1)"}`,
                      color: days.includes(i) ? profileColor : "rgba(245,245,245,0.5)",
                    }}>
                    {label}
                  </button>
                ))}
              </div>
              {days.length === 0 && (
                <p className="text-xs text-danger text-center">Sélectionne au moins un jour</p>
              )}
              <p className="text-[11px] text-text-muted text-center">
                {days.length} jour{days.length > 1 ? "s" : ""} sélectionné{days.length > 1 ? "s" : ""}
              </p>
              <div className="flex gap-2 mt-1">
                <button onClick={() => setStep("objective")} className="flex-1 py-3 rounded-2xl font-bold text-sm"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(245,245,245,0.6)" }}>
                  ← Retour
                </button>
                <button onClick={handleSubmit} disabled={days.length === 0}
                  className="flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
                  style={{ background: days.length > 0 ? profileColor : "rgba(255,255,255,0.1)", color: days.length > 0 ? "#0A0A0A" : "rgba(245,245,245,0.3)" }}>
                  <Check size={16} />
                  Générer mon plan
                </button>
              </div>
            </div>
          )}

          <div className="h-2" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
