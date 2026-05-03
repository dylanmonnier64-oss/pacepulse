"use client"
import { useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { TrendingUp, Clock, Mountain, Heart } from "lucide-react"
import type { Run } from "@/lib/types"
import {
  formatDistance, formatPace, formatDurationShort,
  formatDateShort, getRunTypeLabel, getRunTypeColor,
} from "@/lib/utils"

export default function HeroCard({ run }: { run: Run }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const typeColor = getRunTypeColor(run.type)

  /* ── 3‑D tilt ── */
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const rotX = useSpring(useTransform(rawY, [-160, 160], [5, -5]), { stiffness: 280, damping: 32 })
  const rotY = useSpring(useTransform(rawX, [-160, 160], [-5, 5]), { stiffness: 280, damping: 32 })

  function onPointerMove(e: React.PointerEvent) {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    rawX.set(e.clientX - rect.left - rect.width / 2)
    rawY.set(e.clientY - rect.top - rect.height / 2)
  }
  function onPointerLeave() { rawX.set(0); rawY.set(0) }

  const feelingPct = (run.feeling / 10) * 100
  const hasPR = run.isPersonalRecord && Object.keys(run.isPersonalRecord).length > 0

  const stats = [
    { icon: TrendingUp, value: formatPace(run.pace),         unit: "/km" },
    { icon: Clock,      value: formatDurationShort(run.duration), unit: "" },
    { icon: Mountain,   value: `+${run.elevation}m`,         unit: "" },
    ...(run.heartRate ? [{ icon: Heart, value: `${run.heartRate.avg}`, unit: "bpm" }] : []),
  ]

  return (
    <motion.div
      ref={cardRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
        className="relative rounded-3xl"
      >
        {/* ── Gradient border shell ── */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            padding: 1,
            background: "linear-gradient(135deg, rgba(244,208,63,0.7) 0%, rgba(255,107,26,0.4) 45%, rgba(168,85,247,0.6) 100%)",
            borderRadius: 24,
          }}
        >
          <div className="absolute inset-px rounded-3xl" style={{ background: "#0c0c0c", borderRadius: 23 }} />
        </div>

        {/* ── Dark inner background ── */}
        <div className="absolute inset-px rounded-3xl overflow-hidden" style={{ borderRadius: 23 }}>
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, #100800 0%, #0b0014 55%, #080505 100%)" }} />

          {/* Orb gold */}
          <motion.div
            animate={{ top: ["8%", "14%", "8%"], left: ["6%", "68%", "6%"] }}
            transition={{ duration: 13, repeat: Infinity, ease: "linear" }}
            className="absolute w-40 h-40 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(244,208,63,0.32) 0%, transparent 70%)", filter: "blur(28px)" }}
          />
          {/* Orb purple */}
          <motion.div
            animate={{ top: ["62%", "8%", "62%"], left: ["68%", "55%", "68%"] }}
            transition={{ duration: 17, repeat: Infinity, ease: "linear" }}
            className="absolute w-48 h-48 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(168,85,247,0.28) 0%, transparent 70%)", filter: "blur(36px)" }}
          />
          {/* Orb orange */}
          <motion.div
            animate={{ top: ["72%", "68%", "72%"], left: ["4%", "46%", "4%"] }}
            transition={{ duration: 21, repeat: Infinity, ease: "linear" }}
            className="absolute w-32 h-32 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(255,107,26,0.22) 0%, transparent 70%)", filter: "blur(20px)" }}
          />

          {/* Noise grain */}
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              mixBlendMode: "screen",
            }}
          />
        </div>

        {/* ── Content ── */}
        <div className="relative z-10 p-5 flex flex-col" style={{ minHeight: 228 }}>

          {/* Header row */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-1.5"
                style={{ color: "rgba(250,250,250,0.38)" }}>
                Dernière sortie · {formatDateShort(run.date)}
              </p>
              <span
                className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{
                  background: `${typeColor}18`,
                  color: typeColor,
                  border: `1px solid ${typeColor}40`,
                }}
              >
                {getRunTypeLabel(run.type)}
              </span>
            </div>
            {hasPR && (
              <span
                className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ background: "rgba(244,208,63,0.92)", color: "#050505" }}
              >
                🏆 PR
              </span>
            )}
          </div>

          {/* Big distance */}
          <div className="flex items-baseline gap-2 mb-2">
            <span
              className="font-black tracking-tight stat-num leading-none"
              style={{
                fontSize: 64,
                color: "#FAFAFA",
                textShadow: "0 0 32px rgba(244,208,63,0.45), 0 0 80px rgba(244,208,63,0.18)",
              }}
            >
              {formatDistance(run.distance)}
            </span>
            <span className="text-2xl font-semibold" style={{ color: "rgba(250,250,250,0.45)" }}>km</span>
          </div>

          {/* Feeling bar */}
          <div className="mb-4">
            <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${feelingPct}%` }}
                transition={{ delay: 0.45, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #F4D03F, #FF6B1A, #A855F7)" }}
              />
            </div>
            <p className="text-[9px] mt-1" style={{ color: "rgba(250,250,250,0.28)" }}>
              Ressenti {run.feeling}/10
            </p>
          </div>

          {/* Stat pills */}
          <div className="flex items-center gap-2 mt-auto flex-wrap">
            {stats.map(({ icon: Icon, value, unit }, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Icon size={11} style={{ color: "rgba(250,250,250,0.45)" }} />
                <span className="text-xs font-bold stat-num" style={{ color: "#FAFAFA" }}>{value}</span>
                {unit && <span className="text-[9px]" style={{ color: "rgba(250,250,250,0.35)" }}>{unit}</span>}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
