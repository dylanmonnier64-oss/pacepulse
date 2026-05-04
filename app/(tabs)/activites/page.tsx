"use client"
import { useState, useEffect, useCallback, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSearchParams, useRouter } from "next/navigation"
import { Clock, ChevronRight, Pencil, Trophy, Trash2, Search, Plus } from "lucide-react"
import { useRuns } from "@/hooks/useRuns"
import { usePadelSessions } from "@/hooks/usePadelSessions"
import RunCard from "@/components/runs/RunCard"
import { hapticFeedback, lgStyle, formatDateShort } from "@/lib/utils"
import type { Run, PadelSession } from "@/lib/types"

/* ── Types ── */
type ActiveFilter = "tout" | "runs" | "padel"
type ActivityItem = { kind: "run"; data: Run } | { kind: "padel"; data: PadelSession }

/* Couleur padel : violet pour victoire, rouge pour défaite */
const PADEL_WIN_COLOR  = "#A855F7"
const PADEL_LOSE_COLOR = "#EF4444"

/* ── Helpers ── */
function groupByDate(items: ActivityItem[]): [string, ActivityItem[]][] {
  const map = new Map<string, ActivityItem[]>()
  items.forEach(item => {
    const d = item.data.date.split("T")[0]
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

/* ══════════════════════════════════════════════════
   PADEL CARD — même structure exacte que RunCard
══════════════════════════════════════════════════ */
function PadelCard({ session, onEdit, index = 0 }: {
  session: PadelSession
  onEdit: (s: PadelSession) => void
  index?: number
}) {
  const isWin  = session.result === "victoire"
  const color  = isWin ? PADEL_WIN_COLOR : PADEL_LOSE_COLOR

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.045, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, boxShadow: `0 14px 40px rgba(0,0,0,0.4), 0 0 0 1px ${color}28` }}
      onClick={() => { hapticFeedback(); onEdit(session) }}
      className="cursor-pointer"
    >
      <div
        className="relative rounded-[22px] overflow-hidden touch-feedback"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Barre gauche colorée — identique RunCard */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{ background: `linear-gradient(180deg, ${color}, ${color}44)`, borderRadius: "3px 0 0 3px" }} />
        {/* Wash gauche */}
        <div className="absolute left-0 top-0 bottom-0 w-24 pointer-events-none"
          style={{ background: `linear-gradient(90deg, ${color}10 0%, transparent 100%)` }} />

        <div className="pl-3 pr-4 py-4">
          {/* Ligne du haut */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: `${color}18`, color, border: `1px solid ${color}38` }}>
                  {isWin ? "Victoire" : "Défaite"}
                </span>
                {isWin && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(244,208,63,0.9)", color: "#050505" }}>
                    🏆
                  </span>
                )}
                {session.partner && (
                  <span className="text-[10px]" style={{ color: "rgba(250,250,250,0.4)" }}>
                    · 👥 {session.partner}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium" style={{ color: "rgba(250,250,250,0.38)" }}>
                {formatDateShort(session.date)}
              </p>
            </div>

            {/* Boutons droite */}
            <div className="flex items-center gap-2">
              <button
                onClick={e => { e.stopPropagation(); hapticFeedback(); onEdit(session) }}
                className="w-7 h-7 rounded-xl flex items-center justify-center touch-feedback"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Pencil size={12} style={{ color: "rgba(250,250,250,0.45)" }} />
              </button>
              <ChevronRight size={16} style={{ color: "rgba(250,250,250,0.25)" }} />
            </div>
          </div>

          {/* Stats principales */}
          <div className="flex items-end gap-5">
            {/* Rating — mis en avant comme la distance */}
            <div>
              <span className="data-mono text-[28px] font-black tracking-tight leading-none"
                style={{ color: "#FAFAFA" }}>
                {session.rating}
              </span>
              <span className="text-[11px] font-semibold ml-1" style={{ color: "rgba(250,250,250,0.38)" }}>
                /10
              </span>
            </div>

            {/* Stats secondaires */}
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
                  <span className="data-mono text-[13px] font-bold" style={{ color: "#F4D03F" }}>Win</span>
                </div>
              )}
            </div>
          </div>

          {/* Barre feeling — identique RunCard */}
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

