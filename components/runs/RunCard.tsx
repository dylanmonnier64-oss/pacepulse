"use client"
import { motion } from "framer-motion"
import Link from "next/link"
import { TrendingUp, Clock, Mountain, Heart, ChevronRight, Pencil } from "lucide-react"
import type { Run } from "@/lib/types"
import {
  formatDistance, formatPace, formatDurationShort,
  formatDateShort, getRunTypeLabel, getRunTypeColor, getWeatherIcon,
} from "@/lib/utils"
import { formatGAP } from "@/lib/calculations"

interface RunCardProps {
  run: Run
  index?: number
}

export default function RunCard({ run, index = 0 }: RunCardProps) {
  const typeColor = getRunTypeColor(run.type)
  const hasPR = run.isPersonalRecord && Object.keys(run.isPersonalRecord).length > 0
  const gap = run.elevation > 0 ? formatGAP(run.pace, run.elevation, run.distance) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.045, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, boxShadow: `0 14px 40px rgba(0,0,0,0.4), 0 0 0 1px ${typeColor}28` }}
    >
      <Link href={`/runs/${run.id}`}>
        <div
          className="relative rounded-[22px] overflow-hidden touch-feedback"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Left gradient accent */}
          <div
            className="absolute left-0 top-0 bottom-0 w-[3px]"
            style={{
              background: `linear-gradient(180deg, ${typeColor}, ${typeColor}44)`,
              borderRadius: "3px 0 0 3px",
            }}
          />
          {/* Left color wash */}
          <div
            className="absolute left-0 top-0 bottom-0 w-24 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, ${typeColor}10 0%, transparent 100%)`,
            }}
          />

          <div className="pl-3 pr-4 py-4">
            {/* Top row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  {/* Type badge */}
                  <span
                    className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      background: `${typeColor}18`,
                      color: typeColor,
                      border: `1px solid ${typeColor}38`,
                    }}
                  >
                    {getRunTypeLabel(run.type)}
                  </span>
                  {hasPR && (
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(244,208,63,0.9)", color: "#050505" }}
                    >
                      🏆 PR
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-medium" style={{ color: "rgba(250,250,250,0.38)" }}>
                  {formatDateShort(run.date)}
                </p>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2">
                {run.weather && (
                  <span className="text-base">{getWeatherIcon(run.weather.conditions)}</span>
                )}
                <Link
                  href={`/runs/${run.id}/edit`}
                  onClick={e => e.stopPropagation()}
                  className="w-7 h-7 rounded-xl flex items-center justify-center touch-feedback"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Pencil size={12} style={{ color: "rgba(250,250,250,0.45)" }} />
                </Link>
                <ChevronRight size={16} style={{ color: "rgba(250,250,250,0.25)" }} />
              </div>
            </div>

            {/* Main stats row */}
            <div className="flex items-end gap-5">
              {/* Distance — prominent */}
              <div>
                <span
                  className="data-mono text-[28px] font-black tracking-tight leading-none"
                  style={{ color: "#FAFAFA" }}
                >
                  {formatDistance(run.distance)}
                </span>
                <span className="text-[11px] font-semibold ml-1" style={{ color: "rgba(250,250,250,0.38)" }}>
                  km
                </span>
              </div>

              {/* Secondary stats */}
              <div className="flex items-center gap-3.5 pb-0.5 flex-1 flex-wrap">
                <div className="flex items-center gap-1">
                  <TrendingUp size={11} style={{ color: "rgba(250,250,250,0.38)" }} />
                  <span className="data-mono text-[13px] font-bold" style={{ color: "rgba(250,250,250,0.8)" }}>
                    {formatPace(run.pace)}
                  </span>
                  <span className="text-[9px]" style={{ color: "rgba(250,250,250,0.35)" }}>/km</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={11} style={{ color: "rgba(250,250,250,0.38)" }} />
                  <span className="data-mono text-[13px] font-bold" style={{ color: "rgba(250,250,250,0.8)" }}>
                    {formatDurationShort(run.duration)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Mountain size={11} style={{ color: "rgba(250,250,250,0.38)" }} />
                  <span className="data-mono text-[13px] font-bold" style={{ color: "rgba(250,250,250,0.8)" }}>
                    +{run.elevation}m
                  </span>
                </div>
                {gap && (
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold uppercase" style={{ color: "var(--gold)", opacity: 0.8 }}>GAP</span>
                    <span className="data-mono text-[13px] font-bold" style={{ color: "var(--gold)" }}>
                      {gap}
                    </span>
                  </div>
                )}
                {run.heartRate && (
                  <div className="flex items-center gap-1">
                    <Heart size={11} style={{ color: "#EF4444" }} />
                    <span className="data-mono text-[13px] font-bold" style={{ color: "rgba(250,250,250,0.8)" }}>
                      {run.heartRate.avg}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Feeling bar */}
            <div className="mt-3 flex items-center gap-2">
              <div
                className="h-1 rounded-full overflow-hidden flex-1"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(run.feeling / 10) * 100}%`,
                    background: `linear-gradient(90deg, ${typeColor}88, ${typeColor})`,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
              <span className="text-[9px] font-semibold" style={{ color: "rgba(250,250,250,0.3)" }}>
                {run.feeling}/10
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
