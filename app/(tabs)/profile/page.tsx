"use client"
import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Trophy, Download, Star, Gauge, RotateCcw, LogOut,
  RefreshCw, AlertCircle, CheckCircle2, Zap, User, ChevronDown, ChevronUp,
} from "lucide-react"
import { useRuns } from "@/hooks/useRuns"
import {
  getGear, getProfile, exportAllData, resetStorage, importAllData,
  getStravaTokens, saveStravaTokens, clearStravaTokens, saveAllRuns,
  getActiveProfile, switchProfile, getPadelSessions, savePadelSession,
  type ProfileId,
} from "@/lib/storage"
import { detectPersonalRecords } from "@/lib/calculations"
import { fetchStravaAll } from "@/lib/strava"
import type { Gear, UserProfile } from "@/lib/types"
import type { StravaTokens } from "@/lib/storage"
import { formatDate, secondsToRaceTime, formatPace, formatDistance, hapticFeedback, lgStyle } from "@/lib/utils"
import GlassCard from "@/components/ui/GlassCard"
import Button from "@/components/ui/Button"
import GoogleFitCard from "@/components/profile/GoogleFitCard"

const CLIENT_ID = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID

// ─── Constantes visuelles ────────────────────────────────────────────────────
const STRAVA_ORANGE = "#FC4C02"
const PR_LABELS: Record<string, string> = {
  "1km": "1 km", "5km": "5 km", "10km": "10 km", "15km": "15 km",
  semi: "Semi-marathon", marathon: "Marathon", elevation: "Meilleur D+", longest: "Plus long run",
}

// ─── Types ────────────────────────────────────────────────────────────────────
type SyncState = "idle" | "refreshing" | "fetching" | "saving" | "done" | "error"

