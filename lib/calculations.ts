import type { Run, FitnessDataPoint, HRZone, RacePredict } from "./types"

// --- TSS (Training Stress Score) ---
export function calculateTSS(run: Run): number {
  const hours = run.duration / 3600
  const typeMultiplier: Record<string, number> = {
    recovery: 0.5,
    endurance: 0.75,
    long: 0.80,
    threshold: 1.05,
    interval: 1.20,
  }
  const mult = typeMultiplier[run.type] || 0.75
  // TSS ≈ hours × pace_intensity² × 100 where pace_intensity ≈ type multiplier
  return Math.round(hours * Math.pow(mult, 2) * 100)
}

// --- CTL / ATL / TSB (Fitness/Fatigue Model) ---
export function buildFitnessTimeline(runs: Run[], days = 120): FitnessDataPoint[] {
  const tssMap: Record<string, number> = {}
  runs.forEach((r) => {
    const day = r.date.split("T")[0]
    tssMap[day] = (tssMap[day] || 0) + (r.tss ?? calculateTSS(r))
  })

  const result: FitnessDataPoint[] = []
  let ctl = 0
  let atl = 0
  const K_CTL = Math.exp(-1 / 42)
  const K_ATL = Math.exp(-1 / 7)

  const today = new Date()
  for (let i = days; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const day = d.toISOString().split("T")[0]
    const tss = tssMap[day] || 0

    ctl = ctl * K_CTL + tss * (1 - K_CTL)
    atl = atl * K_ATL + tss * (1 - K_ATL)
    const tsb = ctl - atl

    result.push({
      date: day,
      ctl: Math.round(ctl * 10) / 10,
      atl: Math.round(atl * 10) / 10,
      tsb: Math.round(tsb * 10) / 10,
      tss,
    })
  }
  return result
}

export function getTrainingStatus(tsb: number): { label: string; color: string; recommendation: string } {
  if (tsb > 15) return {
    label: "Frais / Déentraîné",
    color: "#3498DB",
    recommendation: "Bonne fraîcheur — moment idéal pour une course longue.",
  }
  if (tsb > 5) return {
    label: "Forme optimale",
    color: "#27AE60",
    recommendation: "Jour idéal pour une séance dure ou une compétition.",
  }
  if (tsb > -10) return {
    label: "Charge normale",
    color: "#F4D03F",
    recommendation: "Entraînement modéré conseillé.",
  }
  if (tsb > -25) return {
    label: "Fatigué",
    color: "#E67E22",
    recommendation: "Récupération conseillée — sortie légère ou repos.",
  }
  return {
    label: "Surentraînement",
    color: "#E74C3C",
    recommendation: "⚠️ Repos obligatoire — risque de blessure élevé.",
  }
}

// --- Riegel Race Predictor ---
export function riegelPredict(t1Seconds: number, d1Km: number, d2Km: number): number {
  return t1Seconds * Math.pow(d2Km / d1Km, 1.06)
}

export function getRacePredictions(runs: Run[]): RacePredict[] {
  const raceDists = [
    { km: 1, label: "1 km" },
    { km: 5, label: "5 km" },
    { km: 10, label: "10 km" },
    { km: 21.097, label: "Semi" },
    { km: 42.195, label: "Marathon" },
  ]

  // Find best pace run >= 3km with good feeling
  const candidates = runs
    .filter((r) => r.distance >= 3 && r.feeling >= 6)
    .sort((a, b) => a.pace - b.pace)
    .slice(0, 5)

  if (!candidates.length) return []

  const best = candidates[0]
  const baseDist = best.distance
  const baseTime = best.duration

  return raceDists.map(({ km, label }) => {
    const time = riegelPredict(baseTime, baseDist, km)
    const pace = time / km
    // Confidence degrades with distance extrapolation ratio
    const ratio = Math.abs(Math.log(km / baseDist))
    const confidence = Math.max(30, Math.round(95 - ratio * 20))
    return { distance: km, label, time: Math.round(time), pace: Math.round(pace), confidence }
  })
}

