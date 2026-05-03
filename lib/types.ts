export type RunType = 'endurance' | 'threshold' | 'interval' | 'long' | 'recovery'
export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'windy' | 'snow' | 'humid'

export interface Split {
  km: number
  time: number // seconds for this km
  pace: number // seconds per km
  heartRate?: number
}

export interface Run {
  id: string
  date: string // ISO date string
  distance: number // km
  duration: number // seconds
  pace: number // seconds per km (avg)
  elevation: number // meters ascent
  heartRate?: { avg: number; max: number }
  type: RunType
  feeling: number // 1-10
  notes: string
  weather?: { temp: number; wind: number; conditions: WeatherCondition }
  gearId?: string
  splits?: Split[]
  isPersonalRecord?: Partial<Record<string, boolean>>
  tss?: number // Training Stress Score
}

export interface Gear {
  id: string
  name: string
  brand: string
  model: string
  color: string
  km: number // current km
  totalKmAtPurchase: number
  isActive: boolean
  addedDate: string
  runIds: string[]
}

export type GoalPeriod = 'week' | 'month' | 'year'
export type GoalType = 'distance' | 'runs' | 'elevation' | 'time' | 'perf'

export interface PerfCriteria {
  minDistance: number   // km
  maxDuration?: number  // seconds
  maxPace?: number      // sec/km
}

export interface Goal {
  id: string
  type: GoalType
  period: GoalPeriod
  target: number
  unit: string
  label: string
  icon: string
  color: string
  perfCriteria?: PerfCriteria
  achieved?: boolean
  achievedDate?: string
  achievedRunId?: string
}

export interface PersonalRecord {
  distance: string
  label: string
  time: number // seconds
  pace: number // seconds per km
  date: string
  runId: string
}

export interface FitnessDataPoint {
  date: string
  ctl: number
  atl: number
  tsb: number
  tss: number
}

export interface HRZone {
  zone: number
  name: string
  minBpm: number
  maxBpm: number
  minPaceStr: string
  maxPaceStr: string
  color: string
  description: string
  percentage: number // % of max HR range
}

export interface UserProfile {
  name: string
  maxHR: number
  restHR: number
  weight: number // kg
  theme: 'dark' | 'light'
  weekStart: 'monday' | 'sunday'
}

export interface RacePredict {
  distance: number
  label: string
  time: number // seconds
  pace: number // seconds per km
  confidence: number // 0-100
}

// ── Health Hub ──────────────────────────────────────────────────
export interface HealthLog {
  id?: string
  user_profile: string
  date: string // YYYY-MM-DD
  steps?: number
  calories?: number           // kcal
  active_minutes?: number     // durée de la séance sportive (min)
  active_breaks?: number      // number of active breaks
  heart_rate_avg?: number
  sport_type?: "running" | "padel" | null
  exercise_done?: boolean     // legacy
  exercise_duration?: number  // legacy — minutes
  sleep_hours?: number
  sleep_minutes?: number
  ai_analysis?: AIHealthAnalysis | null
  created_at?: string
  updated_at?: string
}

export interface AIHealthAnalysis {
  fatigue_score: number        // 0-10 (0 = frais, 10 = épuisé)
  vitality_score: number       // 0-100 (score global)
  narrative: string            // texte Claude en français
  recommendation: string       // conseil pour demain
  sleep_quality: "excellent" | "bonne" | "moyenne" | "insuffisante"
  readiness: "optimal" | "normal" | "fatigué" | "repos recommandé"
  generated_at: string         // ISO timestamp
}

export interface HealthFormState {
  steps: string
  calories: string
  active_minutes: string
  active_breaks: string
  heart_rate_avg: string
  sleep_hours: string
  sleep_minutes: string
  sport_type?: "running" | "padel" | null
}

// ── Padel ────────────────────────────────────────────────────────
export interface PadelSession {
  id: string
  user_profile: string
  date: string              // YYYY-MM-DD
  duration: number          // minutes
  result: "victoire" | "défaite"
  rating: number            // 1-10, note perso sur le jeu
  comment: string           // commentaire libre
  partner?: string          // partenaire (optionnel)
  source: "manual" | "strava"
  strava_id?: string
  ai_advice?: PadelAIAdvice | null
  created_at?: string
}

export interface PadelAIAdvice {
  form_score: number        // 0-100
  trend: "en hausse" | "stable" | "en baisse"
  narrative: string         // analyse de la forme padel
  tip: string               // conseil concret
  generated_at: string
}
