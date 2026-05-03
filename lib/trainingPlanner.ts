export type ProfileId = "dylan" | "manon"
export type RunLevel = "débutant" | "intermédiaire" | "avancé" | "elite"
export type RunObjective = "forme" | "10k" | "semi" | "marathon" | "trail" | "vitesse"
export type SessionType = "endurance" | "threshold" | "interval" | "long" | "recovery" | "rest"

export interface TrainingProfile {
  id: ProfileId
  level: RunLevel
  objective: RunObjective
  availableDays: number[] // 0=Lun … 6=Dim
  lastQuestionnaireDate?: string // ISO month "2025-04"
}

export interface TrainingSession {
  date: string // "YYYY-MM-DD"
  type: SessionType
  name: string
  description: string
  targetKm: number
  targetPaceStr?: string
  week: number // 1–4
  dayOfWeek: number // 0=Lun
}

export interface TrainingPlan {
  profileId: ProfileId
  generatedAt: string
  startDate: string // Monday of week 1
  sessions: TrainingSession[]
}

const SESSION_NAMES: Record<SessionType, string> = {
  endurance: "Endurance fondamentale",
  threshold: "Travail au seuil",
  interval: "Fractionné",
  long: "Sortie longue",
  recovery: "Récupération active",
  rest: "Repos",
}

const SESSION_DESCRIPTIONS: Record<RunObjective, Partial<Record<SessionType, string>>> = {
  forme: {
    endurance: "Courez à allure confortable, conversation possible. Objectif : maintenir la forme générale.",
    recovery: "Jogging très léger, 10–15 min. Favorise la récupération musculaire.",
    long: "Sortie à allure facile, augmentez progressivement chaque semaine.",
  },
  "10k": {
    endurance: "Allure facile Z2. Construisez votre base aérobie.",
    threshold: "3×10 min au seuil (Z4), 3 min récup. Améliorez votre vitesse critique.",
    interval: "6×400 m à allure 5k, 90 s récup. Développez la VMA.",
    long: "Sortie longue en endurance, terminez les 3 derniers km au seuil.",
    recovery: "Footing très léger, rétablissement actif.",
  },
  semi: {
    endurance: "Z2 soutenu. Construisez le volume pour la demi.",
    threshold: "4×8 min à allure semi + 10 s/km, 2 min récup.",
    interval: "8×400 m à allure 5k, 90 s récup.",
    long: "Sortie longue progressive : départ Z2, finish Z3.",
    recovery: "Récupération active — 20–30 min très lent.",
  },
  marathon: {
    endurance: "Z2 structuré. Volume est roi pour le marathon.",
    threshold: "30–45 min au seuil. Renforce l'économie de course.",
    interval: "4×1 km à allure 10k, 2 min récup. Améliore le plafond aérobie.",
    long: "Sortie longue clé : intégrez des segments à allure marathon.",
    recovery: "Récupération indispensable — jamais négligée.",
  },
  trail: {
    endurance: "Endurance sur terrain varié, incluez du dénivelé.",
    threshold: "Montées en seuil — 4×5 min en côte, descente récup.",
    interval: "Séries en côte : 8×200 m à fond, marche descente.",
    long: "Sortie trail longue — priorité au temps sur les pieds, pas à l'allure.",
    recovery: "Récupération active ou marche rapide en nature.",
  },
  vitesse: {
    endurance: "Z2 de base pour soutenir l'intensité des séances vitesse.",
    threshold: "20 min au seuil continu. Repoussez votre seuil lactique.",
    interval: "10×200 m à allure 1 500 m, 1 min 30 récup. Développez la puissance.",
    long: "Sortie longue modérée pour soutenir les séances de vitesse.",
    recovery: "Récupération totale — repos actif léger.",
  },
}

interface LevelConfig {
  sessionsPerWeek: [number, number] // min, max
  types: SessionType[]
  kmPerWeekBase: number
  longRunRatio: number // fraction of weekly km for long run
}

const LEVEL_CONFIGS: Record<RunLevel, LevelConfig> = {
  débutant: {
    sessionsPerWeek: [3, 3],
    types: ["endurance", "recovery", "long"],
    kmPerWeekBase: 20,
    longRunRatio: 0.35,
  },
  intermédiaire: {
    sessionsPerWeek: [4, 4],
    types: ["endurance", "threshold", "long", "recovery"],
    kmPerWeekBase: 35,
    longRunRatio: 0.30,
  },
  avancé: {
    sessionsPerWeek: [5, 5],
    types: ["endurance", "threshold", "interval", "long", "recovery"],
    kmPerWeekBase: 55,
    longRunRatio: 0.27,
  },
  elite: {
    sessionsPerWeek: [6, 6],
    types: ["endurance", "threshold", "interval", "long", "recovery", "endurance"],
    kmPerWeekBase: 80,
    longRunRatio: 0.25,
  },
}

