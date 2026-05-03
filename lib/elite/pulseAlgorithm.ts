/** Pondérations par zone cardiaque */
const WEIGHTS = { z1: 0.5, z2: 1, z3: 2, z4: 3.5, z5: 5 }
const MAX_RAW = 500 // score brut si 100% Z5

/** Calcule le Pulse Index (0–100) à partir du temps en zone */
export function calculatePulseIndex(zones: { z1: number; z2: number; z3: number; z4: number; z5: number }): number {
  const raw =
    zones.z1 * WEIGHTS.z1 +
    zones.z2 * WEIGHTS.z2 +
    zones.z3 * WEIGHTS.z3 +
    zones.z4 * WEIGHTS.z4 +
    zones.z5 * WEIGHTS.z5
  return Math.round((raw / MAX_RAW) * 100)
}

/** Couleur de l'anneau selon le score */
export function pulseColor(score: number): string {
  if (score < 40) return "#F5E642"
  if (score < 70) return "#FF6B35"
  return "#FF2D78"
}

/** Niveau textuel */
export function pulseLevel(score: number): string {
  if (score < 25) return "Récupération"
  if (score < 50) return "Modéré"
  if (score < 75) return "Intensif"
  return "Elite"
}
