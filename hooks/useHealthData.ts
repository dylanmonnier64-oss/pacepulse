"use client"
import { useState, useEffect, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkoutEntry {
  type: string
  duration: number     // minutes
  distance?: number    // km
  avgHR?: number
  date: string         // ISO 8601
}

export interface HealthMetrics {
  steps?: number
  heartRate?: {
    current: number
    avg7d: number
    resting: number
  }
  distance?: number    // km
  calories?: number
  workouts?: WorkoutEntry[]
}

export interface HealthDevice {
  id: string
  name: string
  lastSync: string     // ISO 8601
  data: HealthMetrics
}

export interface HealthStore {
  devices: Record<string, HealthDevice>
  merged: HealthMetrics
  lastUpdated: string  // ISO 8601
}

export type SyncStatus = 'synced' | 'stale' | 'offline'

export interface UseHealthDataResult {
  healthData: HealthStore | null
  syncStatus: SyncStatus
  lastSync: string | null
  deviceCount: number
  refresh: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const HEALTH_STORE_KEY = 'vomero_health_data'
const POLL_INTERVAL_MS = 5 * 60 * 1000   // 5 minutes

const ONE_HOUR_MS  = 60 * 60 * 1000
const TWO_HOURS_MS = 2 * 60 * 60 * 1000

// ─────────────────────────────────────────────────────────────────────────────
// PURE HELPERS (exported for external use)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merges all device data into a single HealthMetrics object.
 * Most recent value wins for each metric.
 */
export function mergeHealthDevices(store: HealthStore): HealthMetrics {
  const devices = Object.values(store.devices)
  if (devices.length === 0) return {}

  // Sort devices by lastSync descending so we prefer the most recently synced
  const sorted = [...devices].sort(
    (a, b) => new Date(b.lastSync).getTime() - new Date(a.lastSync).getTime()
  )

  const merged: HealthMetrics = {}

  for (const device of sorted) {
    const m = device.data

    // steps — take the highest value (in case devices double-count differently)
    if (m.steps !== undefined) {
      merged.steps = Math.max(merged.steps ?? 0, m.steps)
    }

    // heartRate — take from most recent device (already sorted)
    if (m.heartRate !== undefined && merged.heartRate === undefined) {
      merged.heartRate = { ...m.heartRate }
    }

    // distance — take highest
    if (m.distance !== undefined) {
      merged.distance = Math.max(merged.distance ?? 0, m.distance)
    }

    // calories — take highest
    if (m.calories !== undefined) {
      merged.calories = Math.max(merged.calories ?? 0, m.calories)
    }

    // workouts — merge all, de-duplicate by (type, date)
    if (m.workouts && m.workouts.length > 0) {
      const existing = merged.workouts ?? []
      const existingKeys = new Set(existing.map(w => `${w.type}|${w.date}`))
      const newEntries = m.workouts.filter(w => !existingKeys.has(`${w.type}|${w.date}`))
      merged.workouts = [...existing, ...newEntries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    }
  }

  return merged
}

/**
 * Persists the HealthStore to localStorage.
 */
export function saveHealthData(store: HealthStore): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(HEALTH_STORE_KEY, JSON.stringify(store))
  } catch {
    // Silently ignore quota exceeded or other errors
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function loadHealthData(): HealthStore | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(HEALTH_STORE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as HealthStore
  } catch {
    return null
  }
}

function computeSyncStatus(lastUpdated: string | null | undefined): SyncStatus {
  if (!lastUpdated) return 'offline'
  const ageMs = Date.now() - new Date(lastUpdated).getTime()
  if (ageMs <= ONE_HOUR_MS)  return 'synced'
  if (ageMs <= TWO_HOURS_MS) return 'stale'
  return 'offline'
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useHealthData(): UseHealthDataResult {
  const [healthData, setHealthData] = useState<HealthStore | null>(null)

  const refresh = useCallback(() => {
    const store = loadHealthData()
    setHealthData(store)
  }, [])

  // Initial load
  useEffect(() => {
    refresh()
  }, [refresh])

  // Poll every 5 minutes
  useEffect(() => {
    const timer = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [refresh])

  const syncStatus   = computeSyncStatus(healthData?.lastUpdated)
  const lastSync     = healthData?.lastUpdated ?? null
  const deviceCount  = healthData ? Object.keys(healthData.devices).length : 0

  return { healthData, syncStatus, lastSync, deviceCount, refresh }
}