function nextMonday(): Date {
  const d = new Date()
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? 1 : 8 - day // days until next Monday (or today if Mon)
  d.setDate(d.getDate() + (day === 1 ? 0 : diff))
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toISO(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function generatePlan(profile: TrainingProfile): TrainingPlan {
  const config = LEVEL_CONFIGS[profile.level]
  const start = nextMonday()
  const sessions: TrainingSession[] = []
  const descriptions = SESSION_DESCRIPTIONS[profile.objective]

  // Weekly km progression: +10% each week
  const weeklyKms = [1, 1.1, 1.2, 0.9].map(m => Math.round(config.kmPerWeekBase * m))

  for (let week = 0; week < 4; week++) {
    const weekKm = weeklyKms[week]
    const longKm = Math.round(weekKm * config.longRunRatio)

    // Filter available days for this week
    const available = profile.availableDays.slice().sort((a, b) => a - b)
    const needed = config.sessionsPerWeek[0]
    const days = available.slice(0, needed)

    // Assign session types to days
    const types = config.types.slice(0, needed)

    days.forEach((dayOfWeek, idx) => {
      const sessionType = types[idx] as SessionType
      const date = addDays(start, week * 7 + dayOfWeek)

      let km = 0
      if (sessionType === "long") km = longKm
      else if (sessionType === "recovery") km = Math.round(weekKm * 0.12)
      else if (sessionType === "interval") km = Math.round(weekKm * 0.15)
      else if (sessionType === "threshold") km = Math.round(weekKm * 0.18)
      else km = Math.round((weekKm - longKm) / (needed - 1))

      sessions.push({
        date: toISO(date),
        type: sessionType,
        name: SESSION_NAMES[sessionType],
        description: descriptions[sessionType] ?? "Séance programmée selon votre profil.",
        targetKm: Math.max(km, 3),
        week: week + 1,
        dayOfWeek,
      })
    })
  }

  return {
    profileId: profile.id,
    generatedAt: new Date().toISOString(),
    startDate: toISO(start),
    sessions,
  }
}

// ── Storage ──────────────────────────────────────────────────────────────────

const KEY_PROFILE = (id: ProfileId) => `pp_training_profile_${id}`
const KEY_PLAN = (id: ProfileId) => `pp_training_plan_${id}`
const KEY_ACTIVE = "pp_training_active_profile"

const DEFAULT_PROFILES: Record<ProfileId, TrainingProfile> = {
  dylan: { id: "dylan", level: "intermédiaire", objective: "semi", availableDays: [1, 3, 5, 6] },
  manon: { id: "manon", level: "débutant", objective: "forme", availableDays: [2, 4, 6] },
}

export function getProfile(id: ProfileId): TrainingProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILES[id]
  try {
    const raw = localStorage.getItem(KEY_PROFILE(id))
    return raw ? JSON.parse(raw) : DEFAULT_PROFILES[id]
  } catch { return DEFAULT_PROFILES[id] }
}

export function saveProfile(profile: TrainingProfile): void {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY_PROFILE(profile.id), JSON.stringify(profile))
}

export function getPlan(id: ProfileId): TrainingPlan | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(KEY_PLAN(id))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function savePlan(plan: TrainingPlan): void {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY_PLAN(plan.profileId), JSON.stringify(plan))
}

export function getActiveProfile(): ProfileId {
  if (typeof window === "undefined") return "dylan"
  return (localStorage.getItem(KEY_ACTIVE) as ProfileId) ?? "dylan"
}

export function setActiveProfile(id: ProfileId): void {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY_ACTIVE, id)
}

export function needsQuestionnaire(profile: TrainingProfile): boolean {
  if (!profile.lastQuestionnaireDate) return true
  const currentMonth = new Date().toISOString().slice(0, 7)
  return profile.lastQuestionnaireDate < currentMonth
}

export const SESSION_COLORS: Record<SessionType, string> = {
  endurance: "#3498DB",
  threshold: "#E67E22",
  interval: "#E74C3C",
  long: "#9B59B6",
  recovery: "#27AE60",
  rest: "rgba(255,255,255,0.08)",
}

export const LEVEL_LABELS: Record<RunLevel, string> = {
  débutant: "Débutant",
  intermédiaire: "Intermédiaire",
  avancé: "Avancé",
  elite: "Élite",
}

export const OBJECTIVE_LABELS: Record<RunObjective, string> = {
  forme: "Forme générale",
  "10k": "10 km",
  semi: "Semi-marathon",
  marathon: "Marathon",
  trail: "Trail",
  vitesse: "Vitesse / VMA",
}

export const OBJECTIVE_ICONS: Record<RunObjective, string> = {
  forme: "💪",
  "10k": "🏃",
  semi: "⚡",
  marathon: "🏅",
  trail: "🏔️",
  vitesse: "🚀",
}

export const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
