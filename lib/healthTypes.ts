// Types et utilitaires de santé — importable côté serveur ET client

export interface WorkoutEntry {
  type: string
  duration: number
  distance?: number
  avgHR?: number
  date: string
}

export interface HealthMetrics {
  steps?: number
  distance?: number
  calories?: number
  sleepHours?: number      // heures de sommeil total (nuit précédente)
  sleepMinutes?: number    // minutes restantes
  heartRate?: {
    current: number
    avg7d: number
    resting: number
  }
  workouts?: WorkoutEntry[]
}

export interface HealthDevice {
  id: string
  name: string
  lastSync: string
  data: HealthMetrics
}

export interface HealthStore {
  devices: Record<string, HealthDevice>
  merged: HealthMetrics
  lastUpdated: string
}

export function mergeHealthDevices(store: HealthStore): HealthMetrics {
  const allDevices = Object.values(store.devices)
  if (allDevices.length === 0) return {}

  const merged: HealthMetrics = {}

  const steps = allDevices.map(d => d.data.steps ?? 0).filter(s => s > 0)
  if (steps.length > 0) merged.steps = Math.max(...steps)

  const distance = allDevices.map(d => d.data.distance ?? 0).filter(d => d > 0)
  if (distance.length > 0) merged.distance = Math.max(...distance)

  const calories = allDevices.map(d => d.data.calories ?? 0).filter(c => c > 0)
  if (calories.length > 0) merged.calories = Math.max(...calories)

  const hrData = allDevices
    .map(d => d.data.heartRate)
    .filter(Boolean) as Array<HealthMetrics['heartRate']>
  if (hrData.length > 0) {
    merged.heartRate = {
      current: Math.max(...hrData.map(h => h?.current ?? 0)),
      avg7d:   Math.max(...hrData.map(h => h?.avg7d ?? 0)),
      resting: Math.max(...hrData.map(h => h?.resting ?? 0)),
    }
  }

  const allWorkouts = allDevices.flatMap(d => d.data.workouts ?? [])
  if (allWorkouts.length > 0) merged.workouts = allWorkouts

  return merged
}
