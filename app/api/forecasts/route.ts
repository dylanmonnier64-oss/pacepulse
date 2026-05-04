/**
 * API Prévisions de Performance
 * Formules : VDOT (Jack Daniels) + Riegel
 * Source   : sorties d'entraînement réelles (toute distance ≥ 3 km)
 *            OU records manuels (10 km / semi / marathon)
 */
import { NextRequest, NextResponse } from "next/server"

// ── Distances en mètres ───────────────────────────────────────────
export const RACE_DISTANCES: Record<string, number> = {
  "10km":     10000,
  "semi":     21097.5,
  "marathon": 42195,
}

// ── Riegel ────────────────────────────────────────────────────────
function riegelPredict(t1Sec: number, d1M: number, d2M: number): number {
  return t1Sec * Math.pow(d2M / d1M, 1.06)
}

// ── VDOT (Jack Daniels) ───────────────────────────────────────────
function calcVDOT(distanceM: number, timeSec: number): number {
  const t   = timeSec / 60
  const v   = distanceM / t
  const vo2 = -4.60 + 0.182258 * v + 0.000104 * v * v
  const pct = 0.8
    + 0.1894393 * Math.exp(-0.012778 * t)
    + 0.2989558 * Math.exp(-0.1932605 * t)
  return vo2 / pct
}

function vdotToTime(vdot: number, distanceM: number): number {
  let lo = 1, hi = 600
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (calcVDOT(distanceM, mid * 60) > vdot) lo = mid
    else hi = mid
  }
  return ((lo + hi) / 2) * 60
}

// ── Confiance par écart de distance (mode PB) ─────────────────────
function baseConfidence(d1M: number, d2M: number): number {
  const ratio = Math.log(Math.max(d2M, d1M) / Math.min(d2M, d1M)) / Math.LN2
  return Math.round(Math.max(45, 100 - ratio * 18))
}

// ── Plage de prédiction ───────────────────────────────────────────
function predictionRange(timeSec: number, conf: number): { low: number; high: number } {
  const spread = ((100 - conf) / 100) * 0.06
  return { low: Math.round(timeSec * (1 - spread)), high: Math.round(timeSec * (1 + spread)) }
}

