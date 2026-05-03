"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Compass, Zap, Trophy, Users, ChevronRight, Sparkles, Flame, Target, Shield } from "lucide-react"
import { useRuns } from "@/hooks/useRuns"
import { usePadelSessions } from "@/hooks/usePadelSessions"
import { hapticFeedback, lgStyle } from "@/lib/utils"
import { calculateInjuryRisk } from "@/lib/calculations"
import LogoPP from "@/components/ui/LogoPP"

/* ── Défi personnalisé IA ── */
function computePersonalChallenge(weekKm: number, totalRuns: number, injuryScore: number): {
  title: string; desc: string; target: string; icon: string; color: string; xp: number
} {
  if (injuryScore >= 70) return {
    title: "Semaine Récupération", desc: "Ton corps a besoin de repos. Priorité à la mobilité et au sommeil.",
    target: "3 séances légères max", icon: "🛌", color: "#3B82F6", xp: 150,
  }
  if (weekKm < 10) return {
    title: "Reprise Progressive", desc: "Relance la machine avec des sorties courtes et régulières.",
    target: `${Math.round(weekKm * 1.3 + 5)} km cette semaine`, icon: "🔥", color: "#FF6B1A", xp: 200,
  }
  if (weekKm < 25) return {
    title: "Construire la Base", desc: "Augmente ton volume d'endurance pour solidifier ta base aérobie.",
    target: `${Math.round(weekKm * 1.1 + 3)} km avec 1 longue sortie`, icon: "📈", color: "#22C55E", xp: 350,
  }
  if (totalRuns >= 20) return {
    title: "Défi Tempo", desc: "Intègre une séance au seuil lactique pour progresser sur ta vitesse.",
    target: "1 séance tempo + volume habituel", icon: "⚡", color: "#F4D03F", xp: 450,
  }
  return {
    title: "Constance Élite", desc: "Maintiens ton niveau avec une semaine équilibrée.",
    target: `${Math.round(weekKm)} km répartis sur 4 sorties`, icon: "👑", color: "#D4AF37", xp: 400,
  }
}

/* ── Mock community data (local leaderboard Dydz vs Mans) ── */
const ATHLETES = [
  { name: "Dylan", avatar: "🏃", weekKm: 0, wins: 0, xp: 0, rank: 1 },
  { name: "Manon", avatar: "🏃‍♀️", weekKm: 0, wins: 0, xp: 0, rank: 2 },
]

const COMMUNITY_CHALLENGES = [
  { id: "c1", title: "10km Club", desc: "Atteins 10km en moins de 50 min", icon: "🎯", color: "#3B82F6", participants: 847, xp: 500, difficulty: "Intermédiaire" },
  { id: "c2", title: "Régularité Iron", desc: "5 runs en 7 jours sans interruption", icon: "🔗", color: "#F4D03F", participants: 1203, xp: 300, difficulty: "Accessible" },
  { id: "c3", title: "Ultra Volume", desc: "50km dans la semaine", icon: "⚡", color: "#EF4444", participants: 312, xp: 800, difficulty: "Élite" },
  { id: "c4", title: "Padel Perfect", desc: "3 victoires consécutives", icon: "🎾", color: "#A855F7", participants: 428, xp: 400, difficulty: "Intermédiaire" },
]

/* ── XP Progress Ring ── */
function XPRing({ xp, maxXp, color }: { xp: number; maxXp: number; color: string }) {
  const R = 22, C = 2 * Math.PI * R
  const pct = Math.min(1, xp / maxXp)
  return (
    <svg width={52} height={52} viewBox="0 0 52 52">
      <circle cx={26} cy={26} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
      <motion.circle cx={26} cy={26} r={R} fill="none" stroke={color} strokeWidth={5}
        strokeLinecap="round" strokeDasharray={`${C} ${C}`}
        initial={{ strokeDashoffset: C }}
        animate={{ strokeDashoffset: C - pct * C }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        transform="rotate(-90 26 26)"
        style={{ filter: `drop-shadow(0 0 4px ${color}88)` }} />
      <text x={26} y={29} textAnchor="middle" fontSize={9} fontWeight={800}
        fill={color} fontFamily="JetBrains Mono, monospace">{Math.round(pct * 100)}%</text>
    </svg>
  )
}

/* ── Challenge Card ── */
function ChallengeCard({ challenge, joined, onJoin }: {
  challenge: typeof COMMUNITY_CHALLENGES[0]; joined: boolean; onJoin: (id: string) => void
}) {
  return (
    <motion.div whileTap={{ scale: 0.98 }}
      className="flex items-center gap-4 rounded-[20px] p-4"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0"
        style={{ background: `${challenge.color}12`, border: `1px solid ${challenge.color}22` }}>
        <span style={{ fontSize: 20 }}>{challenge.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-black text-sm" style={{ color: "#FAFAFA" }}>{challenge.title}</p>
          <span className="text-[8px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-full"
            style={{ background: `${challenge.color}12`, color: challenge.color }}>
            {challenge.difficulty}
          </span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "rgba(250,250,250,0.42)" }}>{challenge.desc}</p>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1">
            <Users size={9} style={{ color: "rgba(250,250,250,0.28)" }} />
            <span className="text-[9px]" style={{ color: "rgba(250,250,250,0.35)" }}>{challenge.participants.toLocaleString("fr-FR")}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap size={9} style={{ color: "#F4D03F" }} />
            <span className="text-[9px]" style={{ color: "#F4D03F" }}>+{challenge.xp} XP</span>
          </div>
        </div>
      </div>
      <motion.button whileTap={{ scale: 0.9 }}
        onClick={() => { hapticFeedback(); onJoin(challenge.id) }}
        className="px-3 py-1.5 rounded-[10px] text-[10px] font-black touch-feedback flex-shrink-0"
        style={{
          background: joined ? `${challenge.color}18` : "rgba(255,255,255,0.06)",
          border: `1px solid ${joined ? challenge.color + "30" : "rgba(255,255,255,0.1)"}`,
          color: joined ? challenge.color : "rgba(250,250,250,0.5)",
          transition: "all 0.15s",
        }}>
        {joined ? "Rejoint ✓" : "Rejoindre"}
      </motion.button>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════ */
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const fadeUp  = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] } } }

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(212,175,55,0.2), transparent)" }} />
      <span className="text-[8px] font-bold uppercase tracking-[0.25em]" style={{ color: "rgba(212,175,55,0.38)" }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(270deg, rgba(212,175,55,0.2), transparent)" }} />
    </div>
  )
}

