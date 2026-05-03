"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Bell, BellOff, BookOpen, Heart, Footprints, Moon, Zap, Flame, Timer } from "lucide-react"
import { useHealthLogs } from "@/hooks/useHealthLogs"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import FatigueRing from "@/components/health/FatigueRing"
import AIInsightCard from "@/components/health/AIInsightCard"
import HealthMetricCard from "@/components/health/HealthMetricCard"
import TrendChart from "@/components/health/TrendChart"
import DailyQuestionnaire from "@/components/health/DailyQuestionnaire"
import LogoPP from "@/components/ui/LogoPP"
import { hapticFeedback, lgStyle } from "@/lib/utils"
import type { HealthFormState } from "@/lib/types"

function SectionLabel({ children, gold }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-1">
      {gold && (
        <div
          className="w-1 h-3 rounded-full"
          style={{ background: "linear-gradient(180deg, var(--gold), var(--gold-dark))", boxShadow: "0 0 6px var(--gold-glow)" }}
        />
      )}
      <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: gold ? "var(--gold)" : "rgba(250,250,250,0.32)" }}>
        {children}
      </p>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      {[200, 160, 100, 140].map((h, i) => (
        <div key={i} className="rounded-3xl" style={{ height: h, background: "rgba(255,255,255,0.04)" }} />
      ))}
    </div>
  )
}

function formatSleep(hours?: number, minutes?: number): string {
  if (hours == null) return "—"
  const m = minutes ?? 0
  return `${hours}h${m === 0 ? "00" : String(m)}`
}

