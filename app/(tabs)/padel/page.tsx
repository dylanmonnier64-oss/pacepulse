"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Sparkles, TrendingUp, TrendingDown, Minus, ChevronRight, Trophy, MessageSquare, Pencil } from "lucide-react"
import { usePadelSessions } from "@/hooks/usePadelSessions"
import LogoPP from "@/components/ui/LogoPP"
import { hapticFeedback, lgStyle } from "@/lib/utils"
import type { PadelAIAdvice, PadelSession } from "@/lib/types"

/* ── Helpers ──────────────────────────────────────────────────── */
function fmtDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "short", day: "numeric", month: "short",
  })
}

/* ── Stat card ────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div
      className="rounded-[18px] p-3.5 flex flex-col gap-1"
      style={{ background: `${color}0d`, border: `1px solid ${color}22` }}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: `${color}bb` }}>{label}</p>
      <p className="text-[22px] font-black data-mono leading-none" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px]" style={{ color: "rgba(250,250,250,0.35)" }}>{sub}</p>}
    </div>
  )
}

/* ── Form score ring ──────────────────────────────────────────── */
function FormRing({ score, trend }: { score: number; trend: string }) {
  const color = score >= 70 ? "#22C55E" : score >= 45 ? "#F4D03F" : "#EF4444"
  const TrendIcon = trend === "en hausse" ? TrendingUp : trend === "en baisse" ? TrendingDown : Minus
  const trendColor = trend === "en hausse" ? "#22C55E" : trend === "en baisse" ? "#EF4444" : "#F4D03F"
  const R = 52, C = 2 * Math.PI * R, arcLen = C * 0.75
  const offset = arcLen - (score / 100) * arcLen

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0" style={{ width: 130, height: 130 }}>
        <motion.div className="absolute inset-0 rounded-full pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity }}
          style={{ background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`, filter: "blur(16px)", transform: "scale(1.3)" }}
        />
        <svg width={130} height={130} viewBox="0 0 130 130" className="absolute inset-0">
          <circle cx={65} cy={65} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={9}
            strokeLinecap="round" strokeDasharray={`${arcLen} ${C}`} transform="rotate(135 65 65)" />
          <g transform="rotate(135 65 65)">
            <motion.circle cx={65} cy={65} r={R} fill="none" stroke={color} strokeWidth={9}
              strokeLinecap="round" strokeDasharray={`${arcLen} ${C}`}
              initial={{ strokeDashoffset: arcLen }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              style={{ filter: `drop-shadow(0 0 8px ${color}aa)` }}
            />
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="data-mono font-black leading-none" style={{ fontSize: 34, color, textShadow: `0 0 20px ${color}88` }}>
            {score}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "rgba(250,250,250,0.3)" }}>/100</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(212,175,55,0.6)" }}>Forme padel</p>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: `${trendColor}15`, border: `1px solid ${trendColor}30` }}>
          <TrendIcon size={11} style={{ color: trendColor }} />
          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: trendColor }}>{trend}</span>
        </div>
        <p className="text-[11px]" style={{ color: "rgba(250,250,250,0.4)" }}>
          Basé sur tes {"\n"}dernières sessions
        </p>
      </div>
    </div>
  )
}

/* ── Session card ─────────────────────────────────────────────── */
function SessionCard({ session, onDelete, onEdit }: {
  session: PadelSession
  onDelete: (id: string) => void
  onEdit: (session: PadelSession) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isWin = session.result === "victoire"
  const ratingColor = session.rating >= 7 ? "#22C55E" : session.rating >= 5 ? "#F4D03F" : "#EF4444"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      className="rounded-[20px] overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <button className="w-full p-4 text-left touch-feedback" onClick={() => { hapticFeedback(); setExpanded(e => !e) }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
            style={{ background: isWin ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", border: `1px solid ${isWin ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}` }}>
            {isWin ? "🏆" : "😤"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-[0.14em]"
                style={{ color: isWin ? "#22C55E" : "#EF4444" }}>
                {isWin ? "Victoire" : "Défaite"}
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(250,250,250,0.4)" }}>
                {session.duration} min
              </span>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(250,250,250,0.4)" }}>{fmtDate(session.date)}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="data-mono text-[18px] font-black" style={{ color: ratingColor }}>{session.rating}</span>
            <span className="text-[9px]" style={{ color: "rgba(250,250,250,0.3)" }}>/10</span>
          </div>
          <ChevronRight size={14} style={{ color: "rgba(250,250,250,0.25)", transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="px-4 py-3 space-y-3">
              {session.comment && (
                <div className="flex items-start gap-2">
                  <MessageSquare size={12} style={{ color: "rgba(212,175,55,0.5)", marginTop: 2, flexShrink: 0 }} />
                  <p className="text-[12px] leading-relaxed" style={{ color: "rgba(250,250,250,0.6)" }}>{session.comment}</p>
                </div>
              )}
              {session.ai_advice && (
                <div className="rounded-[14px] p-3 space-y-1.5"
                  style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(168,85,247,0.8)" }}>💡 Conseil IA</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: "rgba(250,250,250,0.65)" }}>{session.ai_advice.tip}</p>
                </div>
              )}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => { hapticFeedback(); onEdit(session) }}
                  className="flex items-center gap-1.5 text-[10px] font-bold touch-feedback"
                  style={{ color: "rgba(168,85,247,0.7)" }}
                >
                  <Pencil size={10} /> Modifier
                </button>
                <button
                  onClick={() => { hapticFeedback(); onDelete(session.id) }}
                  className="text-[10px] font-bold touch-feedback"
                  style={{ color: "rgba(239,68,68,0.5)" }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Session modal (ajout + édition) ─────────────────────────── */
function AddSessionModal({
  onAdd, onClose, existing,
}: {
  onAdd: (data: { date: string; duration: number; result: "victoire" | "défaite"; rating: number; comment: string }) => void
  onClose: () => void
  existing?: PadelSession
}) {
  const [date, setDate] = useState(() => existing?.date ?? new Date().toISOString().split("T")[0])
  const [duration, setDuration] = useState(existing?.duration ?? 90)
  const [result, setResult] = useState<"victoire" | "défaite" | null>(existing?.result ?? null)
  const [rating, setRating] = useState(existing?.rating ?? 6)
  const [comment, setComment] = useState(existing?.comment ?? "")

  const isEdit = !!existing

  function submit() {
    if (!result) return
    hapticFeedback()
    onAdd({ date, duration, result, rating, comment })
    onClose()
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full rounded-t-[28px] flex flex-col"
        style={{ background: "rgba(8,8,8,0.98)", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none", maxHeight: "92dvh", overflowY: "auto" }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
      >
        {/* Gold top line */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.6), transparent)" }} />

        <div className="p-5 pb-10 space-y-5">
          {/* Handle + header */}
          <div className="flex justify-center mb-1">
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(168,85,247,0.3)" }} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(168,85,247,0.7)" }}>
                {isEdit ? "Modifier la session" : "Nouvelle session"}
              </p>
              <h2 className="text-[20px] font-black" style={{ color: "#FAFAFA" }}>🎾 Padel</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <X size={14} style={{ color: "rgba(250,250,250,0.4)" }} />
            </button>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(250,250,250,0.4)" }}>Date</p>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-[16px] text-sm font-bold outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FAFAFA" }} />
          </div>

          {/* Résultat */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(250,250,250,0.4)" }}>Résultat</p>
            <div className="grid grid-cols-2 gap-2.5">
              {([["victoire", "🏆", "#22C55E"], ["défaite", "😤", "#EF4444"]] as const).map(([r, emoji, color]) => (
                <motion.button key={r} whileTap={{ scale: 0.95 }} onClick={() => { hapticFeedback(); setResult(r) }}
                  className="py-4 rounded-[18px] flex flex-col items-center gap-1.5 touch-feedback"
                  style={{
                    background: result === r ? `${color}18` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${result === r ? color + "40" : "rgba(255,255,255,0.07)"}`,
                    boxShadow: result === r ? `0 0 16px ${color}20` : "none",
                    transition: "all 0.15s",
                  }}>
                  <span className="text-3xl">{emoji}</span>
                  <span className="text-[11px] font-black uppercase tracking-[0.12em]"
                    style={{ color: result === r ? color : "rgba(250,250,250,0.35)" }}>
                    {r === "victoire" ? "Victoire" : "Défaite"}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Durée */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(250,250,250,0.4)" }}>Durée</p>
              <span className="data-mono font-black text-lg" style={{ color: "#A855F7" }}>{duration} <span className="text-sm font-medium" style={{ color: "rgba(168,85,247,0.6)" }}>min</span></span>
            </div>
            <input type="range" min={30} max={180} step={15} value={duration} onChange={e => setDuration(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#A855F7" }} />
            <div className="flex justify-between">
              {[30, 60, 90, 120, 150, 180].map(v => (
                <span key={v} className="data-mono text-[9px]" style={{ color: "rgba(250,250,250,0.2)" }}>{v}</span>
              ))}
            </div>
          </div>

          {/* Note de jeu */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(250,250,250,0.4)" }}>Ma note de jeu</p>
              <span className="data-mono font-black text-xl" style={{ color: rating >= 7 ? "#22C55E" : rating >= 5 ? "#F4D03F" : "#EF4444" }}>{rating}/10</span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <motion.button key={n} whileTap={{ scale: 0.88 }} onClick={() => { hapticFeedback(); setRating(n) }}
                  className="flex-1 py-2.5 rounded-xl data-mono font-black text-xs touch-feedback"
                  style={{
                    background: rating === n ? (n >= 7 ? "#22C55E" : n >= 5 ? "#F4D03F" : "#EF4444") : "rgba(255,255,255,0.04)",
                    color: rating === n ? "#050505" : "rgba(250,250,250,0.35)",
                    border: `1px solid ${rating === n ? "transparent" : "rgba(255,255,255,0.06)"}`,
                    transition: "all 0.15s",
                  }}>
                  {n}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Commentaire */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(250,250,250,0.4)" }}>Commentaire <span style={{ color: "rgba(250,250,250,0.2)" }}>(optionnel)</span></p>
            <textarea
              value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Comment s'est passée la session ? Points forts, points à améliorer..."
              rows={3}
              className="w-full px-4 py-3 rounded-[16px] text-sm outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#FAFAFA" }}
            />
          </div>

          {/* Save */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={submit}
            disabled={!result}
            className="w-full py-4 rounded-[18px] font-black text-sm touch-feedback"
            style={{
              background: result ? "linear-gradient(135deg, #A855F7, #7C3AED)" : "rgba(255,255,255,0.06)",
              color: result ? "#fff" : "rgba(250,250,250,0.3)",
              boxShadow: result ? "0 0 24px rgba(168,85,247,0.35)" : "none",
              transition: "all 0.2s",
            }}>
            {isEdit ? "Sauvegarder les modifications" : "Enregistrer la session"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── AI Advice card ───────────────────────────────────────────── */
function AIAdviceCard({ advice, loading, onAnalyze }: { advice: PadelAIAdvice | null; loading: boolean; onAnalyze: () => void }) {
  if (loading) {
    return (
      <div className="rounded-[22px] p-5 flex items-center gap-3"
        style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-5 h-5 rounded-full border-2 flex-shrink-0"
          style={{ borderColor: "rgba(168,85,247,0.2)", borderTopColor: "#A855F7" }} />
        <span className="text-sm font-medium" style={{ color: "rgba(250,250,250,0.4)" }}>Analyse IA en cours…</span>
      </div>
    )
  }

  if (!advice) {
    return (
      <motion.button whileTap={{ scale: 0.97 }} onClick={onAnalyze}
        className="w-full py-4 rounded-[22px] flex items-center justify-center gap-2 font-bold text-sm touch-feedback"
        style={{ ...lgStyle("rgba(168,85,247,0.08)"), border: "1px solid rgba(168,85,247,0.2)", color: "#A855F7" }}>
        <Sparkles size={15} />
        Analyser ma forme padel avec l'IA
      </motion.button>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-[22px] p-5 space-y-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.06), rgba(124,58,237,0.04))", border: "1px solid rgba(168,85,247,0.18)" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.5), transparent)" }} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(168,85,247,0.7)" }}>Analyse IA</p>
          <h3 className="text-base font-black mt-0.5" style={{ color: "#FAFAFA" }}>Forme padel</h3>
        </div>
        <FormRing score={advice.form_score} trend={advice.trend} />
      </div>

      <p className="text-[13px] leading-[1.7]" style={{ color: "rgba(250,250,250,0.7)" }}>{advice.narrative}</p>

      <div className="flex items-start gap-2.5 p-3.5 rounded-[16px]"
        style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)" }}>
        <span className="text-base flex-shrink-0">💡</span>
        <p className="text-[12px] leading-relaxed" style={{ color: "rgba(250,250,250,0.7)" }}>{advice.tip}</p>
      </div>

      <button onClick={onAnalyze}
        className="text-[10px] font-bold touch-feedback" style={{ color: "rgba(168,85,247,0.5)" }}>
        Actualiser l'analyse →
      </button>
    </motion.div>
  )
}

