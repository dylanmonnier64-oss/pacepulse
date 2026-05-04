"use client"
import { useState, useEffect } from "react"
import type { HealthStore, HealthMetrics, HealthDevice, WorkoutEntry } from "@/lib/healthTypes"

// Re-export types pour compatibilité
export type { WorkoutEntry, HealthMetrics, HealthDevice, HealthStore }
export { mergeHealthDevices } from "@/lib/healthTypes"

// ── Main hook ─────────────────────────────────────────────────────
export function useHealthData() {
  const [store, setStore] = useState<HealthStore>({
    devices: {},
    merged: {},
    lastUpdated: new Date().toISOString(),
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/health")
        if (res.ok) {
          const data = await res.json()
          setStore(data)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }

    fetchHealth()
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const hasDevices = Object.keys(store.devices).length > 0
  const deviceCount = Object.keys(store.devices).length
  const deviceList = Object.values(store.devices)
  const lastSyncTime = deviceList.length > 0 ? new Date(deviceList[0].lastSync) : null
  const lastSync = lastSyncTime ? lastSyncTime.toLocaleString("fr-FR") : null

  const minsSinceSync = lastSyncTime
    ? Math.floor((Date.now() - lastSyncTime.getTime()) / 60000)
    : null

  const syncStatus: "synced" | "stale" | "offline" =
    !hasDevices || minsSinceSync === null
      ? "offline"
      : minsSinceSync < 60
      ? "synced"
      : minsSinceSync < 120
      ? "stale"
      : "offline"

  const refresh = async () => {
    try {
      const res = await fetch("/api/health")
      if (res.ok) {
        const data = await res.json()
        setStore(data)
      }
    } catch {
      // silently fail
    }
  }

  return {
    devices: store.devices,
    merged: store.merged,
    lastUpdated: store.lastUpdated,
    hasDevices,
    loading,
    healthData: store,
    deviceCount,
    lastSync,
    syncStatus,
    refresh,
  }
}

// Alias pour compatibilité
export const useHealthDevices = useHealthData
