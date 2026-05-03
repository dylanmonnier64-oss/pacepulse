"use client"
import { useState, useEffect, useCallback, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { ChevronRight, Filter, Trophy, Clock, Route, Mountain } from "lucide-react"
import { useRuns } from "@/hooks/useRuns"
import { usePadelSessions } from "@/hooks/usePadelSessions"
import { hapticFeedback, lgStyle, formatPace, formatDurationShort, secondsToRaceTime } from "@/lib/utils"
import type { Run, PadelSession } from "@/lib/types"

/* ── Types ── */
type Filter = "tout" | "runs" | "padel"
type ActivityItem =
  | { kind: "run";   data: Run }
  | { kind: "padel"; data: PadelSession }

/* ── Helpers ── */
function getItemDate(item: ActivityItem): string {
  return item.kind === "run" ? item.data.date : item.data.date
}

function groupByDate(items: ActivityItem[]): [string, ActivityItem[]][] {
  const map = new Map<string, ActivityItem[]>()
  items.forEach(item => {
    const d = getItemDate(item).split("T")[0]
    if (!map.has(d)) map.set(d, [])
    map.get(d)!.push(item)
  })
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
}

function formatGroupDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  if (dateStr === today.toISOString().split("T")[0]) return "Aujourd'hui"
  if (dateStr === yesterday.toISOString().split("T")[0]) return "Hier"
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
}

/* ── Run Card ── */
const TYPE_COLORS: Record<string, string> = {
  endurance: "#3498DB", threshold: "#E67E22", interval: "#E74C3C",
  long: "#9B59B6", recovery: "#27AE60",
}
const TYPE_LABELS: Record<string, string> = {
  endurance: "Endurance", threshold: "Seuil", interval: "Fractionné",
  long: "Sortie longue", recovery: "Récupération",
}

function RunCard({ run }: { run: Run }) {
  const color = TYPE_COLORS[run.type] || "#888"
  return (
    <Link href={`/runs/${run.id}`} onClick={hapticFeedback}>
      <motion.div whileTap={{ scale: 0.98 }}
        className="flex items-center gap-4 rounded-[20px] p-4 touch-feedback"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {/* Type dot */}
        <div className="w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <Route size={16} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full"
              style={{ background: `${color}12`, color }}>
              {TYPE_LABELS[run.type] || run.type}
            </span>
            {run.feeling >= 8 && <span className="text-[10px]">⚡</span>}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="data-mono font-black text-[18px]" style={{ color: "#FAFAFA" }}>
              {run.distance.toFixed(1)}
            </span>
            <span className="text-[10px]" style={{ color: "rgba(250,250,250,0.4)" }}>km</span>
            <span className="data-mono text-[12px]" style={{ color: "rgba(250,250,250,0.5)" }}>·</span>
            <span className="data-mono text-[12px]" style={{ color: "rgba(250,250,250,0.55)" }}>
              {formatPace(run.pace)}/km
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Clock size={9} style={{ color: "rgba(250,250,250,0.28)" }} />
            <span className="text-[10px]" style={{ color: "rgba(250,250,250,0.35)" }}>
              {formatDurationShort(run.duration)}
            </span>
            {run.elevation > 0 && (
              <>
                <Mountain size={9} style={{ color: "rgba(250,250,250,0.28)" }} />
                <span className="text-[10px]" style={{ color: "rgba(250,250,250,0.35)" }}>
                  {run.elevation}m D+
                </span>
              </>
            )}
          </div>
        </div>
        <ChevronRight size={14} style={{ color: "rgba(250,250,250,0.2)" }} />
      </motion.div>
    </Link>
  )
}

/* ── Padel Card ── */
function PadelCard({ session }: { session: PadelSession }) {
  const isWin = session.result === "victoire"
  const color = isWin ? "#22C55E" : "#EF4444"
  return (
    <motion.div whileTap={{ scale: 0.98 }}
      className="flex items-center gap-4 rounded-[20px] p-4"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      {/* Icon */}
      <div className="w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
        <span style={{ fontSize: 18 }}>🎾</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full"
            style={{ background: `${color}12`, color }}>
            {isWin ? "Victoire" : "Défaite"}
          </span>
          {isWin && <Trophy size={10} style={{ color: "#F4D03F" }} />}
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="data-mono font-black text-[18px]" style={{ color: "#FAFAFA" }}>
            {session.rating}
          </span>
          <span className="text-[10px]" style={{ color: "rgba(250,250,250,0.4)" }}>/10</span>
          <span className="data-mono text-[12px]" style={{ color: "rgba(250,250,250,0.5)" }}>·</span>
          <span className="data-mono text-[12px]" style={{ color: "rgba(250,250,250,0.55)" }}>
            {session.duration} min
          </span>
        </div>
        {session.comment && (
          <p className="text-[10px] mt-0.5 truncate" style={{ color: "rgba(250,250,250,0.35)" }}>
            {session.comment}
          </p>
        )}
      </div>
    </motion.div>
  )
}

