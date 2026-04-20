import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  interactive?: boolean
}

export default function GlassCard({ children, className, style, onClick, interactive }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-card",
        interactive && "touch-feedback cursor-pointer",
        className
      )}
      style={style}
    >
      {children}
    </div>
  )
}
