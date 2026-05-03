"use client"
import { useRef, useEffect, useCallback, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, Share2 } from "lucide-react"
import type { Run } from "@/lib/types"
import {
  formatPace, formatDistance, formatDuration,
  secondsToRaceTime, getRunTypeLabel, getRunTypeColor, hapticFeedback,
} from "@/lib/utils"
import { formatGAP } from "@/lib/calculations"

/* ── Canvas portrait 9:16 ── */
const W = 1080
const H = 1920

/* ── Pulse Index ─────────────────────────────────────────────────── */
function computePulseIndex(run: Run): number {
  if (run.heartRate) {
    const max = run.heartRate.max || Math.round(run.heartRate.avg * 1.08)
    return Math.min(100, Math.round((run.heartRate.avg / max) * 110 + (run.feeling - 5) * 2))
  }
  const base: Record<string, number> = { recovery: 22, endurance: 44, long: 52, threshold: 76, interval: 91 }
  return Math.min(100, (base[run.type] ?? 50) + Math.round((run.feeling - 5) * 2))
}

/* ── Abstract GPS path (SVG) ────────────────────────────────────── */
function buildSVGPath(run: Run): string {
  const splits = run.splits?.length ? run.splits : null
  const pts: [number, number][] = []

  if (splits) {
    const paces = splits.map(s => s.pace)
    const min = Math.min(...paces), max = Math.max(...paces), range = Math.max(max - min, 30)
    splits.forEach((s, i) => {
      const t = i / (splits.length - 1)
      pts.push([20 + t * 280, 130 - ((max - s.pace) / range) * 80])
    })
  } else {
    // Organic looping trace seeded by run data
    const seed = (run.distance * 317 + run.duration * 0.13) % 6
    const n = 72
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const angle = t * Math.PI * (2.7 + seed * 0.15)
      const rx = 108, ry = 60
      const wobble = Math.sin(angle * 3.1 + seed) * 22 + Math.cos(angle * 1.8 + seed * 0.5) * 14
      pts.push([160 + Math.cos(angle) * (rx + wobble), 110 + Math.sin(angle) * (ry + wobble * 0.6)])
    }
  }

  if (!pts.length) return ""
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i]
    d += ` Q ${ax.toFixed(1)} ${ay.toFixed(1)} ${((ax + bx) / 2).toFixed(1)} ${((ay + by) / 2).toFixed(1)}`
  }
  return d
}

