/**
 * /api/health — Health Auto Export webhook + data retrieval
 *
 * POST: Receives health data from Health Auto Export app.
 *       device_id peut venir du body OU du query param (?device_id=watch-1)
 *       Supporte le format Health Auto Export (data.metrics[]) et le format simple.
 *
 * GET:  Retourne le store de santé courant.
 *
 * ⚠️  PERSISTENCE
 * Utilise Supabase si configuré, sinon fallback en mémoire (reset sur cold start).
 */

import { NextRequest, NextResponse } from 'next/server'
import type { HealthStore, HealthDevice, HealthMetrics, WorkoutEntry } from '@/lib/healthTypes'
import { mergeHealthDevices } from '@/lib/healthTypes'

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE (optionnel — fallback mémoire si non configuré)
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_OK  = !!SUPABASE_URL && !SUPABASE_URL.includes('placeholder')

async function supabaseUpsert(device: HealthDevice) {
  if (!SUPABASE_OK) return
  await fetch(`${SUPABASE_URL}/rest/v1/health_devices`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        SUPABASE_KEY!,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer':        'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      device_id:   device.id,
      device_name: device.name,
      last_sync:   device.lastSync,
      data:        device.data,
    }),
  })
}

async function supabaseFetchAll(): Promise<HealthDevice[]> {
  if (!SUPABASE_OK) return []
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/health_devices?select=*&order=last_sync.desc`, {
      headers: {
        'apikey':        SUPABASE_KEY!,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    })
    if (!res.ok) return []
    const rows = await res.json() as Array<{
      device_id: string; device_name: string; last_sync: string; data: HealthMetrics
    }>
    return rows.map(r => ({
      id:       r.device_id,
      name:     r.device_name,
      lastSync: r.last_sync,
      data:     r.data,
    }))
  } catch {
    return []
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY FALLBACK
// ─────────────────────────────────────────────────────────────────────────────

let memStore: HealthStore = {
  devices:     {},
  merged:      {},
  lastUpdated: new Date().toISOString(),
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSE HEALTH AUTO EXPORT FORMAT
// Supporte les deux formats :
//   1. Format metrics[] : { data: { metrics: [{name, data:[{qty}]}], workouts:[...] } }
//   2. Format simple    : { data: { steps, heart_rate, ... } }
// ─────────────────────────────────────────────────────────────────────────────

interface HaeMetricEntry { qty?: number; Avg?: number; Min?: number; Max?: number; date?: string }
interface HaeMetric      { name: string; units?: string; data: HaeMetricEntry[] }
interface HaeWorkout {
  name?: string; start?: string; duration?: number
  distance?: number; activeEnergyBurned?: number; avgHeartRate?: number
  // alternate keys
  workoutActivityType?: string; startDate?: string
  totalDistance?: number; averageHeartRate?: number
}

interface HaePayload {
  // Health Auto Export format
  data?: {
    metrics?: HaeMetric[]
    workouts?: HaeWorkout[]
    // simple format fallback
    steps?: number
    heart_rate?: number
    heart_rate_avg_7d?: number
    resting_heart_rate?: number
    distance?: number
    active_calories?: number
  }
  // device identification — peut venir ici ou du query param
  device_id?:   string
  device_name?: string
  name?:        string  // Health Auto Export met parfois le nom ici
}

function getMetricValue(metrics: HaeMetric[], name: string): number | undefined {
  const m = metrics.find(m => m.name === name)
  if (!m || m.data.length === 0) return undefined
  // prend le dernier enregistrement
  const last = m.data[m.data.length - 1]
  return last.qty ?? last.Avg ?? last.Min ?? undefined
}

function parsePayload(body: HaePayload): HealthMetrics {
  const metrics: HealthMetrics = {}
  const d = body.data
  if (!d) return metrics

  // ── Format metrics[] (Health Auto Export natif) ──
  if (d.metrics && d.metrics.length > 0) {
    const steps    = getMetricValue(d.metrics, 'step_count')
            ?? getMetricValue(d.metrics, 'steps')
    const dist     = getMetricValue(d.metrics, 'walking_running_distance')
            ?? getMetricValue(d.metrics, 'distance_walking_running')
            ?? getMetricValue(d.metrics, 'distanceWalkingRunning')
    const cal      = getMetricValue(d.metrics, 'active_energy_burned')
            ?? getMetricValue(d.metrics, 'activeEnergyBurned')
    const hr       = getMetricValue(d.metrics, 'heart_rate')
    const restHR   = getMetricValue(d.metrics, 'resting_heart_rate')
            ?? getMetricValue(d.metrics, 'restingHeartRate')
    const hrv      = getMetricValue(d.metrics, 'heart_rate_variability_sdnn')

    // Sommeil — sleep_analysis donne la durée totale en minutes ou heures
    const sleepMins = getMetricValue(d.metrics, 'sleep_analysis')
            ?? getMetricValue(d.metrics, 'asleep')
            ?? getMetricValue(d.metrics, 'sleeping')
    const sleepHoursRaw = getMetricValue(d.metrics, 'sleep_hours')
    if (sleepMins !== undefined) {
      // Health Auto Export retourne le sommeil en minutes généralement
      const totalMins = sleepMins > 24 ? sleepMins : sleepMins * 60 // si < 24 → déjà en heures
      metrics.sleepHours   = Math.floor(totalMins / 60)
      metrics.sleepMinutes = Math.round(totalMins % 60)
    } else if (sleepHoursRaw !== undefined) {
      metrics.sleepHours   = Math.floor(sleepHoursRaw)
      metrics.sleepMinutes = Math.round((sleepHoursRaw % 1) * 60)
    }

    if (steps  !== undefined) metrics.steps    = steps
    if (dist   !== undefined) metrics.distance = dist
    if (cal    !== undefined) metrics.calories = cal

    if (hr !== undefined || restHR !== undefined) {
      metrics.heartRate = {
        current: hr      ?? 0,
        avg7d:   hrv     ?? 0,
        resting: restHR  ?? 0,
      }
    }
  }

  // ── Format simple (fallback / test manuel) ──
  if (d.steps           !== undefined) metrics.steps    = d.steps
  if (d.distance        !== undefined) metrics.distance = d.distance
  if (d.active_calories !== undefined) metrics.calories = d.active_calories
  if (d.heart_rate !== undefined || d.resting_heart_rate !== undefined) {
    metrics.heartRate = {
      current: d.heart_rate         ?? metrics.heartRate?.current ?? 0,
      avg7d:   d.heart_rate_avg_7d  ?? metrics.heartRate?.avg7d   ?? 0,
      resting: d.resting_heart_rate ?? metrics.heartRate?.resting  ?? 0,
    }
  }

  // ── Workouts (les deux formats) ──
  const rawWorkouts: HaeWorkout[] = d.workouts ?? []
  if (rawWorkouts.length > 0) {
    metrics.workouts = rawWorkouts.map((w): WorkoutEntry => ({
      type:     w.name ?? w.workoutActivityType ?? 'unknown',
      duration: w.duration ?? 0,
      distance: w.distance ?? w.totalDistance,
      avgHR:    w.avgHeartRate ?? w.averageHeartRate,
      date:     w.start ?? w.startDate ?? new Date().toISOString(),
    }))
  }

  return metrics
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Receive health data
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Log raw body for debugging
  let body: unknown
  try {
    const text = await request.text()
    console.log('[health POST] raw body:', text.slice(0, 500))
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const url      = new URL(request.url)
  const payload  = body as HaePayload

  // device_id : query param > body > fallback
  const device_id   = url.searchParams.get('device_id')
    ?? payload.device_id
    ?? 'default'
  const device_name = payload.device_name ?? payload.name ?? device_id

  console.log('[health POST] device_id:', device_id, '| keys:', Object.keys(payload))

  const receivedAt = new Date().toISOString()
  const newData    = parsePayload(payload)

  // Merger avec les données existantes du même device (pas écraser)
  const existing   = memStore.devices[device_id]?.data ?? {}
  const mergedData: HealthMetrics = {
    steps:    newData.steps    ?? existing.steps,
    distance: newData.distance ?? existing.distance,
    calories: newData.calories ?? existing.calories,
    sleepHours:   newData.sleepHours   ?? existing.sleepHours,
    sleepMinutes: newData.sleepMinutes ?? existing.sleepMinutes,
    heartRate: newData.heartRate
      ? {
          current: newData.heartRate.current || existing.heartRate?.current || 0,
          avg7d:   newData.heartRate.avg7d   || existing.heartRate?.avg7d   || 0,
          resting: newData.heartRate.resting || existing.heartRate?.resting  || 0,
        }
      : existing.heartRate,
    workouts: newData.workouts?.length
      ? newData.workouts
      : existing.workouts,
  }

  const device: HealthDevice = {
    id:       device_id,
    name:     device_name,
    lastSync: receivedAt,
    data:     mergedData,
  }

  // Persist to Supabase if available
  await supabaseUpsert(device)

  // Always update memory store (for same-instance GETs)
  memStore = {
    devices: {
      ...memStore.devices,
      [device_id]: device,
    },
    merged:      {},
    lastUpdated: receivedAt,
  }
  memStore.merged = mergeHealthDevices(memStore)

  console.log('[health POST] metrics stored:', JSON.stringify(device.data))

  return NextResponse.json({ status: 200, device_id, received_at: receivedAt }, { status: 200 })
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — Return current health store
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(_request: NextRequest): Promise<NextResponse> {
  // Try Supabase first
  const dbDevices = await supabaseFetchAll()

  if (dbDevices.length > 0) {
    const store: HealthStore = {
      devices:     Object.fromEntries(dbDevices.map(d => [d.id, d])),
      merged:      {},
      lastUpdated: dbDevices[0]?.lastSync ?? new Date().toISOString(),
    }
    store.merged = mergeHealthDevices(store)
    return NextResponse.json(store)
  }

  // Fallback: mémoire (peut être vide sur Vercel si cold start)
  return NextResponse.json(memStore)
}
