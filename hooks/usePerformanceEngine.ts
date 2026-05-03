"use client"
import { useMemo } from "react"
import { useRuns } from "@/hooks/useRuns"
import { getProfile } from "@/lib/storage"
import { calculateHRZones, riegelPredict, detectPersonalRecords } from "@/lib/calculations"
import type { Run, HRZone } from "@/lib/types"

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES LEMON
// ─────────────────────────────────────────────────────────────────────────────
export const LEMON_COLORS = {
  z1: "#F4D03F",   // jaune primaire
  z2: "#E8A020",   // orange clair
  z3: "#E67E22",   // orange
  z4: "#C0392B",   // rouge
  z5: "#9B59B6",   // fuchsia
} as const

// Seuil par défaut si non renseigné (5:00/km = allure endurance haute)
const DEFAULT_THRESHOLD_PACE = 300 // sec/km

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1A — TSS (formule spec)
// TSS = (durée_s × intensité_normalisée²) / 3600
// intensité_normalisée :
//   • avec FC  → (FC_moy / FC_max)²
//   • sans FC  → allure_seuil / allure_réelle  (ratio, plafonné à 1.5)
// ─────────────────────────────────────────────────────────────────────────────
function specTSS(run: Run, maxHR: number, thresholdPace = DEFAULT_THRESHOLD_PACE): number {
  if (!run.duration || run.duration <= 0) return 0

  let normalizedIntensity: number
  if (run.heartRate?.avg && maxHR > 0) {
    normalizedIntensity = Math.pow(run.heartRate.avg / maxHR, 2)
  } else {
    normalizedIntensity = run.pace > 0
      ? Math.min(thresholdPace / run.pace, 1.5)
      : 0.75
  }

  return (run.duration * Math.pow(normalizedIntensity, 2)) / 3600
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1B — FORME / FATIGUE (fenêtre 7 jours glissants)
// Forme   = Σ TSS de J-7 à J-2 (charge de fond)
// Fatigue = TSS(J-1) + TSS(J0) × 1.3 (charge récente amplifiée)
// ─────────────────────────────────────────────────────────────────────────────
function dayKey(offsetFromToday: number): string {
  const d = new Date()
  d.setDate(d.getDate() - offsetFromToday)
  return d.toISOString().split("T")[0]
}

function buildDailyTSS(runs: Run[], maxHR: number): Record<string, number> {
  const map: Record<string, number> = {}
  for (const run of runs) {
    const key = run.date.split("T")[0]
    map[key] = (map[key] ?? 0) + specTSS(run, maxHR)
  }
  return map
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1B — PREDICTOR PRO (Riegel)
// T2 = T1 × (d2/d1)^1.06
// Base : 3 meilleures activités récentes (distance ≥ 3 km, feeling ≥ 5)
// ─────────────────────────────────────────────────────────────────────────────
const RACE_TARGETS: Array<{ km: number; label: string; prKey: string }> = [
  { km: 5,      label: "5 km",  prKey: "5km"  },
  { km: 10,     label: "10 km", prKey: "10km" },
  { km: 21.097, label: "Semi",  prKey: "semi" },
]

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1C — ZONE FC DOMINANTE d'une sortie
// ─────────────────────────────────────────────────────────────────────────────
function dominantZone(run: Run, zones: HRZone[]): number {
  if (!run.heartRate?.avg) {
    const typeMap: Record<string, number> = {
      recovery: 1, endurance: 2, long: 2, threshold: 4, interval: 5,
    }
    return typeMap[run.type] ?? 2
  }
  for (let i = zones.length - 1; i >= 0; i--) {
    if (run.heartRate.avg >= zones[i].minBpm) return zones[i].zone
  }
  return 1
}

// Distribution estimée des zones sur une sortie (%)
function estimateZoneDistribution(run: Run, zones: HRZone[]): number[] {
  if (!run.heartRate) {
    // Estimation par type
    const dist = [0, 0, 0, 0, 0]
    const dom = dominantZone(run, zones) - 1
    dist[dom] = 70
    if (dom > 0) dist[dom - 1] = 20
    if (dom < 4) dist[dom + 1] = 10
    return dist
  }

  const avg = run.heartRate.avg
  const raw = zones.map(z => {
    const mid = (z.minBpm + z.maxBpm) / 2
    const spread = z.maxBpm - z.minBpm
    return Math.max(0, spread - Math.abs(mid - avg) * 0.9)
  })
  const total = raw.reduce((s, v) => s + v, 0)
  if (total === 0) return [20, 40, 25, 10, 5]
  return raw.map(v => Math.round((v / total) * 100))
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES PUBLICS
// ─────────────────────────────────────────────────────────────────────────────
export interface FormeFatigueData {
  forme: number          // TSS cumulé J-7→J-2
  fatigue: number        // TSS(J-1) + TSS(J0)×1.3
  formeRatio: number     // forme/fatigue — >1 = en forme, <1 = fatigué
  tssToday: number
  tssYesterday: number
  tss7Days: number[]     // [J-6..J-0] pour sparkline
  statusLabel: string
  statusColor: string
}

export interface PredictionResult {
  label: string
  km: number
  predictedSeconds: number
  predictedPace: number  // sec/km
  prSeconds?: number
  deltaPct: number       // positif = prédiction plus rapide que le PR
  deltaSeconds: number   // différence brute
  confidence: number     // 30–95
  color: string          // vert si amélioration, rouge sinon
}

export interface ZoneData {
  hrZones: HRZone[]
  lastRunZone: number           // zone dominante
  zoneDistribution: number[]    // [z1%, z2%, z3%, z4%, z5%]
  zoneColors: string[]
}

export interface PerformanceEngineOutput {
  formeFatigue: FormeFatigueData
  predictions: PredictionResult[]
  bestBaseRuns: Run[]   // top 3 utilisés pour Riegel
  zones: ZoneData
  loading: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export function usePerformanceEngine(): PerformanceEngineOutput {
  const { runs, loading } = useRuns()
  const profile = getProfile()
  const maxHR   = profile?.maxHR  ?? 190
  const restHR  = profile?.restHR ?? 60

  const output = useMemo((): Omit<PerformanceEngineOutput, "loading"> => {

    // ── 1. TSS journalier ──────────────────────────────────────────────────
    const dailyTSS = buildDailyTSS(runs, maxHR)

    const j0 = dailyTSS[dayKey(0)] ?? 0
    const j1 = dailyTSS[dayKey(1)] ?? 0
    const forme = [2, 3, 4, 5, 6, 7].reduce((s, i) => s + (dailyTSS[dayKey(i)] ?? 0), 0)
    const fatigue = j1 + j0 * 1.3
    const formeRatio = fatigue > 0.1 ? forme / fatigue : forme > 0 ? 5 : 1

    // Sparkline: J-6 → J0
    const tss7Days = [6, 5, 4, 3, 2, 1, 0].map(i => +(dailyTSS[dayKey(i)] ?? 0).toFixed(1))

    // Statut lisible
    let statusLabel: string
    let statusColor: string
    if (formeRatio >= 2.5)      { statusLabel = "Très en forme";   statusColor = LEMON_COLORS.z1 }
    else if (formeRatio >= 1.5) { statusLabel = "En forme";        statusColor = LEMON_COLORS.z2 }
    else if (formeRatio >= 0.8) { statusLabel = "Charge normale";  statusColor = LEMON_COLORS.z3 }
    else if (formeRatio >= 0.4) { statusLabel = "Fatigué";         statusColor = LEMON_COLORS.z4 }
    else                        { statusLabel = "Surcharge — repos"; statusColor = LEMON_COLORS.z5 }

    const formeFatigue: FormeFatigueData = {
      forme:        +forme.toFixed(1),
      fatigue:      +fatigue.toFixed(1),
      formeRatio:   +formeRatio.toFixed(2),
      tssToday:     +j0.toFixed(1),
      tssYesterday: +j1.toFixed(1),
      tss7Days,
      statusLabel,
      statusColor,
    }

    // ── 2. Predictor Pro (Riegel) ──────────────────────────────────────────
    const prs = detectPersonalRecords(runs)
    const bestBaseRuns = [...runs]
      .filter(r => r.distance >= 3 && r.feeling >= 5 && r.pace > 0)
      .sort((a, b) => a.pace - b.pace)
      .slice(0, 3)

    const base = bestBaseRuns[0] ?? null
    const predictions: PredictionResult[] = base
      ? RACE_TARGETS.map(({ km, label, prKey }) => {
          const predictedSeconds = Math.round(riegelPredict(base.duration, base.distance, km))
          const predictedPace    = Math.round(predictedSeconds / km)
          const prSeconds        = prs[prKey]?.time

          // deltaPct: positif = prédiction plus rapide (= amélioration potentielle)
          const deltaSeconds = prSeconds ? prSeconds - predictedSeconds : 0
          const deltaPct     = prSeconds ? Math.round((deltaSeconds / prSeconds) * 100) : 0

          // Confidence: se dégrade avec l'écart de distance d'extrapolation
          const logRatio   = Math.abs(Math.log(km / base.distance))
          const confidence = Math.max(30, Math.round(95 - logRatio * 18))

          const color = !prSeconds ? "#888" : deltaPct > 0 ? "#27AE60" : "#E74C3C"

          return { label, km, predictedSeconds, predictedPace, prSeconds, deltaPct, deltaSeconds, confidence, color }
        })
      : []

    // ── 3. Zones FC ────────────────────────────────────────────────────────
    const hrZones = calculateHRZones(maxHR, restHR)
    const zoneColors = [LEMON_COLORS.z1, LEMON_COLORS.z2, LEMON_COLORS.z3, LEMON_COLORS.z4, LEMON_COLORS.z5]

    const lastRun = runs.length
      ? [...runs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : null

    const lastRunZone       = lastRun ? dominantZone(lastRun, hrZones) : 2
    const zoneDistribution  = lastRun ? estimateZoneDistribution(lastRun, hrZones) : [20, 40, 25, 10, 5]

    const zones: ZoneData = { hrZones, lastRunZone, zoneDistribution, zoneColors }

    return { formeFatigue, predictions, bestBaseRuns, zones }

  }, [runs, maxHR, restHR])

  return { ...output, loading }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE — hooks préparés (activer en remplaçant useRuns par useRunsSupabase)
// ─────────────────────────────────────────────────────────────────────────────
/*
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function fetchRunsFromSupabase(profileId: string): Promise<Run[]> {
  const { data, error } = await supabase
    .from("runs")
    .select("*")
    .eq("profile_id", profileId)
    .order("date", { ascending: false })
  if (error) throw error
  return data as Run[]
}

export async function saveRunToSupabase(run: Run, profileId: string): Promise<void> {
  const { error } = await supabase
    .from("runs")
    .upsert({ ...run, profile_id: profileId })
  if (error) throw error
}

// Remplacer useRuns() par :
// const { data: runs = [], isLoading: loading } = useQuery({
//   queryKey: ["runs", profileId],
//   queryFn: () => fetchRunsFromSupabase(profileId),
// })
*/
