"use client"
import { motion } from "framer-motion"
import Link from "next/link"
import { TrendingUp, Clock, Mountain, Heart, ChevronRight } from "lucide-react"
import type { Run } from "@/lib/types"
import { formatDistance, formatPace, formatDurationShort, formatDateShort, getRunTypeLabel, getRunTypeColor, getWeatherIcon } from "@/lib/utils"
import Badge from "@/components/ui/Badge"

interface RunCardProps {
  run: Run
  index?: number
}

export default function RunCard({ run, index = 0 }: RunCardProps) {
  const typeColor = getRunTypeColor(run.type)
  const hasPR = run.isPersonalRecord && Object.keys(run.isPersonalRecord).length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <Link href={`/runs/${run.id}`}>
        <div
          className="rounded-2xl p-4 touch-feedback relative overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Left color accent */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
            style={{ background: typeColor }}
          />

          <div className="pl-2">
            {/* Top row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge color={typeColor}>{getRunTypeLabel(run.type)}</Badge>
                  {hasPR && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(244,208,63,0.9)", color: "#0A0A0A" }}>
                      🏆 PR
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-muted font-medium">{formatDateShort(run.date)}</p>
              </div>
              <div className="flex items-center gap-1">
                {run.weather && (
                  <span className="text-base">{getWeatherIcon(run.weather.conditions)}</span>
                )}
                <ChevronRight size={16} style={{ color: "rgba(245,245,245,0.3)" }} />
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-5">
              <div>
                <p className="text-2xl font-extrabold tracking-tight stat-num">{formatDistance(run.distance)}</p>
                <p className="text-[9px] text-text-muted uppercase tracking-wide">km</p>
              </div>
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-1">
                  <TrendingUp size={12} style={{ color: "rgba(245,245,245,0.4)" }} />
                  <span className="text-sm font-semibold stat-num">{formatPace(run.pace)}</span>
                  <span className="text-[9px] text-text-muted">/km</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} style={{ color: "rgba(245,245,245,0.4)" }} />
                  <span className="text-sm font-semibold">{formatDurationShort(run.duration)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mountain size={12} style={{ color: "rgba(245,245,245,0.4)" }} />
                  <span className="text-sm font-semibold stat-num">+{run.elevation}m</span>
                </div>
                {run.heartRate && (
                  <div className="flex items-center gap-1">
                    <Heart size={12} style={{ color: "#E74C3C" }} />
                    <span className="text-sm font-semibold stat-num">{run.heartRate.avg}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Feeling dots */}
            <div className="flex items-center gap-1 mt-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    width: 5,
                    height: 5,
                    background: i < run.feeling ? "#F4D03F" : "rgba(245,245,245,0.12)",
                  }}
                />
              ))}
              <span className="text-[9px] text-text-muted ml-1">{run.feeling}/10</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
