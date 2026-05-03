"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Plus, ChevronRight, ChevronDown } from "lucide-react"
import { useRuns } from "@/hooks/useRuns"
import HeroCard from "@/components/dashboard/HeroCard"
import StatsGrid from "@/components/dashboard/StatsGrid"
import WeeklyChart from "@/components/dashboard/WeeklyChart"
import WeeklyRecap from "@/components/dashboard/WeeklyRecap"
import VitalityScore from "@/components/dashboard/VitalityScore"
import HydrationWidget from "@/components/dashboard/HydrationWidget"
import { WeeklyCoachCard } from "@/components/coach/WeeklyCoachCard"
import { RecoveryDashboard } from "@/components/coach/RecoveryDashboard"
import SyncWidget from "@/components/health/SyncWidget"
import LogoPP from "@/components/ui/LogoPP"
import { hapticFeedback, lgStyle } from "@/lib/utils"

function Skeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {[220, 160, 200, 140, 120].map((h, i) => (
        <div key={i} className="rounded-3xl" style={{ height: h, background: "rgba(255,255,255,0.04)" }} />
      ))}
    </div>
  )
}

function SectionLabel({ children, gold }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-1">
      {gold && (
        <div
          className="w-1 h-3 rounded-full"
          style={{ background: "linear-gradient(180deg, var(--gold), var(--gold-dark))", boxShadow: "0 0 6px var(--gold-glow)" }}
        />
      )}
      <p
        className="text-[9px] font-bold uppercase tracking-[0.18em]"
        style={{ color: gold ? "var(--gold)" : "rgba(250,250,250,0.32)" }}
      >
        {children}
      </p>
    </div>
  )
}

function QuickLink({
  href, emoji, title, sub, bg, border,
}: {
  href: string; emoji: string; title: string; sub: string; bg: string; border: string
}) {
  return (
    <Link href={href} className="touch-feedback" onClick={hapticFeedback}>
      <motion.div
        className="relative overflow-hidden rounded-[22px] p-4 flex flex-col gap-2 h-full"
        style={{ background: bg, border: `1px solid ${border}` }}
        whileHover={{ y: -3, boxShadow: "0 12px 32px rgba(244,208,63,0.12)" }}
        transition={{ duration: 0.22 }}
      >
        <div
          className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)", filter: "blur(10px)" }}
        />
        <span className="text-[26px] relative z-10">{emoji}</span>
        <p className="text-sm font-black relative z-10" style={{ color: "#FAFAFA" }}>{title}</p>
        <p className="text-[11px] relative z-10" style={{ color: "rgba(250,250,250,0.38)" }}>{sub}</p>
      </motion.div>
    </Link>
  )
}

