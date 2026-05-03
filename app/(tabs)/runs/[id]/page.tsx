"use client"
import { use, useMemo } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, TrendingUp, Clock, Mountain, Heart, Star, Trash2, ImageIcon } from "lucide-react"
import { RaceCardGenerator } from "@/components/race/RaceCardGenerator"
import { useRuns } from "@/hooks/useRuns"
import type { Run } from "@/lib/types"
import {
  formatDistance, formatPace, formatDuration, formatDate,
  getRunTypeLabel, getRunTypeColor, getWeatherIcon
} from "@/lib/utils"
import { toast } from "@/lib/toast"
import GlassCard from "@/components/ui/GlassCard"
import Badge from "@/components/ui/Badge"
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell
} from "recharts"

function SplitChart({ splits }: { splits: Run["splits"] }) {
  if (!splits?.length) return null
  const avgPace = splits.reduce((s, sp) => s + sp.pace, 0) / splits.length

  return (
    <GlassCard className="p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
        Splits par kilomètre
      </p>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={splits} barSize={18}>
          <XAxis
            dataKey="km"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fill: "rgba(245,245,245,0.4)" }}
            tickFormatter={(v) => `${v}`}
          />
          <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
          <Tooltip
            formatter={(val: unknown) => [formatPace(val as number), "Allure"]}
            contentStyle={{
              background: "rgba(20,20,20,0.95)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              fontSize: 11,
            }}
          />
          <Bar dataKey="pace" radius={[4, 4, 2, 2]}>
            {splits.map((sp, i) => (
              <Cell
                key={i}
                fill={sp.pace < avgPace * 0.97 ? "#27AE60" :
                      sp.pace > avgPace * 1.03 ? "#E74C3C" : "#F4D03F"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> Rapide</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Allure moy.</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger" /> Lent</span>
      </div>
    </GlassCard>
  )
}

export default function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { runs, removeRun } = useRuns()
  const run = runs.find((r) => r.id === id)

  if (!run) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="text-4xl">🔍</span>
        <p className="text-text-muted">Run introuvable</p>
        <Link href="/runs" className="text-primary font-semibold">← Retour</Link>
      </div>
    )
  }

  const typeColor = getRunTypeColor(run.type)

  return (
    <motion.div className="flex flex-col gap-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      {/* Back */}
      <div className="flex items-center justify-between">
        <Link href="/runs" aria-label="Retour à la liste des sorties"
          className="touch-feedback w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.06)" }}>
          <ArrowLeft size={18} aria-hidden />
        </Link>
        <button
          onClick={() => {
            if (confirm("Supprimer ce run ?")) {
              removeRun(run.id)
              toast.success("Sortie supprimée")
              window.history.back()
            }
          }}
          aria-label="Supprimer ce run"
          className="touch-feedback w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(231,76,60,0.15)", border: "1px solid rgba(231,76,60,0.3)" }}
        >
          <Trash2 size={16} aria-hidden style={{ color: "#E74C3C" }} />
        </button>
      </div>

      {/* Hero */}
      <div
        className="rounded-3xl p-5 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${typeColor}30, ${typeColor}10)`, border: `1px solid ${typeColor}40` }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <Badge color={typeColor}>{getRunTypeLabel(run.type)}</Badge>
            <p className="text-sm text-text-muted mt-1">{formatDate(run.date)}</p>
          </div>
          {run.isPersonalRecord && Object.keys(run.isPersonalRecord).length > 0 && (
            <span className="text-xs font-black px-2 py-1 rounded-full"
              style={{ background: "rgba(244,208,63,0.9)", color: "#0A0A0A" }}>
              🏆 Record perso
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-6xl font-black tracking-tight stat-num">{formatDistance(run.distance)}</span>
          <span className="text-2xl text-text-muted font-semibold">km</span>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Allure moy.", value: formatPace(run.pace), unit: "min/km", icon: TrendingUp, color: "#F4D03F" },
          { label: "Durée", value: formatDuration(run.duration), icon: Clock, color: "#3498DB" },
          { label: "Dénivelé +", value: `${run.elevation}m`, icon: Mountain, color: "#9B59B6" },
          run.heartRate
            ? { label: "FC moy.", value: String(run.heartRate.avg), unit: "bpm", icon: Heart, color: "#E74C3C" }
            : { label: "Ressenti", value: `${run.feeling}/10`, icon: Star, color: "#F4D03F" },
        ].map((stat, i) => (
          <GlassCard key={i} className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: `${stat.color}20` }}>
              <stat.icon size={16} style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-lg font-extrabold stat-num">{stat.value} {stat.unit || ""}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wide">{stat.label}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Splits */}
      {run.splits && <SplitChart splits={run.splits} />}

      {/* Feeling */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Ressenti</p>
          <span className="text-sm font-bold text-primary">{run.feeling}/10</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex-1 h-2 rounded-full"
              style={{ background: i < run.feeling ? "#F4D03F" : "rgba(245,245,245,0.1)" }} />
          ))}
        </div>
      </GlassCard>

      {/* Weather */}
      {run.weather && (
        <GlassCard className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Météo</p>
          <div className="flex items-center gap-4">
            <span className="text-3xl">{getWeatherIcon(run.weather.conditions)}</span>
            <div>
              <p className="font-bold">{run.weather.temp}°C</p>
              <p className="text-sm text-text-muted">Vent {run.weather.wind} km/h</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Notes */}
      {run.notes && (
        <GlassCard className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Notes</p>
          <p className="text-sm leading-relaxed">{run.notes}</p>
        </GlassCard>
      )}

      {/* Race Card Generator */}
      <div className="rounded-3xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon size={14} style={{ color: "#F4D03F" }} />
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(245,245,245,0.4)" }}>
            Race Card
          </p>
        </div>
        <RaceCardGenerator run={run} />
      </div>

      <div className="h-4" />
    </motion.div>
  )
}