// --- Karvonen HR Zones ---
export function calculateHRZones(maxHR: number, restHR: number): HRZone[] {
  const hrr = maxHR - restHR
  const zones: Array<{ name: string; min: number; max: number; color: string; desc: string }> = [
    { name: "Zone 1 — Récupération", min: 0.50, max: 0.60, color: "#3498DB", desc: "Récupération active" },
    { name: "Zone 2 — Endurance", min: 0.60, max: 0.70, color: "#27AE60", desc: "Base aérobie" },
    { name: "Zone 3 — Tempo", min: 0.70, max: 0.80, color: "#F4D03F", desc: "Endurance active" },
    { name: "Zone 4 — Seuil", min: 0.80, max: 0.90, color: "#E67E22", desc: "Seuil lactique" },
    { name: "Zone 5 — VO2max", min: 0.90, max: 1.00, color: "#E74C3C", desc: "Effort maximal" },
  ]

  return zones.map((z, i) => {
    const minBpm = Math.round(z.min * hrr + restHR)
    const maxBpm = Math.round(z.max * hrr + restHR)
    // Rough pace estimates: zone 2 ~5:30/km, zone 5 ~3:50/km
    const paceMap = ["7:00", "5:30", "4:50", "4:20", "3:50"]
    const paceMapMax = ["6:00", "5:00", "4:30", "4:00", "3:30"]
    return {
      zone: i + 1,
      name: z.name,
      minBpm,
      maxBpm,
      minPaceStr: paceMapMax[i],
      maxPaceStr: paceMap[i],
      color: z.color,
      description: z.desc,
      percentage: Math.round((z.max - z.min) * 100),
    }
  })
}

// --- Personal Records ---
export function detectPersonalRecords(runs: Run[]): Record<string, { time: number; runId: string; date: string; pace: number }> {
  const distances = [1, 5, 10, 15, 21.097, 42.195]
  const labels = ["1km", "5km", "10km", "15km", "semi", "marathon"]
  const records: Record<string, { time: number; runId: string; date: string; pace: number }> = {}

  distances.forEach((dist, idx) => {
    const key = labels[idx]
    // Runs within ±5% of the target distance
    const candidates = runs.filter((r) => Math.abs(r.distance - dist) / dist < 0.05)
    if (!candidates.length) return
    const best = candidates.sort((a, b) => a.pace - b.pace)[0]
    records[key] = {
      time: best.duration,
      runId: best.id,
      date: best.date,
      pace: best.pace,
    }
  })

  // Best elevation
  const bestElev = [...runs].sort((a, b) => b.elevation - a.elevation)[0]
  if (bestElev) records["elevation"] = { time: bestElev.elevation, runId: bestElev.id, date: bestElev.date, pace: bestElev.pace }

  // Longest run — store distance in `pace` field for display purposes
  const longest = [...runs].sort((a, b) => b.distance - a.distance)[0]
  if (longest) records["longest"] = { time: longest.duration, runId: longest.id, date: longest.date, pace: longest.distance }

  return records
}

// --- Streak ---
export function calculateStreak(runs: Run[]): number {
  if (!runs.length) return 0
  const runDays = new Set(runs.map((r) => r.date.split("T")[0]))
  let streak = 0
  const today = new Date()

  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const day = d.toISOString().split("T")[0]
    if (runDays.has(day)) streak++
    else if (i > 0) break
  }
  return streak
}

// --- Weekly load progression ---
export function getWeeklyLoads(runs: Run[], weeks = 12): Array<{ week: string; distance: number; tss: number }> {
  const result = []
  const today = new Date()

  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - w * 7)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const weekRuns = runs.filter((r) => {
      const d = new Date(r.date)
      return d >= weekStart && d < weekEnd
    })

    const distance = weekRuns.reduce((s, r) => s + r.distance, 0)
    const tss = weekRuns.reduce((s, r) => s + (r.tss ?? calculateTSS(r)), 0)
    const weekLabel = weekStart.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })

    result.push({ week: weekLabel, distance: Math.round(distance * 10) / 10, tss })
  }
  return result
}