/* ── Stats Banner ── */
function StatsBanner({ runs, sessions }: { runs: Run[]; sessions: PadelSession[] }) {
  const now = new Date()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay() + 1); weekStart.setHours(0,0,0,0)
  const weekRuns = runs.filter(r => new Date(r.date) >= weekStart)
  const weekKm = weekRuns.reduce((s, r) => s + r.distance, 0)
  const weekPadel = sessions.filter(s => new Date(s.date) >= weekStart)
  const padelWins = sessions.filter(s => s.result === "victoire").length
  const padelRate = sessions.length ? Math.round((padelWins / sessions.length) * 100) : 0

  return (
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: "Km cette sem.", value: weekKm.toFixed(1), unit: "km", color: "#3498DB" },
        { label: "Runs totaux", value: String(runs.length), unit: "", color: "#F4D03F" },
        { label: "% victoires padel", value: String(padelRate), unit: "%", color: "#22C55E" },
      ].map(({ label, value, unit, color }) => (
        <div key={label} className="rounded-[16px] p-3 text-center"
          style={{ background: `${color}08`, border: `1px solid ${color}15` }}>
          <div className="flex items-baseline justify-center gap-0.5">
            <span className="data-mono font-black text-[18px]" style={{ color }}>{value}</span>
            {unit && <span className="text-[9px]" style={{ color: `${color}80` }}>{unit}</span>}
          </div>
          <p className="text-[8px] uppercase tracking-[0.12em] mt-0.5" style={{ color: "rgba(250,250,250,0.32)" }}>{label}</p>
        </div>
      ))}
    </div>
  )
}

/* ── New Padel Modal (triggered by ?new=padel) ── */
function NewPadelModal({ onClose, onSave }: { onClose: () => void; onSave: (data: Omit<PadelSession, "id" | "user_profile" | "created_at">) => void }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    duration: "60",
    result: "victoire" as "victoire" | "défaite",
    rating: "7",
    comment: "",
    partner: "",
  })

  function submit() {
    onSave({
      date: form.date,
      duration: Number(form.duration),
      result: form.result,
      rating: Number(form.rating),
      comment: form.comment,
      partner: form.partner || undefined,
      source: "manual",
    })
    onClose()
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)" }} onClick={onClose} />
      <motion.div className="relative w-full rounded-t-[32px] overflow-hidden"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex justify-center pt-3"><div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} /></div>
        <div className="px-5 pt-2 pb-10 space-y-4">
          <h2 className="text-[18px] font-black" style={{ color: "#FAFAFA" }}>Nouveau match <span style={{ color: "#A855F7" }}>🎾</span></h2>
          {[
            { label: "Date", type: "date", key: "date" },
            { label: "Durée (min)", type: "number", key: "duration" },
            { label: "Note /10", type: "number", key: "rating" },
            { label: "Partenaire", type: "text", key: "partner" },
            { label: "Commentaire", type: "text", key: "comment" },
          ].map(({ label, type, key }) => (
            <div key={key}>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5" style={{ color: "rgba(250,250,250,0.4)" }}>{label}</p>
              <input type={type} value={form[key as keyof typeof form] as string}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-transparent rounded-[14px] px-4 py-3 text-sm"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FAFAFA" }} />
            </div>
          ))}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5" style={{ color: "rgba(250,250,250,0.4)" }}>Résultat</p>
            <div className="grid grid-cols-2 gap-2">
              {(["victoire", "défaite"] as const).map(r => (
                <motion.button key={r} whileTap={{ scale: 0.95 }} onClick={() => setForm(f => ({ ...f, result: r }))}
                  className="py-3 rounded-[14px] font-bold text-sm capitalize touch-feedback"
                  style={{
                    background: form.result === r ? (r === "victoire" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)") : "rgba(255,255,255,0.04)",
                    border: `1px solid ${form.result === r ? (r === "victoire" ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)") : "rgba(255,255,255,0.08)"}`,
                    color: form.result === r ? (r === "victoire" ? "#22C55E" : "#EF4444") : "rgba(250,250,250,0.45)",
                  }}>
                  {r === "victoire" ? "🏆 Victoire" : "💪 Défaite"}
                </motion.button>
              ))}
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => { hapticFeedback(); submit() }}
            className="w-full py-3.5 rounded-[18px] font-bold text-sm touch-feedback"
            style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", color: "#A855F7" }}>
            Enregistrer
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════ */
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const fadeUp  = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] } } }

