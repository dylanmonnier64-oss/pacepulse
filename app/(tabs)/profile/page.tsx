"use client"
import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Trophy, Download, Star, Gauge, RotateCcw, LogOut, RefreshCw, AlertCircle } from "lucide-react"
import { useRuns } from "@/hooks/useRuns"
import {
  getGear, getProfile, exportAllData, resetStorage,
  getStravaTokens, saveStravaTokens, clearStravaTokens, saveAllRuns,
  getActiveProfile, switchProfile,
} from "@/lib/storage"
import { detectPersonalRecords } from "@/lib/calculations"
import { fetchStravaActivities } from "@/lib/strava"
import type { Gear, UserProfile } from "@/lib/types"
import { formatDate, secondsToRaceTime, formatPace, formatDistance, hapticFeedback } from "@/lib/utils"
import GlassCard from "@/components/ui/GlassCard"
import Button from "@/components/ui/Button"

const CLIENT_ID = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID

function GearBar({ gear }: { gear: Gear }) {
  const pct = Math.min(100, (gear.km / 700) * 100)
  const status =
    gear.km < 400 ? { color: "#27AE60", label: "Bon état" }
    : gear.km < 600 ? { color: "#F39C12", label: "Usage modéré" }
    : { color: "#E74C3C", label: "À remplacer" }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${gear.color}30` }}>
            <span className="text-xl">👟</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{gear.name}</p>
            <p className="text-[10px] text-text-muted">{gear.brand}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-extrabold stat-num" style={{ color: status.color }}>{formatDistance(gear.km)}</p>
            <p className="text-[9px] text-text-muted">km</p>
          </div>
        </div>
        <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, #27AE60, ${status.color})` }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] font-semibold" style={{ color: status.color }}>{status.label}</span>
          <span className="text-[10px] text-text-muted">
            {gear.km >= 600 ? "⚠️ Remplacement conseillé" : `${Math.round(700 - gear.km)} km restants`}
          </span>
        </div>
        {!gear.isActive && <p className="text-[10px] text-text-muted mt-1">Retraité</p>}
      </GlassCard>
    </motion.div>
  )
}

const PR_LABELS: Record<string, string> = {
  "1km": "1 km", "5km": "5 km", "10km": "10 km", "15km": "15 km",
  semi: "Semi-marathon", marathon: "Marathon", elevation: "Meilleur D+", longest: "Plus long run",
}

function ProfilePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { runs, loading, refresh } = useRuns()
  const [gear, setGear] = useState<Gear[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stravaTokens, setStravaTokens] = useState(getStravaTokens())
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState("")
  const [stravaError, setStravaError] = useState("")

  const activeProfile = getActiveProfile()

  // Handle OAuth callback params
  useEffect(() => {
    const ok = searchParams.get("strava_ok")
    const err = searchParams.get("strava_error")

    if (ok === "1") {
      const tokens = {
        accessToken: searchParams.get("strava_access_token") || "",
        refreshToken: searchParams.get("strava_refresh_token") || "",
        expiresAt: parseInt(searchParams.get("strava_expires_at") || "0"),
        athleteId: parseInt(searchParams.get("strava_athlete_id") || "0"),
        athleteName: searchParams.get("strava_athlete_name") || "",
      }
      saveStravaTokens(tokens)
      setStravaTokens(tokens)
      router.replace("/profile")
    }
    if (err) {
      const messages: Record<string, string> = {
        access_denied: "Connexion refusée par Strava.",
        not_configured: "Clés API Strava non configurées. Crée un .env.local",
        token_failed: "Échange de token échoué.",
        network: "Erreur réseau lors de la connexion.",
      }
      setStravaError(messages[err] || "Erreur inconnue.")
      router.replace("/profile")
    }
  }, [searchParams, router])

  useEffect(() => {
    setGear(getGear())
    setProfile(getProfile())
    setStravaTokens(getStravaTokens())
  }, [])

  const connectStrava = () => {
    hapticFeedback()
    if (!CLIENT_ID) {
      setStravaError("Client ID Strava manquant. Configure .env.local")
      return
    }
    const redirectUri = `${window.location.origin}/api/strava/callback`
    const url = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=activity:read_all&state=${activeProfile}`
    window.location.href = url
  }

  const disconnectStrava = () => {
    hapticFeedback()
    if (!confirm("Déconnecter Strava ? Les runs importés resteront.")) return
    clearStravaTokens()
    setStravaTokens(null)
  }

  const syncStrava = useCallback(async () => {
    if (!stravaTokens) return
    hapticFeedback()
    setSyncing(true)
    setSyncMsg("Connexion à Strava...")
    setStravaError("")
    try {
      const activities = await fetchStravaActivities(
        stravaTokens.accessToken,
        (n) => setSyncMsg(`${n} sorties récupérées...`)
      )

      // Merge: keep existing non-strava runs + add/update strava runs
      const existingNonStrava = runs.filter((r) => !r.id.startsWith("strava_"))
      const merged = [...existingNonStrava, ...activities].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      saveAllRuns(merged)
      refresh()
      setSyncMsg(`✓ ${activities.length} sorties importées`)
      setTimeout(() => setSyncMsg(""), 3000)
    } catch (e) {
      setStravaError("Erreur lors de la synchronisation. Token peut-être expiré.")
    } finally {
      setSyncing(false)
    }
  }, [stravaTokens, runs, refresh])

  const handleExport = () => {
    hapticFeedback()
    const data = exportAllData()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pacepulse-${activeProfile}-export-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    hapticFeedback()
    if (!confirm(`Effacer toutes les données du profil "${activeProfile}" ?`)) return
    resetStorage()
    window.location.reload()
  }

  const handleSwitchProfile = () => {
    hapticFeedback()
    router.push("/")
  }

  const prs = detectPersonalRecords(runs)
  const totalKm = runs.reduce((s, r) => s + r.distance, 0)
  const totalRuns = runs.length
  const totalElev = runs.reduce((s, r) => s + r.elevation, 0)

  const profileLabel = activeProfile === "dydz" ? "dydz 🏃" : "man's 🌸"

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-3xl h-32" style={{ background: "rgba(255,255,255,0.05)" }} />
        ))}
      </div>
    )
  }

  return (
    <motion.div className="flex flex-col gap-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Mon compte</p>
          <h1 className="text-2xl font-black tracking-tight">
            {profileLabel}<span className="text-primary">.</span>
          </h1>
        </div>
        <button
          onClick={handleSwitchProfile}
          className="touch-feedback flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <LogOut size={13} />
          Changer
        </button>
      </div>

      {/* Résumé de carrière */}
      <div className="rounded-3xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(var(--orange),0.2), rgba(var(--purple),0.15))", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="rounded-3xl p-5 absolute inset-0" style={{ background: "var(--zoom-gradient, linear-gradient(135deg,#E67E2220,#9B59B615))", opacity: 0.15 }} />
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 relative">Résumé de carrière</p>
        <div className="grid grid-cols-3 gap-3 relative">
          {[
            { value: formatDistance(totalKm), unit: "km", label: "Total" },
            { value: String(totalRuns), unit: "", label: "Sorties" },
            { value: `${(totalElev / 1000).toFixed(1)}`, unit: "km", label: "D+ total" },
          ].map(({ value, unit, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-extrabold stat-num">{value}<span className="text-sm text-text-muted"> {unit}</span></p>
              <p className="text-[10px] text-text-muted uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strava */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#FC4C02"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Strava</p>
        </div>

        {stravaError && (
          <div className="flex items-start gap-2 p-3 rounded-xl mb-3" style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)" }}>
            <AlertCircle size={14} style={{ color: "#E74C3C", marginTop: 1 }} />
            <p className="text-xs text-danger">{stravaError}</p>
          </div>
        )}

        {stravaTokens ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: "#FC4C02" }} />
                <p className="text-sm font-semibold">
                  Connecté{stravaTokens.athleteName ? ` — ${stravaTokens.athleteName}` : ""}
                </p>
              </div>
              <button onClick={disconnectStrava} className="touch-feedback" style={{ color: "rgba(245,245,245,0.4)" }}>
                <LogOut size={14} />
              </button>
            </div>

            {syncMsg && (
              <p className="text-xs font-medium text-primary">{syncMsg}</p>
            )}

            <button
              onClick={syncStrava}
              disabled={syncing}
              className="touch-feedback w-full flex items-center justify-center gap-2 rounded-2xl font-bold text-sm py-3"
              style={{
                background: "rgba(252,76,2,0.15)",
                border: "1px solid rgba(252,76,2,0.4)",
                color: "#FC4C02",
                opacity: syncing ? 0.6 : 1,
              }}
            >
              <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Synchronisation..." : "Synchroniser mes runs"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-text-muted mb-1">
              Connecte ton compte Strava pour importer automatiquement toutes tes sorties.
            </p>
            <button
              onClick={connectStrava}
              className="touch-feedback w-full flex items-center justify-center gap-2 rounded-2xl font-bold text-sm py-3"
              style={{
                background: "#FC4C02",
                color: "#fff",
              }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>
              Connecter Strava
            </button>
            {!CLIENT_ID && (
              <p className="text-[10px] text-text-muted text-center">Configure .env.local avec ton Client ID Strava</p>
            )}
          </div>
        )}
      </GlassCard>

      {/* Records personnels */}
      {Object.keys(prs).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={14} style={{ color: "#F4D03F" }} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Records personnels</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(prs).map(([key, pr], i) => {
              const label = PR_LABELS[key]
              if (!label) return null
              const longestDistKm: number = pr.pace
              return (
                <motion.div key={key} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                  <GlassCard className="p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Star size={10} style={{ color: "#F4D03F" }} fill="#F4D03F" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</p>
                    </div>
                    {key === "elevation" && <p className="text-lg font-extrabold stat-num">{pr.time} m</p>}
                    {key === "longest" && (
                      <p className="text-lg font-extrabold stat-num">
                        {formatDistance(longestDistKm)} <span className="text-sm text-text-muted">km</span>
                      </p>
                    )}
                    {key !== "elevation" && key !== "longest" && (
                      <p className="text-lg font-extrabold stat-num">{secondsToRaceTime(pr.time)}</p>
                    )}
                    <p className="text-[10px] text-text-muted">{formatDate(pr.date)}</p>
                    {key !== "elevation" && key !== "longest" && (
                      <p className="text-[10px] text-primary font-semibold">{formatPace(pr.pace)} /km</p>
                    )}
                  </GlassCard>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Chaussures */}
      {gear.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Gauge size={14} style={{ color: "#9B59B6" }} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Chaussures</p>
          </div>
          <div className="flex flex-col gap-3">
            {gear.map((g) => <GearBar key={g.id} gear={g} />)}
          </div>
        </div>
      )}

      {/* Paramètres */}
      {profile && (
        <GlassCard className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Paramètres</p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm">FC maximale</p>
              <p className="text-sm font-bold stat-num">{profile.maxHR} bpm</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm">FC au repos</p>
              <p className="text-sm font-bold stat-num">{profile.restHR} bpm</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm">Poids</p>
              <p className="text-sm font-bold stat-num">{profile.weight} kg</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Actions */}
      <Button variant="ghost" fullWidth onClick={handleExport}>
        <Download size={16} />
        Exporter toutes les données (JSON)
      </Button>

      <button
        onClick={handleReset}
        className="touch-feedback w-full rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm py-3"
        style={{ background: "rgba(231,76,60,0.08)", border: "1px solid rgba(231,76,60,0.25)", color: "#E74C3C", minHeight: 44 }}
      >
        <RotateCcw size={15} />
        Réinitialiser toutes les données
      </button>

      <div className="text-center py-4">
        <p className="text-sm font-black text-primary">PacePulse</p>
        <p className="text-[10px] text-text-muted">v1.0.0 · Données locales · Aucun compte requis</p>
      </div>

      <div className="h-4" />
    </motion.div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex flex-col gap-4 animate-pulse">{[...Array(3)].map((_, i) => <div key={i} className="rounded-3xl h-32" style={{ background: "rgba(255,255,255,0.05)" }} />)}</div>}>
      <ProfilePageInner />
    </Suspense>
  )
}
