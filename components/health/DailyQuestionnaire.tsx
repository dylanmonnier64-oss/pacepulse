"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import type { HealthFormState, HealthLog } from "@/lib/types"
import { lgStyle } from "@/lib/utils"
import { useHealthData } from "@/hooks/useHealthData"

interface DailyQuestionnaireProps {
  open: boolean
  onClose(): void
  onSave(data: HealthFormState): Promise<void>
  existingData?: HealthLog | null
  date?: string
}

const STEPS = 4

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0,
  background: "rgba(0,0,0,0.7)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  zIndex: 60,
}

const sheetStyle: React.CSSProperties = {
  position: "fixed", bottom: 0, left: 0, right: 0,
  background: "rgba(5,5,5,0.98)",
  borderTop: "1px solid rgba(212,175,55,0.15)",
  borderRadius: "24px 24px 0 0",
  zIndex: 61,
  padding: "24px 20px 40px",
  maxHeight: "90dvh",
  overflowY: "auto",
  boxShadow: "0 -8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,175,55,0.08)",
}

function numInputStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    ...lgStyle("rgba(255,255,255,0.07)"),
    borderRadius: 16,
    color: "#FAFAFA",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 36,
    fontWeight: 800,
    textAlign: "center",
    width: "100%",
    padding: "18px",
    outline: "none",
    ...extra,
  }
}

const sliderStyle: React.CSSProperties = { width: "100%", accentColor: "var(--gold)" }

function Dot({ active }: { active: boolean }) {
  return (
    <motion.div
      animate={{
        width: active ? 22 : 7,
        background: active ? "var(--gold)" : "rgba(255,255,255,0.15)",
        boxShadow: active ? "0 0 8px rgba(212,175,55,0.5)" : "none",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{ height: 7, borderRadius: 4 }}
    />
  )
}

function GoalBar({ value, goal, color = "var(--gold)" }: { value: number; goal: number; color?: string }) {
  const pct = Math.min((value / goal) * 100, 100)
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="data-mono text-[11px] font-bold" style={{ color: "rgba(250,250,250,0.5)" }}>
          {value.toLocaleString("fr-FR")}
          <span style={{ color: "rgba(250,250,250,0.25)" }}> / {goal.toLocaleString("fr-FR")}</span>
        </span>
        <span className="data-mono text-[11px] font-bold" style={{ color }}>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: `linear-gradient(90deg, ${color}cc, ${color})` }}
        />
      </div>
    </div>
  )
}

const SPORTS = [
  {
    type: "running" as const,
    emoji: "🏃",
    label: "Course",
    color: "#22C55E",
    colorAlpha: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.25)",
    sliderBg: "rgba(34,197,94,0.04)",
    sliderBorder: "rgba(34,197,94,0.1)",
  },
  {
    type: "padel" as const,
    emoji: "🎾",
    label: "Padel",
    color: "#A855F7",
    colorAlpha: "rgba(168,85,247,0.1)",
    border: "rgba(168,85,247,0.25)",
    sliderBg: "rgba(168,85,247,0.04)",
    sliderBorder: "rgba(168,85,247,0.1)",
  },
  {
    type: null,
    emoji: "😴",
    label: "Repos",
    color: "rgba(250,250,250,0.5)",
    colorAlpha: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.1)",
    sliderBg: "",
    sliderBorder: "",
  },
]

