"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { switchProfile, getProfileStats, hasStravaForProfile } from "@/lib/storage"
import { lgStyle } from "@/lib/utils"
import type { ProfileId } from "@/lib/storage"

const PROFILES = [
  {
    id: "dydz" as ProfileId,
    name: "dydz",
    emoji: "🏃",
    primaryColor: "#F4D03F",
    secondaryColor: "#E67E22",
    gradient: "linear-gradient(135deg, #E67E22 0%, #C0392B 50%, #9B59B6 100%)",
    cardGlow: "rgba(244,208,63,0.2)",
    border: "rgba(244,208,63,0.35)",
    btnBg: "#F4D03F",
    btnColor: "#0A0A0A",
    stravaColor: "#FC4C02",
  },
  {
    id: "mans" as ProfileId,
    name: "man's",
    emoji: "🌸",
    primaryColor: "#FF6B9D",
    secondaryColor: "#C44AFF",
    gradient: "linear-gradient(135deg, #FF6B9D 0%, #E040A0 50%, #C44AFF 100%)",
    cardGlow: "rgba(255,107,157,0.2)",
    border: "rgba(255,107,157,0.35)",
    btnBg: "#FF6B9D",
    btnColor: "#fff",
    stravaColor: "#FC4C02",
  },
]

export default function ProfileSelector() {
  const router = useRouter()
  const [stats, setStats] = useState<Record<ProfileId, { runs: number; km: number }>>({
    dydz: { runs: 0, km: 0 },
    mans: { runs: 0, km: 0 },
  })
  const [stravaConnected, setStravaConnected] = useState<Record<ProfileId, boolean>>({
    dydz: false,
    mans: false,
  })

  useEffect(() => {
    setStats({
      dydz: getProfileStats("dydz"),
      mans: getProfileStats("mans"),
    })
    setStravaConnected({
      dydz: hasStravaForProfile("dydz"),
      mans: hasStravaForProfile("mans"),
    })
  }, [])

  const enter = (p: typeof PROFILES[0]) => {
    switchProfile(p.id)
    router.push("/dashboard")
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0A0A0A", padding: "env(safe-area-inset-top, 0) 0 env(safe-area-inset-bottom, 0)" }}
    >
      {/* Header */}
      <motion.div
        className="text-center pt-12 pb-6 px-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.25em] mb-1" style={{ color: "rgba(245,245,245,0.4)" }}>
          Bienvenue sur
        </p>
        <h1 className="text-4xl font-black tracking-tight" style={{ color: "#F5F5F5" }}>
          Pace<span style={{ color: "#F4D03F" }}>Pulse</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(245,245,245,0.4)" }}>
          Choisis ton profil
        </p>
      </motion.div>

      {/* Profile cards */}
      <div className="flex-1 flex flex-col gap-4 px-5 pb-8">
        {PROFILES.map((p, i) => {
          const s = stats[p.id]
          const stravaOk = stravaConnected[p.id]
          const hasData = s.runs > 0

          return (
            <motion.button
              key={p.id}
              onClick={() => enter(p)}
              className="flex-1 rounded-3xl overflow-hidden relative text-left"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${p.border}`,
                boxShadow: `0 0 40px ${p.cardGlow}, inset 0 0 60px ${p.cardGlow}`,
                minHeight: 200,
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.45 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Gradient orb */}
              <div
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-40 pointer-events-none"
                style={{ background: p.gradient }}
              />


              {/* Content */}
              <div className="relative z-10 p-6 flex flex-col justify-between h-full gap-4">
                {/* Top row: emoji + name + strava badge */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: `${p.primaryColor}20`, border: `1px solid ${p.primaryColor}40` }}
                    >
                      {p.emoji}
                    </div>
                    <div>
                      <p className="text-2xl font-black tracking-tight" style={{ color: p.primaryColor }}>
                        {p.name}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(245,245,245,0.4)" }}>
                        Profil
                      </p>
                    </div>
                  </div>

                  {/* Strava badge */}
                  {stravaOk ? (
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(252,76,2,0.15)", border: "1px solid rgba(252,76,2,0.4)" }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#FC4C02" }} />
                      <span className="text-[10px] font-bold" style={{ color: "#FC4C02" }}>STRAVA</span>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <span className="text-[10px]" style={{ color: "rgba(245,245,245,0.4)" }}>Strava non connecté</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-5">
                  {hasData ? (
                    <>
                      <div>
                        <p className="text-3xl font-black" style={{ color: p.primaryColor, fontVariantNumeric: "tabular-nums" }}>
                          {s.km}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(245,245,245,0.4)" }}>
                          km total
                        </p>
                      </div>
                      <div className="w-px h-10" style={{ background: "rgba(255,255,255,0.1)" }} />
                      <div>
                        <p className="text-3xl font-black" style={{ color: "rgba(245,245,245,0.9)", fontVariantNumeric: "tabular-nums" }}>
                          {s.runs}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(245,245,245,0.4)" }}>
                          sorties
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm" style={{ color: "rgba(245,245,245,0.35)" }}>
                      Aucune donnée — ajoute ta première sortie
                    </p>
                  )}
                </div>

                {/* CTA — liquid glass tinted with profile color */}
                <div
                  className="flex items-center justify-center gap-2 rounded-2xl font-black text-sm py-3.5"
                  style={{
                    ...lgStyle(`${p.primaryColor}14`),
                    color: p.primaryColor,
                    border: `1px solid ${p.primaryColor}35`,
                  }}
                >
                  Entrer
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* App version */}
      <p className="text-center text-[10px] pb-6" style={{ color: "rgba(245,245,245,0.2)" }}>
        PacePulse · v1.0.0 · Données locales
      </p>
    </div>
  )
}
