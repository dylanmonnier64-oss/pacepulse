"use client"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  Search, MapPin, Calendar, Filter, X, ChevronRight,
  ExternalLink, Sparkles, RefreshCw, Clock, Mountain,
  Users, Medal, ArrowUpDown,
} from "lucide-react"
import { lgStyle, hapticFeedback } from "@/lib/utils"
import {
  useRaces, TYPE_COLORS, TYPE_EMOJIS, TYPE_LABELS,
  DISTANCE_LABELS, MONTHS_FR, formatDateFr, formatDateShortFr,
  daysUntil, type RaceEvent, type RaceType,
} from "@/hooks/useRaces"

// ── Tokens design ──────────────────────────────────────────────────
const GOLD   = "#D4AF37"
const GOLD_Y = "#F4D03F"

// ── Durée depuis auj. (badge "dans X jours") ─────────────────────
function DaysChip({ dateStr }: { dateStr: string }) {
  const n = daysUntil(dateStr)
  if (n > 60) return null
  const urgent = n <= 14
  const color  = urgent ? "#EF4444" : GOLD_Y
  return (
    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {n <= 0 ? "Aujourd'hui !" : n === 1 ? "Demain" : `Dans ${n} j`}
    </span>
  )
}

// ── Badge type de course ──────────────────────────────────────────
function TypeBadge({ type, small }: { type: string; small?: boolean }) {
  const color = TYPE_COLORS[type] ?? "#888"
  const emoji = TYPE_EMOJIS[type] ?? "🏃"
  const label = TYPE_LABELS[type] ?? type
  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-full ${small ? "text-[9px] px-2 py-0.5" : "text-[10px] px-2.5 py-1"}`}
      style={{ background: `${color}18`, color, border: `1px solid ${color}28` }}>
      <span>{emoji}</span>{label}
    </span>
  )
}

// ── Pill de distance ──────────────────────────────────────────────
function DistancePill({ label }: { label: string }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg"
      style={{ background: "rgba(255,255,255,0.07)", color: "rgba(250,250,250,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
      {label}
    </span>
  )
}

// ── Skeleton loader ───────────────────────────────────────────────
function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="h-0.5 w-full animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex justify-between">
          <div className="h-4 w-24 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-4 w-16 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
        <div className="h-6 w-3/4 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="h-3 w-full rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="h-3 w-2/3 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="flex gap-2 mt-1">
          {[0,1,2].map(i => (
            <div key={i} className="h-6 w-16 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ── État vide ─────────────────────────────────────────────────────
function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center text-center gap-5 py-14 px-6 rounded-2xl"
      style={lgStyle("rgba(255,255,255,0.02)")}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="text-5xl"
      >
        🏁
      </motion.div>
      <div>
        <h3 className="text-base font-bold mb-2" style={{ color: "#FAFAFA" }}>
          {hasFilters ? "Aucune course trouvée" : "Pas de course à venir"}
        </h3>
        <p className="text-[12px] leading-relaxed max-w-xs" style={{ color: "rgba(250,250,250,0.45)" }}>
          {hasFilters
            ? "Aucun événement ne correspond à tes critères. Essaie de modifier ou supprimer les filtres actifs."
            : "Aucune course n'est planifiée dans les 6 prochains mois pour cette région. Reviens bientôt !"}
        </p>
      </div>
      {hasFilters && (
        <button
          onClick={() => { hapticFeedback(); onReset() }}
          className="touch-feedback flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm"
          style={{ ...lgStyle("rgba(244,208,63,0.10)"), color: GOLD_Y, border: `1px solid rgba(244,208,63,0.28)` }}
        >
          <X size={14} /> Réinitialiser les filtres
        </button>
      )}
    </motion.div>
  )
}

// ── Carte événement ───────────────────────────────────────────────
function RaceCard({ race, idx }: { race: RaceEvent; idx: number }) {
  const color = TYPE_COLORS[race.type] ?? "#888"
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: idx * 0.06, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      layout
      className="rounded-2xl overflow-hidden group"
      style={lgStyle("rgba(255,255,255,0.03)")}
      whileHover={{ y: -3, boxShadow: `0 14px 36px rgba(0,0,0,0.45), 0 0 0 1px ${color}22` }}
      aria-label={`Événement : ${race.name}`}
    >
      {/* Barre de couleur type */}
      <div className="h-0.5 w-full"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}33)` }} />

      {/* Lueur featured */}
      {race.featured && (
        <div className="h-px w-full"
          style={{ background: `linear-gradient(90deg, transparent, ${color}55, transparent)` }} />
      )}

      <div className="p-4">
        {/* ── Top row ── */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <TypeBadge type={race.type} small />
            {race.featured && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}28` }}>
                <Sparkles size={8} /> Incontournable
              </span>
            )}
            <DaysChip dateStr={race.date} />
          </div>
          {race.edition && (
            <span className="text-[9px] font-semibold flex-shrink-0" style={{ color: "rgba(250,250,250,0.28)" }}>
              {race.edition}e éd.
            </span>
          )}
        </div>

        {/* ── Nom ── */}
        <h3 className="text-[16px] font-black leading-tight mb-2.5 pr-2" style={{ color: "#FAFAFA" }}>
          {race.name}
        </h3>

        {/* ── Date & Lieu ── */}
        <div className="flex flex-col gap-1 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar size={11} style={{ color: "rgba(250,250,250,0.35)", flexShrink: 0 }} />
            <span className="text-[11px] font-semibold capitalize" style={{ color: "rgba(250,250,250,0.65)" }}>
              {formatDateFr(race.date)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={11} style={{ color: color, flexShrink: 0 }} />
            <span className="text-[11px] font-semibold" style={{ color: "rgba(250,250,250,0.65)" }}>
              {race.city} — {race.department}
            </span>
            {race.distanceFromBordeaux > 0 && (
              <span className="text-[10px]" style={{ color: "rgba(250,250,250,0.28)" }}>
                ({race.distanceFromBordeaux} km)
              </span>
            )}
          </div>
        </div>

        {/* ── Distances ── */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {race.distances.map((d) => (
            <DistancePill key={d.label} label={d.label} />
          ))}
        </div>

        {/* ── Description ── */}
        <p className="text-[11px] leading-relaxed mb-3"
          style={{ color: "rgba(250,250,250,0.5)", display: "-webkit-box", WebkitLineClamp: expanded ? undefined : 2, WebkitBoxOrient: "vertical" as const, overflow: expanded ? "visible" : "hidden" }}>
          {race.description}
        </p>

        {/* ── Points forts (si expanded) ── */}
        <AnimatePresence>
          {expanded && race.highlights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 flex flex-wrap gap-1.5"
              style={{ overflow: "hidden" }}
            >
              {race.highlights.map((h) => (
                <span key={h} className="text-[10px] px-2 py-0.5 rounded-lg font-medium"
                  style={{ background: `${color}12`, color: `${color}cc`, border: `1px solid ${color}20` }}>
                  ✦ {h}
                </span>
              ))}
              {race.elevation && (
                <span className="text-[10px] px-2 py-0.5 rounded-lg font-medium flex items-center gap-1"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(250,250,250,0.5)" }}>
                  <Mountain size={9} /> {race.elevation.toLocaleString("fr-FR")} m D+
                </span>
              )}
              {race.maxParticipants && (
                <span className="text-[10px] px-2 py-0.5 rounded-lg font-medium flex items-center gap-1"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(250,250,250,0.5)" }}>
                  <Users size={9} /> {race.maxParticipants.toLocaleString("fr-FR")} participants
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Actions ── */}
        <div className="flex items-center justify-between gap-2 pt-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => { hapticFeedback(); setExpanded(e => !e) }}
            className="touch-feedback text-[10px] font-semibold"
            style={{ color: "rgba(250,250,250,0.38)" }}
            aria-expanded={expanded}
          >
            {expanded ? "Moins d'infos ↑" : "Plus d'infos ↓"}
          </button>

          <a
            href={race.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={hapticFeedback}
            aria-label={`En savoir plus sur ${race.name}`}
            className="touch-feedback flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-[12px] transition-all"
            style={{
              ...lgStyle(`${color}12`),
              color,
              border: `1px solid ${color}35`,
              minHeight: 36,
            }}
          >
            En savoir plus
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </motion.article>
  )
}

// ── Panneau de filtres ────────────────────────────────────────────
function FilterPanel({
  filters, updateFilter, availableMonths, hasActive, onReset,
}: {
  filters: ReturnType<typeof useRaces>["filters"]
  updateFilter: ReturnType<typeof useRaces>["updateFilter"]
  availableMonths: number[]
  hasActive: boolean
  onReset: () => void
}) {
  const types: Array<{ value: RaceType | "all"; label: string; emoji: string }> = [
    { value: "all",      label: "Tous",      emoji: "⚡" },
    { value: "route",    label: "Route",     emoji: "🏃" },
    { value: "trail",    label: "Trail",     emoji: "🌲" },
    { value: "marathon", label: "Marathon",  emoji: "🏆" },
    { value: "cross",    label: "Cross",     emoji: "🌿" },
    { value: "urban",    label: "Urbaine",   emoji: "🌃" },
  ]

  const distances: Array<{ value: number | "all"; label: string }> = [
    { value: "all",    label: "Toutes" },
    { value: 5,        label: "5 km" },
    { value: 10,       label: "10 km" },
    { value: 21.1,     label: "Semi" },
    { value: 42.195,   label: "Marathon" },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Types */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.20em] mb-2"
          style={{ color: "rgba(250,250,250,0.32)" }}>Type de course</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {types.map(({ value, label, emoji }) => {
            const active = filters.type === value
            const color  = value !== "all" ? TYPE_COLORS[value as string] : GOLD_Y
            return (
              <button
                key={value}
                onClick={() => { hapticFeedback(); updateFilter("type", value as RaceType | "all") }}
                className="touch-feedback flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-[11px] transition-all"
                style={{
                  ...(active ? lgStyle(`${color}15`) : lgStyle()),
                  color: active ? color : "rgba(250,250,250,0.5)",
                  border: active ? `1px solid ${color}35` : "1px solid rgba(255,255,255,0.10)",
                  minHeight: 34,
                }}
                aria-pressed={active}
              >
                <span>{emoji}</span>{label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Distances */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.20em] mb-2"
          style={{ color: "rgba(250,250,250,0.32)" }}>Distance</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {distances.map(({ value, label }) => {
            const active = filters.distance === value
            return (
              <button
                key={String(value)}
                onClick={() => { hapticFeedback(); updateFilter("distance", value as number | "all") }}
                className="touch-feedback flex-shrink-0 px-3 py-1.5 rounded-xl font-semibold text-[11px] transition-all"
                style={{
                  ...(active ? lgStyle("rgba(168,85,247,0.15)") : lgStyle()),
                  color: active ? "#A855F7" : "rgba(250,250,250,0.5)",
                  border: active ? "1px solid rgba(168,85,247,0.35)" : "1px solid rgba(255,255,255,0.10)",
                  minHeight: 34,
                }}
                aria-pressed={active}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Mois */}
      {availableMonths.length > 0 && (
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.20em] mb-2"
            style={{ color: "rgba(250,250,250,0.32)" }}>Mois</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => { hapticFeedback(); updateFilter("month", "all") }}
              className="touch-feedback flex-shrink-0 px-3 py-1.5 rounded-xl font-semibold text-[11px]"
              style={{
                ...(filters.month === "all" ? lgStyle("rgba(244,208,63,0.12)") : lgStyle()),
                color: filters.month === "all" ? GOLD_Y : "rgba(250,250,250,0.5)",
                border: filters.month === "all" ? `1px solid rgba(244,208,63,0.28)` : "1px solid rgba(255,255,255,0.10)",
                minHeight: 34,
              }}
              aria-pressed={filters.month === "all"}
            >
              Tous
            </button>
            {availableMonths.map((m) => {
              const active = filters.month === m
              return (
                <button
                  key={m}
                  onClick={() => { hapticFeedback(); updateFilter("month", m) }}
                  className="touch-feedback flex-shrink-0 px-3 py-1.5 rounded-xl font-semibold text-[11px] whitespace-nowrap"
                  style={{
                    ...(active ? lgStyle("rgba(244,208,63,0.12)") : lgStyle()),
                    color: active ? GOLD_Y : "rgba(250,250,250,0.5)",
                    border: active ? `1px solid rgba(244,208,63,0.28)` : "1px solid rgba(255,255,255,0.10)",
                    minHeight: 34,
                  }}
                  aria-pressed={active}
                >
                  {MONTHS_FR[m]}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Reset si filtres actifs */}
      {hasActive && (
        <motion.button
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => { hapticFeedback(); onReset() }}
          className="touch-feedback self-start flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl"
          style={{ ...lgStyle("rgba(239,68,68,0.08)"), color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <X size={11} /> Effacer les filtres
        </motion.button>
      )}
    </div>
  )
}

// ── Compteur & tri header ─────────────────────────────────────────
function ResultsHeader({ total, loading }: { total: number; loading: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[11px] font-semibold" style={{ color: "rgba(250,250,250,0.4)" }}>
        {loading ? (
          <span className="animate-pulse">Chargement…</span>
        ) : (
          <span>
            <span style={{ color: "#FAFAFA", fontWeight: 700 }}>{total}</span>
            {total <= 1 ? " course trouvée" : " courses trouvées"}
          </span>
        )}
      </p>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold"
        style={{ color: "rgba(250,250,250,0.32)" }}>
        <ArrowUpDown size={10} />
        Par date
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════
export default function RacesPage() {
  const {
    events, total, loading, error,
    filters, updateFilter, resetFilters,
    hasActiveFilters, availableMonths,
    refresh,
  } = useRaces()

  const [showFilters, setShowFilters] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // Debounce recherche texte
  useEffect(() => {
    const t = setTimeout(() => {}, 300)
    return () => clearTimeout(t)
  }, [filters.search])

  return (
    <motion.div
      className="flex flex-col gap-5 pb-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Orbe décoratif ── */}
      <div aria-hidden className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-96 h-56 opacity-15"
        style={{ background: "radial-gradient(ellipse at center, #22C55E 0%, #3B82F6 50%, transparent 80%)", filter: "blur(50px)", zIndex: 0 }} />

      {/* ── Header ── */}
      <div className="relative z-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-0.5"
          style={{ color: "rgba(250,250,250,0.38)" }}>
          Région Bordeaux · 200 km
        </p>
        <h1 className="text-[26px] font-black tracking-tight leading-tight" style={{ color: "#FAFAFA" }}>
          Courses & Marathons<span style={{ color: GOLD_Y }}>.</span>
        </h1>
      </div>

      {/* ── Introduction ── */}
      <motion.div
        className="rounded-2xl p-4"
        style={lgStyle("rgba(34,197,94,0.05)")}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
      >
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <Medal size={14} style={{ color: "#22C55E" }} />
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: "rgba(250,250,250,0.62)" }}>
            Découvre toutes les courses à pied, trails et marathons des <strong style={{ color: "#FAFAFA" }}>6 prochains mois</strong>{" "}
            dans un rayon de <strong style={{ color: "#FAFAFA" }}>200 km autour de Bordeaux</strong>.
            Filtre par distance, type ou mois, et inscris-toi directement sur le site officiel.
          </p>
        </div>
      </motion.div>

      {/* ── Barre de recherche ── */}
      <div
        role="search"
        className="flex items-center gap-3 px-4 rounded-2xl"
        style={{ ...lgStyle(), height: 48, border: "1px solid rgba(255,255,255,0.12)" }}
      >
        <Search size={15} aria-hidden style={{ color: "rgba(250,250,250,0.35)", flexShrink: 0 }} />
        <input
          ref={searchRef}
          type="search"
          aria-label="Rechercher une course"
          placeholder="Rechercher une course, une ville…"
          value={filters.search}
          onChange={e => updateFilter("search", e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[rgba(250,250,250,0.28)]"
          style={{ color: "#FAFAFA" }}
        />
        {filters.search && (
          <button onClick={() => { hapticFeedback(); updateFilter("search", "") }}
            className="touch-feedback" aria-label="Effacer la recherche">
            <X size={14} style={{ color: "rgba(250,250,250,0.4)" }} />
          </button>
        )}
      </div>

      {/* ── Toggle filtres ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { hapticFeedback(); setShowFilters(f => !f) }}
          className="touch-feedback flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-[12px]"
          style={{
            ...(showFilters || hasActiveFilters ? lgStyle("rgba(244,208,63,0.10)") : lgStyle()),
            color: showFilters || hasActiveFilters ? GOLD_Y : "rgba(250,250,250,0.55)",
            border: showFilters || hasActiveFilters ? "1px solid rgba(244,208,63,0.28)" : "1px solid rgba(255,255,255,0.10)",
            minHeight: 38,
          }}
          aria-expanded={showFilters}
        >
          <Filter size={13} />
          Filtres
          {hasActiveFilters && (
            <span className="w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
              style={{ background: GOLD_Y, color: "#050505" }}>
              !
            </span>
          )}
        </button>

        <button
          onClick={() => { hapticFeedback(); refresh() }}
          disabled={loading}
          className="touch-feedback flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-[11px]"
          style={{ ...lgStyle(), color: "rgba(250,250,250,0.45)", minHeight: 38 }}
          aria-label="Actualiser les données"
        >
          <motion.div
            animate={loading ? { rotate: 360 } : { rotate: 0 }}
            transition={loading ? { duration: 0.9, repeat: Infinity, ease: "linear" } : {}}
          >
            <RefreshCw size={12} />
          </motion.div>
          {loading ? "Chargement…" : "Actualiser"}
        </button>

        {/* Prochain délai */}
        <div className="ml-auto flex items-center gap-1"
          style={{ color: "rgba(250,250,250,0.25)" }}>
          <Clock size={10} />
          <span className="text-[10px]">6 mois</span>
        </div>
      </div>

      {/* ── Panneau filtres ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            key="filters"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="rounded-2xl p-4" style={lgStyle("rgba(255,255,255,0.03)")}>
              <FilterPanel
                filters={filters}
                updateFilter={updateFilter}
                availableMonths={availableMonths}
                hasActive={hasActiveFilters}
                onReset={resetFilters}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Compteur résultats ── */}
      <ResultsHeader total={total} loading={loading} />

      {/* ── Erreur ── */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
          role="alert"
        >
          <X size={16} style={{ color: "#EF4444", flexShrink: 0 }} />
          <p className="text-[12px]" style={{ color: "rgba(250,250,250,0.7)" }}>{error}</p>
        </motion.div>
      )}

      {/* ── Liste des courses ── */}
      <section aria-label="Liste des courses et marathons">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeletons" className="flex flex-col gap-3">
              {[0, 1, 2, 3].map(i => <SkeletonCard key={i} delay={i * 0.06} />)}
            </motion.div>
          ) : events.length === 0 ? (
            <motion.div key="empty">
              <EmptyState hasFilters={hasActiveFilters} onReset={resetFilters} />
            </motion.div>
          ) : (
            <motion.div key="list" className="flex flex-col gap-3">
              <AnimatePresence>
                {events.map((race, i) => (
                  <RaceCard key={race.id} race={race} idx={i} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── CTA Bas de page ── */}
      {!loading && events.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={lgStyle("rgba(212,175,55,0.05)")}
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} style={{ color: GOLD }} />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>
              Prépare ta prochaine course
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/forecasts"
              onClick={hapticFeedback}
              className="touch-feedback flex items-center justify-between px-4 py-3 rounded-xl"
              style={lgStyle("rgba(99,102,241,0.08)")}
            >
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-0.5" style={{ color: "rgba(250,250,250,0.35)" }}>Analyse</p>
                <p className="text-sm font-bold" style={{ color: "#FAFAFA" }}>🔮 Voir mes prévisions de temps</p>
              </div>
              <ChevronRight size={14} style={{ color: "rgba(250,250,250,0.3)" }} />
            </Link>
            <Link
              href="/runs/new"
              onClick={hapticFeedback}
              className="touch-feedback flex items-center justify-between px-4 py-3 rounded-xl"
              style={lgStyle("rgba(34,197,94,0.08)")}
            >
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-0.5" style={{ color: "rgba(250,250,250,0.35)" }}>Entraînement</p>
                <p className="text-sm font-bold" style={{ color: "#FAFAFA" }}>🏃 Ajouter une sortie</p>
              </div>
              <ChevronRight size={14} style={{ color: "rgba(250,250,250,0.3)" }} />
            </Link>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
