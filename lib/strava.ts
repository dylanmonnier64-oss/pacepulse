import type { Run, RunType } from "./types"
import { generateId } from "./utils"
import { calculateTSS } from "./calculations"

interface StravaActivity {
  id: number
  name: string
  sport_type: string
  type: string
  distance: number // meters
  moving_time: number // seconds
  total_elevation_gain: number // meters
  average_speed: number // m/s
  average_heartrate?: number
  max_heartrate?: number
  start_date: string // ISO date
  workout_type?: number // 0=default, 1=race, 2=long, 3=workout
  average_cadence?: number
}

function mapWorkoutType(workoutType?: number, sportType?: string): RunType {
  if (workoutType === 1) return "threshold" // race
  if (workoutType === 2) return "long" // long run
  if (workoutType === 3) return "interval" // workout
  return "endurance"
}

export async function fetchStravaActivities(
  accessToken: string,
  onProgress?: (count: number) => void
): Promise<Run[]> {
  const runs: Run[] = []
  let page = 1

  while (true) {
    const res = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=200&page=${page}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!res.ok) throw new Error(`Strava API error: ${res.status}`)

    const activities: StravaActivity[] = await res.json()
    if (!Array.isArray(activities) || activities.length === 0) break

    const runActivities = activities.filter(
      (a) => a.sport_type === "Run" || a.type === "Run"
    )

    for (const a of runActivities) {
      const distKm = a.distance / 1000
      if (distKm < 0.1) continue

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
          ? {
              avg: Math.round(a.average_heartrate),
              max: Math.round(a.max_heartrate || a.average_heartrate),
            }
          : undefined,
        isPersonalRecord: {},
      }
      run.tss = calculateTSS(run)
      runs.push(run)
    }

    onProgress?.(runs.length)
    if (activities.length < 200) break
    page++
  }

  return runs
}

export async function refreshStravaToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number } | null> {
  const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID
  if (!clientId) return null

  try {
    const res = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: "", // cannot refresh client-side — need server
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
    }
  } catch {
    return null
  }
}
