"use client"
import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { HealthLog, AIHealthAnalysis } from "@/lib/types"
import { getActiveProfile } from "@/lib/storage"
import { applySeedIfNeeded } from "@/lib/health-seed"

const SUPABASE_ENABLED = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://YOUR_PROJECT.supabase.co" &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "placeholder_key"
)

// ── localStorage fallback key ──
function localKey(profile: string) {
  return `pp_health_logs_${profile}`
}

function readLocal(profile: string): HealthLog[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(localKey(profile)) ?? "[]")
  } catch { return [] }
}

function writeLocal(profile: string, logs: HealthLog[]) {
  localStorage.setItem(localKey(profile), JSON.stringify(logs))
}

// ── Hook ──────────────────────────────────────────────────────
export function useHealthLogs() {
  const profile = getActiveProfile()
  const [logs, setLogs] = useState<HealthLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    applySeedIfNeeded()
    setLoading(true)
    if (SUPABASE_ENABLED) {
      const { data, error } = await supabase
        .from("health_logs")
        .select("*")
        .eq("user_profile", profile)
        .order("date", { ascending: false })
        .limit(30)
      if (!error && data) {
        setLogs(data as HealthLog[])
        setLoading(false)
        return
      }
    }
    // Fallback to localStorage
    setLogs(readLocal(profile))
    setLoading(false)
  }, [profile])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const saveLog = useCallback(async (log: Omit<HealthLog, "user_profile">): Promise<HealthLog> => {
    const entry: HealthLog = { ...log, user_profile: profile }

    if (SUPABASE_ENABLED) {
      const { data, error } = await supabase
        .from("health_logs")
        .upsert(entry, { onConflict: "user_profile,date" })
        .select()
        .single()
      if (!error && data) {
        setLogs((prev) => {
          const filtered = prev.filter((l) => l.date !== log.date)
          return [data as HealthLog, ...filtered].sort((a, b) => b.date.localeCompare(a.date))
        })
        return data as HealthLog
      }
    }
    // localStorage fallback
    const current = readLocal(profile)
    const filtered = current.filter((l) => l.date !== log.date)
    const updated = [entry, ...filtered].sort((a, b) => b.date.localeCompare(a.date))
    writeLocal(profile, updated)
    setLogs(updated)
    return entry
  }, [profile])

  const updateAnalysis = useCallback(async (date: string, analysis: AIHealthAnalysis) => {
    if (SUPABASE_ENABLED) {
      await supabase
        .from("health_logs")
        .update({ ai_analysis: analysis, updated_at: new Date().toISOString() })
        .eq("user_profile", profile)
        .eq("date", date)
    }
    const current = readLocal(profile)
    const updated = current.map((l) =>
      l.date === date ? { ...l, ai_analysis: analysis } : l
    )
    writeLocal(profile, updated)
    setLogs((prev) => prev.map((l) => l.date === date ? { ...l, ai_analysis: analysis } : l))
  }, [profile])

  const todayLog = logs.find((l) => l.date === new Date().toISOString().split("T")[0]) ?? null

  return { logs, loading, todayLog, saveLog, updateAnalysis, refresh: fetchLogs }
}
