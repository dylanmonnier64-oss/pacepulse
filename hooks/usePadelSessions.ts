"use client"
import { useState, useEffect, useCallback } from "react"
import { getPadelSessions, savePadelSession, deletePadelSession } from "@/lib/storage"
import { getActiveProfile } from "@/lib/storage"
import type { PadelSession, PadelAIAdvice } from "@/lib/types"
import { generateId } from "@/lib/utils"

export function usePadelSessions() {
  const profile = getActiveProfile()
  const [sessions, setSessions] = useState<PadelSession[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setSessions(getPadelSessions().filter((s) => s.user_profile === profile))
    setLoading(false)
  }, [profile])

  useEffect(() => { refresh() }, [refresh])

  const addSession = useCallback((data: Omit<PadelSession, "id" | "user_profile" | "created_at">) => {
    const session: PadelSession = {
      ...data,
      id: generateId(),
      user_profile: profile,
      created_at: new Date().toISOString(),
    }
    savePadelSession(session)
    setSessions((prev) => [session, ...prev])
    return session
  }, [profile])

  const updateSession = useCallback((session: PadelSession) => {
    savePadelSession(session)
    setSessions((prev) => prev.map((s) => s.id === session.id ? session : s))
  }, [])

  const removeSession = useCallback((id: string) => {
    deletePadelSession(id)
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const updateAdvice = useCallback((id: string, advice: PadelAIAdvice) => {
    const session = getPadelSessions().find((s) => s.id === id)
    if (!session) return
    const updated = { ...session, ai_advice: advice }
    savePadelSession(updated)
    setSessions((prev) => prev.map((s) => s.id === id ? updated : s))
  }, [])

  // Stats calculées
  const wins = sessions.filter((s) => s.result === "victoire").length
  const losses = sessions.filter((s) => s.result === "défaite").length
  const winRate = sessions.length ? Math.round((wins / sessions.length) * 100) : 0
  const avgRating = sessions.length
    ? +(sessions.reduce((s, p) => s + p.rating, 0) / sessions.length).toFixed(1)
    : 0
  const recentSessions = sessions.slice(0, 5)

  return {
    sessions, loading, refresh,
    addSession, updateSession, removeSession, updateAdvice,
    stats: { wins, losses, winRate, avgRating, total: sessions.length },
    recentSessions,
  }
}
