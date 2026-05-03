/**
 * /api/health — Health Auto Export webhook + data retrieval
 *
 * POST: Receives health data from Health Auto Export app.
 *       Merges the incoming payload into the in-memory store.
 *       Returns { status: 200, device_id, received_at }.
 *
 * GET:  Returns the current in-memory health store as JSON.
 *
 * ⚠️  PERSISTENCE LIMITATION
 * This route runs as a serverless function (Netlify / Vercel). The module-level
 * `healthStore` variable is in-memory only — it resets on each cold start and is
 * NOT shared across concurrent function instances.
 *
 * For persistence across deploys, use Supabase (see SETUP.md):
 *   - Table: health_store (id, device_id, payload jsonb, received_at timestamptz)
 *   - Replace the in-memory store reads/writes below with supabase-js calls.
 */

import { NextRequest, NextResponse } from 'next/server'
import type { HealthStore, HealthDevice, HealthMetrics, WorkoutEntry } from '@/hooks/useHealthData'
import { mergeHealthDevices } from '@/hooks/useHealthData'

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY STORE (module-level — resets on cold start)
// For persistence across deploys, use Supabase (see SETUP.md).
// ─────────────────────────────────────────────────────────────────────────────

let healthStore: HealthStore = {
  devices: {},
  merged:  {},
  lastUpdated: new Date().toISOString(),
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST BODY TYPES (Health Auto Export format)
// ─────────────────────────────────────────────────────────────────────────────

interface IncomingWorkout {
  workoutActivityType?: string
  duration?: number
  totalDistance?: number
  averageHeartRate?: number
  startDate?: string
}

interface IncomingHealthPayload {
  device_id: string
  device_name?: string
  data?: {
    steps?: number
    heart_rate?: number
    heart_rate_avg_7d?: number
    resting_heart_rate?: number
    distance?: number
    active_calories?: number
    workouts?: IncomingWorkout[]
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function mapIncomingToMetrics(data: IncomingHealthPayload['data']): HealthMetrics {
  if (!data) return {}

  const metrics: HealthMetrics = {}

  if (data.steps            !== undefined) metrics.steps    = data.steps
  if (data.distance         !== undefined) metrics.distance = data.distance
  if (data.active_calories  !== undefined) metrics.calories = data.active_calories

  if (
    data.heart_rate         !== undefined ||
    data.heart_rate_avg_7d  !== undefined ||
    data.resting_heart_rate !== undefined
  ) {
    metrics.heartRate = {
      current: data.heart_rate        ?? 0,
      avg7d:   data.heart_rate_avg_7d ?? 0,
      resting: data.resting_heart_rate ?? 0,
    }
  }

  if (data.workouts && data.workouts.length > 0) {
    metrics.workouts = data.workouts.map((w): WorkoutEntry => ({
      type:     w.workoutActivityType ?? 'unknown',
      duration: w.duration            ?? 0,
      distance: w.totalDistance,
      avgHR:    w.averageHeartRate,
      date:     w.startDate           ?? new Date().toISOString(),
    }))
  }

  return metrics
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Receive health data
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  // Validate required device_id field
  if (
    typeof body !== 'object' ||
    body === null ||
    !('device_id' in body) ||
    typeof (body as Record<string, unknown>).device_id !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Missing required field: device_id (string)' },
      { status: 400 }
    )
  }

  const payload = body as IncomingHealthPayload
  const { device_id, device_name, data } = payload

  const receivedAt = new Date().toISOString()

  const device: HealthDevice = {
    id:       device_id,
    name:     device_name ?? device_id,
    lastSync: receivedAt,
    data:     mapIncomingToMetrics(data),
  }

  // Merge device into store
  healthStore = {
    devices: {
      ...healthStore.devices,
      [device_id]: device,
    },
    merged:      {},        // will be recomputed below
    lastUpdated: receivedAt,
  }

  // Recompute merged metrics
  healthStore.merged = mergeHealthDevices(healthStore)

  return NextResponse.json(
    { status: 200, device_id, received_at: receivedAt },
    { status: 200 }
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — Return current health store
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(healthStore)
}