/* ── Canvas hi-res render ────────────────────────────────────────── */
function drawCard(canvas: HTMLCanvasElement, run: Run) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  canvas.width = W; canvas.height = H
  const pi = computePulseIndex(run)
  const isElite = pi >= 80
  const hasPR = run.isPersonalRecord && Object.keys(run.isPersonalRecord).length > 0

  // Deep background
  ctx.fillStyle = "#060608"; ctx.fillRect(0, 0, W, H)
  const g1 = ctx.createRadialGradient(220, 360, 0, 220, 360, 680)
  g1.addColorStop(0, "rgba(212,175,55,0.09)"); g1.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H)
  const g2 = ctx.createRadialGradient(920, 1580, 0, 920, 1580, 600)
  g2.addColorStop(0, "rgba(155,89,182,0.10)"); g2.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H)

  // Noise grain
  ctx.save(); ctx.globalAlpha = 0.022
  for (let i = 0; i < 16000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.6})`
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1)
  }
  ctx.restore()

  // Golden gradient border 0.5px
  const bord = ctx.createLinearGradient(0, 0, W, H)
  bord.addColorStop(0, "rgba(212,175,55,0.9)"); bord.addColorStop(0.5, "rgba(244,208,63,0.5)")
  bord.addColorStop(1, "rgba(155,89,182,0.7)")
  ctx.strokeStyle = bord; ctx.lineWidth = 1
  ctx.beginPath(); ctx.roundRect(14, 14, W - 28, H - 28, 36); ctx.stroke()

  // ── Header ──
  const monoG = ctx.createLinearGradient(60, 80, 180, 120)
  monoG.addColorStop(0, "#F4D03F"); monoG.addColorStop(0.5, "#D4AF37"); monoG.addColorStop(1, "#B8962E")
  ctx.fillStyle = monoG; ctx.font = "bold 34px Arial, sans-serif"; ctx.textBaseline = "middle"; ctx.fillText("PP", 60, 100)
  ctx.fillStyle = "rgba(212,175,55,0.5)"; ctx.font = "300 16px Arial, sans-serif"; ctx.fillText("HERITAGE ELITE OS", 104, 100)

  const dStr = new Date(run.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
  ctx.save(); ctx.font = "300 19px Arial, sans-serif"; ctx.fillStyle = "rgba(245,245,245,0.38)"
  ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.fillText(dStr, W - 60, 100); ctx.textAlign = "left"; ctx.restore()

  const sepG = ctx.createLinearGradient(60, 0, W - 60, 0)
  sepG.addColorStop(0, "rgba(212,175,55,0.5)"); sepG.addColorStop(0.5, "rgba(244,208,63,0.2)"); sepG.addColorStop(1, "rgba(212,175,55,0.5)")
  ctx.strokeStyle = sepG; ctx.lineWidth = 0.5
  ctx.beginPath(); ctx.moveTo(60, 136); ctx.lineTo(W - 60, 136); ctx.stroke()

  // ── Hero Distance ──
  ctx.save()
  const distStr = formatDistance(run.distance)
  const fs = distStr.length <= 3 ? 320 : distStr.length <= 4 ? 260 : 210
  ctx.font = `900 ${fs}px Arial, sans-serif`; ctx.textBaseline = "top"
  const dw = ctx.measureText(distStr).width
  const dx = (W - dw) / 2 - 20, dy = 170
  const distG = ctx.createLinearGradient(dx, dy, dx + dw, dy + fs)
  distG.addColorStop(0, "#F4D03F"); distG.addColorStop(0.3, "#FFB347"); distG.addColorStop(0.65, "#E67E22"); distG.addColorStop(1, "#9B59B6")
  ctx.shadowColor = "#F4D03F"; ctx.shadowBlur = 72; ctx.fillStyle = distG; ctx.fillText(distStr, dx, dy)
  ctx.font = "300 68px Arial, sans-serif"; ctx.fillStyle = "rgba(245,245,245,0.38)"
  ctx.textBaseline = "alphabetic"; ctx.fillText("km", dx + dw + 20, dy + fs - 16)
  ctx.restore()

  // Type pill
  const tc = getRunTypeColor(run.type); const tl = getRunTypeLabel(run.type).toUpperCase()
  const pillY = dy + fs + 56
  ctx.save(); ctx.font = "700 26px Arial, sans-serif"
  const pw = ctx.measureText(tl).width + 56
  ctx.fillStyle = `${tc}20`; ctx.strokeStyle = `${tc}50`; ctx.lineWidth = 1
  ctx.beginPath(); ctx.roundRect((W - pw) / 2, pillY, pw, 48, 24); ctx.fill(); ctx.stroke()
  ctx.fillStyle = tc; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(tl, W / 2, pillY + 24)
  ctx.textAlign = "left"; ctx.restore()

  // ── GPS Gold Thread panel ──
  const gpsY = pillY + 76, gpsH = 420, gpsP = 60
  ctx.save()
  ctx.fillStyle = "#04040a"; ctx.strokeStyle = "rgba(212,175,55,0.15)"; ctx.lineWidth = 0.5
  ctx.beginPath(); ctx.roundRect(gpsP, gpsY, W - gpsP * 2, gpsH, 22); ctx.fill(); ctx.stroke()
  ctx.font = "600 18px Arial, sans-serif"; ctx.fillStyle = "rgba(212,175,55,0.38)"
  ctx.textBaseline = "top"; ctx.fillText("GPS TRACE", gpsP + 28, gpsY + 22)

  // Build path in canvas space
  const splits = run.splits?.length ? run.splits : null
  const cpts: [number, number][] = []
  const ppw = W - gpsP * 2 - 80, pph = gpsH - 90, ppx = gpsP + 40, ppy = gpsY + 55

  if (splits) {
    const paces = splits.map(s => s.pace)
    const mn = Math.min(...paces), mx = Math.max(...paces), rng = Math.max(mx - mn, 30)
    splits.forEach((s, i) => {
      cpts.push([ppx + (i / (splits.length - 1)) * ppw, ppy + pph - ((mx - s.pace) / rng) * pph * 0.7 - pph * 0.08])
    })
  } else {
    const n = 64, cx = ppx + ppw / 2, cy = ppy + pph / 2
    const rx = ppw * 0.38, ry = pph * 0.40
    const seed = (run.distance * 317 + run.duration * 0.13) % 6
    for (let i = 0; i <= n; i++) {
      const t = i / n, angle = t * Math.PI * (2.7 + seed * 0.15)
      const w = Math.sin(angle * 3.1 + seed) * rx * 0.2 + Math.cos(angle * 1.8 + seed * 0.5) * ry * 0.15
      cpts.push([cx + Math.cos(angle) * (rx + w), cy + Math.sin(angle) * (ry + w * 0.6)])
    }
  }

  if (cpts.length > 1) {
    const gg = ctx.createLinearGradient(ppx, 0, ppx + ppw, 0)
    gg.addColorStop(0, "#D4AF37"); gg.addColorStop(0.4, "#F4D03F"); gg.addColorStop(1, "#B8962E")
    ctx.save(); ctx.shadowColor = "rgba(212,175,55,0.9)"; ctx.shadowBlur = 18
    ctx.strokeStyle = gg; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round"
    ctx.beginPath(); ctx.moveTo(cpts[0][0], cpts[0][1])
    for (let i = 1; i < cpts.length; i++) {
      const [ax, ay] = cpts[i - 1], [bx, by] = cpts[i]
      ctx.quadraticCurveTo(ax, ay, (ax + bx) / 2, (ay + by) / 2)
    }
    ctx.stroke()
    ctx.globalAlpha = 0.55; ctx.lineWidth = 1; ctx.strokeStyle = "#FFFAD0"; ctx.stroke()
    ctx.restore()
    ctx.save(); ctx.fillStyle = "#F4D03F"; ctx.shadowColor = "#F4D03F"; ctx.shadowBlur = 14
    ctx.beginPath(); ctx.arc(cpts[0][0], cpts[0][1], 6, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  }

  ctx.font = "400 16px Arial, sans-serif"; ctx.fillStyle = "rgba(212,175,55,0.4)"
  ctx.textBaseline = "bottom"; ctx.fillText(`${run.distance.toFixed(2)} km  ·  +${run.elevation} m`, gpsP + 28, gpsY + gpsH - 20)
  ctx.restore()

  // ── 3-column Metrics ──
  const mY = gpsY + gpsH + 52
  const colW = (W - gpsP * 2) / 3
  const trailPct = Math.min(0.4, run.elevation / 500)
  const gap = run.elevation > 0 ? formatGAP(run.pace, run.elevation, run.distance) : null

  const cols = [
    { label: "CHRONO", value: secondsToRaceTime(run.duration), sub: null, color: "rgba(245,245,245,0.92)", glow: false },
    { label: "ALLURE", value: `${formatPace(run.pace)}/km`, sub: gap ? `GAP ${gap}` : null, color: "rgba(245,245,245,0.92)", subColor: "#D4AF37", glow: false },
    { label: "PULSE INDEX", value: String(pi), sub: "/100", color: pi >= 80 ? "#C77DFF" : "rgba(245,245,245,0.92)", subColor: "rgba(199,125,255,0.55)", glow: pi >= 80 },
  ]

  cols.forEach(({ label, value, sub, subColor, color, glow }, i) => {
    const cx = gpsP + i * colW, mx2 = cx + colW / 2
    if (i > 0) { ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(cx, mY); ctx.lineTo(cx, mY + 210); ctx.stroke() }
    ctx.save(); ctx.textAlign = "center"
    ctx.font = "600 18px Arial, sans-serif"; ctx.fillStyle = "rgba(245,245,245,0.28)"; ctx.textBaseline = "top"; ctx.fillText(label, mx2, mY)
    const vfs = value.length <= 5 ? 80 : 62
    ctx.font = `700 ${vfs}px Arial, sans-serif`
    if (glow) { ctx.shadowColor = "#C77DFF"; ctx.shadowBlur = 28 }
    ctx.fillStyle = color; ctx.textBaseline = "top"; ctx.fillText(value, mx2, mY + 32); ctx.shadowBlur = 0
    if (sub) {
      ctx.font = "500 22px Arial, sans-serif"; ctx.fillStyle = subColor || "rgba(245,245,245,0.35)"
      ctx.fillText(sub, mx2, mY + 32 + vfs + 14)
    }
    ctx.textAlign = "left"; ctx.restore()
  })

  // ── Surface bar ──
  const sY = mY + 260, sX = gpsP, sW = W - gpsP * 2
  ctx.font = "600 18px Arial, sans-serif"; ctx.fillStyle = "rgba(245,245,245,0.28)"; ctx.textBaseline = "top"; ctx.fillText("SURFACE", sX, sY)
  ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.beginPath(); ctx.roundRect(sX, sY + 32, sW, 12, 6); ctx.fill()
  const asp = 1 - trailPct
  const aspG = ctx.createLinearGradient(sX, 0, sX + sW * asp, 0)
  aspG.addColorStop(0, "#555"); aspG.addColorStop(1, "#333")
  ctx.fillStyle = aspG; ctx.beginPath(); ctx.roundRect(sX, sY + 32, sW * asp, 12, [6, 0, 0, 6]); ctx.fill()
  if (trailPct > 0) {
    const trG = ctx.createLinearGradient(sX + sW * asp, 0, sX + sW, 0)
    trG.addColorStop(0, "#4a6741"); trG.addColorStop(1, "#2d3e2a")
    ctx.fillStyle = trG; ctx.beginPath(); ctx.roundRect(sX + sW * asp, sY + 32, sW * trailPct, 12, [0, 6, 6, 0]); ctx.fill()
  }
  ctx.font = "400 18px Arial, sans-serif"; ctx.fillStyle = "rgba(245,245,245,0.38)"
  ctx.fillText(`Asphalte ${Math.round(asp * 100)}%`, sX, sY + 60)
  if (trailPct > 0) { ctx.textAlign = "right"; ctx.fillStyle = "rgba(120,160,100,0.7)"; ctx.fillText(`Trail ${Math.round(trailPct * 100)}%`, sX + sW, sY + 60); ctx.textAlign = "left" }

  // ── Badge ──
  if (hasPR || isElite) {
    const bY = sY + 100
    const bt = hasPR ? "🏆  RECORD PERSONNEL" : "⚡  ELITE PERFORMANCE"
    const bc = hasPR ? "#F4D03F" : "#C77DFF"
    ctx.save(); ctx.font = "700 28px Arial, sans-serif"
    const bw = ctx.measureText(bt).width + 64
    const bx = (W - bw) / 2
    ctx.fillStyle = `${bc}14`; ctx.strokeStyle = `${bc}50`; ctx.lineWidth = 1
    ctx.beginPath(); ctx.roundRect(bx, bY, bw, 56, 28); ctx.fill(); ctx.stroke()
    ctx.fillStyle = bc; ctx.shadowColor = bc; ctx.shadowBlur = 22
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(bt, W / 2, bY + 28)
    ctx.textAlign = "left"; ctx.restore()
  }

  // ── Footer ──
  const fY = H - 108
  const fSep = ctx.createLinearGradient(60, 0, W - 60, 0)
  fSep.addColorStop(0, "rgba(212,175,55,0)"); fSep.addColorStop(0.25, "rgba(212,175,55,0.4)"); fSep.addColorStop(0.75, "rgba(212,175,55,0.4)"); fSep.addColorStop(1, "rgba(212,175,55,0)")
  ctx.strokeStyle = fSep; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(60, fY - 16); ctx.lineTo(W - 60, fY - 16); ctx.stroke()
  ctx.textAlign = "center"; ctx.font = "700 30px Arial, sans-serif"; ctx.fillStyle = "#D4AF37"; ctx.textBaseline = "top"; ctx.fillText("PACEPULSE", W / 2, fY)
  ctx.font = "300 18px Arial, sans-serif"; ctx.fillStyle = "rgba(212,175,55,0.42)"; ctx.fillText("HERITAGE ELITE OS", W / 2, fY + 40)
  ctx.textAlign = "left"
}

/* ── SVG GPS component ───────────────────────────────────────────── */
function GPSTrace({ run }: { run: Run }) {
  const path = buildSVGPath(run)
  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ background: "#04040a", border: "0.5px solid rgba(212,175,55,0.15)", height: 160 }}>
      <p className="absolute top-2 left-3 text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(212,175,55,0.38)" }} aria-hidden>GPS Trace</p>
      <svg viewBox="0 0 320 160" className="w-full h-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <defs>
          <linearGradient id="goldThread" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#D4AF37" />
            <stop offset="40%"  stopColor="#F4D03F" />
            <stop offset="100%" stopColor="#B8962E" />
          </linearGradient>
          <filter id="gpsGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Soft outer glow */}
        <path d={path} fill="none" stroke="rgba(212,175,55,0.22)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        {/* Gold thread */}
        <path d={path} fill="none" stroke="url(#goldThread)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#gpsGlow)" />
        {/* Bright specular core */}
        <path d={path} fill="none" stroke="rgba(255,248,200,0.45)" strokeWidth="0.7" strokeLinecap="round" />
      </svg>
      <p className="absolute bottom-2 left-3 text-[9px]" style={{ color: "rgba(212,175,55,0.38)" }} aria-label={`Distance ${run.distance.toFixed(2)} km, dénivelé +${run.elevation}m`}>
        {run.distance.toFixed(2)} km · +{run.elevation}m
      </p>
    </div>
  )
}

/* ── Pulse Index badge ───────────────────────────────────────────── */
function PulseIndexBadge({ value }: { value: number }) {
  const hi = value >= 80
  return (
    <div className="flex flex-col items-center gap-0.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(245,245,245,0.28)" }}>
        Pulse Index
      </p>
      <motion.span
        className="data-mono font-black leading-none"
        style={{
          fontSize: 30,
          color: hi ? "#C77DFF" : "#F5F5F5",
          textShadow: hi ? "0 0 18px rgba(199,125,255,0.75), 0 0 48px rgba(199,125,255,0.35)" : "none",
        }}
        animate={hi ? { opacity: [1, 0.75, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        aria-label={`Pulse Index ${value} sur 100${hi ? ", haute intensité" : ""}`}
      >
        {value}
      </motion.span>
      <p className="text-[10px]" style={{ color: hi ? "rgba(199,125,255,0.5)" : "rgba(245,245,245,0.28)" }}>/ 100</p>
    </div>
  )
}

/* ── Main export ────────────────────────────────────────────────── */
export function RaceCardGenerator({ run }: { run: Run }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  const pi         = computePulseIndex(run)
  const isElite    = pi >= 80
  const hasPR      = run.isPersonalRecord && Object.keys(run.isPersonalRecord).length > 0
  const gap        = run.elevation > 0 ? formatGAP(run.pace, run.elevation, run.distance) : null
  const trailPct   = Math.min(40, Math.round(run.elevation / 5))
  const asphaltPct = 100 - trailPct
  const dateLabel  = new Date(run.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })

  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    drawCard(c, run); setReady(true)
  }, [run])

  const download = useCallback(() => {
    hapticFeedback()
    const c = canvasRef.current; if (!c) return
    const a = document.createElement("a")
    a.href = c.toDataURL("image/png")
    a.download = `pacepulse-elite-${run.date.split("T")[0]}.png`
    a.click()
  }, [run])

  const share = useCallback(() => {
    hapticFeedback()
    if (navigator.share) {
      navigator.share({ title: "PacePulse Elite Summary", text: `${formatDistance(run.distance)} km — PacePulse Heritage Elite OS` })
    }
  }, [run])

  return (
    <div className="flex flex-col gap-4">

      {/* ── Interactive React preview ── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl"
        style={{
          background: "linear-gradient(160deg, #0a080c 0%, #060608 55%, #08040c 100%)",
          boxShadow: [
            "inset 0 0 0 0.5px rgba(212,175,55,0.5)",
            "0 0 0 0.5px rgba(155,89,182,0.2)",
            "0 28px 72px rgba(0,0,0,0.75)",
          ].join(", "),
        }}
        role="img"
        aria-label={`Résumé Elite : ${formatDistance(run.distance)} km, durée ${formatDuration(run.duration)}, allure ${formatPace(run.pace)}/km, Pulse Index ${pi}/100`}
      >
        {/* Ambient glows */}
        <div className="absolute pointer-events-none" aria-hidden style={{ top: -50, left: -50, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.09) 0%, transparent 70%)", filter: "blur(28px)" }} />
        <div className="absolute pointer-events-none" aria-hidden style={{ bottom: -30, right: -30, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(155,89,182,0.11) 0%, transparent 70%)", filter: "blur(24px)" }} />

        <div className="relative z-10 p-5 flex flex-col gap-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="text-[15px] font-black leading-none"
                aria-hidden
                style={{ background: "linear-gradient(135deg, #F4D03F, #D4AF37, #B8962E)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                PP
              </span>
              <span className="text-[8px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(212,175,55,0.5)" }}>Heritage Elite OS</span>
            </div>
            <p className="text-[10px] font-light capitalize" style={{ color: "rgba(245,245,245,0.32)", fontFamily: "var(--font-mono)" }}>
              {dateLabel}
            </p>
          </div>

          {/* Hairline separator */}
          <div className="h-px" style={{ background: "linear-gradient(90deg, rgba(212,175,55,0.55), rgba(212,175,55,0.15), transparent)" }} aria-hidden />

          {/* HERO iridescent distance */}
          <div className="flex items-end gap-2">
            <span
              className="data-mono font-black leading-none tracking-tight"
              style={{
                fontSize: 68,
                background: "linear-gradient(135deg, #F4D03F 0%, #FFB347 30%, #E67E22 62%, #9B59B6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 18px rgba(244,208,63,0.4))",
              }}
              aria-label={`${formatDistance(run.distance)} kilomètres`}
            >
              {formatDistance(run.distance)}
            </span>
            <span className="text-xl font-light mb-2" style={{ color: "rgba(245,245,245,0.38)" }} aria-hidden>km</span>
          </div>

          {/* Type badge */}
          <div>
            <span
              className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
              style={{
                background: `${getRunTypeColor(run.type)}15`,
                color: getRunTypeColor(run.type),
                border: `0.5px solid ${getRunTypeColor(run.type)}44`,
              }}
            >
              {getRunTypeLabel(run.type)}
            </span>
          </div>

          {/* GPS trace */}
          <GPSTrace run={run} />

          {/* 3-column metrics */}
          <div className="grid grid-cols-3 gap-1 py-1">
            {/* Chrono */}
            <div className="flex flex-col items-center gap-0.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(245,245,245,0.28)" }}>Chrono</p>
              <span className="data-mono text-[18px] font-bold" style={{ color: "#F5F5F5" }}>
                {secondsToRaceTime(run.duration)}
              </span>
            </div>
            {/* Pace + GAP */}
            <div className="flex flex-col items-center gap-0.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(245,245,245,0.28)" }}>Allure</p>
              <span className="data-mono text-[18px] font-bold" style={{ color: "#F5F5F5" }}>
                {formatPace(run.pace)}
                <span className="text-[10px] font-normal ml-0.5" style={{ color: "rgba(245,245,245,0.35)" }}>/km</span>
              </span>
              {gap && (
                <span className="data-mono text-[10px] font-bold" style={{ color: "var(--gold)" }}>
                  GAP {gap}
                </span>
              )}
            </div>
            {/* Pulse Index */}
            <PulseIndexBadge value={pi} />
          </div>

          {/* Divider */}
          <div className="h-px" style={{ background: "rgba(255,255,255,0.05)" }} aria-hidden />

          {/* Surface bar */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "rgba(245,245,245,0.28)" }}>Surface</p>
            <div className="h-1.5 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div style={{ width: `${asphaltPct}%`, background: "linear-gradient(90deg, #4a4a4a, #333)" }} />
              {trailPct > 0 && <div style={{ width: `${trailPct}%`, background: "linear-gradient(90deg, #4a6741, #2d3e2a)" }} />}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px]" style={{ color: "rgba(245,245,245,0.3)" }}>Asphalte {asphaltPct}%</span>
              {trailPct > 0 && <span className="text-[9px]" style={{ color: "rgba(120,160,100,0.65)" }}>Trail {trailPct}%</span>}
            </div>
          </div>

          {/* PR / Elite badge */}
          <AnimatePresence>
            {(hasPR || isElite) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-2xl"
                role="status"
                aria-label={hasPR ? "Nouveau record personnel" : "Performance élite"}
                style={{
                  background: hasPR ? "rgba(244,208,63,0.09)" : "rgba(199,125,255,0.09)",
                  border: `0.5px solid ${hasPR ? "rgba(244,208,63,0.4)" : "rgba(199,125,255,0.38)"}`,
                }}
              >
                <motion.span animate={{ rotate: [0, 12, -12, 0] }} transition={{ duration: 0.7, delay: 0.2 }} className="text-sm" aria-hidden>
                  {hasPR ? "🏆" : "⚡"}
                </motion.span>
                <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: hasPR ? "#F4D03F" : "#C77DFF" }}>
                  {hasPR ? "Nouveau Record !" : "Elite Performance"}
                </span>
                <motion.span animate={{ opacity: [0.35, 1, 0.35] }} transition={{ duration: 1.6, repeat: Infinity }} aria-hidden
                  style={{ fontSize: 10, color: hasPR ? "rgba(244,208,63,0.55)" : "rgba(199,125,255,0.55)" }}>
                  ✦
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="flex items-center gap-2 pt-1">
            <div className="h-px flex-1" style={{ background: "rgba(212,175,55,0.12)" }} />
            <span className="text-[8px] font-bold uppercase tracking-[0.3em]" style={{ color: "rgba(212,175,55,0.32)" }}>PacePulse</span>
            <div className="h-px flex-1" style={{ background: "rgba(212,175,55,0.12)" }} />
          </div>

        </div>
      </motion.div>

      {/* Hidden hi-res canvas */}
      <canvas ref={canvasRef} style={{ display: "none" }} aria-hidden />

      {/* Action buttons */}
      <div className="flex gap-2">
        <motion.button
          onClick={download}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm touch-feedback"
          style={{
            background: "linear-gradient(135deg, rgba(212,175,55,0.14), rgba(244,208,63,0.07))",
            color: "var(--gold)",
            border: "0.5px solid rgba(212,175,55,0.35)",
          }}
          whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(212,175,55,0.18)" }}
          whileTap={{ scale: 0.97 }}
          aria-label="Télécharger la carte en 9:16 haute résolution"
        >
          <Download size={15} aria-hidden />
          Exporter 9:16
        </motion.button>
        <motion.button
          onClick={share}
          className="w-12 flex items-center justify-center rounded-2xl touch-feedback"
          style={{ background: "rgba(199,125,255,0.08)", border: "0.5px solid rgba(199,125,255,0.28)" }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          aria-label="Partager ce run"
        >
          <Share2 size={15} style={{ color: "#C77DFF" }} aria-hidden />
        </motion.button>
      </div>
    </div>
  )
}