// ── Format ────────────────────────────────────────────────────────
export function fmtTime(sec: number): string {
  const s = Math.round(sec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
  return `${m}:${String(ss).padStart(2, "0")}`
}

function fmtPace(timeSec: number, distanceM: number): string {
  const secPerKm = timeSec / (distanceM / 1000)
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}:${String(s).padStart(2, "0")}/km`
}

// ── Allures d'entraînement Jack Daniels ──────────────────────────
export interface TrainingPaces {
  easy:       string
  marathon:   string
  threshold:  string
  interval:   string
  repetition: string
}

function calcTrainingPaces(vdot: number): TrainingPaces {
  const vdotPct = (pct: number) => vdotToTime(vdot * pct, 1000)
  const toStr   = (secPerKm: number) => {
    const m = Math.floor(secPerKm / 60)
    const s = Math.round(secPerKm % 60)
    return `${m}:${String(s).padStart(2, "0")}/km`
  }
  return {
    easy:       toStr(vdotPct(0.68)),
    marathon:   toStr(vdotPct(0.79)),
    threshold:  toStr(vdotPct(0.88)),
    interval:   toStr(vdotPct(0.975)),
    repetition: toStr(vdotPct(1.05)),
  }
}

// ── Distribution allure par km ────────────────────────────────────
export interface PacePoint { km: number; pace: number; paceStr: string }

function paceDistribution(targetTimeSec: number, distanceKm: number): PacePoint[] {
  const avg  = targetTimeSec / distanceKm
  const n    = Math.ceil(distanceKm)
  const pts: PacePoint[] = []
  for (let i = 1; i <= n; i++) {
    const variation = 1 + Math.sin(i * 2.3) * 0.018
    const pace = Math.round(avg * variation)
    const m = Math.floor(pace / 60)
    const s = Math.round(pace % 60)
    pts.push({ km: i, pace, paceStr: `${m}:${String(s).padStart(2, "0")}` })
  }
  return pts
}

// ── Types ─────────────────────────────────────────────────────────
export type ConfidenceMode = "conservateur" | "réaliste" | "ambitieux"

export interface RunForForecast {
  id:       string
  distance: number   // km
  duration: number   // secondes
  date:     string   // ISO
  type?:    string   // "recovery" exclu
}

export interface ContributingRun {
  id:       string
  distance: number
  duration: number
  date:     string
  vdot:     number
}

export interface ForecastInput {
  runs?:       RunForForecast[]   // sorties d'entraînement (priorité)
  pb10k?:      number | null      // override manuel en secondes
  pbSemi?:     number | null
  pbMarathon?: number | null
  vo2max?:     number | null
  mode?:       ConfidenceMode
}

export interface DistanceForecast {
  distance:         string
  label:            string
  predictedSec:     number
  low:              number
  high:             number
  confidence:       number
  pace:             string
  vdot:             number
  sourcedFrom:      string[]
  paceDistribution: PacePoint[]
}

export interface ForecastResponse {
  forecasts:       DistanceForecast[]
  avgVDOT:         number
  strongestAt:     string
  vo2maxEst:       number | null
  trainingPaces:   TrainingPaces
  mode:            ConfidenceMode
  contributingRuns: ContributingRun[]
  runsAnalyzed:    number
  analysisMethod:  "training_runs" | "race_pbs" | "vo2max_only"
}

// ── Multiplicateur selon le mode ──────────────────────────────────
const MODE_MULTIPLIER: Record<ConfidenceMode, number> = {
  conservateur: 1.025,
  réaliste:     1.000,
  ambitieux:    0.975,
}

// ── VDOT depuis les sorties d'entraînement ────────────────────────
function vdotFromTrainingRuns(runs: RunForForecast[]): {
  avgVDOT:     number
  contributing: ContributingRun[]
  analyzed:    number
} {
  // Filtres qualité : ≥ 3 km, pas récupération, allure < 8 min/km
  const qualifying = runs.filter(r =>
    r.distance >= 3 &&
    r.duration > 0 &&
    r.type !== "recovery" &&
    r.duration / (r.distance * 60) < 480
  )

  if (qualifying.length === 0) return { avgVDOT: 0, contributing: [], analyzed: 0 }

  // VDOT par sortie
  const withVdot = qualifying
    .map(r => ({ ...r, vdot: calcVDOT(r.distance * 1000, r.duration) }))
    .filter(r => r.vdot > 20 && r.vdot < 90) // sanity check

  if (withVdot.length === 0) return { avgVDOT: 0, contributing: [], analyzed: 0 }

  // Top 5 (meilleur VDOT = effort le plus proche de la compétition)
  const top5 = [...withVdot].sort((a, b) => b.vdot - a.vdot).slice(0, 5)

  // Pondération par récence : < 30j → 3, < 60j → 2, sinon → 1
  const now = Date.now()
  const weighted = top5.map(r => {
    const ageDays = (now - new Date(r.date).getTime()) / 86400000
    const weight  = ageDays <= 30 ? 3 : ageDays <= 60 ? 2 : 1
    return { ...r, weight }
  })

  const totalW  = weighted.reduce((s, r) => s + r.weight, 0)
  const avgVDOT = weighted.reduce((s, r) => s + r.vdot * r.weight, 0) / totalW

  return {
    avgVDOT,
    contributing: top5.map(r => ({
      id:       r.id,
      distance: r.distance,
      duration: r.duration,
      date:     r.date,
      vdot:     Math.round(r.vdot * 10) / 10,
    })),
    analyzed: qualifying.length,
  }
}

// ── Confiance pour prédictions depuis sorties ─────────────────────
function trainingRunsConfidence(contributing: ContributingRun[]): number {
  if (contributing.length === 0) return 55
  // Base : 60% → bonus si plusieurs sorties cohérentes
  const vdots = contributing.map(r => r.vdot)
  const spread = vdots.length > 1 ? Math.max(...vdots) - Math.min(...vdots) : 0
  const avgV   = vdots.reduce((a, b) => a + b, 0) / vdots.length
  const consistencyBonus = spread / avgV < 0.05 ? 8 : spread / avgV < 0.1 ? 4 : 0
  const countBonus = Math.min(contributing.length * 2, 10)
  return Math.min(78, 60 + consistencyBonus + countBonus)
}

// ── Handler ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body: ForecastInput = await req.json()
    const { runs = [], pb10k, pbSemi, pbMarathon, vo2max, mode = "réaliste" } = body
    const mult = MODE_MULTIPLIER[mode] ?? 1

    // ── Construire les inputs depuis PBs manuels ──────────────────
    const pbInputs: Array<{ key: string; label: string; distM: number; timeSec: number }> = []
    if (pb10k      && pb10k > 0)      pbInputs.push({ key: "10km",     label: "10 km",        distM: RACE_DISTANCES["10km"],     timeSec: pb10k })
    if (pbSemi     && pbSemi > 0)     pbInputs.push({ key: "semi",     label: "Semi-marathon", distM: RACE_DISTANCES["semi"],     timeSec: pbSemi })
    if (pbMarathon && pbMarathon > 0) pbInputs.push({ key: "marathon", label: "Marathon",      distM: RACE_DISTANCES["marathon"], timeSec: pbMarathon })

    // ── Déterminer la méthode d'analyse ───────────────────────────
    let avgVDOT    = 0
    let contributing: ContributingRun[] = []
    let runsAnalyzed = 0
    let analysisMethod: ForecastResponse["analysisMethod"] = "training_runs"

    const targets = [
      { key: "10km",     label: "10 km",        distM: RACE_DISTANCES["10km"],     distKm: 10 },
      { key: "semi",     label: "Semi-marathon", distM: RACE_DISTANCES["semi"],     distKm: 21.097 },
      { key: "marathon", label: "Marathon",      distM: RACE_DISTANCES["marathon"], distKm: 42.195 },
    ]

    const forecasts: DistanceForecast[] = []

    // ── Chemin A : Records manuels (Riegel + VDOT combiné) ────────
    if (pbInputs.length > 0) {
      analysisMethod = "race_pbs"
      const vdotMap: Record<string, number> = {}
      for (const inp of pbInputs) vdotMap[inp.key] = calcVDOT(inp.distM, inp.timeSec)
      const vdotValues = Object.values(vdotMap)
      avgVDOT = vdotValues.reduce((a, b) => a + b, 0) / vdotValues.length

      for (const tgt of targets) {
        const sourcedFrom: string[] = []
        const weighted: Array<{ sec: number; w: number }> = []

        for (const inp of pbInputs) {
          if (inp.key === tgt.key) continue
          const predicted = riegelPredict(inp.timeSec, inp.distM, tgt.distM)
          const conf      = baseConfidence(inp.distM, tgt.distM)
          weighted.push({ sec: predicted, w: conf })
          sourcedFrom.push(inp.label)
        }
        if (vo2max && vo2max > 0) {
          weighted.push({ sec: vdotToTime(vo2max, tgt.distM), w: 70 })
          if (!sourcedFrom.includes("VO₂max")) sourcedFrom.push("VO₂max")
        }
        if (weighted.length === 0) {
          weighted.push({ sec: vdotToTime(avgVDOT, tgt.distM), w: 60 })
          sourcedFrom.push("VDOT moyen")
        }

        const totalW         = weighted.reduce((s, x) => s + x.w, 0)
        const basePrediction = weighted.reduce((s, x) => s + x.sec * x.w, 0) / totalW
        const predictedSec   = Math.round(basePrediction * mult)

        const baseConf  = weighted.reduce((s, x) => s + x.w, 0) / weighted.length
        const bonus     = weighted.length > 1
          ? Math.max(0, 8 - (Math.max(...weighted.map(x => x.sec)) - Math.min(...weighted.map(x => x.sec))) / basePrediction * 200)
          : 0
        const finalConf = Math.min(95, Math.round(baseConf + bonus))
        const range     = predictionRange(predictedSec, finalConf)

        forecasts.push({
          distance:         tgt.key,
          label:            tgt.label,
          predictedSec,
          low:              range.low,
          high:             range.high,
          confidence:       finalConf,
          pace:             fmtPace(predictedSec, tgt.distM),
          vdot:             Math.round(calcVDOT(tgt.distM, predictedSec) * 10) / 10,
          sourcedFrom,
          paceDistribution: paceDistribution(predictedSec, tgt.distKm),
        })
      }

    // ── Chemin B : Sorties d'entraînement (VDOT seul) ─────────────
    } else if (runs.length > 0) {
      analysisMethod = "training_runs"
      const res = vdotFromTrainingRuns(runs)
      if (res.avgVDOT <= 0) {
        return NextResponse.json({ error: "Aucune sortie exploitable (min. 3 km, hors récupération)." }, { status: 400 })
      }
      avgVDOT      = res.avgVDOT
      contributing = res.contributing
      runsAnalyzed = res.analyzed

      const confidence = trainingRunsConfidence(contributing)

      for (const tgt of targets) {
        const basePrediction = vdotToTime(avgVDOT, tgt.distM)
        const predictedSec   = Math.round(basePrediction * mult)
        const range          = predictionRange(predictedSec, confidence)

        forecasts.push({
          distance:         tgt.key,
          label:            tgt.label,
          predictedSec,
          low:              range.low,
          high:             range.high,
          confidence,
          pace:             fmtPace(predictedSec, tgt.distM),
          vdot:             Math.round(calcVDOT(tgt.distM, predictedSec) * 10) / 10,
          sourcedFrom:      [`${contributing.length} sortie${contributing.length > 1 ? "s" : ""} d'entraînement`],
          paceDistribution: paceDistribution(predictedSec, tgt.distKm),
        })
      }

    // ── Chemin C : VO₂max seul ────────────────────────────────────
    } else if (vo2max && vo2max > 0) {
      analysisMethod = "vo2max_only"
      avgVDOT = vo2max

      for (const tgt of targets) {
        const basePrediction = vdotToTime(avgVDOT, tgt.distM)
        const predictedSec   = Math.round(basePrediction * mult)
        const range          = predictionRange(predictedSec, 68)

        forecasts.push({
          distance:         tgt.key,
          label:            tgt.label,
          predictedSec,
          low:              range.low,
          high:             range.high,
          confidence:       68,
          pace:             fmtPace(predictedSec, tgt.distM),
          vdot:             Math.round(calcVDOT(tgt.distM, predictedSec) * 10) / 10,
          sourcedFrom:      ["VO₂max"],
          paceDistribution: paceDistribution(predictedSec, tgt.distKm),
        })
      }

    } else {
      return NextResponse.json({ error: "Aucune donnée fournie." }, { status: 400 })
    }

    const vo2maxEst = vo2max ?? Math.round(avgVDOT * 10) / 10

    // strongestAt = distance avec le plus haut VDOT prédit
    const strongestAt = forecasts.sort((a, b) => b.vdot - a.vdot)[0]?.distance ?? "10km"
    // Re-sort par ordre logique
    const ORDER = ["10km", "semi", "marathon"]
    forecasts.sort((a, b) => ORDER.indexOf(a.distance) - ORDER.indexOf(b.distance))

    return NextResponse.json({
      forecasts,
      avgVDOT:         Math.round(avgVDOT * 10) / 10,
      strongestAt,
      vo2maxEst,
      trainingPaces:   calcTrainingPaces(avgVDOT),
      mode,
      contributingRuns: contributing,
      runsAnalyzed,
      analysisMethod,
    } satisfies ForecastResponse)

  } catch (err) {
    console.error("[Forecasts API]", err)
    return NextResponse.json({ error: "Erreur de calcul." }, { status: 500 })
  }
}