/* ══════════════════════════════════════════════════
   PADEL MODAL (Créer / Modifier)
══════════════════════════════════════════════════ */
function PadelModal({ onClose, editingSession, onSave, onDelete }: {
  onClose: () => void
  editingSession?: PadelSession
  onSave: (data: Omit<PadelSession, "id" | "user_profile" | "created_at">) => void
  onDelete?: (id: string) => void
}) {
  const isEditing = !!editingSession
  const [form, setForm] = useState({
    date:     editingSession?.date     ?? new Date().toISOString().split("T")[0],
    duration: String(editingSession?.duration ?? 60),
    result:   (editingSession?.result  ?? "victoire") as "victoire" | "défaite",
    rating:   String(editingSession?.rating   ?? 7),
    comment:  editingSession?.comment  ?? "",
    partner:  editingSession?.partner  ?? "",
  })

  function submit() {
    onSave({
      date: form.date, duration: Number(form.duration), result: form.result,
      rating: Number(form.rating), comment: form.comment,
      partner: form.partner || undefined, source: "manual",
    })
    onClose()
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)" }}
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
            {isEditing ? "Modifier le match" : "Nouveau match"}{" "}
            <span style={{ color: PADEL_WIN_COLOR }}>🎾</span>
          </h2>

          {([ { label: "Date", type: "date", key: "date" },
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
              {(["victoire", "défaite"] as const).map(r => {
                const c = r === "victoire" ? PADEL_WIN_COLOR : PADEL_LOSE_COLOR
                const active = form.result === r
                return (
                  <motion.button key={r} whileTap={{ scale: 0.95 }}
                    onClick={() => setForm(f => ({ ...f, result: r }))}
                    className="py-3 rounded-[14px] font-bold text-sm capitalize touch-feedback"
                    style={{
                      background: active ? `${c}18` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${active ? `${c}45` : "rgba(255,255,255,0.08)"}`,
                      color: active ? c : "rgba(250,250,250,0.45)",
                    }}>
                    {r === "victoire" ? "🏆 Victoire" : "💪 Défaite"}
                  </motion.button>
                )
              })}
            </div>
          </div>

          {isEditing && onDelete && (
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => { hapticFeedback(); onDelete(editingSession!.id); onClose() }}
              className="w-full py-3 rounded-[16px] font-bold text-sm flex items-center justify-center gap-2 touch-feedback"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444" }}>
              <Trash2 size={14} /> Supprimer
            </motion.button>
          )}

          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => { hapticFeedback(); submit() }}
            className="w-full py-3.5 rounded-[18px] font-bold text-sm touch-feedback"
            style={{ background: `${PADEL_WIN_COLOR}22`, border: `1px solid ${PADEL_WIN_COLOR}45`, color: PADEL_WIN_COLOR }}>
            {isEditing ? "Modifier" : "Enregistrer"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════
   PAGE ACTIVITÉS
══════════════════════════════════════════════════ */
function ActivitesContent() {
  const { runs, loading: runsLoading } = useRuns()
  const { sessions, loading: padelLoading, addSession, updateSession, removeSession } = usePadelSessions()
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("tout")
  const [search, setSearch] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [editingSession, setEditingSession] = useState<PadelSession | undefined>()

  useEffect(() => {
    if (searchParams.get("new") === "padel") setShowModal(true)
  }, [searchParams])

  const handleClose = useCallback(() => {
    setShowModal(false)
    setEditingSession(undefined)
    router.replace("/activites")
  }, [router])

  const handleEditSession = useCallback((session: PadelSession) => {
    setEditingSession(session)
    setShowModal(true)
  }, [])

  const handleSave = useCallback((data: Omit<PadelSession, "id" | "user_profile" | "created_at">) => {
    if (editingSession) updateSession({ ...editingSession, ...data })
    else addSession(data)
    handleClose()
  }, [editingSession, updateSession, addSession, handleClose])

  const loading = runsLoading || padelLoading

  /* Statistiques */
  const totalKm    = runs.reduce((s, r) => s + r.distance, 0)
  const totalElev  = runs.reduce((s, r) => s + r.elevation, 0)
  const totalItems = runs.length + sessions.length

  /* Liste filtrée + recherche */
  const allItems: ActivityItem[] = [
    ...(activeFilter !== "padel" ? runs.map(r => ({ kind: "run"   as const, data: r })) : []),
    ...(activeFilter !== "runs"  ? sessions.map(s => ({ kind: "padel" as const, data: s })) : []),
  ].filter(item => {
    if (!search) return true
    if (item.kind === "run")
      return item.data.distance.toString().includes(search) ||
             (item.data.notes ?? "").toLowerCase().includes(search.toLowerCase())
    return (item.data.comment  ?? "").toLowerCase().includes(search.toLowerCase()) ||
           (item.data.partner  ?? "").toLowerCase().includes(search.toLowerCase())
  }).sort((a, b) => a.data.date < b.data.date ? 1 : -1)

  const grouped = groupByDate(allItems)

  return (
    <>
      <motion.div className="flex flex-col gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: "rgba(250,250,250,0.38)" }}>Journal</p>
            <h1 className="text-[26px] font-black tracking-tight" style={{ color: "#FAFAFA" }}>
              Activités<span style={{ color: "#F4D03F" }}>.</span>
            </h1>
          </div>
        </div>

        {/* ── Recherche — liquid glass comme Mes Runs ── */}
        <div className="flex items-center gap-3 px-4 rounded-2xl"
          style={{ ...lgStyle(), height: 48, border: "1px solid rgba(255,255,255,0.12)" }}>
          <Search size={16} style={{ color: "rgba(250,250,250,0.38)" }} />
          <input type="search" placeholder="Rechercher..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "#FAFAFA", border: "none", padding: 0 }} />
        </div>

        {/* ── Filtres — liquid glass comme Mes Runs ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-select" style={{ scrollbarWidth: "none" }}>
          {([
            { id: "tout",  label: "Tous",  emoji: "⚡" },
            { id: "runs",  label: "Runs",  emoji: "🏃" },
            { id: "padel", label: "Padel", emoji: "🎾" },
          ] as { id: ActiveFilter; label: string; emoji: string }[]).map(f => {
            const active = activeFilter === f.id
            return (
              <button key={f.id}
                onClick={() => { hapticFeedback(); setActiveFilter(f.id) }}
                className="touch-feedback flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold"
                style={{
                  ...(active ? lgStyle("rgba(244,208,63,0.15)") : lgStyle()),
                  color: active ? "#F4D03F" : "rgba(250,250,250,0.60)",
                  border: `1px solid ${active ? "rgba(244,208,63,0.35)" : "rgba(255,255,255,0.10)"}`,
                  minHeight: 36,
                }}>
                <span>{f.emoji}</span>{f.label}
              </button>
            )
          })}
        </div>

        {/* ── Stats — même style que Mes Runs ── */}
        {!loading && (
          <div className="rounded-[22px] p-3 flex items-center gap-4"
            style={lgStyle("rgba(255,255,255,0.03)")}>
            {[
              { value: String(totalItems),          label: "sorties" },
              { value: totalKm.toFixed(0),          label: "km total" },
              { value: String(Math.round(totalElev)), label: "m D+" },
            ].map(({ value, label }, i) => (
              <div key={label} className={`text-center flex-1 ${i === 1 ? "border-x" : ""}`}
                style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                <p className="text-lg font-extrabold" style={{ color: "#FAFAFA" }}>{value}</p>
                <p className="text-[9px] uppercase tracking-wide"
                  style={{ color: "rgba(250,250,250,0.38)" }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Liste ── */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-[22px] h-28 animate-pulse"
                style={{ background: "rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-16" role="status">
            <span className="text-4xl">📋</span>
            <p className="mt-3 font-bold" style={{ color: "#FAFAFA" }}>Aucune activité</p>
            <p className="text-sm mt-1" style={{ color: "rgba(250,250,250,0.35)" }}>
              Utilise le bouton <span style={{ color: "var(--gold)" }}>+</span> pour enregistrer
            </p>
          </div>
        ) : (
          <ol className="flex flex-col gap-3">
            {grouped.map(([date, items]) => (
              <li key={date}>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] px-1 mb-2 capitalize"
                  style={{ color: "rgba(250,250,250,0.32)" }}>
                  {formatGroupDate(date)}
                </p>
                <ol className="flex flex-col gap-3">
                  {items.map((item, i) => (
                    <li key={item.data.id}>
                      {item.kind === "run"
                        ? <RunCard run={item.data} index={i} />
                        : <PadelCard session={item.data} index={i} onEdit={handleEditSession} />
                      }
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>
        )}

        <div className="h-6" />
      </motion.div>

      {/* ── Modal Padel ── */}
      <AnimatePresence>
        {showModal && (
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