export default function DailyQuestionnaire({ open, onClose, onSave, existingData, date }: DailyQuestionnaireProps) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [steps, setSteps] = useState("0")
  const [calories, setCalories] = useState("0")
  const [activeMinutes, setActiveMinutes] = useState("0")
  const [activeBreaks, setActiveBreaks] = useState("0")
  const [hr, setHr] = useState("0")
  const [sleepHours, setSleepHours] = useState("7")
  const [sleepMinutes, setSleepMinutes] = useState("0")
  const [sportType, setSportType] = useState<"running" | "padel" | null>(null)
  const [watchPrefilled, setWatchPrefilled] = useState(false)

  // Données de la montre
  const { merged, hasDevices } = useHealthData()

  useEffect(() => {
    if (existingData) {
      // Données existantes en priorité
      setSteps(String(existingData.steps ?? 0))
      setCalories(String(existingData.calories ?? 0))
      setActiveMinutes(String(existingData.active_minutes ?? 0))
      setActiveBreaks(String(existingData.active_breaks ?? 0))
      setHr(String(existingData.heart_rate_avg ?? 0))
      setSleepHours(String(existingData.sleep_hours ?? 7))
      setSleepMinutes(String(existingData.sleep_minutes ?? 0))
      setSportType(existingData.sport_type ?? null)
      setWatchPrefilled(false)
    } else if (hasDevices && merged) {
      // Pré-remplir depuis la montre si pas de données existantes
      if (merged.steps)                 setSteps(String(merged.steps))
      if (merged.calories)              setCalories(String(Math.round(merged.calories)))
      if (merged.heartRate?.resting)    setHr(String(merged.heartRate.resting))
      if (merged.sleepHours !== undefined) {
        setSleepHours(String(merged.sleepHours))
        // Arrondir les minutes au 15 le plus proche
        const rawMin = merged.sleepMinutes ?? 0
        const roundedMin = Math.round(rawMin / 15) * 15
        setSleepMinutes(String(Math.min(roundedMin, 45)))
      }
      setWatchPrefilled(true)
    } else {
      setSteps("0")
      setCalories("0")
      setActiveMinutes("0")
      setActiveBreaks("0")
      setHr("0")
      setSleepHours("7")
      setSleepMinutes("0")
      setSportType(null)
      setWatchPrefilled(false)
    }
  }, [existingData, hasDevices, merged])

  useEffect(() => { if (open) setStep(0) }, [open])

  function goNext() { setDirection(1); setStep((s) => Math.min(s + 1, STEPS - 1)) }
  function goBack() { setDirection(-1); setStep((s) => Math.max(s - 1, 0)) }

  function handleSelectSport(type: "running" | "padel" | null) {
    setSportType(type)
    if (type === null) setActiveMinutes("0")
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave({
        steps,
        calories,
        active_minutes: activeMinutes,
        active_breaks: activeBreaks,
        heart_rate_avg: hr,
        sleep_hours: sleepHours,
        sleep_minutes: sleepMinutes,
        sport_type: sportType,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 56 : -56, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -56 : 56, opacity: 0 }),
  }

  const ql = (n: number) => (
    <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(250,250,250,0.35)" }}>
      {n}/{STEPS}
    </p>
  )
  const qt = (t: string) => (
    <h2 className="text-xl font-black mt-0.5" style={{ color: "#FAFAFA" }}>{t}</h2>
  )

  const activeSport = SPORTS.find((s) => s.type === sportType)

  const stepContent = [
    /* Step 0 — Pas + Calories */
    <div key="steps-cals" className="space-y-6">
      <div className="text-center space-y-1">{ql(1)}{qt("Activité du jour")}</div>

      <div className="space-y-4">
        <div
          className="rounded-[18px] p-4 space-y-3"
          style={{ background: "rgba(244,208,63,0.04)", border: "1px solid rgba(244,208,63,0.1)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">👟</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(244,208,63,0.8)" }}>Pas</span>
          </div>
          <input
            type="number" value={steps}
            onChange={(e) => setSteps(e.target.value)}
            min={0} style={numInputStyle({ fontSize: 28 })} inputMode="numeric"
          />
          <GoalBar value={Number(steps) || 0} goal={10000} color="#F4D03F" />
        </div>

        <div
          className="rounded-[18px] p-4 space-y-3"
          style={{ background: "rgba(255,107,26,0.04)", border: "1px solid rgba(255,107,26,0.1)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(255,107,26,0.9)" }}>Calories</span>
          </div>
          <input
            type="number" value={calories}
            onChange={(e) => setCalories(e.target.value)}
            min={0} style={numInputStyle({ fontSize: 28 })} inputMode="numeric"
          />
          <GoalBar value={Number(calories) || 0} goal={500} color="#FF6B1A" />
        </div>
      </div>
    </div>,

    /* Step 1 — Sport du jour */
    <div key="sport" className="space-y-5">
      <div className="text-center space-y-1">{ql(2)}{qt("Sport du jour")}</div>

      {/* Sport selector */}
      <div className="grid grid-cols-3 gap-2.5">
        {SPORTS.map(({ type, emoji, label, color, colorAlpha, border }) => {
          const selected = sportType === type
          return (
            <motion.button
              key={label}
              onClick={() => handleSelectSport(type)}
              whileTap={{ scale: 0.94 }}
              className="py-5 rounded-[20px] flex flex-col items-center gap-2 touch-feedback"
              style={{
                background: selected ? colorAlpha : "rgba(255,255,255,0.03)",
                border: `1px solid ${selected ? border : "rgba(255,255,255,0.06)"}`,
                boxShadow: selected ? `0 0 20px ${colorAlpha}` : "none",
                transition: "all 0.2s",
              }}
            >
              <span className="text-3xl">{emoji}</span>
              <span
                className="text-[10px] font-black uppercase tracking-[0.14em]"
                style={{ color: selected ? color : "rgba(250,250,250,0.35)" }}
              >
                {label}
              </span>
              {selected && (
                <motion.div
                  layoutId="sport-dot"
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: color }}
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Duration — only when sport selected */}
      <AnimatePresence mode="wait">
        {sportType !== null && activeSport && (
          <motion.div
            key={sportType}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="rounded-[18px] p-4 space-y-3"
            style={{ background: activeSport.sliderBg, border: `1px solid ${activeSport.sliderBorder}` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">⏱️</span>
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: activeSport.color + "dd" }}
                >
                  Durée de la séance
                </span>
              </div>
              <span className="data-mono font-black text-xl" style={{ color: activeSport.color }}>
                {activeMinutes}
                <span className="text-sm font-medium" style={{ color: activeSport.color + "88" }}> min</span>
              </span>
            </div>
            <input
              type="range" min={0} max={180} step={5}
              value={activeMinutes}
              onChange={(e) => setActiveMinutes(e.target.value)}
              style={{ ...sliderStyle, accentColor: activeSport.color }}
            />
            <div className="flex justify-between">
              {[0, 30, 60, 90, 120, 150, 180].map((v) => (
                <span key={v} className="data-mono text-[9px]" style={{ color: "rgba(250,250,250,0.2)" }}>
                  {v === 0 ? "0" : v === 180 ? "3h" : `${v}`}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pauses actives */}
      <div
        className="rounded-[18px] p-4 space-y-3"
        style={{ background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.1)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⏸️</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(168,85,247,0.9)" }}>Pauses actives</span>
          </div>
          <span className="data-mono font-black text-xl" style={{ color: "#A855F7" }}>{activeBreaks}</span>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((v) => (
            <motion.button
              key={v}
              onClick={() => setActiveBreaks(String(v))}
              whileTap={{ scale: 0.92 }}
              className="flex-1 py-3 rounded-xl data-mono font-black text-xs"
              style={{
                background: activeBreaks === String(v) ? "#A855F7" : "rgba(255,255,255,0.03)",
                color: activeBreaks === String(v) ? "#fff" : "rgba(250,250,250,0.4)",
                border: `1px solid ${activeBreaks === String(v) ? "#A855F7" : "rgba(255,255,255,0.06)"}`,
                transition: "all 0.18s",
              }}
            >
              {v}
            </motion.button>
          ))}
        </div>
      </div>
    </div>,

    /* Step 2 — FC */
    <div key="hr" className="space-y-6">
      <div className="text-center space-y-1">{ql(3)}{qt("FC au repos ce matin ?")}</div>
      <div
        className="rounded-[18px] p-4 space-y-3"
        style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)" }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
            className="w-2 h-2 rounded-full"
            style={{ background: "#EF4444" }}
          />
          <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(239,68,68,0.9)" }}>Fréquence cardiaque</span>
        </div>
        <input
          type="number" value={hr}
          onChange={(e) => setHr(e.target.value)}
          min={30} max={220} style={numInputStyle()} inputMode="numeric"
        />
        <p className="text-center text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(250,250,250,0.25)" }}>bpm</p>
      </div>
      <div className="flex justify-center gap-6">
        {[["< 55", "#22C55E", "Athlète"], ["55–70", "#F4D03F", "Optimal"], ["> 70", "#E67E22", "Élevé"]].map(([range, color, label]) => (
          <div key={range} className="text-center">
            <p className="data-mono text-[11px] font-bold" style={{ color }}>{range}</p>
            <p className="text-[9px] mt-0.5" style={{ color: "rgba(250,250,250,0.3)" }}>{label}</p>
          </div>
        ))}
      </div>
    </div>,

    /* Step 3 — Sommeil */
    <div key="sleep" className="space-y-6">
      <div className="text-center space-y-1">{ql(4)}{qt("Sommeil la nuit dernière ?")}</div>

      <div
        className="rounded-[18px] p-4 space-y-3"
        style={{ background: "rgba(59,130,246,0.04)", border: "1px solid rgba(59,130,246,0.1)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌙</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(59,130,246,0.9)" }}>Heures</span>
          </div>
          <span className="data-mono font-black text-xl" style={{ color: "#3B82F6" }}>{sleepHours}h</span>
        </div>
        <input type="range" min={0} max={12} step={1} value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} style={sliderStyle} />
        <div className="flex justify-between">
          {[0, 2, 4, 6, 8, 10, 12].map((v) => (
            <span key={v} className="data-mono text-[9px]" style={{ color: "rgba(250,250,250,0.2)" }}>{v}h</span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(250,250,250,0.4)" }}>Minutes</span>
        <div className="flex gap-2">
          {["0", "15", "30", "45"].map((m) => (
            <motion.button
              key={m}
              onClick={() => setSleepMinutes(m)}
              whileTap={{ scale: 0.94 }}
              className="flex-1 py-3 rounded-[16px] data-mono font-black text-sm"
              style={{
                background: sleepMinutes === m ? "var(--gold)" : "rgba(255,255,255,0.03)",
                color: sleepMinutes === m ? "#050505" : "rgba(250,250,250,0.4)",
                border: `1px solid ${sleepMinutes === m ? "var(--gold)" : "rgba(255,255,255,0.07)"}`,
                transition: "all 0.2s",
                boxShadow: sleepMinutes === m ? "0 0 12px rgba(212,175,55,0.25)" : "none",
              }}
            >
              :{m === "0" ? "00" : m}
            </motion.button>
          ))}
        </div>
      </div>

      <p
        className="text-center data-mono font-black text-3xl"
        style={{ color: "var(--gold)", textShadow: "0 0 24px rgba(212,175,55,0.4)" }}
      >
        {sleepHours}h{sleepMinutes === "0" ? "00" : sleepMinutes}
      </p>
    </div>,
  ]

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={overlayStyle} onClick={onClose} />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34, mass: 0.9 }}
            style={sheetStyle}
          >
            {/* Gold top edge */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)" }} />

            {/* Handle */}
            <div className="flex justify-center mb-5">
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(212,175,55,0.25)" }} />
            </div>

            {/* Heritage label */}
            <div className="text-center mb-1.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--gold)" }}>Heritage Elite OS · Journal santé</p>
              {date && (
                <p className="text-[10px] font-semibold mt-0.5 capitalize" style={{ color: "rgba(250,250,250,0.35)" }}>
                  {new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              )}
              {watchPrefilled && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full"
                  style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}
                >
                  <span className="text-[10px]">⌚</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#22C55E" }}>
                    Pré-rempli depuis ta montre
                  </span>
                </motion.div>
              )}
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mb-7">
              {Array.from({ length: STEPS }).map((_, i) => <Dot key={i} active={i === step} />)}
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <X size={14} style={{ color: "rgba(250,250,250,0.4)" }} />
            </button>

            {/* Step content */}
            <div style={{ minHeight: 320, position: "relative", overflow: "hidden" }}>
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  {stepContent[step]}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <motion.button
                  onClick={goBack}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center justify-center rounded-[16px]"
                  style={{ ...lgStyle(), flex: "0 0 52px", height: 52 }}
                >
                  <ChevronLeft size={18} style={{ color: "rgba(250,250,250,0.6)" }} />
                </motion.button>
              )}
              {step < STEPS - 1 ? (
                <motion.button
                  onClick={goNext}
                  whileTap={{ scale: 0.96 }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-[16px] font-black text-sm touch-feedback"
                  style={{ ...lgStyle(), height: 52, color: "rgba(250,250,250,0.9)" }}
                >
                  Suivant <ChevronRight size={16} />
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleSave}
                  disabled={saving}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-[16px] font-black text-sm"
                  style={{
                    height: 52,
                    background: saving ? "rgba(212,175,55,0.4)" : "var(--gold)",
                    color: "#050505",
                    opacity: saving ? 0.7 : 1,
                    transition: "opacity 0.2s",
                    boxShadow: saving ? "none" : "0 0 20px rgba(212,175,55,0.35)",
                  }}
                >
                  <Sparkles size={15} />
                  {saving ? "Analyse en cours…" : "Analyser avec l'IA"}
                </motion.button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
