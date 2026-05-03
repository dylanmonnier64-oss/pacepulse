import type { Run, RunType, PadelSession } from "./types"
import { calculateTSS } from "./calculations"

export interface StravaActivity {
  id: number
  name: string
  sport_type: string
  type: string
  distance: number        // mètres
  moving_time: number     // secondes
  total_elevation_gain: number
  average_speed: number   // m/s
  average_heartrate?: number
  max_heartrate?: number
  start_date: string
  workout_type?: number   // 0=défaut, 1=course, 2=long, 3=interval
  average_cadence?: number
}

// ─── Classification ────────────────────────────────────────────────────────

const RUN_TYPES = new Set(["Run", "TrailRun", "VirtualRun"])
const PADEL_SPORT_TYPES = new Set(["Padel", "Squash", "Racquetball", "Tennis", "TableTennis", "Badminton", "Pickleball"])

function isRunActivity(a: StravaActivity): boolean {
  return RUN_TYPES.has(a.sport_type) || RUN_TYPES.has(a.type)
}

function isPadelActivity(a: StravaActivity): boolean {
  if (PADEL_SPORT_TYPES.has(a.sport_type) || PADEL_SPORT_TYPES.has(a.type)) return true
  // Convention utilisateur : pas de distance = padel
  if (a.distance < 100 && a.moving_time > 0) {
    const nameLower = (a.name || "").toLowerCase()
    if (nameLower.includes("padel") || nameLower.includes("pádel")) return true
  }
  return false
}

// ─── Conversion ────────────────────────────────────────────────────────────

function mapWorkoutType(workoutType?: number): RunType {
  if (workoutType === 1) return "threshold"
  if (workoutType === 2) return "long"
  if (workoutType === 3) return "interval"
  return "endurance"
}

function stravaActivityToRun(a: StravaActivity): Run | null {
  const distKm = a.distance / 1000
  if (distKm < 0.1) return null

  const paceSecPerKm = distKm > 0 ? Math.round(a.moving_time / distKm) : 0

  const run: Run = {
    id: `strava_${a.id}`,
    date: a.start_date,
    distance: Math.round(distKm * 100) / 100,
    duration: a.moving_time,
    pace: paceSecPerKm,
    elevation: Math.round(a.total_elevation_gain || 0),
    type: mapWorkoutType(a.workout_type),
    feeling: 7,
    notes: a.name || "",
    heartRate: a.average_heartrate
      ? { avg: Math.round(a.average_heartrate), max: Math.round(a.max_heartrate || a.average_heartrate) }
      : undefined,
    isPersonalRecord: {},
  }
  run.tss = calculateTSS(run)
  return run
}

function stravaActivityToPadelSession(a: StravaActivity, profile: string): PadelSession {
  return {
    id: `strava_${a.id}`,
    user_profile: profile,
    date: a.start_date.split("T")[0],
    duration: Math.round(a.moving_time / 60),
    result: "victoire",   // inconnu depuis Strava, défaut victoire
    rating: 7,
    comment: a.name || "",
    source: "strava",
    strava_id: String(a.id),
    created_at: new Date().toISOString(),
  }
}

// ─── Fetch unifié (runs + padel) ────────────────────────────────────────────

export async function fetchStravaAll(
  accessToken: string,
  profile: string,
  onProgress?: (msg: string) => void
): Promise<{ runs: Run[]; padel: PadelSession[] }> {
  const runs: Run[] = []
  const padel: PadelSession[] = []
  let page = 1

  while (true) {
    const res = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=200&page=${page}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!res.ok) throw new Error(`Strava API ${res.status}`)

    const activities: StravaActivity[] = await res.json()
    if (!Array.isArray(activities) || activities.length === 0) break

    for (const a of activities) {
      if (isRunActivity(a)) {
        const run = stravaActivityToRun(a)
        if (run) runs.push(run)
      } else if (isPadelActivity(a)) {
        padel.push(stravaActivityToPadelSession(a, profile))
      }
    }

    onProgress?.(`${runs.length} runs · ${padel.length} sessions padel…`)
    if (activities.length < 200) break
    page++
  }

  return { runs, padel }
}

// Gardé pour compatibilité ascendante
export async function fetchStravaActivities(
  accessToken: string,
  onProgress?: (count: number) => void
): Promise<Run[]> {
  const { runs } = await fetchStravaAll(accessToken, "dydz", (msg) => {
    const match = msg.match(/^(\d+) runs/)
    if (match) onProgress?.(parseInt(match[1]))
  })
  return runs
}

export async function refreshStravaToken(
  _refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number } | null> {
  // Le renouvellement côté client n'est plus supporté (client_secret requis).
  // Utiliser /api/strava/refresh côté serveur.
  return null
}
