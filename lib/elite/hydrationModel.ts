/**
 * Estime la perte hydrique en litres
 * Base 0.5L/h × multiplicateur intensité × multiplicateur chaleur
 */
export function estimateFluidLoss(
  pulseIndex: number,
  durationMin: number,
  tempCelsius: number
): number {
  const base = 0.5
  const multiIntensity = 1 + (pulseIndex / 100) * 1.5
  const multiHeat = 1 + Math.max(0, (tempCelsius - 20) * 0.03)
  const loss = base * (durationMin / 60) * multiIntensity * multiHeat
  return Math.round(loss * 100) / 100
}

/** Recommandation de réhydratation (1.5× la perte) */
export function rehydrationAdvice(lossL: number): string {
  return `Buvez ${(lossL * 1.5).toFixed(1)}L dans les 2 prochaines heures`
}
