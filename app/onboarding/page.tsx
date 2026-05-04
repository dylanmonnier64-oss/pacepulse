"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  ChevronRight, Activity, Heart, BarChart2, Zap,
  MapPin, Check,
} from "lucide-react"
import { hapticFeedback } from "@/lib/utils"
import { glass, colors, transitions, gradients } from "@/lib/design-system"

// ── Clé de persistance ────────────────────────────────────────────
const ONBOARDING_KEY = "pp_onboarding_done"

// ── Types ─────────────────────────────────────────────────────────
interface Step {
  id: number
  emoji: string
  title: string
  subtitle: string
  description: string
  color: string
  features: Array<{ icon: React.ElementType; text: string }>
}

const STEPS: Step[] = [
  {
    id: 0,
    emoji: "🏃",
    title: "Bienvenue sur\nPacePulse",
    subtitle: "Ton compagnon running premium",
    description: "Suis tes performances, analyse ta progression et atteins tes objectifs avec une précision d'athlète.",
    color: "#F4D03F",
    features: [
      { icon: Activity,  text: "Journal de toutes tes sorties" },
      { icon: BarChart2, text: "Stats CTL/ATL/TSB comme les pros" },
      { icon: Zap,       text: "Analyse IA personnalisée" },
    ],
  },
  {
    id: 1,
    emoji: "📊",
    title: "Analyse ta\nperformance",
    subtitle: "Des données, pas du bruit",
    description: "VDOT, TSS, allure GAP, dénivelé compensé… Toutes les métriques qui comptent vraiment pour progresser.",
    color: "#A855F7",
    features: [
      { icon: BarChart2, text: "Prévisions de temps par distance" },
      { icon: Zap,       text: "Courbe de forme en temps réel" },
      { icon: Heart,     text: "Suivi santé quotidien" },
    ],
  },
  {
    id: 2,
    emoji: "🏆",
    title: "Découvre les\ncourses près de toi",
    subtitle: "200 km autour de Bordeaux",
    description: "Marathons, trails, semi… Tous les événements de la région pour te fixer de nouveaux défis.",
    color: "#22C55E",
    features: [
      { icon: MapPin,    text: "15+ courses référencées" },
      { icon: Activity,  text: "Filtres distance & type" },
      { icon: Zap,       text: "Liens d'inscription directs" },
    ],
  },
  {
    id: 3,
    emoji: "✨",
    title: "Prêt à courir\nplus vite ?",
    subtitle: "Rejoins PacePulse",
    description: "Importe tes runs Strava ou saisis-les manuellement. Toutes tes données restent sur ton appareil.",
    color: "#3B82F6",
    features: [
      { icon: Zap,       text: "Sync Strava en un clic" },
      { icon: Heart,     text: "Données 100% privées" },
      { icon: Check,     text: "Aucun abonnement requis" },
    ],
  },
]

// ── Orbe animé de fond ────────────────────────────────────────────
function BackgroundOrb({ color }: { color: string }) {
  return (
    <motion.div
      key={color}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden
    >
      {/* Orbe principal */}
      <motion.div
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[340px] h-[340px] rounded-full"
        style={{ background: `radial-gradient(ellipse, ${color}28 0%, transparent 70%)`, filter: "blur(48px)" }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ opacity: { duration: 0.5 }, scale: { duration: 0.5 }, y: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
      />
      {/* Orbe secondaire gauche */}
      <motion.div
        className="absolute bottom-[20%] left-[-5%] w-48 h-48 rounded-full"
        style={{ background: `radial-gradient(ellipse, ${color}18 0%, transparent 70%)`, filter: "blur(40px)" }}
        animate={{ x: [0, 8, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Particules flottantes */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 4 + i * 2,
            height: 4 + i * 2,
            background: color,
            left: `${15 + i * 18}%`,
            top: `${20 + i * 12}%`,
            opacity: 0.25,
          }}
          animate={{ y: [0, -12, 0], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 3 + i * 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
        />
      ))}
      {/* Grain texture */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")", backgroundSize: "200px 200px" }} />
    </motion.div>
  )
}

