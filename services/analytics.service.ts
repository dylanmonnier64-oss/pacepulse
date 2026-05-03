/**
 * analytics.service.ts — Clean facade over all performance calculation logic.
 * Import from here instead of directly from lib/calculations.ts.
 */

export {
  calculateTSS,
  buildFitnessTimeline,
  getTrainingStatus,
  getWeeklyLoads,
} from "@/lib/calculations"

export type { FitnessDataPoint } from "@/lib/types"

// GAP — Gradient Adjusted Pace
export function calculateGAP(paceSec: number, gradientPercent: number): number {
  if (gradientPercent > 0) {
    return paceSec + gradientPercent * 8 // +8 sec/km per 1% uphill
  }
  return Math.max(paceSec + gradientPercent * 3, paceSec * 0.7) // -3 sec/km per 1% downhill
}

// Pulse Index (1–100): weighted effort from HR zone distribution
export function calculatePulseIndex(zones: Record<"z1" | "z2" | "z3" | "z4" | "z5", number>): number {
  const weights = { z1: 1, z2: 1.5, z3: 2, z4: 3, z5: 5 }
  const total = Object.values(zones).reduce((s, v) => s + v, 0)
  if (total === 0) return 0
  const weighted = (zones.z1 * weights.z1 + zones.z2 * weights.z2 + zones.z3 * weights.z3 +
    zones.z4 * weights.z4 + zones.z5 * weights.z5)
  return Math.round((weighted / (total * 5)) * 100)
}

// Riegel predictor: T2 = T1 × (D2/D1)^1.06
export function riegelPredict(t1Sec: number, d1Km: number, d2Km: number): number {
  return Math.round(t1Sec * Math.pow(d2Km / d1Km, 1.06))
}

// Vitality score computation (used by VitalityScore widget)
export function computeVitalityScore(runs: { date: string; feeling: number; pace: number }[]): number {
  const now = Date.now()
  const day = 86_400_000
  const runs7 = runs.filter(r => now - new Date(r.date).getTime() < 7 * day).length
  const runs30 = runs.filter(r => now - new Date(r.date).getTime() < 30 * day).length
  const last = runs[0]

  const freq = Math.min(runs7 / 5, 1) * 35
  const consistency = Math.min(runs30 / 20, 1) * 30
  let freshness = 18
  if (last) {
    const daysSince = (now - new Date(last.date).getTime()) / day
    freshness = daysSince <= 1 ? Math.round((1 - last.feeling / 10) * 25) : daysSince <= 3 ? 20 : 18
  }
  let trend = 5
  if (runs.length >= 3) {
    const recent = runs[0].pace
    const prev = runs.slice(1, 6).reduce((s, r) => s + r.pace, 0) / Math.min(5, runs.length - 1)
    trend = recent < prev * 0.98 ? 10 : recent > prev * 1.05 ? 2 : 5
  }
  return Math.max(0, Math.min(100, Math.round(freq + consistency + freshness + trend)))
}

// Hydration loss estimate (ml)
export function estimateHydrationLoss(
  durationSec: number,
  runType: string,
  tempCelsius: number
): number {
  const mult: Record<string, number> = { recovery: 1, endurance: 1.2, long: 1.3, threshold: 1.5, interval: 1.8 }
  const rate = 500 * (mult[runType] ?? 1.2) + Math.max(0, (tempCelsius - 15) * 30)
  return Math.round(rate * (durationSec / 3600))
}
