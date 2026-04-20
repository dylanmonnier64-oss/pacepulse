"use client"
import { motion } from "framer-motion"
import { MapPin, Clock, TrendingUp, Mountain, Star } from "lucide-react"
import type { Run } from "@/lib/types"
import { formatDistance, formatPace, formatDurationShort, formatDateShort, getRunTypeLabel, getRunTypeColor } from "@/lib/utils"
import Badge from "@/components/ui/Badge"

export default function HeroCard({ run }: { run: Run }) {
  const typeColor = getRunTypeColor(run.type)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="relative overflow-hidden rounded-3xl"
      style={{ minHeight: 220 }}
    >
      {/* ZoomX gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #E67E22 0%, #C0392B 35%, #9B59B6 100%)",
          backgroundSize: "200% 200%",
          animation: "gradient-shift 8s ease infinite",
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          mixBlendMode: "overlay",
        }}
      />

      {/* Glow orbs */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-40"
        style={{ background: "radial-gradient(circle, rgba(244,208,63,0.6) 0%, transparent 70%)" }} />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, rgba(155,89,182,0.8) 0%, transparent 70%)" }} />

      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 rounded-3xl"
        style={{ background: "rgba(0,0,0,0.15)" }} />

      {/* Content */}
      <div className="relative z-10 p-5 flex flex-col h-full" style={{ minHeight: 220 }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">
              Dernière sortie · {formatDateShort(run.date)}
            </p>
            <Badge color={typeColor} className="border-white/30 bg-white/10">
              {getRunTypeLabel(run.type)}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={10}
                style={{ color: i < Math.round(run.feeling / 2) ? "#F4D03F" : "rgba(255,255,255,0.3)" }}
                fill={i < Math.round(run.feeling / 2) ? "#F4D03F" : "transparent"}
              />
            ))}
          </div>
        </div>

        {/* Big distance */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-6xl font-black tracking-tight text-white stat-num">
            {formatDistance(run.distance)}
          </span>
          <span className="text-2xl font-semibold text-white/70">km</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-auto">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-white/15">
              <TrendingUp size={13} className="text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-bold stat-num">{formatPace(run.pace)}</p>
              <p className="text-white/55 text-[9px] uppercase tracking-wide">min/km</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-white/15">
              <Clock size={13} className="text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-bold stat-num">{formatDurationShort(run.duration)}</p>
              <p className="text-white/55 text-[9px] uppercase tracking-wide">durée</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-white/15">
              <Mountain size={13} className="text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-bold stat-num">+{run.elevation}m</p>
              <p className="text-white/55 text-[9px] uppercase tracking-wide">D+</p>
            </div>
          </div>
          {run.heartRate && (
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-white/15">
                <MapPin size={13} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-bold stat-num">{run.heartRate.avg}</p>
                <p className="text-white/55 text-[9px] uppercase tracking-wide">bpm</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PR badges */}
      {run.isPersonalRecord && Object.keys(run.isPersonalRecord).length > 0 && (
        <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
          <span
            className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full"
            style={{ background: "rgba(244,208,63,0.9)", color: "#0A0A0A" }}
          >
            🏆 PR
          </span>
        </div>
      )}
    </motion.div>
  )
}