// ── Étape individuelle ────────────────────────────────────────────
function StepContent({ step }: { step: Step }) {
  return (
    <motion.div
      key={step.id}
      className="flex flex-col items-center text-center gap-6 flex-1 justify-center px-2"
      initial={{ opacity: 0, x: 32, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -32, scale: 0.97 }}
      transition={transitions.reveal}
    >
      {/* Emoji central avec halo */}
      <motion.div
        className="relative flex items-center justify-center"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute w-24 h-24 rounded-full"
          style={{ background: `${step.color}20`, filter: "blur(20px)" }} />
        <div className="relative w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
          style={{ ...glass.card, background: `${step.color}12`, border: `1px solid ${step.color}30` }}>
          {step.emoji}
        </div>
      </motion.div>

      {/* Titre & sous-titre */}
      <div>
        <h1
          className="text-[28px] font-black leading-tight mb-2"
          style={{ color: colors.text.primary, whiteSpace: "pre-line" }}
        >
          {step.title}
        </h1>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: step.color }}>
          {step.subtitle}
        </p>
      </div>

      {/* Description */}
      <p className="text-[13px] leading-relaxed max-w-[280px]" style={{ color: colors.text.secondary }}>
        {step.description}
      </p>

      {/* Features list */}
      <div className="w-full max-w-[300px] flex flex-col gap-2.5">
        {step.features.map(({ icon: Icon, text }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.07, ...transitions.reveal }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-left"
            style={glass.card}
          >
            <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${step.color}18`, border: `1px solid ${step.color}28` }}>
              <Icon size={13} style={{ color: step.color }} />
            </div>
            <span className="text-[12px] font-semibold" style={{ color: colors.text.secondary }}>{text}</span>
            <Check size={11} className="ml-auto flex-shrink-0" style={{ color: `${step.color}80` }} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Indicateur de pagination ──────────────────────────────────────
function StepDots({ current, total, color }: { current: number; total: number; color: string }) {
  return (
    <div className="flex items-center gap-2" role="tablist" aria-label="Étapes de l'introduction">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          role="tab"
          aria-selected={i === current}
          aria-label={`Étape ${i + 1} sur ${total}`}
          animate={{
            width: i === current ? 24 : 6,
            background: i === current ? color : "rgba(255,255,255,0.2)",
          }}
          transition={transitions.snappy}
          className="h-1.5 rounded-full"
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════
export default function OnboardingPage() {
  const router = useRouter()
  const [stepIdx, setStepIdx] = useState(0)
  const [exiting, setExiting] = useState(false)

  const step = STEPS[stepIdx]
  const isLast = stepIdx === STEPS.length - 1

  // Redirige si déjà fait
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(ONBOARDING_KEY)) {
      router.replace("/dashboard")
    }
  }, [router])

  const goNext = () => {
    hapticFeedback()
    if (isLast) {
      finish()
    } else {
      setStepIdx(i => i + 1)
    }
  }

  const skip = () => {
    hapticFeedback()
    finish()
  }

  const finish = () => {
    setExiting(true)
    localStorage.setItem(ONBOARDING_KEY, "1")
    setTimeout(() => router.replace("/dashboard"), 400)
  }

  return (
    <motion.div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: colors.bg.base, zIndex: 100 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Filtre SVG liquid glass */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <filter id="lg">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="mask" />
            <feComposite in="SourceGraphic" in2="mask" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Fond animé */}
      <AnimatePresence mode="wait">
        <BackgroundOrb key={step.color} color={step.color} />
      </AnimatePresence>

      {/* Header avec logo + skip */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-14 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: gradients.fab }}>
            <span className="text-[12px] font-black" style={{ color: "#050505" }}>PP</span>
          </div>
          <span className="text-sm font-black tracking-tight" style={{ color: colors.text.primary }}>
            PacePulse
          </span>
        </div>
        {!isLast && (
          <button
            onClick={skip}
            className="touch-feedback text-[12px] font-semibold px-3 py-1.5 rounded-xl"
            style={{ ...glass.card, color: colors.text.muted }}
            aria-label="Passer l'introduction"
          >
            Passer
          </button>
        )}
      </div>

      {/* Contenu de l'étape */}
      <div className="relative z-10 flex-1 flex flex-col px-6 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {!exiting && <StepContent key={stepIdx} step={step} />}
        </AnimatePresence>
      </div>

      {/* Footer — pagination + CTA */}
      <motion.div
        className="relative z-10 px-6 pb-10 flex flex-col items-center gap-5"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, ...transitions.reveal }}
      >
        <StepDots current={stepIdx} total={STEPS.length} color={step.color} />

        <button
          onClick={goNext}
          className="touch-feedback w-full h-[54px] rounded-2xl flex items-center justify-center gap-2 font-black text-base relative overflow-hidden"
          style={{
            background: isLast
              ? `linear-gradient(135deg, ${step.color} 0%, ${step.color}CC 100%)`
              : `linear-gradient(135deg, ${step.color}20, ${step.color}10)`,
            border: `1px solid ${step.color}${isLast ? "00" : "35"}`,
            color: isLast ? "#050505" : step.color,
            boxShadow: isLast ? `0 8px 24px ${step.color}40` : "none",
          }}
          aria-label={isLast ? "Commencer PacePulse" : `Étape suivante (${stepIdx + 2} sur ${STEPS.length})`}
        >
          {/* Reflet sur le bouton final */}
          {isLast && (
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 60%)", borderRadius: "inherit" }} />
          )}
          <span>{isLast ? "🚀 Commencer" : "Continuer"}</span>
          {!isLast && <ChevronRight size={18} />}
        </button>

        {/* Lien direct dashboard (si déjà utilisateur) */}
        {stepIdx === 0 && (
          <button onClick={skip} className="touch-feedback text-[11px] font-semibold"
            style={{ color: colors.text.subtle }}>
            Déjà utilisateur ? Aller directement →
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}