export default function DecouvrirPage() {
  const { runs } = useRuns()
  const { sessions, stats: padelStats } = usePadelSessions()
  const [joinedChallenges, setJoinedChallenges] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set()
    try { return new Set(JSON.parse(localStorage.getItem("pp_joined_challenges") ?? "[]") as string[]) } catch { return new Set() }
  })
  const [challengeProgress, setChallengeProgress] = useState(0)

  // Compute weekly stats
  const now = new Date()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay() + 1); weekStart.setHours(0,0,0,0)
  const weekRuns = runs.filter(r => new Date(r.date) >= weekStart)
  const weekKm = weekRuns.reduce((s, r) => s + r.distance, 0)
  const injuryRisk = calculateInjuryRisk(runs)

  // Personal challenge
  const personalChallenge = computePersonalChallenge(weekKm, runs.length, injuryRisk.score)

  // Simple XP calculation
  const totalXp = Math.round(
    runs.reduce((s, r) => s + r.distance * 10, 0) +
    sessions.filter(s => s.result === "victoire").length * 100 +
    joinedChallenges.size * 50
  )

  // Simulate weekly progress
  useEffect(() => {
    const timer = setTimeout(() => {
      const pct = weekKm > 0 ? Math.min(100, Math.round((weekKm / (weekKm + 5)) * 80 + 10)) : 5
      setChallengeProgress(pct)
    }, 400)
    return () => clearTimeout(timer)
  }, [weekKm])

  function toggleJoin(id: string) {
    setJoinedChallenges(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      localStorage.setItem("pp_joined_challenges", JSON.stringify(Array.from(next)))
      return next
    })
  }

  return (
    <motion.div className="flex flex-col gap-5" variants={stagger} initial="hidden" animate="show">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(250,250,250,0.38)" }}>Communauté</p>
          <h1 className="text-[26px] font-black tracking-tight" style={{ color: "#FAFAFA" }}>
            Découvrir<span style={{ color: "#F4D03F" }}>.</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl"
          style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
          <Zap size={13} style={{ color: "#F4D03F" }} />
          <span className="data-mono font-black text-sm" style={{ color: "#F4D03F" }}>{totalXp.toLocaleString("fr-FR")}</span>
          <span className="text-[9px]" style={{ color: "rgba(212,175,55,0.6)" }}>XP</span>
        </div>
      </motion.div>

      {/* ── Défi IA Personnalisé ── */}
      <motion.div variants={fadeUp}><Divider label="Défi personnalisé IA" /></motion.div>

      <motion.div variants={fadeUp}
        className="relative rounded-[24px] overflow-hidden p-5 space-y-4"
        style={{
          background: `linear-gradient(135deg, ${personalChallenge.color}0d 0%, rgba(255,255,255,0.02) 100%)`,
          border: `1px solid ${personalChallenge.color}22`,
        }}>
        {/* Glow */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${personalChallenge.color}18 0%, transparent 70%)`, filter: "blur(20px)" }} />

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={11} style={{ color: `${personalChallenge.color}99` }} />
              <p className="text-[9px] font-bold uppercase tracking-[0.2em]"
                style={{ color: `${personalChallenge.color}80` }}>Adapté à ton niveau</p>
            </div>
            <h2 className="text-[18px] font-black" style={{ color: "#FAFAFA" }}>
              {personalChallenge.icon} {personalChallenge.title}
            </h2>
            <p className="text-[12px] mt-1 leading-snug" style={{ color: "rgba(250,250,250,0.55)" }}>
              {personalChallenge.desc}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 flex-shrink-0 ml-4">
            <XPRing xp={challengeProgress} maxXp={100} color={personalChallenge.color} />
            <span className="text-[8px] font-bold" style={{ color: `${personalChallenge.color}80` }}>Progression</span>
          </div>
        </div>

        {/* Target */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-[16px]"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <Target size={14} style={{ color: personalChallenge.color }} />
          <p className="text-[12px] font-black" style={{ color: "#FAFAFA" }}>{personalChallenge.target}</p>
          <div className="ml-auto flex items-center gap-1">
            <Zap size={11} style={{ color: "#F4D03F" }} />
            <span className="text-[10px] font-black" style={{ color: "#F4D03F" }}>+{personalChallenge.xp} XP</span>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-[9px]" style={{ color: "rgba(250,250,250,0.3)" }}>Progression semaine</span>
            <span className="data-mono text-[9px] font-bold" style={{ color: personalChallenge.color }}>{challengeProgress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
            <motion.div className="h-full rounded-full"
              initial={{ width: 0 }} animate={{ width: `${challengeProgress}%` }}
              transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: `linear-gradient(90deg, ${personalChallenge.color}80, ${personalChallenge.color})` }} />
          </div>
        </div>
      </motion.div>

      {/* ── Classement local ── */}
      <motion.div variants={fadeUp}><Divider label="Classement Dylan vs Manon" /></motion.div>

      <motion.div variants={fadeUp} className="space-y-2">
        {[
          {
            name: "Dylan", avatar: "🏃", role: "dydz",
            weekKm: weekKm.toFixed(1), totalRuns: runs.length,
            padelWins: sessions.filter(s => s.result === "victoire").length,
            xp: Math.round(runs.reduce((s, r) => s + r.distance * 10, 0) + padelStats.wins * 100),
            rank: 1,
          },
          {
            name: "Manon", avatar: "🏃‍♀️", role: "mans",
            weekKm: "—", totalRuns: "—",
            padelWins: "—",
            xp: 0,
            rank: 2,
          },
        ].map((athlete, i) => (
          <motion.div key={athlete.name}
            className="flex items-center gap-4 rounded-[20px] p-4"
            style={{
              background: i === 0 ? "linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(255,255,255,0.02) 100%)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${i === 0 ? "rgba(212,175,55,0.22)" : "rgba(255,255,255,0.07)"}`,
            }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {athlete.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm" style={{ color: "#FAFAFA" }}>{athlete.name}</span>
                {i === 0 && <Trophy size={11} style={{ color: "#F4D03F" }} />}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px]" style={{ color: "rgba(250,250,250,0.38)" }}>{athlete.weekKm} km cette sem.</span>
                <span className="text-[10px]" style={{ color: "rgba(250,250,250,0.38)" }}>{athlete.padelWins} 🏆</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1 justify-end">
                <Zap size={10} style={{ color: "#F4D03F" }} />
                <span className="data-mono font-black text-sm" style={{ color: i === 0 ? "#F4D03F" : "rgba(250,250,250,0.3)" }}>
                  {athlete.xp > 0 ? athlete.xp.toLocaleString("fr-FR") : "—"}
                </span>
              </div>
              <span className="text-[8px]" style={{ color: "rgba(250,250,250,0.25)" }}>XP total</span>
            </div>
          </motion.div>
        ))}

        <p className="text-[10px] text-center px-4" style={{ color: "rgba(250,250,250,0.2)" }}>
          Connecte Strava de Manon dans les paramètres pour voir ses stats
        </p>
      </motion.div>

      {/* ── Challenges communauté ── */}
      <motion.div variants={fadeUp}><Divider label="Défis de la communauté" /></motion.div>

      <motion.div variants={fadeUp} className="space-y-2.5">
        {COMMUNITY_CHALLENGES.map(challenge => (
          <ChallengeCard key={challenge.id} challenge={challenge}
            joined={joinedChallenges.has(challenge.id)}
            onJoin={toggleJoin} />
        ))}
      </motion.div>

      {/* ── Risque & Récup ── */}
      <motion.div variants={fadeUp}><Divider label="Forme actuelle" /></motion.div>

      <motion.div variants={fadeUp}
        className="flex items-center gap-4 rounded-[22px] p-4"
        style={{ background: `${injuryRisk.color}0a`, border: `1px solid ${injuryRisk.color}20` }}>
        <Shield size={20} style={{ color: injuryRisk.color, flexShrink: 0 }} />
        <div className="flex-1">
          <p className="font-black text-sm" style={{ color: "#FAFAFA" }}>Risque de blessure — {injuryRisk.label}</p>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(250,250,250,0.45)" }}>{injuryRisk.reason}</p>
        </div>
        <div className="flex-shrink-0">
          <span className="data-mono font-black text-[22px]" style={{ color: injuryRisk.color }}>{injuryRisk.score}</span>
          <span className="text-[9px]" style={{ color: `${injuryRisk.color}70` }}>/100</span>
        </div>
      </motion.div>

      <div className="h-6" />
    </motion.div>
  )
}
