interface StatBlockProps {
  label: string
  value: string | number
  unit?: string
  accent?: string
  size?: "sm" | "md" | "lg"
}

export default function StatBlock({ label, value, unit, accent, size = "md" }: StatBlockProps) {
  const sizes = {
    sm: { value: "text-xl font-bold", label: "text-[10px]", unit: "text-sm" },
    md: { value: "text-2xl font-bold", label: "text-xs", unit: "text-base" },
    lg: { value: "text-4xl font-extrabold", label: "text-xs", unit: "text-xl" },
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline gap-1">
        <span
          className={`stat-num ${sizes[size].value} tracking-tight`}
          style={{ color: accent || "#F5F5F5" }}
        >
          {value}
        </span>
        {unit && (
          <span
            className={`${sizes[size].unit} font-medium`}
            style={{ color: "rgba(245,245,245,0.6)" }}
          >
            {unit}
          </span>
        )}
      </div>
      <span
        className={`${sizes[size].label} font-medium uppercase tracking-widest`}
        style={{ color: "rgba(245,245,245,0.45)" }}
      >
        {label}
      </span>
    </div>
  )
}
