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
export type GoalType = 'distance' | 'runs' | 'elevation' | 'time'

export interface Goal {
  id: string
  type: GoalType
  period: GoalPeriod
  target: number
  unit: string
  label: string
  icon: string
  color: string
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
