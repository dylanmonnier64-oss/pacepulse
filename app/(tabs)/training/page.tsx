"use client"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RefreshCw, CalendarDays } from "lucide-react"
import ProfileSwitcher from "@/components/training/ProfileSwitcher"
import QuestionnaireModal from "@/components/training/QuestionnaireModal"
import TrainingCalendar from "@/components/training/TrainingCalendar"
import {
  getActiveProfile, setActiveProfile, getProfile, saveProfile, getPlan, savePlan,
  generatePlan, needsQuestionnaire,
  LEVEL_LABELS, OBJECTIVE_LABELS, OBJECTIVE_ICONS,
  type ProfileId, type TrainingProfile,
} from "@/lib/trainingPlanner"

const PROFILE_META: Record<ProfileId, { name: string; color: string }> = {
  dylan: { name: "Dylan", color: "#F4D03F" },
  manon: { name: "Manon", color: "#9B59B6" },
}

export default function TrainingPage() {
  const [activeId, setActiveId] = useState<ProfileId>("dylan")
  const [profile, setProfile] = useState<TrainingProfile | null>(null)
  const [plan, setPlan] = useState<ReturnType<typeof getPlan>>(null)
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load from localStorage after mount
  useEffect(() => {
    const id = getActiveProfile()
    setActiveId(id)
    const p = getProfile(id)
    setProfile(p)
    const pl = getPlan(id)
    setPlan(pl)
    setMounted(true)
    // Show questionnaire if needed
    if (needsQuestionnaire(p) || !pl) {
      setShowModal(true)
    }
  }, [])

  const switchProfile = useCallback((id: ProfileId) => {
    setActiveProfile(id)
    setActiveId(id)
    const p = getProfile(id)
    setProfile(p)
    const pl = getPlan(id)
    setPlan(pl)
    if (needsQuestionnaire(p) || !pl) {
      setShowModal(true)
    }
  }, [])

  const handleQuestionnaireSubmit = useCallback(
    (partial: Pick<TrainingProfile, "level" | "objective" | "availableDays">) => {
      const currentMonth = new Date().toISOString().slice(0, 7)
      const updated: TrainingProfile = {
        id: activeId,
        ...partial,
        lastQuestionnaireDate: currentMonth,
      }
      saveProfile(updated)
      const newPlan = generatePlan(updated)
      savePlan(newPlan)
      setProfile(updated)
      setPlan(newPlan)
      setShowModal(false)
    },
    [activeId]
  )

  const handleRegenerate = () => {
    setShowModal(true)
  }

  const meta = PROFILE_META[activeId]

  if (!mounted) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-3xl h-32" style={{ background: "rgba(255,255,255,0.05)" }} />
        ))}
      </div>
    )
  }

  return (
    <>
      <motion.div
        className="flex flex-col gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Planning</p>
            <h1 className="text-2xl font-black tracking-tight">
              Entraînement<span style={{ color: meta.color }}>.</span>
            </h1>
          </div>
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold touch-feedback"
            style={{
              background: `${meta.color}15`,
              border: `1px solid ${meta.color}40`,
              color: meta.color,
            }}
          >
            <RefreshCw size={13} />
            Nouveau plan
          </button>
        </div>

        {/* Profile switcher */}
        <ProfileSwitcher active={activeId} onChange={switchProfile} />

        {/* Profile summary card */}
        {profile && (
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-4 flex items-center gap-4"
            style={{
              background: `${meta.color}10`,
              border: `1px solid ${meta.color}30`,
            }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: `${meta.color}20` }}>
              {OBJECTIVE_ICONS[profile.objective]}
            </div>
            <div className="flex-1">
              <p className="font-black text-sm" style={{ color: meta.color }}>
                {meta.name}
              </p>
              <p className="text-xs text-text-muted">
                {LEVEL_LABELS[profile.level]} · {OBJECTIVE_LABELS[profile.objective]}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: `${meta.color}80` }}>
                {profile.availableDays.length} entraînements / semaine
              </p>
            </div>
          </motion.div>
        )}

        {/* Plan calendar */}
        <AnimatePresence mode="wait">
          {plan ? (
            <motion.div
              key={`plan-${activeId}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-3xl p-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays size={15} style={{ color: meta.color }} />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: meta.color }}>
                  Plan 4 semaines
                </p>
                <span className="text-[10px] text-text-muted ml-auto">
                  {plan.sessions.length} séances
                </span>
              </div>
              <TrainingCalendar plan={plan} profileColor={meta.color} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 gap-4"
            >
              <div className="text-4xl">📋</div>
              <p className="text-sm text-text-muted text-center">
                Aucun plan généré pour {meta.name}.<br />
                Complète le questionnaire pour commencer.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 rounded-2xl font-black text-sm"
                style={{ background: meta.color, color: "#0A0A0A" }}
              >
                Créer mon plan
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-4" />
      </motion.div>

      {/* Questionnaire modal */}
      {showModal && (
        <QuestionnaireModal
          profileId={activeId}
          profileName={meta.name}
          profileColor={meta.color}
          onSubmit={handleQuestionnaireSubmit}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
