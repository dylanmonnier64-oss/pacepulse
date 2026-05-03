import type { HealthLog } from "./types"

// Données Apple Health importées automatiquement (avril 2026)
// Steps + calories iPhone/Mi Fitness · FC + sommeil Mi Band
export const HEALTH_SEED: Omit<HealthLog, "id" | "created_at" | "updated_at">[] = [
  { user_profile:"dydz", date:"2026-04-01", steps:7914,  calories:220,  active_breaks:0, sport_type:null, ai_analysis:null },
  { user_profile:"dydz", date:"2026-04-02", steps:3600,  calories:85,   active_breaks:0, sport_type:null, ai_analysis:null },
  { user_profile:"dydz", date:"2026-04-03", steps:2688,  calories:62,   active_breaks:0, sport_type:null, ai_analysis:null },
  { user_profile:"dydz", date:"2026-04-04", steps:10952, calories:277,  active_breaks:0, sport_type:null, ai_analysis:null },
  { user_profile:"dydz", date:"2026-04-05", steps:8792,  calories:172,  active_breaks:0, sport_type:null, ai_analysis:null },
  { user_profile:"dydz", date:"2026-04-06", steps:5734,  calories:122,  active_breaks:0, sport_type:null, ai_analysis:null },
  { user_profile:"dydz", date:"2026-04-07", steps:1938,  calories:48,   active_breaks:0, sport_type:null, ai_analysis:null },
  { user_profile:"dydz", date:"2026-04-08", steps:5462,  calories:125,  active_breaks:0, sport_type:null, ai_analysis:null },
  { user_profile:"dydz", date:"2026-04-09", steps:8978,  calories:212,  active_breaks:0, sport_type:null, ai_analysis:null },
  { user_profile:"dydz", date:"2026-04-10", steps:5246,  calories:135,  active_breaks:0, sport_type:null, ai_analysis:null },
  { user_profile:"dydz", date:"2026-04-11", steps:8125,  calories:219,  active_breaks:0, sport_type:null, ai_analysis:null },
  { user_profile:"dydz", date:"2026-04-12", steps:4023,  calories:97,   active_breaks:0, sport_type:null, ai_analysis:null },
  { user_profile:"dydz", date:"2026-04-13", steps:5017,  calories:128,  active_breaks:0, sport_type:null, ai_analysis:null },
  { user_profile:"dydz", date:"2026-04-14", steps:2002,  calories:43,   active_breaks:0, sport_type:null, ai_analysis:null },
  { user_profile:"dydz", date:"2026-04-15", steps:4260,  calories:93,   active_breaks:0, sport_type:null, ai_analysis:null },
  { user_profile:"dydz", date:"2026-04-16", steps:1473,  calories:28,   active_breaks:0, sport_type:null, ai_analysis:null },
  { user_profile:"dydz", date:"2026-04-17", steps:6476,  calories:128,  active_breaks:0, sport_type:null, ai_analysis:null },
  { user_profile:"dydz", date:"2026-04-18", steps:4363,  calories:96,   active_breaks:0, sport_type:null, ai_analysis:null },
  { user_profile:"dydz", date:"2026-04-19", steps:3621,  calories:73,   active_breaks:0, sport_type:null, ai_analysis:null },
  { user_profile:"dydz", date:"2026-04-20", steps:12242, calories:399,  active_breaks:0, sport_type:null, ai_analysis:null },
  { user_profile:"dydz", date:"2026-04-21", steps:13824, calories:1148, active_breaks:0, sport_type:null, ai_analysis:null, heart_rate_avg:81, sleep_hours:1,  sleep_minutes:30 },
  { user_profile:"dydz", date:"2026-04-22", steps:16941, calories:744,  active_breaks:0, sport_type:null, ai_analysis:null, heart_rate_avg:70, sleep_hours:4,  sleep_minutes:0  },
  { user_profile:"dydz", date:"2026-04-23", steps:3447,  calories:116,  active_breaks:0, sport_type:null, ai_analysis:null, heart_rate_avg:66, sleep_hours:4,  sleep_minutes:30 },
  { user_profile:"dydz", date:"2026-04-24", steps:20974, calories:1261, active_breaks:0, sport_type:null, ai_analysis:null, heart_rate_avg:72, sleep_hours:7,  sleep_minutes:45 },
  { user_profile:"dydz", date:"2026-04-25", steps:6808,  calories:258,  active_breaks:0, sport_type:null, ai_analysis:null, heart_rate_avg:71 },
  { user_profile:"dydz", date:"2026-04-26", steps:19771, calories:1582, active_breaks:0, sport_type:null, ai_analysis:null, heart_rate_avg:91 },
  { user_profile:"dydz", date:"2026-04-27", steps:5598,  calories:155,  active_breaks:0, sport_type:null, ai_analysis:null, heart_rate_avg:73 },
  { user_profile:"dydz", date:"2026-04-28", steps:9482,  calories:1093, active_breaks:0, sport_type:null, ai_analysis:null, heart_rate_avg:80 },
  { user_profile:"dydz", date:"2026-04-29", steps:12560, calories:1171, active_breaks:0, sport_type:null, ai_analysis:null, heart_rate_avg:74, sleep_hours:10, sleep_minutes:30 },
  { user_profile:"dydz", date:"2026-04-30", steps:15168, calories:1312, active_breaks:0, sport_type:null, ai_analysis:null, heart_rate_avg:74, sleep_hours:5,  sleep_minutes:45 },
]

const SEED_FLAG = "pp_health_seed_v1"

export function applySeedIfNeeded(): void {
  if (typeof window === "undefined") return
  if (localStorage.getItem(SEED_FLAG)) return

  const key = "pp_health_logs_dydz"
  let existing: HealthLog[] = []
  try { existing = JSON.parse(localStorage.getItem(key) ?? "[]") } catch {}

  const existingDates = new Set(existing.map((l) => l.date))
  const toAdd = HEALTH_SEED.filter((s) => !existingDates.has(s.date))

  if (toAdd.length > 0) {
    const merged = [...toAdd, ...existing].sort((a, b) => b.date.localeCompare(a.date))
    localStorage.setItem(key, JSON.stringify(merged))
  }

  localStorage.setItem(SEED_FLAG, "1")
}
