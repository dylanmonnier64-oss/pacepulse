import type { Run, Gear, Goal, UserProfile, PadelSession } from "./types"

export type ProfileId = "dydz" | "mans"

const ACTIVE_KEY = "pp_active_profile"

export function getActiveProfile(): ProfileId {
  if (typeof window === "undefined") return "dydz"
  return (localStorage.getItem(ACTIVE_KEY) as ProfileId) || "dydz"
}

export function switchProfile(id: ProfileId): void {
  if (typeof window === "undefined") return
  localStorage.setItem(ACTIVE_KEY, id)
  document.documentElement.setAttribute("data-profile", id)
}

function k(key: string): string {
  const p = typeof window !== "undefined" ? (localStorage.getItem(ACTIVE_KEY) || "dydz") : "dydz"
  return `pp_${p}_${key}`
}

function kFor(profile: ProfileId, key: string): string {
  return `pp_${profile}_${key}`
}

function get<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(k(key))
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch { return fallback }
}

function set<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(k(key), JSON.stringify(value)) } catch {}
}

export function initStorage(): void {
  // No mock data — starts empty, user imports from Strava or adds manually
}

// --- Runs ---
export function getRuns(): Run[] {
  return get<Run[]>("runs", []).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function saveRun(run: Run): void {
  const runs = getRuns()
  const idx = runs.findIndex((r) => r.id === run.id)
  if (idx >= 0) runs[idx] = run
  else runs.unshift(run)
  set("runs", runs)
}

export function saveAllRuns(runs: Run[]): void {
  set("runs", runs)
}

export function deleteRun(id: string): void {
  set("runs", getRuns().filter((r) => r.id !== id))
}

// --- Padel ---
export function getPadelSessions(): PadelSession[] {
  return get<PadelSession[]>("padel", []).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function savePadelSession(session: PadelSession): void {
  const sessions = getPadelSessions()
  const idx = sessions.findIndex((s) => s.id === session.id)
  if (idx >= 0) sessions[idx] = session
  else sessions.unshift(session)
  set("padel", sessions)
}

export function deletePadelSession(id: string): void {
  set("padel", getPadelSessions().filter((s) => s.id !== id))
}

// --- Gear ---
export function getGear(): Gear[] {
  return get<Gear[]>("gear", [])
}

export function saveGear(gear: Gear): void {
  const gears = getGear()
  const idx = gears.findIndex((g) => g.id === gear.id)
  if (idx >= 0) gears[idx] = gear
  else gears.push(gear)
  set("gear", gears)
}

// --- Goals ---
export function getGoals(): Goal[] {
  return get<Goal[]>("goals", [])
}

export function saveGoals(goals: Goal[]): void {
  set("goals", goals)
}

// --- User profile ---
const DEFAULT_PROFILE: UserProfile = {
  name: "",
  maxHR: 190,
  restHR: 50,
  weight: 70,
  theme: "dark",
  weekStart: "monday",
}

export function getProfile(): UserProfile {
  return get<UserProfile>("userprofile", DEFAULT_PROFILE)
}

export function saveProfile(profile: UserProfile): void {
  set("userprofile", profile)
}

// --- Strava tokens ---
export interface StravaTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
  athleteId: number
  athleteName: string
}

export function getStravaTokens(): StravaTokens | null {
  return get<StravaTokens | null>("strava_tokens", null)
}

export function saveStravaTokens(tokens: StravaTokens): void {
  set("strava_tokens", tokens)
}

export function clearStravaTokens(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(k("strava_tokens"))
}

// --- Quick stats for a specific profile (for home screen) ---
export function getProfileStats(profileId: ProfileId): { runs: number; km: number } {
  if (typeof window === "undefined") return { runs: 0, km: 0 }
  try {
    const raw = localStorage.getItem(kFor(profileId, "runs"))
    if (!raw) return { runs: 0, km: 0 }
    const arr = JSON.parse(raw) as Run[]
    return {
      runs: arr.length,
      km: Math.round(arr.reduce((s, r) => s + r.distance, 0)),
    }
  } catch { return { runs: 0, km: 0 } }
}

export function hasStravaForProfile(profileId: ProfileId): boolean {
  if (typeof window === "undefined") return false
  try {
    const raw = localStorage.getItem(kFor(profileId, "strava_tokens"))
    if (!raw) return false
    const tokens = JSON.parse(raw) as StravaTokens
    return !!tokens.accessToken
  } catch { return false }
}

// --- Reset ---
export function resetStorage(): void {
  if (typeof window === "undefined") return
  const profile = getActiveProfile()
  ;["runs", "gear", "goals", "userprofile", "strava_tokens"].forEach(
    (key) => localStorage.removeItem(`pp_${profile}_${key}`)
  )
}

// --- Export ---
export function exportAllData(): string {
  return JSON.stringify({
    runs: getRuns(), gear: getGear(), goals: getGoals(),
    profile: getProfile(), exportedAt: new Date().toISOString(),
  }, null, 2)
}

// --- Import ---
export function importAllData(jsonString: string): { success: boolean; message: string } {
  if (typeof window === "undefined") {
    return { success: false, message: "Import non disponible côté serveur" }
  }

  try {
    const data = JSON.parse(jsonString)

    // Validation basique
    if (!data.runs || !Array.isArray(data.runs)) {
      return { success: false, message: "Format JSON invalide : 'runs' manquant ou invalide" }
    }

    const profile = getActiveProfile()

    // Importer les données
    if (Array.isArray(data.runs)) set("runs", data.runs)
    if (Array.isArray(data.gear)) set("gear", data.gear)
    if (Array.isArray(data.goals)) set("goals", data.goals)
    if (data.profile && typeof data.profile === "object") set("userprofile", data.profile)

    return {
      success: true,
      message: `✅ Importation réussie ! ${data.runs.length} sorties restaurées.`,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue"
    return { success: false, message: `Erreur d'importation : ${msg}` }
  }
}
