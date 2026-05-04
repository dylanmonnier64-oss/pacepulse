"use client"
import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  Plus, Search, Flame, TrendingUp,
  Calendar, Mountain, X, ChevronDown,
} from "lucide-react"
import { useRuns } from "@/hooks/useRuns"
import RunCard from "@/components/runs/RunCard"
import type { Run, RunType } from "@/lib/types"
import { hapticFeedback, lgStyle, isSameWeek, isSameMonth, formatDurationShort } from "@/lib/utils"
import { colors, transitions, runTypeTokens, glass } from "@/lib/design-system"

// ── Constantes ────────────────────────────────────────────────────
const GOLD   = colors.gold.bright
const TYPE_FILTERS: Array<{ value: RunType | "all"; label: string; emoji: string }> = [
  { value: "all",       label: "Tous ⚡",    emoji: "" },
  { value: "endurance", label: "Endurance",  emoji: "🫀" },
  { value: "threshold", label: "Seuil",      emoji: "🔥" },
  { value: "interval",  label: "Fractionné", emoji: "⚡" },
  { value: "long",      label: "Long",       emoji: "🌄" },
  { value: "recovery",  label: "Récup",      emoji: "🌿" },
]

// ── Helpers semaine/streak ────────────────────────────────────────
function getStreak(runs: Run[]): number {
  if (!runs.length) return 0
  const days = [...new Set(runs.map(r => r.date.split("T")[0]))].sort((a, b) => b.localeCompare(a))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < days.length; i++) {
    const expected = new Date(today)
    expected.setDate(today.getDate() - i)
    const expectedStr = expected.toISOString().split("T")[0]
    if (days[i] === expectedStr) streak++
    else break
  }
  return streak
}

function getWeekStats(runs: Run[]) {
  const week = runs.filter(r => isSameWeek(r.date))
  return {
    count:    week.length,
    km:       parseFloat(week.reduce((s, r) => s + r.distance, 0).toFixed(1)),
    duration: week.reduce((s, r) => s + r.duration, 0),
    elev:     week.reduce((s, r) => s + r.elevation, 0),
  }
}

// ── Grouper par mois ──────────────────────────────────────────────
function groupByMonth(runs: Run[]): Array<{ label: string; runs: Run[] }> {
  const map = new Map<string, Run[]>()
  for (const r of runs) {
    const d    = new Date(r.date)
    const key  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const prev = map.get(key) ?? []
    map.set(key, [...prev, r])
  }
  return [...map.entries()].map(([key, items]) => {
    const [year, month] = key.split("-")
    const d = new Date(parseInt(year), parseInt(month) - 1)
    const label = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    return { label: label.charAt(0).toUpperCase() + label.slice(1), runs: items }
  })
}