/* ── Page principale ──────────────────────────────────────────── */
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } }
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] } } }

export default function PadelPage() {
  const { sessions, loading, stats, addSession, updateSession, removeSession, updateAdvice } = usePadelSessions()
  const [showModal, setShowModal] = useState(false)
  const [editingSession, setEditingSession] = useState<PadelSession | null>(null)
  const [advice, setAdvice] = useState<PadelAIAdvice | null>(null)
  const [analyzingAI, setAnalyzingAI] = useState(false)

  async function handleAnalyze() {
    if (sessions.length === 0) return
    setAnalyzingAI(true)
    try {
      const res = await fetch("/api/ai/padel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessions, profile: "dydz" }),
      })
      if (res.ok) {
        const data: PadelAIAdvice = await res.json()
        setAdvice(data)
        if (sessions[0]) updateAdvice(sessions[0].id, data)
      }
    } finally {
      setAnalyzingAI(false)
    }
  }

  function handleAdd(data: { date: string; duration: number; result: "victoire" | "défaite"; rating: number; comment: string }) {
    if (editingSession) {
      updateSession({ ...editingSession, ...data })
      setEditingSession(null)
    } else {
      addSession({ ...data, source: "manual", ai_advice: null })
    }
  }

  function handleEdit(session: PadelSession) {
    hapticFeedback()
    setEditingSession(session)
    setShowModal(true)
  }

  function handleCloseModal() {
    setShowModal(false)
    setEditingSession(null)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-5 animate-pulse">
        {[56, 120, 80, 200].map((h, i) => (
          <div key={i} className="rounded-3xl" style={{ height: h, background: "rgba(255,255,255,0.04)" }} />
        ))}
      </div>
    )
  }

  return (
    <motion.div className="flex flex-col gap-5" variants={stagger} initial="hidden" animate="show">
      <AnimatePresence>
        {showModal && (
          <AddSessionModal
            onAdd={handleAdd}
            onClose={handleCloseModal}
            existing={editingSession ?? undefined}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoPP size={30} />
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(168,85,247,0.8)" }}>Heritage Elite OS</p>
            <h1 className="text-[20px] font-black tracking-tight leading-none" style={{ color: "#FAFAFA" }}>
              Padel<span style={{ color: "#A855F7" }}>.</span>
            </h1>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.92 }} onClick={() => { hapticFeedback(); setShowModal(true) }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-[16px] font-black text-sm touch-feedback"
          style={{ background: "linear-gradient(135deg, #A855F7, #7C3AED)", color: "#fff", boxShadow: "0 0 20px rgba(168,85,247,0.3)" }}>
          <Plus size={15} /> Session
        </motion.button>
      </motion.div>

      {/* Divider */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(168,85,247,0.3), transparent)" }} />
        <span className="text-[8px] font-bold uppercase tracking-[0.25em]" style={{ color: "rgba(168,85,247,0.4)" }}>🎾 Suivi</span>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(270deg, rgba(168,85,247,0.3), transparent)" }} />
      </motion.div>

      {/* Stats */}
      {sessions.length > 0 ? (
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          <StatCard label="Win rate" value={`${stats.winRate}%`} sub={`${stats.wins}V · ${stats.losses}D`} color="#22C55E" />
          <StatCard label="Note moy." value={`${stats.avgRating}/10`} sub={`${stats.total} sessions`} color="#A855F7" />
          <StatCard label="Victoires" value={stats.wins} sub="au total" color="#F4D03F" />
          <StatCard label="Défaites" value={stats.losses} sub="au total" color="#EF4444" />
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="flex flex-col items-center gap-4 py-10 rounded-[22px]"
          style={{ background: "rgba(168,85,247,0.04)", border: "1px dashed rgba(168,85,247,0.2)" }}>
          <span className="text-5xl">🎾</span>
          <div className="text-center">
            <p className="font-black text-base" style={{ color: "#FAFAFA" }}>Aucune session</p>
            <p className="text-[12px] mt-1" style={{ color: "rgba(250,250,250,0.35)" }}>Enregistre ta première session de padel</p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => { hapticFeedback(); setShowModal(true) }}
            className="flex items-center gap-2 px-5 py-3 rounded-[16px] font-black text-sm touch-feedback"
            style={{ background: "linear-gradient(135deg, #A855F7, #7C3AED)", color: "#fff" }}>
            <Plus size={14} /> Ajouter une session
          </motion.button>
        </motion.div>
      )}

      {/* AI Advice */}
      {sessions.length > 0 && (
        <motion.div variants={fadeUp}>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-3 px-1" style={{ color: "rgba(168,85,247,0.6)" }}>
            ✦ Analyse Intelligence
          </p>
          <AIAdviceCard advice={advice} loading={analyzingAI} onAnalyze={handleAnalyze} />
        </motion.div>
      )}

      {/* Sessions list */}
      {sessions.length > 0 && (
        <motion.div variants={fadeUp} className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(250,250,250,0.3)" }}>
              Historique · {sessions.length} session{sessions.length > 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-1">
              <Trophy size={10} style={{ color: "rgba(212,175,55,0.5)" }} />
              <span className="text-[9px]" style={{ color: "rgba(212,175,55,0.5)" }}>
                {stats.wins} victoire{stats.wins > 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <AnimatePresence>
            {sessions.map(s => (
              <SessionCard key={s.id} session={s} onDelete={removeSession} onEdit={handleEdit} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Footer */}
      <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 py-2">
        <div className="h-px flex-1" style={{ background: "rgba(168,85,247,0.08)" }} />
        <span className="text-[8px] uppercase tracking-[0.3em]" style={{ color: "rgba(168,85,247,0.2)" }}>PacePulse Padel Tracker</span>
        <div className="h-px flex-1" style={{ background: "rgba(168,85,247,0.08)" }} />
      </motion.div>
    </motion.div>
  )
}
