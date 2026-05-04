import type { HealthMetrics, WorkoutEntry } from "./healthTypes"

/**
 * Types pour Google Fit API
 * Google Fit retourne les données en data points avec timestamps en nanosecondes
 */

interface GoogleFitDataPoint {
  dataTypeName: string
  endTimeNanos: string
  startTimeNanos: string
  value: Array<{ fpVal?: number; intVal?: number; stringVal?: string }>
}

interface GoogleFitDataset {
  dataSourceId: string
  point: GoogleFitDataPoint[]
}

interface GoogleFitAggregateResponse {
  bucket: Array<{
    startTimeMillis: string
    endTimeMillis: string
    dataset: GoogleFitDataset[]
  }>
}

/**
 * Convertit nanosecondes en milliseconds
 */
function nanoToMs(nanos: string): number {
  return Math.floor(parseInt(nanos) / 1000000)
}

/**
 * Extrait une valeur numérique d'un data point Google Fit
 */
function getNumericValue(point: GoogleFitDataPoint): number | undefined {
  const values = point.value?.[0]
  return values?.fpVal ?? values?.intVal ?? undefined
}

/**
 * Fetch données agrégées Google Fit
 * Utilise l'API Fitness REST pour récupérer des données agrégées
 */
export async function fetchGoogleFitAggregated(
  accessToken: string,
  startTimeMs: number,
  endTimeMs: number
): Promise<HealthMetrics> {
  const requestBody = {
    aggregateBy: [
      {
        dataTypeName: "com.google.step_count.delta",
        dataSourceId: "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps",
      },
      {
        dataTypeName: "com.google.distance.delta",
        dataSourceId: "derived:com.google.distance.delta:com.google.android.gms:merge_distance",
      },
      {
        dataTypeName: "com.google.calories.expended",
        dataSourceId: "derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended",
      },
      {
        dataTypeName: "com.google.heart_rate.bpm",
      },
      {
        dataTypeName: "com.google.sleep.segment",
      },
    ],
    bucketByTime: { durationMillis: 86400000 }, // 1 jour
    startTimeMillis: startTimeMs,
    endTimeMillis: endTimeMs,
  }

  const res = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })

  if (!res.ok) {
    console.error("[google-fit] aggregate request failed:", res.status, await res.text())
    return {}
  }

  const data = (await res.json()) as GoogleFitAggregateResponse

  // Traiter les données
  const metrics: HealthMetrics = {}

  for (const bucket of data.bucket || []) {
    for (const dataset of bucket.dataset || []) {
      for (const point of dataset.point || []) {
        const value = getNumericValue(point)
        if (value === undefined) continue

        if (point.dataTypeName === "com.google.step_count.delta") {
          metrics.steps = (metrics.steps || 0) + value
        } else if (point.dataTypeName === "com.google.distance.delta") {
          // Distance en mètres, convertir en km
          metrics.distance = (metrics.distance || 0) + value / 1000
        } else if (point.dataTypeName === "com.google.calories.expended") {
          metrics.calories = (metrics.calories || 0) + value
        } else if (point.dataTypeName === "com.google.heart_rate.bpm") {
          if (!metrics.heartRate) {
            metrics.heartRate = { current: 0, avg7d: 0, resting: 0 }
          }
          metrics.heartRate.current = value
        } else if (point.dataTypeName === "com.google.sleep.segment") {
          // Sleep segment en nanosecondes, convertir
          const durationMs = nanoToMs(point.endTimeNanos) - nanoToMs(point.startTimeNanos)
          const hours = Math.floor(durationMs / 3600000)
          const mins = Math.round((durationMs % 3600000) / 60000)

          if (!metrics.sleepHours) metrics.sleepHours = hours
          if (!metrics.sleepMinutes) metrics.sleepMinutes = mins
        }
      }
    }
  }

  return metrics
}

/**
 * Fetch activités (sessions de sport) depuis Google Fit
 */
export async function fetchGoogleFitActivities(
  accessToken: string,
  startTimeMs: number,
  endTimeMs: number
): Promise<WorkoutEntry[]> {
  const requestBody = {
    aggregateBy: [
      {
        dataTypeName: "com.google.activity.segment",
      },
    ],
    bucketByTime: { durationMillis: 3600000 }, // 1 heure pour capturer les sessions
    startTimeMillis: startTimeMs,
    endTimeMillis: endTimeMs,
  }

  const res = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })

  if (!res.ok) {
    console.error("[google-fit] activities request failed:", res.status)
    return []
  }

  const data = (await res.json()) as GoogleFitAggregateResponse
  const workouts: WorkoutEntry[] = []

  // Mapping activités Google Fit vers noms lisibles
  const activityTypeMap: Record<number, string> = {
    0: "unknown",
    1: "in_vehicle",
    2: "biking",
    3: "on_foot",
    4: "still",
    5: "unknown",
    6: "tilting",
    7: "walking",
    8: "running",
    9: "still",
    10: "cycling",
    11: "hiking",
    12: "sports",
    13: "swimming",
  }

  for (const bucket of data.bucket || []) {
    for (const dataset of bucket.dataset || []) {
      for (const point of dataset.point || []) {
        if (point.dataTypeName === "com.google.activity.segment") {
          const activityType = point.value?.[0]?.intVal ?? 0
          const activityName = activityTypeMap[activityType] || "unknown"
          const startTimeMs = nanoToMs(point.startTimeNanos)
          const endTimeMs = nanoToMs(point.endTimeNanos)
          const durationMs = endTimeMs - startTimeMs

          if (durationMs > 60000) {
            // Filtrer les sessions < 1 min
            workouts.push({
              type: activityName,
              duration: Math.round(durationMs / 1000), // en secondes
              date: new Date(startTimeMs).toISOString(),
            })
          }
        }
      }
    }
  }

  return workouts
}

/**
 * Renouvelle le token Google Fit (refresh token)
 * À appeler côté serveur uniquement
 */
export async function refreshGoogleFitToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: number } | null> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID
  const clientSecret = process.env.GOOGLE_FIT_CLIENT_SECRET

  if (!clientId || !clientSecret) return null

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    })

    if (!res.ok) return null

    const data = await res.json()
    return {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    }
  } catch {
    return null
  }
}
