"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { useRuns } from "@/hooks/useRuns"
import RunCard from "@/components/runs/RunCard"
import type { RunType } from "@/lib/types"
import { hapticFeedback } from "@/lib/utils"

const TYPE_FILTERS: Array<{ value: RunType | "all"; label: string }> = [
  { value: "all", label: "Tous" },
  { value: "endurance", label: "Endurance" },
  { value: "threshold", label: "Seuil" },
  { value: "interval", label: "Fractionné" },
  { value: "long", label: "Long" },
  { value: "recovery", label: "Récup" },
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Journal</p>
          <h1 className="text-2xl font-black tracking-tight">
            Mes Runs<span className="text-primary">.</span>
          </h1>
        </div>
        <Link
          href="/runs/new"
          onClick={hapticFeedback}
          className="touch-feedback flex items-center gap-1.5 px-4 py-2 rounded-2xl font-bold text-sm text-app no-select"
          style={{ background: "#F4D03F", minHeight: 44 }}
        >
          <Plus size={16} />
          Ajouter
        </Link>
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-3 px-4 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", height: 44 }}
      >
        <Search size={16} style={{ color: "rgba(245,245,245,0.4)" }} />
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
          style={{ background: "transparent !important", border: "none !important", padding: 0, borderRadius: 0 }}
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar no-select">
        {TYPE_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { hapticFeedback(); setFilter(value as RunType | "all") }}
            className="touch-feedback flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all"
            style={{
              background: filter === value ? "#F4D03F" : "rgba(255,255,255,0.06)",
              color: filter === value ? "#0A0A0A" : "rgba(245,245,245,0.7)",
              border: filter === value ? "none" : "1px solid rgba(255,255,255,0.1)",
              minHeight: 36,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stats summary */}
      <div
        className="rounded-2xl p-3 flex items-center gap-4"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="text-center flex-1">
          <p className="text-lg font-extrabold stat-num">{filtered.length}</p>
          <p className="text-[9px] text-text-muted uppercase tracking-wide">sorties</p>
        </div>
        <div className="text-center flex-1 border-x border-white/5">
          <p className="text-lg font-extrabold stat-num">
            {filtered.reduce((s, r) => s + r.distance, 0).toFixed(0)}
          </p>
          <p className="text-[9px] text-text-muted uppercase tracking-wide">km total</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-lg font-extrabold stat-num">
            {filtered.reduce((s, r) => s + r.elevation, 0)}
          </p>
          <p className="text-[9px] text-text-muted uppercase tracking-wide">m D+</p>
        </div>
      </div>

      {/* Run list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl h-24 animate-pulse"
              style={{ background: "rgba(255,255,255,0.04)" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-4xl">🏃</span>
          <p className="text-text-muted mt-3">Aucune sortie trouvée</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((run, idx) => (
            <RunCard key={run.id} run={run} index={idx} />
          ))}
        </div>
      )}
    </motion.div>
  )
}