// ── Hero Semaine ──────────────────────────────────────────────────
function WeekHero({ runs }: { runs: Run[] }) {
  const week = getWeekStats(runs)
  const streak = getStreak(runs)
  const totalMonth = runs.filter(r => isSameMonth(r.date)).reduce((s, r) => s + r.distance, 0)

  if (!runs.length) return null

  const stats = [
    { value: `${week.km}`, unit: "km", label: "cette semaine", color: GOLD },
    { value: String(week.count), unit: runs.length === 1 ? "run" : "runs", label: "7 derniers jours", color: "#A855F7" },
    { value: `${Math.round(totalMonth)}`, unit: "km", label: "ce mois", color: "#3B82F6" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, ...transitions.reveal }}
      className="rounded-[24px] overflow-hidden relative"
      style={{ ...glass.card, background: "rgba(255,255,255,0.04)" }}
    >
      {/* Gradient de fond */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top left, rgba(212,175,55,0.08) 0%, transparent 65%)" }} />

      <div className="relative p-4">
        {/* Label + streak */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(212,175,55,0.15)" }}>
              <TrendingUp size={12} style={{ color: GOLD }} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: colors.text.label }}>
              Résumé hebdo
            </p>
          </div>
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{ background: "rgba(255,107,26,0.15)", border: "1px solid rgba(255,107,26,0.3)" }}
            >
              <Flame size={11} style={{ color: "#FF6B1A" }} />
              <span className="text-[10px] font-black" style={{ color: "#FF6B1A" }}>{streak}j</span>
            </motion.div>
          )}
        </div>

        {/* Stats en 3 colonnes */}
        <div className="grid grid-cols-3 gap-2">
          {stats.map(({ value, unit, label, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06, ...transitions.reveal }}
              className={`text-center py-2 ${i === 1 ? "border-x" : ""}`}
              style={{ borderColor: "rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-baseline justify-center gap-0.5">
                <span className="text-[20px] font-black data-mono" style={{ color: "#FAFAFA" }}>{value}</span>
                <span className="text-[10px] font-bold" style={{ color }}>{unit}</span>
              </div>
              <p className="text-[9px] mt-0.5" style={{ color: colors.text.subtle }}>{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Barre durée semaine */}
        {week.duration > 0 && (
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar size={10} style={{ color: colors.text.subtle }} />
                <span className="text-[10px]" style={{ color: colors.text.muted }}>
                  {formatDurationShort(week.duration)} en mouvement
                </span>
              </div>
              {week.elev > 0 && (
                <div className="flex items-center gap-1">
                  <Mountain size={10} style={{ color: colors.text.subtle }} />
                  <span className="text-[10px]" style={{ color: colors.text.muted }}>{week.elev} m D+</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Skeleton loader ───────────────────────────────────────────────
function SkeletonList() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Chargement des sorties">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.07 }}
          className="rounded-[22px] overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="p-4 flex flex-col gap-3">
            <div className="flex justify-between">
              <div className="h-4 w-20 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
              <div className="h-4 w-14 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
            </div>
            <div className="h-8 w-24 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="flex gap-3">
              {[0,1,2].map(j => (
                <div key={j} className="h-3 flex-1 rounded-full animate-pulse"
                  style={{ background: "rgba(255,255,255,0.04)", animationDelay: `${j * 0.15}s` }} />
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ── État vide ─────────────────────────────────────────────────────
function EmptyState({ search, filter }: { search: string; filter: string }) {
  const hasFilter = search || filter !== "all"
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center gap-4 py-14 px-6 rounded-[24px]"
      style={glass.surface}
      role="status"
    >
      <motion.span
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="text-5xl"
        aria-hidden
      >
        {hasFilter ? "🔍" : "🏃"}
      </motion.span>
      <div>
        <p className="text-base font-bold mb-1.5" style={{ color: "#FAFAFA" }}>
          {hasFilter ? "Aucun résultat" : "Aucune sortie enregistrée"}
        </p>
        <p className="text-[12px] leading-relaxed" style={{ color: colors.text.muted }}>
          {search
            ? `Aucun run ne correspond à « ${search} ». Essaie un autre terme.`
            : filter !== "all"
            ? `Aucun run de type "${filter}" trouvé.`
            : "Commence par ajouter ta première sortie ou connecte ton compte Strava."}
        </p>
      </div>
      {!hasFilter && (
        <Link
          href="/runs/new"
          onClick={hapticFeedback}
          className="touch-feedback flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm"
          style={{ ...lgStyle(colors.gold.tint10), color: GOLD, border: `1px solid ${colors.border.gold}` }}
        >
          <Plus size={15} /> Ajouter un run
        </Link>
      )}
    </motion.div>
  )
}

// ── Mois label ────────────────────────────────────────────────────
function MonthLabel({ label, count, km }: { label: string; count: number; km: number }) {
  return (
    <div className="flex items-center justify-between px-1 mb-2">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: colors.text.label }}>
        {label}
      </h2>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold" style={{ color: colors.text.subtle }}>
          {count} run{count > 1 ? "s" : ""} · {km.toFixed(0)} km
        </span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════
export default function RunsPage() {
  const { runs, loading } = useRuns()
  const [filter, setFilter] = useState<RunType | "all">("all")
  const [search, setSearch]  = useState("")
  const [showAllMonths, setShowAllMonths] = useState(false)

  const filtered = useMemo(() => runs.filter((r) => {
    if (filter !== "all" && r.type !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!r.notes.toLowerCase().includes(q) && !r.distance.toString().includes(q) &&
          !r.date.includes(q)) return false
    }
    return true
  }), [runs, filter, search])

  const grouped = useMemo(() => groupByMonth(filtered), [filtered])
  const displayed = showAllMonths ? grouped : grouped.slice(0, 3)

  return (
    <motion.div
      className="flex flex-col gap-4 pb-2"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.28 }}
    >
      {/* ── Orbe décoratif ── */}
      <div aria-hidden className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-72 h-40 opacity-20"
        style={{ background: "radial-gradient(ellipse, #D4AF37 0%, transparent 70%)", filter: "blur(44px)", zIndex: 0 }} />

      {/* ── Header ── */}
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: colors.text.muted }}>
            Journal
          </p>
          <h1 className="text-[26px] font-black tracking-tight" style={{ color: "#FAFAFA" }}>
            Mes Runs<span style={{ color: GOLD }}>.</span>
          </h1>
        </div>
        <Link
          href="/runs/new"
          onClick={hapticFeedback}
          aria-label="Ajouter une nouvelle sortie"
          className="touch-feedback flex items-center gap-1.5 px-4 py-2 rounded-2xl font-bold text-sm no-select"
          style={{ ...lgStyle(colors.gold.tint10), color: GOLD, border: `1px solid ${colors.border.gold}`, minHeight: 44 }}
        >
          <Plus size={16} />
          Ajouter
        </Link>
      </div>

      {/* ── Hero hebdo ── */}
      <WeekHero runs={runs} />

      {/* ── Recherche ── */}
      <div
        role="search"
        className="flex items-center gap-3 px-4 rounded-2xl"
        style={{ ...lgStyle(), height: 48, border: "1px solid rgba(255,255,255,0.12)" }}
      >
        <Search size={15} aria-hidden style={{ color: colors.text.muted }} />
        <input
          type="search"
          id="search-runs"
          aria-label="Rechercher une sortie"
          placeholder="Rechercher un run, une distance…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-[rgba(250,250,250,0.28)]"
          style={{ color: "#FAFAFA" }}
        />
        <AnimatePresence>
          {search && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => { hapticFeedback(); setSearch("") }}
              aria-label="Effacer"
              className="touch-feedback w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <X size={12} style={{ color: colors.text.muted }} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Filtres par type ── */}
      <div
        role="group"
        aria-label="Filtrer par type de sortie"
        className="flex gap-2 overflow-x-auto pb-1 no-select"
        style={{ scrollbarWidth: "none" }}
      >
        {TYPE_FILTERS.map(({ value, label }) => {
          const active = filter === value
          const token  = value !== "all" ? runTypeTokens[value as RunType] : null
          const color  = token?.color ?? GOLD
          return (
            <motion.button
              key={value}
              onClick={() => { hapticFeedback(); setFilter(value as RunType | "all") }}
              aria-pressed={active}
              className="touch-feedback flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold"
              style={{
                ...(active ? lgStyle(`${color}15`) : lgStyle()),
                color: active ? color : "rgba(250,250,250,0.55)",
                border: `1px solid ${active ? `${color}35` : "rgba(255,255,255,0.10)"}`,
                minHeight: 36,
              }}
              whileTap={{ scale: 0.94 }}
              transition={transitions.snappy}
            >
              {label}
            </motion.button>
          )
        })}
      </div>

      {/* ── Résumé stats (filtré) ── */}
      <motion.div
        layout
        className="rounded-[22px] p-3 flex items-center gap-4"
        style={lgStyle("rgba(255,255,255,0.03)")}
        aria-label="Résumé des runs filtrés"
      >
        {[
          { value: String(filtered.length),                                             unit: "sorties" },
          { value: filtered.reduce((s, r) => s + r.distance, 0).toFixed(0),            unit: "km total" },
          { value: String(filtered.reduce((s, r) => s + r.elevation, 0)),              unit: "m D+"     },
        ].map(({ value, unit }, i) => (
          <div key={unit} className={`text-center flex-1 ${i === 1 ? "border-x" : ""}`}
            style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <p className="text-lg font-extrabold data-mono" style={{ color: "#FAFAFA" }}>{value}</p>
            <p className="text-[9px] uppercase tracking-wide" style={{ color: colors.text.muted }}>{unit}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Liste des sorties ── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SkeletonList />
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmptyState search={search} filter={filter} />
          </motion.div>
        ) : (
          <motion.div key="list" className="flex flex-col gap-5">
            {displayed.map(({ label, runs: monthRuns }, gi) => (
              <motion.section
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.05, ...transitions.reveal }}
                aria-label={`Sorties de ${label}`}
              >
                <MonthLabel
                  label={label}
                  count={monthRuns.length}
                  km={monthRuns.reduce((s, r) => s + r.distance, 0)}
                />
                <ol className="flex flex-col gap-3">
                  {monthRuns.map((run, idx) => (
                    <motion.li
                      key={run.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: gi * 0.03 + idx * 0.06, ...transitions.reveal }}
                    >
                      <RunCard run={run} index={idx} />
                    </motion.li>
                  ))}
                </ol>
              </motion.section>
            ))}

            {/* Voir plus */}
            {grouped.length > 3 && (
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                onClick={() => { hapticFeedback(); setShowAllMonths(v => !v) }}
                className="touch-feedback flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm"
                style={{ ...lgStyle(), color: colors.text.muted }}
              >
                <motion.div animate={{ rotate: showAllMonths ? 180 : 0 }} transition={transitions.snappy}>
                  <ChevronDown size={15} />
                </motion.div>
                {showAllMonths ? "Afficher moins" : `Voir ${grouped.length - 3} mois de plus`}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
