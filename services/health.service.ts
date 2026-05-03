/**
 * health.service.ts — Facade for Apple Health / Google Health Connect data.
 * POST to /api/health to push device metrics; GET to read current state.
 */

export interface HealthDevice {
  device_id: string
  device_name: string
  platform: "apple" | "google" | "garmin" | "fitbit" | "redmi" | "other"
  last_sync: string // ISO
}

export interface DailySteps {
  date: string // YYYY-MM-DD
  count: number
  goal: number // default 8000
}

export interface SleepEntry {
  date: string
  durationHr: number
  quality: "poor" | "fair" | "good" | "excellent"
}

export interface HealthSnapshot {
  steps?: DailySteps[]
  sleep?: SleepEntry[]
  heartRateResting?: number
  hrvMs?: number // Heart Rate Variability
  devices: HealthDevice[]
  lastSyncAt?: string
}

const CACHE_KEY = "pp_health_snapshot"
const CACHE_TTL = 5 * 60 * 1000 // 5 min

function readCache(): HealthSnapshot | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data
  } catch { return null }
}

function writeCache(data: HealthSnapshot): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  } catch { /* ignore */ }
}

export async function fetchHealthSnapshot(): Promise<HealthSnapshot> {
  const cached = readCache()
  if (cached) return cached

  try {
    const res = await fetch("/api/health")
    if (!res.ok) throw new Error("Health API error")
    const data = await res.json()
    writeCache(data)
    return data
  } catch {
    return { devices: [] }
  }
}

export async function pushHealthData(payload: {
  device_id: string
  device_name: string
  platform: HealthDevice["platform"]
  metrics: Partial<{ steps: number; sleep_hr: number; hr_resting: number; hrv_ms: number }>
}): Promise<boolean> {
  try {
    const res = await fetch("/api/health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    return res.ok
  } catch { return false }
}

// Step goal analysis
export function analyzeSteps(steps: DailySteps[]): {
  todayCount: number
  weekAvg: number
  belowGoalDays: number
  message: string
} {
  if (steps.length === 0) return { todayCount: 0, weekAvg: 0, belowGoalDays: 0, message: "Connectez un appareil pour voir vos pas" }

  const today = new Date().toISOString().split("T")[0]
  const todayEntry = steps.find(s => s.date === today)
  const todayCount = todayEntry?.count ?? 0
  const goal = todayEntry?.goal ?? 8000

  const last7 = steps.slice(-7)
  const weekAvg = Math.round(last7.reduce((s, d) => s + d.count, 0) / Math.max(last7.length, 1))
  const belowGoalDays = last7.filter(d => d.count < d.goal).length

  let message = ""
  if (todayCount === 0) message = "Aucun pas enregistré aujourd'hui"
  else if (todayCount < goal * 0.5) message = `Encore ${(goal - todayCount).toLocaleString()} pas pour atteindre votre objectif`
  else if (todayCount < goal) message = `Presque ! Plus que ${(goal - todayCount).toLocaleString()} pas`
  else message = `Objectif atteint 🎉 — ${todayCount.toLocaleString()} pas`

  return { todayCount, weekAvg, belowGoalDays, message }
}

// HRV interpretation
export function interpretHRV(hrvMs: number): { level: string; color: string; advice: string } {
  if (hrvMs > 80) return { level: "Excellent", color: "#27AE60", advice: "Système nerveux bien récupéré — intensité possible" }
  if (hrvMs > 55) return { level: "Bon", color: "#F4D03F", advice: "Bonne récupération — entraînement normal" }
  if (hrvMs > 35) return { level: "Modéré", color: "#E67E22", advice: "Récupération incomplète — évitez les séances intenses" }
  return { level: "Faible", color: "#E74C3C", advice: "Fatigue élevée — repos ou récupération active uniquement" }
}
