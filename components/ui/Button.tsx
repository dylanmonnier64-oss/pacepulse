import { cn } from "@/lib/utils"
import { hapticFeedback } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "zoom" | "danger"
  size?: "sm" | "md" | "lg"
  fullWidth?: boolean
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  onClick,
  ...props
}: ButtonProps) {
  const base = "touch-feedback no-select font-semibold rounded-2xl transition-all flex items-center justify-center gap-2"

  const variants = {
    primary: "bg-primary text-app",
    ghost: "bg-white/8 text-text-primary border border-white/10",
    zoom: "zoom-gradient text-white",
    danger: "bg-danger/20 text-danger border border-danger/30",
  }

  const sizes = {
    sm: "px-4 py-2 text-sm min-h-[36px]",
    md: "px-5 py-3 text-sm min-h-[44px]",
    lg: "px-6 py-4 text-base min-h-[52px]",
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
      onClick={(e) => { hapticFeedback(); onClick?.(e) }}
      {...props}
    >
      {children}
    </button>
  )
}
