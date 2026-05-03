"use client"
import { useState, useEffect, useCallback, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSearchParams, useRouter } from "next/navigation"
import { Clock, ChevronRight, Pencil, Trophy, Trash2, Filter, Search } from "lucide-react"
import { useRuns } from "@/hooks/useRuns"
import { usePadelSessions } from "@/hooks/usePadelSessions"
import RunCard from "@/components/runs/RunCard"
import { hapticFeedback, formatDurationShort } from "@/lib/utils"
import { formatDateShort } from "@/lib/utils"
import type { Run, PadelSession } from "@/lib/types"

/* ── Types ── */
type ActiveFilter = "tout" | "runs" | "padel"
type ActivityItem =
  | { kind: "run";   data: Run }
  | { kind: "padel"; data: PadelSession }

/* ── Helpers ── */
function getItemDate(item: ActivityItem): string {
  return item.data.date
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

/* ── Padel Card (style identique à RunCard) ── */
function PadelCard({ session, onEdit, index = 0 }: { session: PadelSession; onEdit: (s: PadelSession) => void; index?: number }) {
  const isWin = session.result === "victoire"
  const color = isWin ? "#22C55E" : "#EF4444"

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.045, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, boxShadow: `0 14px 40px rgba(0,0,0,0.4), 0 0 0 1px ${color}28` }}
    >
      <div
        className="relative rounded-[22px] overflow-hidden touch-feedback"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={() => { hapticFeedback(); onEdit(session) }}
      >
        {/* Left gradient accent */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{ background: `linear-gradient(180deg, ${color}, ${color}44)`, borderRadius: "3px 0 0 3px" }} />
        {/* Left color wash */}
        <div className="absolute left-0 top-0 bottom-0 w-24 pointer-events-none"
          style={{ background: `linear-gradient(90deg, ${color}10 0%, transparent 100%)` }} />

        <div className="pl-3 pr-4 py-4">
          {/* Top row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: `${color}18`, color, border: `1px solid ${color}38` }}>
                  {isWin ? "Victoire" : "Défaite"}
                </span>
                {session.partner && (
                  <span className="text-[10px]" style={{ color: "rgba(250,250,250,0.4)" }}>
                    👥 {session.partner}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium" style={{ color: "rgba(250,250,250,0.38)" }}>
                {formatDateShort(session.date)}
              </p>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); hapticFeedback(); onEdit(session) }}
                className="w-7 h-7 rounded-xl flex items-center justify-center touch-feedback"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Pencil size={12} style={{ color: "rgba(250,250,250,0.45)" }} />
              </button>
              <ChevronRight size={16} style={{ color: "rgba(250,250,250,0.25)" }} />
            </div>
          </div>

          {/* Main stats row */}
          <div className="flex items-end gap-5">
            {/* Rating — prominent */}
            <div>
              <span className="data-mono text-[28px] font-black tracking-tight leading-none" style={{ color: "#FAFAFA" }}>
                {session.rating}
              </span>
              <span className="text-[11px] font-semibold ml-1" style={{ color: "rgba(250,250,250,0.38)" }}>
                /10
              </span>
            </div>

            {/* Secondary stats */}
            <div className="flex items-center gap-3.5 pb-0.5 flex-1 flex-wrap">
              <div className="flex items-center gap-1">
                <Clock size={11} style={{ color: "rgba(250,250,250,0.38)" }} />
                <span className="data-mono text-[13px] font-bold" style={{ color: "rgba(250,250,250,0.8)" }}>
                  {session.duration} min
                </span>
              </div>
              {isWin && (
                <div className="flex items-center gap-1">
                  <Trophy size={11} style={{ color: "#F4D03F" }} />
                  <span className="data-mono text-[13px] font-bold" style={{ color: "#F4D03F" }}>
                    Win
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Feeling / Rating bar */}
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1 rounded-full overflow-hidden flex-1"
              style={{ background: "rgba(255,255,255,0.07)" }}>
              <div className="h-full rounded-full"
                style={{
                  width: `${(session.rating / 10) * 100}%`,
                  background: `linear-gradient(90deg, ${color}88, ${color})`,
                  transition: "width 0.6s ease",
                }} />
            </div>
            <span className="text-[9px] font-semibold" style={{ color: "rgba(250,250,250,0.3)" }}>
              {session.rating}/10
            </span>
          </div>

          {session.comment && (
            <p className="text-[10px] mt-2 truncate" style={{ color: "rgba(250,250,250,0.35)" }}>
              {session.comment}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ── Padel Modal (Create/Edit) ── */
function PadelModal({ onClose, editingSession, onSave, onDelete }: {
  onClose: () => void
  editingSession?: PadelSession
  onSave: (data: Omit<PadelSession, "id" | "user_profile" | "created_at">) => void
  onDelete?: (id: string) => void
}) {
  const isEditing = !!editingSession
  const [form, setForm] = useState({
    date: editingSession?.date ?? new Date().toISOString().split("T")[0],
    duration: String(editingSession?.duration ?? 60),
    result: (editingSession?.result ?? "victoire") as "victoire" | "défaite",
    rating: String(editingSession?.rating ?? 7),
    comment: editingSession?.comment ?? "",
    partner: editingSession?.partner ?? "",
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
    <motion.div className="fixed inset-0 z-50 flex items-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)" }}
        onClick={onClose} />
      <motion.div className="relative w-full rounded-t-[32px] overflow-hidden"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>
        <div className="px-5 pt-2 pb-10 space-y-4">
          <h2 className="text-[18px] font-black" style={{ color: "#FAFAFA" }}>
            {isEditing ? "Modifier le match" : "Nouveau match"} <span style={{ color: "#A855F7" }}>🎾</span>
          </h2>
          {([
            { label: "Date", type: "date", key: "date" },
            { label: "Durée (min)", type: "number", key: "duration" },
            { label: "Note /10", type: "number", key: "rating" },
            { label: "Partenaire", type: "text", key: "partner" },
            { label: "Commentaire", type: "text", key: "comment" },
          ] as { label: string; type: string; key: string }[]).map(({ label, type, key }) => (
            <div key={key}>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5"
                style={{ color: "rgba(250,250,250,0.4)" }}>{label}</p>
              <input type={type} value={form[key as keyof typeof form] as string}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-transparent rounded-[14px] px-4 py-3 text-sm"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FAFAFA" }} />
            </div>
          ))}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5"
              style={{ color: "rgba(250,250,250,0.4)" }}>Résultat</p>
            <div className="grid grid-cols-2 gap-2">
              {(["victoire", "défaite"] as const).map(r => (
                <motion.button key={r} whileTap={{ scale: 0.95 }}
                  onClick={() => setForm(f => ({ ...f, result: r }))}
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
          {isEditing && onDelete && (
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => { hapticFeedback(); onDelete(editingSession!.id); onClose() }}
              className="w-full py-3 rounded-[16px] font-bold text-sm flex items-center justify-center gap-2 touch-feedback"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444" }}>
              <Trash2 size={14} />
              Supprimer
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => { hapticFeedback(); submit() }}
            className="w-full py-3.5 rounded-[18px] font-bold text-sm touch-feedback"
            style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", color: "#A855F7" }}>
            {isEditing ? "Modifier" : "Enregistrer"}
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
  const { sessions, loading: padelLoading, addSession, updateSession, removeSession } = usePadelSessions()
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("tout")
  const [search, setSearch] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showPadelModal, setShowPadelModal] = useState(false)
  const [editingSession, setEditingSession] = useState<PadelSession | undefined>()

  useEffect(() => {
    if (searchParams.get("new") === "padel") setShowPadelModal(true)
  }, [searchParams])

  const handleClose = useCallback(() => {
    setShowPadelModal(false)
    setEditingSession(undefined)
    router.replace("/activites")
  }, [router])

  const handleEditSession = useCallback((session: PadelSession) => {
    setEditingSession(session)
    setShowPadelModal(true)
  }, [])

  const handleSave = useCallback((data: Omit<PadelSession, "id" | "user_profile" | "created_at">) => {
    if (editingSession) updateSession({ ...editingSession, ...data })
    else addSession(data)
    handleClose()
  }, [editingSession, updateSession, addSession, handleClose])

  const loading = runsLoading || padelLoading

  // Stats
  const totalKm = runs.reduce((s, r) => s + r.distance, 0)
  const totalElev = runs.reduce((s, r) => s + r.elevation, 0)
  const totalActivities = runs.length + sessions.length

  // Build combined list
  const allItems: ActivityItem[] = [
    ...(activeFilter !== "padel" ? runs.map(r => ({ kind: "run" as const, data: r })) : []),
    ...(activeFilter !== "runs" ? sessions.map(s => ({ kind: "padel" as const, data: s })) : []),
  ].filter(item => {
    if (!search) return true
    if (item.kind === "run") return item.data.distance.toString().includes(search) || (item.data.notes ?? "").toLowerCase().includes(search.toLowerCase())
    return item.data.comment?.toLowerCase().includes(search.toLowerCase()) || item.data.partner?.toLowerCase().includes(search.toLowerCase())
  }).sort((a, b) => getItemDate(b).localeCompare(getItemDate(a)))

  const grouped = groupByDate(allItems)

  return (
    <>
      <motion.div className="flex flex-col gap-4" variants={stagger} initial="hidden" animate="show">

        {/* ── Header ── */}
        <motion.div variants={fadeUp}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "rgba(250,250,250,0.38)" }}>Journal</p>
          <h1 className="text-[26px] font-black tracking-tight" style={{ color: "#FAFAFA" }}>
            Activités<span style={{ color: "#F4D03F" }}>.</span>
          </h1>
        </motion.div>

        {/* ── Search ── */}
        <motion.div variants={fadeUp}
          className="flex items-center gap-3 px-4 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.05)", height: 48, border: "1px solid rgba(255,255,255,0.10)" }}>
          <Search size={16} style={{ color: "rgba(250,250,250,0.38)" }} />
          <input
            type="search" placeholder="Rechercher..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "#FAFAFA", border: "none", padding: 0 }} />
        </motion.div>

        {/* ── Filters ── */}
        <motion.div variants={fadeUp} className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {([
            { id: "tout",  label: "Tous",  emoji: "⚡" },
            { id: "runs",  label: "Runs",  emoji: "🏃" },
            { id: "padel", label: "Padel", emoji: "🎾" },
          ] as { id: ActiveFilter; label: string; emoji: string }[]).map(f => (
            <motion.button key={f.id} whileTap={{ scale: 0.93 }}
              onClick={() => { hapticFeedback(); setActiveFilter(f.id) }}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold touch-feedback"
              style={{
                background: activeFilter === f.id ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${activeFilter === f.id ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.08)"}`,
                color: activeFilter === f.id ? "var(--gold)" : "rgba(250,250,250,0.4)",
                transition: "all 0.15s",
              }}>
              <span>{f.emoji}</span>{f.label}
            </motion.button>
          ))}
        </motion.div>

        {/* ── Stats Banner ── */}
        {!loading && (
          <motion.div variants={fadeUp}
            className="rounded-[20px] overflow-hidden"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="grid grid-cols-3 divide-x" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {[
                { value: totalActivities, label: "SORTIES",   color: "#F4D03F", unit: "" },
                { value: totalKm.toFixed(1), label: "KM TOTAL", color: "#3498DB", unit: "" },
                { value: Math.round(totalElev), label: "M D+",  color: "#A855F7", unit: "" },
              ].map(({ value, label, color }) => (
                <div key={label} className="py-3 flex flex-col items-center gap-0.5">
                  <span className="data-mono font-black text-[20px]" style={{ color }}>{value}</span>
                  <span className="text-[8px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: "rgba(250,250,250,0.3)" }}>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── List ── */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-[22px] h-28 animate-pulse"
                style={{ background: "rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        ) : grouped.length === 0 ? (
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
              {items.map((item, i) => (
                item.kind === "run"
                  ? <RunCard key={item.data.id} run={item.data} index={i} />
                  : <PadelCard key={item.data.id} session={item.data} index={i} onEdit={handleEditSession} />
              ))}
            </motion.div>
          ))
        )}

        <div className="h-6" />
      </motion.div>

      {/* ── Padel Modal ── */}
      <AnimatePresence>
        {showPadelModal && (
          <PadelModal
            onClose={handleClose}
            editingSession={editingSession}
            onSave={handleSave}
            onDelete={removeSession}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default function ActivitesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-[22px] h-28 animate-pulse"
            style={{ background: "rgba(255,255,255,0.04)" }} />
        ))}
      </div>
    }>
      <ActivitesContent />
    </Suspense>
  )
}
