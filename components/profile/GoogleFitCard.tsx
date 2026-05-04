"use client"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  RefreshCw, AlertCircle, CheckCircle2, LogOut, ChevronDown, ChevronUp,
} from "lucide-react"
import { hapticFeedback, lgStyle } from "@/lib/utils"
import Button from "@/components/ui/Button"

const GOOGLE_FIT_COLOR = "#4285F4"

interface GoogleFitTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
  userName: string
}

interface GoogleFitSyncResult {
  steps?: number
  distance?: number
  calories?: number
  sleepHours?: number
  sleepMinutes?: number
  workouts?: number
}

type SyncState = "idle" | "fetching" | "saving" | "done" | "error"

export default function GoogleFitCard() {
  const [tokens, setTokens] = useState<GoogleFitTokens | null>(null)
  const [syncState, setSyncState] = useState<SyncState>("idle")
  const [syncMsg, setSyncMsg] = useState("")
  const [syncResult, setSyncResult] = useState<GoogleFitSyncResult | null>(null)
  const [error, setError] = useState("")
  const [expanded, setExpanded] = useState(false)

  // Charger les tokens depuis localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem("pp_googlefit_tokens")
      setTokens(raw ? JSON.parse(raw) : null)
    } catch {
      setTokens(null)
    }
  }, [])

  const saveTokens = useCallback((t: GoogleFitTokens) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pp_googlefit_tokens", JSON.stringify(t))
    }
    setTokens(t)
  }, [])

  const connect = () => {
    hapticFeedback()
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID
    if (!clientId) {
      setError("Client ID Google Fit manquant. Configure .env.local")
      return
    }

    const redirectUri = `${window.location.origin}/api/google-fit/callback`
    const scopes = [
      "https://www.googleapis.com/auth/fitness.activity.read",
      "https://www.googleapis.com/auth/fitness.sleep.read",
      "https://www.googleapis.com/auth/fitness.heart_rate.read",
      "https://www.googleapis.com/auth/fitness.location.read",
    ].join(" ")

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes,
      access_type: "offline",
      prompt: "consent",
    }).toString()}`

    window.location.href = url
  }

  const disconnect = () => {
    hapticFeedback()
    if (!confirm("Déconnecter Google Fit ? Les données synced resteront.")) return
    if (typeof window !== "undefined") {
      localStorage.removeItem("pp_googlefit_tokens")
    }
    setTokens(null)
    setSyncResult(null)
  }

  const sync = useCallback(async () => {
    if (!tokens) return
    hapticFeedback()
    setSyncState("fetching")
    setSyncMsg("Récupération des données Google Fit…")
    setError("")
    setSyncResult(null)

    try {
      // Vérifier si le token a expiré
      if (Date.now() > tokens.expiresAt) {
        setSyncMsg("Renouvellement du token…")
        const refreshRes = await fetch("/api/google-fit/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        })

        if (!refreshRes.ok) {
          throw new Error("token_refresh_failed")
        }

        const refreshed = await refreshRes.json()
        const newTokens = {
          ...tokens,
          accessToken: refreshed.accessToken,
          expiresAt: refreshed.expiresAt,
        }
        saveTokens(newTokens)
      }

      // Fetch les données
      setSyncState("fetching")
      setSyncMsg("Synchronisation avec Google Fit…")

      const res = await fetch("/api/google-fit/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          device_name: `Google Fit - ${tokens.userName}`,
        }),
      })

      if (!res.ok) {
        throw new Error("sync_failed")
      }

      const data = await res.json()
      const metrics = data.data

      setSyncResult({
        steps: metrics.steps,
        distance: metrics.distance,
        calories: metrics.calories,
        sleepHours: metrics.sleepHours,
        sleepMinutes: metrics.sleepMinutes,
        workouts: metrics.workouts?.length || 0,
      })

      setSyncState("done")
      setSyncMsg("")
      setTimeout(() => setSyncState("idle"), 5000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ""
      setSyncState("error")
      setError(
        msg === "token_refresh_failed"
          ? "Token expiré — reconnecte ton compte Google."
          : "Erreur de synchronisation. Vérifie ta connexion."
      )
    }
  }, [tokens, saveTokens])

  // Traiter le callback OAuth depuis les query params
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const ok = params.get("googlefit_ok")

    if (ok === "1") {
      const accessToken = params.get("googlefit_access_token") || ""
      const refreshToken = params.get("googlefit_refresh_token") || ""
      const expiresAt = parseInt(params.get("googlefit_expires_at") || "0")
      const userName = params.get("googlefit_user_name") || "Google Fit"

      if (accessToken) {
        saveTokens({
          accessToken,
          refreshToken,
          expiresAt,
          userName,
        })
        // Nettoyer l'URL
        window.history.replaceState({}, document.title, "/profile")
      }
    }

    const googleFitError = params.get("googlefit_error")
    if (googleFitError) {
      const messages: Record<string, string> = {
        access_denied: "Connexion refusée par Google.",
        not_configured: "Clés API Google Fit non configurées.",
        token_failed: "Échange de token échoué.",
        network: "Erreur réseau.",
      }
      setError(messages[googleFitError] || "Erreur inconnue.")
      window.history.replaceState({}, document.title, "/profile")
    }
  }, [saveTokens])

  const isConnected = !!tokens

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: isConnected
          ? "rgba(66,133,244,0.06)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${isConnected ? "rgba(66,133,244,0.2)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 p-4 touch-feedback"
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${GOOGLE_FIT_COLOR}, #2E7D32)`,
            color: "#fff",
          }}
        >
          🏃
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold">Google Fit</p>
          <p className="text-[10px]" style={{ color: isConnected ? GOOGLE_FIT_COLOR : "rgba(250,250,250,0.35)" }}>
            {isConnected
              ? `Connecté — ${tokens?.userName || "User"}`
              : "Non connecté"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: GOOGLE_FIT_COLOR }} />
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
                    ✓ Synced: {syncResult.steps} pas, {syncResult.distance?.toFixed(1)} km, {syncResult.workouts} activités
                  </p>
                </motion.div>
              )}

              {/* Message de sync */}
              {syncState !== "idle" && syncState !== "done" && (
                <div className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ background: "rgba(66,133,244,0.1)", border: `1px solid ${GOOGLE_FIT_COLOR}33` }}>
                  <RefreshCw size={13} style={{ color: GOOGLE_FIT_COLOR, animation: "spin 1s linear infinite", flexShrink: 0 }} />
                  <p className="text-xs" style={{ color: GOOGLE_FIT_COLOR }}>{syncMsg}</p>
                </div>
              )}

              {/* Actions */}
              {!isConnected ? (
                <button
                  onClick={connect}
                  className="touch-feedback w-full rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm py-3 transition-all duration-200"
                  style={lgStyle("rgba(66,133,244,0.1)")}
                >
                  <span>↗</span>
                  Connecter Google Fit
                </button>
              ) : (
                <>
                  <button
                    onClick={sync}
                    disabled={syncState !== "idle" && syncState !== "done"}
                    className="touch-feedback w-full rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm py-3 transition-all duration-200"
                    style={{
                      ...lgStyle("rgba(66,133,244,0.1)"),
                      opacity: syncState !== "idle" && syncState !== "done" ? 0.5 : 1,
                      pointerEvents: syncState !== "idle" && syncState !== "done" ? "none" : "auto",
                    }}
                  >
                    <RefreshCw size={15} />
                    Synchroniser maintenant
                  </button>

                  <button
                    onClick={disconnect}
                    className="touch-feedback w-full rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm py-3"
                    style={{
                      background: "rgba(231,76,60,0.08)",
                      border: "1px solid rgba(231,76,60,0.25)",
                      color: "#E74C3C",
                      minHeight: 44,
                    }}
                  >
                    <LogOut size={15} />
                    Déconnecter
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
