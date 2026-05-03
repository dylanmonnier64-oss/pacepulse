"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { useRuns } from "@/hooks/useRuns"
import RunCard from "@/components/runs/RunCard"
import type { RunType } from "@/lib/types"
import { hapticFeedback, lgStyle } from "@/lib/utils"

const TYPE_FILTERS: Array<{ value: RunType | "all"; label: string }> = [
  { value: "all",        label: "Tous" },
  { value: "endurance",  label: "Endurance" },
  { value: "threshold",  label: "Seuil" },
  { value: "interval",   label: "Fractionné" },
  { value: "long",       label: "Long" },
  { value: "recovery",   label: "Récup" },
]

export default function RunsPage() {
  const { runs, loading } = useRuns()
  const [filter, setFilter] = useState<RunType | "all">("all")
  const [search, setSearch] = useState("")

  const filtered = runs.filter((r) => {
    if (filter !== "all" && r.type !== filter) return false
    if (search && !r.notes.toLowerCase().includes(search.toLowerCase()) &&
      !r.distance.toString().includes(search)) return false
    return true
  })

  return (
    <motion.div className="flex flex-col gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "rgba(250,250,250,0.38)" }}>
            Journal
          </p>
          <h1 className="text-[26px] font-black tracking-tight" style={{ color: "#FAFAFA" }}>
            Mes Runs<span style={{ color: "#F4D03F" }}>.</span>
          </h1>
        </div>
        <Link
          href="/runs/new"
          onClick={hapticFeedback}
          aria-label="Ajouter une nouvelle sortie"
          className="touch-feedback flex items-center gap-1.5 px-4 py-2 rounded-2xl font-bold text-sm no-select"
          style={{
            ...lgStyle("rgba(244,208,63,0.10)"),
            color: "#F4D03F",
            border: "1px solid rgba(244,208,63,0.28)",
            minHeight: 44,
          }}
        >
          <Plus size={16} />
          Ajouter
        </Link>
      </div>

      {/* ── Recherche ── */}
      <div
        role="search"
        className="flex items-center gap-3 px-4 rounded-2xl"
        style={{
          ...lgStyle(),
          height: 48,
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <Search size={16} aria-hidden style={{ color: "rgba(250,250,250,0.38)" }} />
        <input
          type="search"
          id="search-runs"
          aria-label="Rechercher une sortie"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "#FAFAFA", background: "transparent", border: "none", padding: 0 }}
        />
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
          return (
            <button
              key={value}
              onClick={() => { hapticFeedback(); setFilter(value as RunType | "all") }}
              aria-pressed={active}
              className="touch-feedback flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all"
              style={{
                ...(active ? lgStyle("rgba(244,208,63,0.15)") : lgStyle()),
                color: active ? "#F4D03F" : "rgba(250,250,250,0.60)",
                border: `1px solid ${active ? "rgba(244,208,63,0.35)" : "rgba(255,255,255,0.10)"}`,
                minHeight: 36,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* ── Résumé statistique ── */}
      <div
        className="rounded-[22px] p-3 flex items-center gap-4"
        style={lgStyle("rgba(255,255,255,0.03)")}
        aria-label={`${filtered.length} sorties, ${filtered.reduce((s, r) => s + r.distance, 0).toFixed(0)} km, ${filtered.reduce((s, r) => s + r.elevation, 0)} m de dénivelé`}
      >
        {[
          { value: String(filtered.length),                                              unit: "sorties" },
          { value: filtered.reduce((s, r) => s + r.distance, 0).toFixed(0),             unit: "km total" },
          { value: String(filtered.reduce((s, r) => s + r.elevation, 0)),               unit: "m D+" },
        ].map(({ value, unit }, i) => (
          <div key={unit} className={`text-center flex-1 ${i === 1 ? "border-x" : ""}`}
            style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <p className="text-lg font-extrabold stat-num" style={{ color: "#FAFAFA" }}>{value}</p>
            <p className="text-[9px] uppercase tracking-wide" style={{ color: "rgba(250,250,250,0.38)" }}>
              {unit}
            </p>
          </div>
        ))}
      </div>

      {/* ── Liste des sorties ── */}
      {loading ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Chargement des sorties">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-[22px] h-24 animate-pulse"
              style={{ background: "rgba(255,255,255,0.04)" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" role="status">
          <span className="text-4xl" aria-hidden>🏃</span>
          <p className="mt-3" style={{ color: "rgba(250,250,250,0.45)" }}>
            {search ? `Aucun résultat pour « ${search} »` : "Aucune sortie trouvée"}
          </p>
        </div>
      ) : (
        <ol className="flex flex-col gap-3" aria-label={`${filtered.length} sortie${filtered.length > 1 ? "s" : ""}`}>
          {filtered.map((run, idx) => (
            <li key={run.id}>
              <RunCard run={run} index={idx} />
            </li>
          ))}
        </ol>
      )}
    </motion.div>
  )
}