export default function HealthPage() {
  const { logs, todayLog, loading, saveLog, updateAnalysis } = useHealthLogs()
  const { status: pushStatus, requestPermission } = usePushNotifications()
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    if (!loading && !todayLog) {
      const t = setTimeout(() => setShowQuestionnaire(true), 900)
      return () => clearTimeout(t)
    }
  }, [loading, todayLog])

  async function handleSave(data: HealthFormState) {
    setAnalyzing(true)
    try {
      const today = new Date().toISOString().split("T")[0]
      const logEntry = {
        date: today,
        steps: Number(data.steps),
        calories: Number(data.calories),
        active_minutes: Number(data.active_minutes),
        active_breaks: Number(data.active_breaks),
        heart_rate_avg: Number(data.heart_rate_avg),
        sleep_hours: Number(data.sleep_hours),
        sleep_minutes: Number(data.sleep_minutes),
        sport_type: data.sport_type ?? null,
      }
      await saveLog(logEntry)
      try {
        const allLogs = [{ ...logEntry, user_profile: "dydz" }, ...logs.filter((l) => l.date !== today)]
        const res = await fetch("/api/ai/analyse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ healthLogs: allLogs, runs: [], profile: "dydz" }),
        })
        if (res.ok) {
          const analysis = await res.json()
          await updateAnalysis(today, analysis)
        }
      } catch { /* best-effort */ }
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) return <Skeleton />

  const vitalityScore = todayLog?.ai_analysis?.vitality_score ?? 50
  const fatigueScore  = todayLog?.ai_analysis?.fatigue_score ?? 5
  const readiness     = todayLog?.ai_analysis?.readiness ?? "normal"

  return (
    <motion.div
      className="flex flex-col gap-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoPP size={30} />
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--gold)" }}>
              Heritage Elite OS
            </p>
            <h1 className="text-[20px] font-black tracking-tight leading-none" style={{ color: "#FAFAFA" }}>
              Hub Santé<span style={{ color: "var(--gold)" }}>.</span>
            </h1>
          </div>
        </div>

        {/* Push bell */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={pushStatus !== "granted" ? requestPermission : undefined}
          className="w-10 h-10 flex items-center justify-center rounded-2xl touch-feedback"
          style={
            pushStatus === "granted"
              ? { ...lgStyle("rgba(34,197,94,0.08)"), border: "1px solid rgba(34,197,94,0.2)" }
              : lgStyle()
          }
        >
          {pushStatus === "granted"
            ? <Bell size={17} style={{ color: "#22C55E" }} />
            : <BellOff size={17} style={{ color: "rgba(250,250,250,0.4)" }} />
          }
        </motion.button>
      </div>

      {/* ── Heritage divider ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(212,175,55,0.25), transparent)" }} />
        <span className="text-[8px] font-bold uppercase tracking-[0.25em]" style={{ color: "rgba(212,175,55,0.4)" }}>Santé</span>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(270deg, rgba(212,175,55,0.25), transparent)" }} />
      </div>

      {/* ── Date ── */}
      <p className="text-[11px] font-semibold px-1" style={{ color: "rgba(250,250,250,0.32)" }}>
        {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
      </p>

      {/* ── Vitality Ring ── */}
      <SectionLabel gold>Indice de vitalité</SectionLabel>
      <FatigueRing vitalityScore={vitalityScore} fatigueScore={fatigueScore} readiness={readiness} size={160} />

      {/* ── Journal button ── */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { hapticFeedback(); setShowQuestionnaire(true) }}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[22px] font-bold text-sm touch-feedback"
        style={{
          ...lgStyle("rgba(212,175,55,0.06)"),
          border: "1px solid rgba(212,175,55,0.2)",
          color: "var(--gold)",
        }}
        whileHover={{ boxShadow: "0 0 20px rgba(212,175,55,0.12)" }}
      >
        <BookOpen size={15} />
        {todayLog ? "Modifier mon journal" : "Remplir mon journal du jour"}
      </motion.button>

      {/* ── AI Insight ── */}
      <SectionLabel gold>Analyse Intelligence</SectionLabel>
      <AIInsightCard analysis={todayLog?.ai_analysis ?? null} loading={analyzing} />

      {/* ── Metrics grid ── */}
      <SectionLabel>Métriques du jour</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <HealthMetricCard
          icon={<Footprints size={16} />}
          label="Pas"
          value={todayLog?.steps != null ? todayLog.steps.toLocaleString("fr-FR") : "—"}
          color="#F4D03F"
          delay={0.06}
        />
        <HealthMetricCard
          icon={<Flame size={16} />}
          label="Calories"
          value={todayLog?.calories != null ? todayLog.calories.toLocaleString("fr-FR") : "—"}
          unit={todayLog?.calories ? "kcal" : undefined}
          color="#FF6B1A"
          delay={0.10}
        />
        <HealthMetricCard
          icon={<Timer size={16} />}
          label="Mouvement"
          value={todayLog?.active_minutes ?? "—"}
          unit={todayLog?.active_minutes ? "min" : undefined}
          color="#22C55E"
          delay={0.14}
        />
        <HealthMetricCard
          icon={<Zap size={16} />}
          label="Pauses act."
          value={todayLog?.active_breaks ?? "—"}
          color="#A855F7"
          delay={0.18}
        />
        <HealthMetricCard
          icon={<Heart size={16} />}
          label="FC repos"
          value={todayLog?.heart_rate_avg ?? "—"}
          unit={todayLog?.heart_rate_avg ? "bpm" : undefined}
          color="#EF4444"
          delay={0.22}
        />
        <HealthMetricCard
          icon={<Moon size={16} />}
          label="Sommeil"
          value={formatSleep(todayLog?.sleep_hours, todayLog?.sleep_minutes)}
          color="#3B82F6"
          delay={0.26}
        />
      </div>

      {/* ── Trend chart ── */}
      <SectionLabel>Tendances 7 jours</SectionLabel>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="relative overflow-hidden rounded-[22px] p-4 space-y-3"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Legend */}
        <div className="flex items-center gap-4">
          {[{ label: "FC", color: "#EF4444" }, { label: "Sommeil ×10", color: "#3B82F6" }].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-[9px] font-medium" style={{ color: "rgba(250,250,250,0.4)" }}>{label}</span>
            </div>
          ))}
        </div>
        <TrendChart logs={logs.slice(0, 7)} />
      </motion.div>

      {/* ── Push notification promo ── */}
      {pushStatus !== "granted" && pushStatus !== "loading" && pushStatus !== "unsupported" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="relative overflow-hidden rounded-[22px] p-4 flex items-center justify-between gap-3"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            className="absolute -right-4 -top-4 w-20 h-20 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)", filter: "blur(12px)" }}
          />
          <div className="flex items-center gap-3 relative z-10">
            <div
              className="w-9 h-9 flex items-center justify-center rounded-2xl flex-shrink-0"
              style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}
            >
              <Bell size={16} style={{ color: "var(--gold)" }} />
            </div>
            <div>
              <p className="text-sm font-black" style={{ color: "#FAFAFA" }}>Rappels du soir</p>
              <p className="text-[11px]" style={{ color: "rgba(250,250,250,0.38)" }}>Notification à 22h pour ton journal</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={requestPermission}
            className="relative z-10 px-4 py-2 rounded-[14px] text-xs font-black flex-shrink-0 touch-feedback"
            style={{ background: "var(--gold)", color: "#050505", boxShadow: "0 0 16px rgba(212,175,55,0.3)" }}
          >
            Activer
          </motion.button>
        </motion.div>
      )}

      {/* ── Heritage footer ── */}
      <div className="flex items-center justify-center gap-2 py-2">
        <div className="h-px flex-1" style={{ background: "rgba(212,175,55,0.08)" }} />
        <span className="text-[8px] uppercase tracking-[0.3em]" style={{ color: "rgba(212,175,55,0.2)" }}>
          PacePulse Heritage Elite OS
        </span>
        <div className="h-px flex-1" style={{ background: "rgba(212,175,55,0.08)" }} />
      </div>

      <DailyQuestionnaire
        open={showQuestionnaire}
        onClose={() => setShowQuestionnaire(false)}
        onSave={handleSave}
        existingData={todayLog}
      />
    </motion.div>
  )
}
