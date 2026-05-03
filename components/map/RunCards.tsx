/**
 * RunCards — Cartes de recommandation de parcours
 * Défilement horizontal, stagger animation, badge meilleur choix
 */
"use client"
import { motion } from "framer-motion"
import type { RecommendationResult } from "@/lib/route-engine"

const TERRAIN_EMOJI: Record<string, string> = {
  quais: "🌊",
  parc: "🌳",
  forêt: "🌲",
  urbain: "🏙️",
  mixte: "🗺️",
  lac: "💧",
}

const DIFFICULTY_COLOR: Record<string, string> = {
  débutant: "#27AE60",
  intermédiaire: "#F4D03F",
  avancé: "#E74C3C",
}

const SURFACE_LABEL: Record<string, string> = {
  goudron: "Goudron",
  terre: "Terre",
  mixte: "Mixte",
}

interface RunCardsProps {
  recommendations: RecommendationResult[]
  selectedId: string | null
  onSelect: (r: RecommendationResult) => void
  onLaunch: (r: RecommendationResult) => void
}

export default function RunCards({ recommendations, selectedId, onSelect, onLaunch }: RunCardsProps) {
  if (!recommendations.length) {
    return (
      <div className="flex items-center justify-center h-36 rounded-3xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}>
        <div className="text-center">
          <p className="text-2xl mb-1">🗺️</p>
          <p className="text-xs text-text-muted">Chargement des parcours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      {recommendations.map((rec, i) => {
        const isTop = i === 0
        const isSelected = selectedId === rec.route.id
        const diffColor = DIFFICULTY_COLOR[rec.route.difficulty] || "#F4D03F"

        return (
          <motion.div
            key={rec.route.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, duration: 0.4, ease: "easeOut" }}
            className="flex-shrink-0 rounded-3xl p-4 cursor-pointer touch-feedback"
            style={{
              width: 220,
              background: isSelected
                ? "rgba(244,208,63,0.12)"
                : "rgba(255,255,255,0.05)",
              border: isSelected
                ? "1px solid rgba(244,208,63,0.5)"
                : "1px solid rgba(255,255,255,0.08)",
              boxShadow: isSelected ? "0 0 20px rgba(244,208,63,0.15)" : "none",
              transition: "all 0.25s ease",
            }}
            onClick={() => onSelect(rec)}
          >
            {/* Top badge */}
            {isTop && (
              <div className="flex items-center gap-1 mb-2">
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: "#F4D03F", color: "#0A0A0A" }}>
                  ⚡️ Meilleur choix aujourd'hui
                </span>
              </div>
            )}

            {/* Score bar */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{TERRAIN_EMOJI[rec.route.terrain_type] || "🏃"}</span>
                <span className="text-xs font-bold text-text-primary truncate" style={{ maxWidth: 130 }}>
                  {rec.route.name}
                </span>
              </div>
              <span className="text-[10px] font-bold tabular-nums"
                style={{ color: rec.score >= 80 ? "#27AE60" : rec.score >= 60 ? "#F4D03F" : "#E74C3C" }}>
                {Math.round(rec.score)}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold" style={{ color: "#F4D03F" }}>
                {rec.route.distance_km}km
              </span>
              <span className="text-[10px] text-text-muted">·</span>
              <span className="text-[10px] text-text-muted">↑{rec.route.elevation_gain_m}m</span>
              <span className="text-[10px] text-text-muted">·</span>
              <span className="text-[10px] font-semibold" style={{ color: diffColor }}>
                {rec.route.difficulty}
              </span>
            </div>

            {/* Surface + wet compat */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] text-text-muted">{SURFACE_LABEL[rec.route.surface] ?? rec.route.surface}</span>
              {rec.route.wet_weather_compatible && (
                <span className="text-[10px]" title="Compatible pluie">🌧️</span>
              )}
              <span className="text-[10px] text-text-muted">·</span>
              <span className="text-[10px] text-text-muted">🌟{rec.route.scenic_score}/10</span>
            </div>

            {/* Reason */}
            <p className="text-[10px] leading-relaxed mb-3" style={{ color: "rgba(245,245,245,0.55)" }}>
              {rec.reason}
            </p>

            {/* Ideal start */}
            {rec.idealStartTime && (
              <div className="flex items-center gap-1 mb-3">
                <span className="text-[10px]">⏰</span>
                <span className="text-[10px] text-text-muted">Idéal : {rec.idealStartTime}</span>
              </div>
            )}

            {/* Launch button */}
            <button
              onClick={e => { e.stopPropagation(); onLaunch(rec) }}
              className="w-full rounded-2xl py-2 text-xs font-bold touch-feedback"
              style={{
                background: isTop ? "#F4D03F" : "rgba(244,208,63,0.15)",
                color: isTop ? "#0A0A0A" : "#F4D03F",
                border: isTop ? "none" : "1px solid rgba(244,208,63,0.3)",
              }}
            >
              Lancer ce parcours →
            </button>
          </motion.div>
        )
      })}
    </div>
  )
}
