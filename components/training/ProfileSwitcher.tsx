"use client"
import { motion } from "framer-motion"
import type { ProfileId } from "@/lib/trainingPlanner"

interface Props {
  active: ProfileId
  onChange: (id: ProfileId) => void
}

const PROFILES: { id: ProfileId; name: string; initial: string; color: string }[] = [
  { id: "dylan", name: "Dylan", initial: "D", color: "#F4D03F" },
  { id: "manon", name: "Manon", initial: "M", color: "#9B59B6" },
]

export default function ProfileSwitcher({ active, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)" }}>
      {PROFILES.map(p => {
        const isActive = active === p.id
        return (
          <motion.button
            key={p.id}
            onClick={() => onChange(p.id)}
            whileTap={{ scale: 0.94 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all"
            style={{
              flex: 1,
              background: isActive ? `${p.color}20` : "transparent",
              border: isActive ? `1px solid ${p.color}60` : "1px solid transparent",
              color: isActive ? p.color : "rgba(245,245,245,0.45)",
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black"
              style={{
                background: isActive ? p.color : "rgba(255,255,255,0.1)",
                color: isActive ? "#0A0A0A" : "rgba(245,245,245,0.5)",
              }}
            >
              {p.initial}
            </div>
            {p.name}
          </motion.button>
        )
      })}
    </div>
  )
}