// ─── GearBar ─────────────────────────────────────────────────────────────────
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
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${gear.color}30` }}>
            <span className="text-xl">👟</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{gear.name}</p>
            <p className="text-[10px] text-text-muted">{gear.brand}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-extrabold stat-num" style={{ color: status.color }}>
              {formatDistance(gear.km)}
            </p>
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

// ─── StravaIcon ───────────────────────────────────────────────────────────────
function StravaIcon({ size = 16, color = STRAVA_ORANGE }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  )
}

// ─── StravaCard ───────────────────────────────────────────────────────────────
function StravaCard({
  profileId,
  label,
  isActive,
}: {
  profileId: ProfileId
  label: string
  isActive: boolean
}) {
  const router = useRouter()
  const { runs, refresh } = useRuns()

  const [tokens, setTokens] = useState<StravaTokens | null>(null)
  const [syncState, setSyncState] = useState<SyncState>("idle")
  const [syncMsg, setSyncMsg] = useState("")
  const [syncResult, setSyncResult] = useState<{ runs: number; padel: number } | null>(null)
  const [error, setError] = useState("")
  const [expanded, setExpanded] = useState(isActive)

  // Charger les tokens du profil ciblé depuis localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(`pp_${profileId}_strava_tokens`)
      setTokens(raw ? JSON.parse(raw) : null)
    } catch { setTokens(null) }
  }, [profileId])

  const saveProfileTokens = useCallback((t: StravaTokens) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`pp_${profileId}_strava_tokens`, JSON.stringify(t))
    }
    setTokens(t)
  }, [profileId])

  const connect = () => {
    hapticFeedback()
    if (!CLIENT_ID) {
      setError("Client ID Strava manquant. Configure .env.local")
      return
    }
    const redirectUri = `${window.location.origin}/api/strava/callback`
    const url = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=activity:read_all&state=${profileId}&approval_prompt=force`
    window.location.href = url
  }

  const disconnect = () => {
    hapticFeedback()
    if (!confirm(`Déconnecter Strava du profil ${label} ? Les runs importés resteront.`)) return
    if (typeof window !== "undefined") {
      localStorage.removeItem(`pp_${profileId}_strava_tokens`)
    }
    setTokens(null)
    setSyncResult(null)
  }

  const sync = useCallback(async () => {
    if (!tokens) return
    hapticFeedback()
    setSyncState("refreshing")
    setSyncMsg("Vérification du token…")
    setError("")
    setSyncResult(null)

    try {
      let { accessToken, refreshToken, expiresAt, athleteId, athleteName } = tokens
      const needsRefresh = Date.now() / 1000 > expiresAt - 300

      if (needsRefresh) {
        setSyncMsg("Renouvellement du token Strava…")
        const res = await fetch("/api/strava/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        })
        const refreshed = await res.json()
        if (!res.ok || refreshed.error) {
          throw new Error("token_refresh_failed")
        }
        accessToken = refreshed.accessToken
        refreshToken = refreshed.refreshToken
        expiresAt = refreshed.expiresAt
        saveProfileTokens({ accessToken, refreshToken, expiresAt, athleteId, athleteName })
      }

      setSyncState("fetching")
      const { runs: stravaRuns, padel: stravaPadel } = await fetchStravaAll(
        accessToken,
        profileId,
        (msg) => setSyncMsg(msg)
      )

      setSyncState("saving")
      setSyncMsg("Sauvegarde des données…")

      // Sauvegarder runs dans le namespace du profil ciblé
      const prevProfile = getActiveProfile()
      if (prevProfile !== profileId) switchProfile(profileId)

      const existingNonStrava = runs.filter((r) => !r.id.startsWith("strava_"))
      const merged = [...existingNonStrava, ...stravaRuns].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      saveAllRuns(merged)

      // Padel — éviter les doublons par strava_id
      const existingSessions = getPadelSessions()
      const existingStravaIds = new Set(existingSessions.map((s) => s.strava_id).filter(Boolean))
      let newPadel = 0
      for (const session of stravaPadel) {
        if (!existingStravaIds.has(session.strava_id)) {
          savePadelSession(session)
          newPadel++
        }
      }

      if (prevProfile !== profileId) switchProfile(prevProfile)

      refresh()
      setSyncResult({ runs: stravaRuns.length, padel: newPadel })
      setSyncState("done")
      setSyncMsg("")
      setTimeout(() => setSyncState("idle"), 5000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ""
      setSyncState("error")
      setError(
        msg === "token_refresh_failed"
          ? "Token expiré — reconnecte ton compte Strava."
          : "Erreur de synchronisation. Vérifie ta connexion ou reconnecte Strava."
      )
    }
  }, [tokens, runs, refresh, profileId, saveProfileTokens])

  const isConnected = !!tokens

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: isActive
          ? "rgba(252,76,2,0.06)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${isActive ? "rgba(252,76,2,0.2)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      {/* Header profil */}
      <button
        className="w-full flex items-center gap-3 p-4 touch-feedback"
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
          style={{
            background: profileId === "dydz"
              ? "linear-gradient(135deg, #D4AF37, #B8962E)"
              : "linear-gradient(135deg, #A855F7, #7C3AED)",
            color: "#fff",
          }}
        >
          {label[0].toUpperCase()}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold">{label}</p>
          <p className="text-[10px]" style={{ color: isConnected ? "#FC4C02" : "rgba(250,250,250,0.35)" }}>
            {isConnected
              ? `Connecté${tokens?.athleteName ? ` — ${tokens.athleteName}` : ""}`
              : "Non connecté"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STRAVA_ORANGE }} />
          )}
          {expanded ? <ChevronUp size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
            : <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.3)" }} />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-4 flex flex-col gap-3">
              {/* Erreur */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl"
                  style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.25)" }}>
                  <AlertCircle size={13} style={{ color: "#E74C3C", marginTop: 1, flexShrink: 0 }} />
                  <p className="text-xs" style={{ color: "#E74C3C" }}>{error}</p>
                </div>
              )}

              {/* Résultat sync */}
              {syncState === "done" && syncResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ background: "rgba(39,174,96,0.1)", border: "1px solid rgba(39,174,96,0.25)" }}
                >
                  <CheckCircle2 size={13} style={{ color: "#27AE60", flexShrink: 0 }} />
                  <p className="text-xs font-semibold" style={{ color: "#27AE60" }}>
                    {syncResult.runs} runs importés
                    {syncResult.padel > 0 ? ` · ${syncResult.padel} sessions padel` : ""}
                  </p>
                </motion.div>
              )}

              {/* Progression */}
              {syncMsg && syncState !== "done" && (
                <p className="text-xs font-medium" style={{ color: "rgba(252,76,2,0.9)" }}>
                  {syncMsg}
                </p>
              )}

              {isConnected ? (
                <div className="flex gap-2">
                  <button
                    onClick={sync}
                    disabled={syncState === "refreshing" || syncState === "fetching" || syncState === "saving"}
                    className="touch-feedback flex-1 flex items-center justify-center gap-2 rounded-2xl font-bold text-sm py-2.5"
                    style={{
                      background: "rgba(252,76,2,0.15)",
                      border: "1px solid rgba(252,76,2,0.35)",
                      color: STRAVA_ORANGE,
                      opacity: (syncState !== "idle" && syncState !== "done" && syncState !== "error") ? 0.5 : 1,
                    }}
                  >
                    <RefreshCw
                      size={14}
                      className={(syncState === "refreshing" || syncState === "fetching" || syncState === "saving") ? "animate-spin" : ""}
                    />
                    {syncState === "refreshing" || syncState === "fetching" || syncState === "saving"
                      ? "Sync…"
                      : "Synchroniser"}
                  </button>
                  <button
                    onClick={disconnect}
                    className="touch-feedback w-10 h-10 flex items-center justify-center rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <LogOut size={13} style={{ color: "rgba(255,255,255,0.4)" }} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-text-muted">
                    Connecte le compte Strava de {label} pour importer ses runs et sessions padel automatiquement.
                  </p>
                  <button
                    onClick={connect}
                    className="touch-feedback w-full flex items-center justify-center gap-2 rounded-2xl font-bold text-sm py-3"
                    style={{ background: STRAVA_ORANGE, color: "#fff" }}
                  >
                    <StravaIcon size={15} color="#fff" />
                    Connecter Strava — {label}
                  </button>
                  {!CLIENT_ID && (
                    <p className="text-[10px] text-text-muted text-center">
                      Ajoute NEXT_PUBLIC_STRAVA_CLIENT_ID dans .env.local
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
function ProfilePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { runs, loading, refresh } = useRuns()
  const [gear, setGear] = useState<Gear[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stravaError, setStravaError] = useState("")
  const [importMsg, setImportMsg] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeProfile = getActiveProfile()
  const profileLabel = activeProfile === "dydz" ? "dydz 🏃" : "man's 🌸"

  // ── Retour OAuth callback ─────────────────────────────────────────────────
  useEffect(() => {
    const ok = searchParams.get("strava_ok")
    const err = searchParams.get("strava_error")

    if (ok === "1") {
      const targetProfile = (searchParams.get("strava_profile") || "dydz") as ProfileId
      const tokens: StravaTokens = {
        accessToken: searchParams.get("strava_access_token") || "",
        refreshToken: searchParams.get("strava_refresh_token") || "",
        expiresAt: parseInt(searchParams.get("strava_expires_at") || "0"),
        athleteId: parseInt(searchParams.get("strava_athlete_id") || "0"),
        athleteName: searchParams.get("strava_athlete_name") || "",
      }
      // Sauvegarder dans le namespace du bon profil directement
      if (typeof window !== "undefined") {
        localStorage.setItem(`pp_${targetProfile}_strava_tokens`, JSON.stringify(tokens))
      }
      // Switcher sur ce profil si ce n'est pas déjà le cas
      if (targetProfile !== getActiveProfile()) switchProfile(targetProfile)
      router.replace("/profile")
    }

    if (err) {
      const messages: Record<string, string> = {
        access_denied: "Connexion refusée par Strava.",
        not_configured: "Clés API Strava non configurées.",
        token_failed: "Échange de token échoué. Réessaie.",
        network: "Erreur réseau lors de la connexion Strava.",
      }
      setStravaError(messages[err] || "Erreur inconnue lors de la connexion Strava.")
      router.replace("/profile")
    }
  }, [searchParams, router])

  useEffect(() => {
    setGear(getGear())
    setProfile(getProfile())
  }, [])

  const handleExport = () => {
    hapticFeedback()
    const data = exportAllData()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pacepulse-${activeProfile}-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    hapticFeedback()
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const jsonString = evt.target?.result as string
        const result = importAllData(jsonString)
        setImportMsg({ text: result.message, type: result.success ? "success" : "error" })
        if (result.success) {
          setTimeout(() => {
            refresh()
            setGear(getGear())
            setProfile(getProfile())
            setTimeout(() => setImportMsg(null), 4000)
          }, 500)
        } else {
          setTimeout(() => setImportMsg(null), 4000)
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Erreur inconnue"
        setImportMsg({ text: `Erreur : ${msg}`, type: "error" })
        setTimeout(() => setImportMsg(null), 4000)
      }
    }
    reader.readAsText(file)
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleReset = () => {
    hapticFeedback()
    if (!confirm(`Effacer toutes les données du profil "${activeProfile}" ?`)) return
    resetStorage()
    window.location.reload()
  }

  const prs = detectPersonalRecords(runs)
  const totalKm = runs.reduce((s, r) => s + r.distance, 0)
  const totalRuns = runs.length
  const totalElev = runs.reduce((s, r) => s + r.elevation, 0)

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-3xl h-24 animate-pulse"
            style={{ background: "rgba(255,255,255,0.04)" }} />
        ))}
      </div>
    )
  }

  return (
    <motion.div className="flex flex-col gap-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Mon compte</p>
          <h1 className="text-2xl font-black tracking-tight">
            {profileLabel}<span className="text-primary">.</span>
          </h1>
        </div>
        <button
          onClick={() => { hapticFeedback(); router.push("/") }}
          className="touch-feedback flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <LogOut size={13} />
          Changer
        </button>
      </div>

      {/* Résumé */}
      <div className="rounded-3xl p-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(168,85,247,0.08))",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Résumé de carrière</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: formatDistance(totalKm), unit: "km", label: "Total" },
            { value: String(totalRuns), unit: "", label: "Sorties" },
            { value: `${(totalElev / 1000).toFixed(1)}`, unit: "km", label: "D+ total" },
          ].map(({ value, unit, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-extrabold stat-num">
                {value}<span className="text-sm text-text-muted"> {unit}</span>
              </p>
              <p className="text-[10px] text-text-muted uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section Strava multi-profil ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <StravaIcon size={14} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Strava</p>
          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
            style={{ background: "rgba(252,76,2,0.15)", color: STRAVA_ORANGE }}>
            2 profils
          </span>
        </div>

        {stravaError && (
          <div className="flex items-start gap-2 p-3 rounded-xl mb-3"
            style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.25)" }}>
            <AlertCircle size={13} style={{ color: "#E74C3C", marginTop: 1 }} />
            <p className="text-xs" style={{ color: "#E74C3C" }}>{stravaError}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <StravaCard profileId="dydz" label="Dydz" isActive={activeProfile === "dydz"} />
          <StravaCard profileId="mans" label="Mans" isActive={activeProfile === "mans"} />
        </div>

        <p className="text-[10px] text-text-muted mt-2 text-center">
          Chaque profil se connecte à son propre compte Strava indépendamment.
        </p>
      </div>

      {/* ── Section Google Fit ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🏃</span>
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Santé & fitness</p>
          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
            style={{ background: "rgba(66,133,244,0.15)", color: "#4285F4" }}>
            Google Fit
          </span>
        </div>
        <GoogleFitCard />
        <p className="text-[10px] text-text-muted mt-2 text-center">
          Synchronise tes données de pas, distance, sommeil et activités.
        </p>
      </div>

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
                <motion.div key={key}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}>
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
            {[
              { label: "FC maximale", value: `${profile.maxHR} bpm` },
              { label: "FC au repos", value: `${profile.restHR} bpm` },
              { label: "Poids", value: `${profile.weight} kg` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <p className="text-sm">{label}</p>
                <p className="text-sm font-bold stat-num">{value}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Import message */}
      <AnimatePresence>
        {importMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="flex items-center gap-2 p-3 rounded-xl"
            style={{
              background: importMsg.type === "success"
                ? "rgba(39,174,96,0.1)"
                : "rgba(231,76,60,0.1)",
              border: importMsg.type === "success"
                ? "1px solid rgba(39,174,96,0.25)"
                : "1px solid rgba(231,76,60,0.25)",
            }}
          >
            {importMsg.type === "success" ? (
              <CheckCircle2 size={13} style={{ color: "#27AE60", flexShrink: 0 }} />
            ) : (
              <AlertCircle size={13} style={{ color: "#E74C3C", flexShrink: 0 }} />
            )}
            <p className="text-xs font-semibold" style={{ color: importMsg.type === "success" ? "#27AE60" : "#E74C3C" }}>
              {importMsg.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <Button variant="ghost" fullWidth onClick={handleExport}>
        <Download size={16} />
        Exporter toutes les données (JSON)
      </Button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="touch-feedback w-full rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm py-3"
        style={{
          background: "rgba(168,85,247,0.08)",
          border: "1px solid rgba(168,85,247,0.25)",
          color: "#A855F7",
          minHeight: 44,
        }}
      >
        <Download size={15} />
        Importer des données (JSON)
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        style={{ display: "none" }}
      />

      <button
        onClick={handleReset}
        className="touch-feedback w-full rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm py-3"
        style={{
          background: "rgba(231,76,60,0.08)",
          border: "1px solid rgba(231,76,60,0.25)",
          color: "#E74C3C",
          minHeight: 44,
        }}
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
    <Suspense fallback={
      <div className="flex flex-col gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-3xl h-24 animate-pulse"
            style={{ background: "rgba(255,255,255,0.05)" }} />
        ))}
      </div>
    }>
      <ProfilePageInner />
    </Suspense>
  )
}
