"use client"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  interactive?: boolean
  noHover?: boolean
  /** Adds a subtle animated gold-to-purple gradient border */
  glowBorder?: boolean
}

export default function GlassCard({
  children,
  className,
  style,
  onClick,
  interactive,
  noHover,
  glowBorder = false,
}: GlassCardProps) {

  const inner = (
    <div
      onClick={onClick}
      className={cn(
        "glass-card relative overflow-hidden",
        interactive && "touch-feedback cursor-pointer",
        className,
      )}
      style={style}
    >
      {/* Subtle animated halo orb — always present, very faint */}
      <motion.div
        animate={{ top: ["10%", "60%", "10%"], left: ["10%", "70%", "10%"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute w-20 h-20 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(244,208,63,0.12) 0%, transparent 70%)",
          filter: "blur(14px)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )

  if (glowBorder) {
    return (
      <div className="relative rounded-[28px]" style={{ padding: 1, background: "linear-gradient(135deg, rgba(244,208,63,0.35), rgba(255,107,26,0.2), rgba(168,85,247,0.3))" }}>
        <div className="absolute inset-px rounded-[27px]" style={{ background: "rgba(8,8,8,0.9)" }} />
        <div className="relative z-10">{inner}</div>
      </div>
    )
  }

  if (noHover) return inner

  return (
    <motion.div
      onClick={onClick}
      className={cn(
        "glass-card relative overflow-hidden",
        interactive && "touch-feedback cursor-pointer",
        className,
      )}
      style={style}
      whileHover={{ y: -3, boxShadow: "0 12px 36px rgba(244,208,63,0.18), 0 4px 12px rgba(0,0,0,0.4)" }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {/* Subtle animated halo orb */}
      <motion.div
        animate={{ top: ["10%", "60%", "10%"], left: ["10%", "70%", "10%"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute w-20 h-20 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(244,208,63,0.1) 0%, transparent 70%)",
          filter: "blur(14px)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}
