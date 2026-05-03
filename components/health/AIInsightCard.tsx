"use client"
import { motion } from "framer-motion"
import { Brain, Lightbulb, Sparkles } from "lucide-react"
import type { AIHealthAnalysis } from "@/lib/types"

interface AIInsightCardProps {
  analysis: AIHealthAnalysis | null
  loading: boolean
}

const sleepQualityColor: Record<string, string> = {
  excellent:    "#22C55E",
  bonne:        "#F4D03F",
  moyenne:      "#E67E22",
  insuffisante: "#EF4444",
}

function SkeletonCard() {
  return (
    <div
      className="relative overflow-hidden rounded-[22px] p-5 space-y-4"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-2.5 w-20 rounded-full animate-pulse" style={{ background: "rgba(212,175,55,0.2)" }} />
          <div className="h-3.5 w-28 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
        </div>
        <div className="h-8 w-8 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="h-3 w-5/6 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="h-3 w-4/6 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>
      <div className="h-12 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-[22px] p-6 flex flex-col items-center text-center gap-4"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
      }}
    >
      {/* Gold glow ambient */}
      <div
        className="absolute -top-6 -left-6 w-32 h-32 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)", filter: "blur(20px)" }}
      />
      <div
        className="relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}
      >
        <Brain size={20} style={{ color: "var(--gold)" }} />
      </div>
      <div className="relative z-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: "var(--gold)" }}>
          Analyse IA
        </p>
        <p className="text-sm font-medium" style={{ color: "rgba(250,250,250,0.45)" }}>
          Complète ton journal pour obtenir une analyse personnalisée
        </p>
      </div>
    </motion.div>
  )
}

export default function AIInsightCard({ analysis, loading }: AIInsightCardProps) {
  if (loading) return <SkeletonCard />
  if (!analysis) return <EmptyState />

  const qColor = sleepQualityColor[analysis.sleep_quality] ?? "#F4D03F"

  const generatedDate = (() => {
    try {
      return new Date(analysis.generated_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    } catch {
      return analysis.generated_at
    }
  })()

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[22px]"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
        border: "1px solid rgba(212,175,55,0.18)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(212,175,55,0.06)",
      }}
    >
      {/* Ambient gold glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -30, left: -30, width: 180, height: 180,
          background: "radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 65%)",
          filter: "blur(24px)",
        }}
      />
      {/* Top-right sparkle accent */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -10, right: -10, width: 100, height: 100,
          background: "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)",
          filter: "blur(16px)",
        }}
      />

      {/* Gold top edge line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)" }}
      />

      <div className="relative z-10 p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--gold)" }}>
              Heritage Elite OS
            </p>
            <h3 className="text-base font-black mt-0.5" style={{ color: "#FAFAFA" }}>
              Analyse IA · Bilan du jour
            </h3>
          </div>
          {/* Sparkles badge */}
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(168,85,247,0.1))",
              border: "1px solid rgba(212,175,55,0.25)",
            }}
          >
            <Sparkles size={15} style={{ color: "var(--gold)" }} />
          </motion.div>
        </div>

        {/* Narrative */}
        <p className="text-sm leading-relaxed" style={{ color: "rgba(250,250,250,0.7)" }}>
          {analysis.narrative}
        </p>

        {/* Recommendation */}
        <div
          className="flex items-start gap-3 p-3.5 rounded-xl"
          style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.12)" }}
        >
          <Lightbulb size={15} className="flex-shrink-0 mt-0.5" style={{ color: "var(--gold)" }} />
          <p className="text-xs leading-relaxed" style={{ color: "rgba(250,250,250,0.7)" }}>
            {analysis.recommendation}
          </p>
        </div>

        {/* Bottom divider */}
        <div className="pt-1" style={{ borderTop: "1px solid rgba(212,175,55,0.1)" }}>
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
              style={{ background: `${qColor}18`, color: qColor, border: `1px solid ${qColor}30` }}
            >
              Sommeil {analysis.sleep_quality}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full" style={{ background: "var(--gold)", opacity: 0.5 }} />
              <span className="text-[10px]" style={{ color: "rgba(250,250,250,0.3)" }}>
                {generatedDate}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