function ActivitesContent() {
  const { runs, loading: runsLoading } = useRuns()
  const { sessions, loading: padelLoading, addSession } = usePadelSessions()
  const [activeFilter, setActiveFilter] = useState<Filter>("tout")
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showNewPadel, setShowNewPadel] = useState(false)

  useEffect(() => {
    if (searchParams.get("new") === "padel") {
      setShowNewPadel(true)
    }
  }, [searchParams])

  const handleClosePadel = useCallback(() => {
    setShowNewPadel(false)
    router.replace("/activites")
  }, [router])

  const loading = runsLoading || padelLoading

  const allItems: ActivityItem[] = [
    ...(activeFilter !== "padel" ? runs.map(r => ({ kind: "run" as const, data: r })) : []),
    ...(activeFilter !== "runs" ? sessions.map(s => ({ kind: "padel" as const, data: s })) : []),
  ].sort((a, b) => getItemDate(b).localeCompare(getItemDate(a)))

  const grouped = groupByDate(allItems)

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl h-20" style={{ background: "rgba(255,255,255,0.04)" }} />
        ))}
      </div>
    )
  }

  return (
    <>
      <motion.div className="flex flex-col gap-4" variants={stagger} initial="hidden" animate="show">
        {/* Header */}
        <motion.div variants={fadeUp}>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(250,250,250,0.38)" }}>Calendrier unifié</p>
          <h1 className="text-[26px] font-black tracking-tight" style={{ color: "#FAFAFA" }}>
            Activités<span style={{ color: "#F4D03F" }}>.</span>
          </h1>
        </motion.div>

        {/* Stats Banner */}
        <motion.div variants={fadeUp}>
          <StatsBanner runs={runs} sessions={sessions} />
        </motion.div>

        {/* Filter tabs */}
        <motion.div variants={fadeUp} className="flex gap-2">
          {([
            { id: "tout",  label: "Tout",    emoji: "⚡" },
            { id: "runs",  label: "Runs",    emoji: "🏃" },
            { id: "padel", label: "Padel",   emoji: "🎾" },
          ] as { id: Filter; label: string; emoji: string }[]).map(f => (
            <motion.button key={f.id} whileTap={{ scale: 0.93 }}
              onClick={() => { hapticFeedback(); setActiveFilter(f.id) }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[14px] text-[11px] font-black uppercase tracking-[0.12em] touch-feedback"
              style={{
                background: activeFilter === f.id ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${activeFilter === f.id ? "rgba(212,175,55,0.28)" : "rgba(255,255,255,0.07)"}`,
                color: activeFilter === f.id ? "var(--gold)" : "rgba(250,250,250,0.38)",
                transition: "all 0.15s",
              }}>
              <span>{f.emoji}</span>{f.label}
            </motion.button>
          ))}
          <motion.button whileTap={{ scale: 0.93 }} onClick={() => hapticFeedback()}
            className="w-10 flex items-center justify-center rounded-[14px] touch-feedback"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <Filter size={14} style={{ color: "rgba(250,250,250,0.35)" }} />
          </motion.button>
        </motion.div>

        {/* Activity list */}
        {grouped.length === 0 ? (
          <motion.div variants={fadeUp}
            className="flex flex-col items-center gap-3 py-16 rounded-[24px]"
            style={{ background: "rgba(255,255,255,0.02)", border: "2px dashed rgba(255,255,255,0.07)" }}>
            <span className="text-4xl">📋</span>
            <p className="font-black" style={{ color: "#FAFAFA" }}>Aucune activité</p>
            <p className="text-[12px]" style={{ color: "rgba(250,250,250,0.35)" }}>
              Utilise le bouton <span style={{ color: "var(--gold)" }}>+</span> pour enregistrer
            </p>
          </motion.div>
        ) : (
          grouped.map(([date, items]) => (
            <motion.div key={date} variants={fadeUp} className="flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] px-1 capitalize"
                style={{ color: "rgba(250,250,250,0.32)" }}>
                {formatGroupDate(date)}
              </p>
              {items.map(item => (
                item.kind === "run"
                  ? <RunCard key={item.data.id} run={item.data} />
                  : <PadelCard key={item.data.id} session={item.data} />
              ))}
            </motion.div>
          ))
        )}

        <div className="h-6" />
      </motion.div>

      {/* New Padel Modal */}
      <AnimatePresence>
        {showNewPadel && (
          <NewPadelModal
            onClose={handleClosePadel}
            onSave={data => { addSession(data); handleClosePadel() }}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default function ActivitesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl h-20" style={{ background: "rgba(255,255,255,0.04)" }} />
        ))}
      </div>
    }>
      <ActivitesContent />
    </Suspense>
  )
}