export default function DashboardPage() {
  const { runs, loading } = useRuns()
  const [expanded, setExpanded] = useState(false)
  const lastRun = runs[0]

  if (loading) return <Skeleton />

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
            <p
              className="text-[8px] font-bold uppercase tracking-[0.22em]"
              style={{ color: "var(--gold)", letterSpacing: "0.22em" }}
            >
              Heritage Elite OS
            </p>
            <h1 className="text-[20px] font-black tracking-tight leading-none" style={{ color: "#FAFAFA" }}>
              PacePulse<span style={{ color: "var(--gold)" }}>.</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sync indicator */}
          <SyncWidget />

          {/* + Run */}
          <Link
            href="/runs/new"
            onClick={hapticFeedback}
            aria-label="Ajouter une nouvelle sortie"
            className="touch-feedback flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-black text-sm no-select"
            style={{
              ...lgStyle("rgba(212,175,55,0.08)"),
              color: "var(--gold)",
              border: "1px solid rgba(212,175,55,0.3)",
              minHeight: 40,
            }}
          >
            <Plus size={14} strokeWidth={2.5} aria-hidden />
            Run
          </Link>
        </div>
      </div>

      {/* ── Heritage divider ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(212,175,55,0.25), transparent)" }} />
        <span className="text-[8px] font-bold uppercase tracking-[0.25em]" style={{ color: "rgba(212,175,55,0.4)" }}>
          Elite
        </span>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(270deg, rgba(212,175,55,0.25), transparent)" }} />
      </div>

      {/* ── Vitality Ring Hero ── */}
      <VitalityScore runs={runs} />

      {/* ── Weekly sparkline ── */}
      <SectionLabel>Semaine en cours</SectionLabel>
      <WeeklyRecap runs={runs} />

      {/* ── Coach IA ── */}
      <SectionLabel gold>Coach Intelligence</SectionLabel>
      <WeeklyCoachCard />

      {/* ── Hero last run ── */}
      {lastRun ? (
        <>
          <SectionLabel>Dernière sortie</SectionLabel>
          <Link href={`/runs/${lastRun.id}`} onClick={hapticFeedback}>
            <HeroCard run={lastRun} />
          </Link>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-8 flex flex-col items-center justify-center gap-3 text-center"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "2px dashed rgba(255,255,255,0.08)",
          }}
        >
          <span className="text-4xl">🏃</span>
          <p className="font-black" style={{ color: "#FAFAFA" }}>Aucune sortie enregistrée</p>
          <p className="text-sm" style={{ color: "rgba(250,250,250,0.38)" }}>
            Ajoutez votre premier run pour commencer
          </p>
          <Link
            href="/runs/new"
            className="mt-2 px-5 py-2.5 rounded-2xl font-bold text-sm touch-feedback"
            style={{ ...lgStyle("rgba(212,175,55,0.08)"), color: "var(--gold)", border: "1px solid rgba(212,175,55,0.25)" }}
          >
            + Ajouter un run
          </Link>
        </motion.div>
      )}

      {/* ── Quick links 2×2 ── */}
      <SectionLabel>Explorer</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <QuickLink
          href="/stats"
          emoji="📊"
          title="Forme & Fatigue"
          sub="CTL · ATL · TSB"
          bg="rgba(168,85,247,0.07)"
          border="rgba(168,85,247,0.18)"
        />
        <QuickLink
          href="/goals"
          emoji="🎯"
          title="Objectifs"
          sub="Semaine · Mois · Année"
          bg="rgba(212,175,55,0.06)"
          border="rgba(212,175,55,0.16)"
        />
      </div>

      {/* ── View all runs ── */}
      {runs.length > 0 && (
        <Link href="/runs" onClick={hapticFeedback}>
          <motion.div
            className="flex items-center justify-between rounded-[22px] px-4 py-3.5 touch-feedback"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-sm font-bold" style={{ color: "#FAFAFA" }}>Toutes les sorties</span>
            <div className="flex items-center gap-1.5">
              <span
                className="data-mono text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(212,175,55,0.1)", color: "var(--gold)" }}
              >
                {runs.length}
              </span>
              <ChevronRight size={15} style={{ color: "rgba(250,250,250,0.3)" }} />
            </div>
          </motion.div>
        </Link>
      )}

      {/* ── Voir plus / Données détaillées ── */}
      <motion.button
        type="button"
        onClick={() => { hapticFeedback(); setExpanded((v) => !v) }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl touch-feedback"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
        whileHover={{ background: "rgba(255,255,255,0.055)" }}
        transition={{ duration: 0.18 }}
        aria-expanded={expanded}
        aria-controls="dashboard-details"
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(250,250,250,0.38)" }}>
          {expanded ? "Réduire" : "Métriques détaillées"}
        </span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={14} style={{ color: "rgba(250,250,250,0.3)" }} aria-hidden />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            id="dashboard-details"
            key="details"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden flex flex-col gap-5"
          >
            {/* Stats grid */}
            <div className="flex flex-col gap-4">
              <SectionLabel>Métriques semaine</SectionLabel>
              <StatsGrid runs={runs} />
            </div>

            {/* Hydration */}
            <HydrationWidget runs={runs} />

            {/* Récupération */}
            <div className="flex flex-col gap-4">
              <SectionLabel gold>Récupération</SectionLabel>
              <RecoveryDashboard />
            </div>

            {/* Weekly chart */}
            <WeeklyChart runs={runs} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Heritage footer ── */}
      <div className="flex items-center justify-center gap-2 py-2">
        <div className="h-px flex-1" style={{ background: "rgba(212,175,55,0.08)" }} />
        <span className="text-[8px] uppercase tracking-[0.3em]" style={{ color: "rgba(212,175,55,0.2)" }}>
          PacePulse Heritage Elite OS
        </span>
        <div className="h-px flex-1" style={{ background: "rgba(212,175,55,0.08)" }} />
      </div>
    </motion.div>
  )
}
