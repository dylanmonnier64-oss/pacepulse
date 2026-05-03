"use client"
interface LogoPPProps {
  size?: number
  color?: string
  className?: string
}

export default function LogoPP({ size = 32, color = "#F4D03F", className }: LogoPPProps) {
  const s = size
  const sw = s * 0.047 // stroke-width ~1.5 at 32px

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left P — stem + bowl */}
      <path
        d="M5 26V6h6.5a5.5 5.5 0 0 1 0 11H5"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right P — shifted right, overlapping slightly */}
      <path
        d="M13 26V10h6.5a5.5 5.5 0 0 1 0 11H13"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
      {/* Gold dot accent */}
      <circle cx="27" cy="25" r={sw * 1.4} fill={color} />
    </svg>
  )
}
