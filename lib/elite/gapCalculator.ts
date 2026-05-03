/**
 * Grade Adjusted Pace — modèle Strava-like
 * +1% pente → +8s/km  |  -1% pente → -3s/km
 */
export function adjustedPace(paceSec: number, gradientPercent: number): number {
  if (gradientPercent > 0) return paceSec + gradientPercent * 8
  return paceSec + gradientPercent * 3 // gradient négatif → soustraction
}

/** Formate des secondes en "m:ss /km" */
export function formatPace(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, "0")} /km`
}
