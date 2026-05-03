"use client"
import { cn } from "@/lib/utils"
import { hapticFeedback, lgStyle } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "zoom" | "danger"
  size?: "sm" | "md" | "lg"
  fullWidth?: boolean
}

/* Tint per variant — everything is liquid glass, only the hue changes */
const TINTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "rgba(244,208,63,0.10)",
  ghost:   "rgba(255,255,255,0.06)",
  zoom:    "rgba(255,107,26,0.08)",
  danger:  "rgba(239,68,68,0.08)",
}

const TEXT_COLORS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "#F4D03F",
  ghost:   "rgba(250,250,250,0.85)",
  zoom:    "#FF6B1A",
  danger:  "#EF4444",
}

const BORDER_COLORS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "rgba(244,208,63,0.30)",
  ghost:   "rgba(255,255,255,0.14)",
  zoom:    "rgba(255,107,26,0.28)",
  danger:  "rgba(239,68,68,0.28)",
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  onClick,
  disabled,
  ...props
}: ButtonProps) {
  const sizeClass = {
    sm: "px-4 py-2 text-sm min-h-[36px] rounded-[14px]",
    md: "px-5 py-3 text-sm min-h-[44px] rounded-[16px]",
    lg: "px-6 py-4 text-base min-h-[52px] rounded-[20px]",
  }[size]

  const glass = lgStyle(TINTS[variant])

  return (
    <button
      disabled={disabled}
      className={cn(
        "touch-feedback no-select font-bold flex items-center justify-center gap-2",
        "relative overflow-hidden transition-opacity",
        sizeClass,
        fullWidth && "w-full",
        disabled && "opacity-40 pointer-events-none",
        className,
      )}
      style={{
        ...glass,
        border: `1px solid ${BORDER_COLORS[variant]}`,
        color: TEXT_COLORS[variant],
      }}
      onClick={(e) => { hapticFeedback(); onClick?.(e) }}
      {...props}
    >
      {children}
    </button>
  )
}
