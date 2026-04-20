import type { Run, Gear, Goal, UserProfile } from "./types"
import { calculateTSS } from "./calculations"

function daysBack(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function makeRun(
  daysAgo: number,
  distance: number,
  type: Run["type"],
  pace: number,
  elevation: number,
  feeling: number,
  options: Partial<Run> = {}
): Run {
  const duration = Math.round(distance * pace)
  const splits = Array.from({ length: Math.floor(distance) }, (_, i) => ({
    km: i + 1,
    time: pace + Math.round((Math.random() - 0.5) * 20),
    pace: pace + Math.round((Math.random() - 0.5) * 20),
    heartRate: options.heartRate ? options.heartRate.avg + Math.round((Math.random() - 0.5) * 10) : undefined,
  }))

  const run: Run = {
    id: `run_${daysAgo}_${Math.random().toString(36).substr(2, 5)}`,
    date: daysBack(daysAgo),
    distance,
    duration,
    pace,
    elevation,
    type,
    feeling,
    notes: "",
    splits,
    ...options,
  }
  run.tss = calculateTSS(run)
  return run
}

export const MOCK_GEAR: Gear[] = [
  {
    id: "gear_1",
    name: "Nike Vomero 17",
    brand: "Nike",
    model: "Vomero 17",
    color: "#F4D03F",
    km: 387,
    totalKmAtPurchase: 0,
    isActive: true,
    addedDate: daysBack(120),
    runIds: [],
  },
  {
    id: "gear_2",
    name: "Adidas Adizero Boston 12",
    brand: "Adidas",
    model: "Adizero Boston 12",
    color: "#3498DB",
    km: 156,
    totalKmAtPurchase: 0,
    isActive: true,
    addedDate: daysBack(60),
    runIds: [],
  },
  {
    id: "gear_3",
    name: "ASICS Nimbus 25",
    brand: "ASICS",
    model: "Gel-Nimbus 25",
    color: "#E74C3C",
    km: 621,
    totalKmAtPurchase: 0,
    isActive: false,
    addedDate: daysBack(300),
    runIds: [],
  },
]

export const MOCK_RUNS: Run[] = [
  // Last 2 weeks — recent activity
  makeRun(1, 12.4, "endurance", 330, 45, 8, {
    heartRate: { avg: 152, max: 168 },
    weather: { temp: 14, wind: 12, conditions: "cloudy" },
    gearId: "gear_1",
    notes: "Belle sortie du matin, jambes légères",
  }),
  makeRun(3, 8.0, "threshold", 278, 60, 7, {
    heartRate: { avg: 168, max: 182 },
    weather: { temp: 16, wind: 8, conditions: "sunny" },
    gearId: "gear_2",
    notes: "Seuil bien tenu sur les 5 derniers km",
  }),
  makeRun(5, 5.1, "interval", 255, 20, 9, {
    heartRate: { avg: 178, max: 192 },
    weather: { temp: 15, wind: 5, conditions: "sunny" },
    gearId: "gear_2",
    notes: "6x800m. Meilleures reps à 4:08/km",
    isPersonalRecord: { "5km": true },
  }),
  makeRun(7, 21.0, "long", 345, 180, 8, {
    heartRate: { avg: 148, max: 162 },
    weather: { temp: 11, wind: 15, conditions: "cloudy" },
    gearId: "gear_1",
    notes: "Sortie longue du dimanche, nutrition impeccable",
    isPersonalRecord: { semi: true },
  }),
  makeRun(9, 6.5, "recovery", 405, 30, 6, {
    heartRate: { avg: 132, max: 145 },
    weather: { temp: 10, wind: 18, conditions: "rainy" },
    gearId: "gear_1",
    notes: "Récup après la longue",
  }),
  makeRun(11, 10.0, "endurance", 318, 85, 8, {
    heartRate: { avg: 155, max: 170 },
    weather: { temp: 13, wind: 10, conditions: "sunny" },
    gearId: "gear_2",
  }),
  makeRun(13, 4.8, "recovery", 398, 25, 7, {
    heartRate: { avg: 128, max: 140 },
    weather: { temp: 12, wind: 7, conditions: "cloudy" },
    gearId: "gear_1",
  }),
  // 2-4 weeks ago
  makeRun(15, 15.3, "endurance", 325, 120, 8, {
    heartRate: { avg: 150, max: 165 },
    weather: { temp: 17, wind: 8, conditions: "sunny" },
    gearId: "gear_1",
  }),
  makeRun(17, 8.0, "threshold", 282, 55, 7, {
    heartRate: { avg: 170, max: 185 },
    weather: { temp: 18, wind: 5, conditions: "sunny" },
    gearId: "gear_2",
  }),
  makeRun(19, 5.0, "interval", 258, 15, 9, {
    heartRate: { avg: 180, max: 195 },
    weather: { temp: 16, wind: 10, conditions: "cloudy" },
    gearId: "gear_2",
  }),
  makeRun(21, 22.5, "long", 340, 210, 7, {
    heartRate: { avg: 145, max: 160 },
    weather: { temp: 10, wind: 20, conditions: "windy" },
    gearId: "gear_1",
    notes: "Vent fort mais bonne tenue de la 2e partie",
  }),
  makeRun(23, 7.0, "recovery", 395, 40, 6, {
    heartRate: { avg: 130, max: 143 },
    weather: { temp: 9, wind: 12, conditions: "cloudy" },
    gearId: "gear_1",
  }),
  makeRun(25, 10.8, "endurance", 322, 90, 8, {
    heartRate: { avg: 153, max: 168 },
    weather: { temp: 15, wind: 6, conditions: "sunny" },
    gearId: "gear_2",
  }),
  makeRun(27, 6.2, "threshold", 290, 50, 7, {
    heartRate: { avg: 165, max: 178 },
    weather: { temp: 14, wind: 8, conditions: "cloudy" },
    gearId: "gear_2",
  }),
  // 1 month ago
  makeRun(30, 20.1, "long", 338, 195, 9, {
    heartRate: { avg: 147, max: 162 },
    weather: { temp: 12, wind: 7, conditions: "sunny" },
    gearId: "gear_1",
    notes: "Très belle sortie, pied léger du début à la fin",
  }),
  makeRun(32, 5.5, "recovery", 400, 35, 6, {
    heartRate: { avg: 125, max: 138 },
    weather: { temp: 11, wind: 15, conditions: "cloudy" },
    gearId: "gear_1",
  }),
  makeRun(34, 12.0, "endurance", 320, 100, 8, {
    heartRate: { avg: 151, max: 164 },
    weather: { temp: 13, wind: 10, conditions: "sunny" },
    gearId: "gear_2",
  }),
  makeRun(36, 8.5, "threshold", 275, 65, 8, {
    heartRate: { avg: 172, max: 188 },
    weather: { temp: 14, wind: 5, conditions: "sunny" },
    gearId: "gear_2",
    notes: "PR au 10km en cumulé",
    isPersonalRecord: { "10km": true },
  }),
  makeRun(38, 5.0, "interval", 252, 10, 9, {
    heartRate: { avg: 182, max: 196 },
    weather: { temp: 15, wind: 8, conditions: "sunny" },
    gearId: "gear_2",
    notes: "8x400m. 3:58/km de moyenne sur les intervalles",
  }),
  makeRun(40, 7.5, "endurance", 330, 55, 7, {
    heartRate: { avg: 148, max: 162 },
    weather: { temp: 16, wind: 9, conditions: "cloudy" },
    gearId: "gear_1",
  }),
  makeRun(42, 18.0, "long", 342, 155, 8, {
    heartRate: { avg: 149, max: 164 },
    weather: { temp: 11, wind: 12, conditions: "cloudy" },
    gearId: "gear_1",
  }),
  makeRun(44, 6.0, "recovery", 392, 30, 7, {
    heartRate: { avg: 127, max: 140 },
    weather: { temp: 10, wind: 6, conditions: "sunny" },
    gearId: "gear_1",
  }),
  // 6-8 weeks ago
  makeRun(47, 10.5, "endurance", 328, 88, 7, {
    heartRate: { avg: 153, max: 166 },
    weather: { temp: 8, wind: 14, conditions: "rainy" },
    gearId: "gear_3",
  }),
  makeRun(49, 8.0, "threshold", 280, 60, 7, {
    heartRate: { avg: 168, max: 182 },
    weather: { temp: 9, wind: 10, conditions: "rainy" },
    gearId: "gear_3",
  }),
  makeRun(51, 23.5, "long", 348, 230, 7, {
    heartRate: { avg: 144, max: 158 },
    weather: { temp: 7, wind: 18, conditions: "windy" },
    gearId: "gear_3",
    notes: "Froid mais belle sortie, profil ondulé",
  }),
  makeRun(53, 5.0, "recovery", 410, 20, 5, {
    heartRate: { avg: 122, max: 135 },
    weather: { temp: 6, wind: 20, conditions: "windy" },
    gearId: "gear_3",
  }),
  makeRun(55, 11.8, "endurance", 332, 95, 8, {
    heartRate: { avg: 150, max: 163 },
    weather: { temp: 9, wind: 8, conditions: "cloudy" },
    gearId: "gear_3",
  }),
  makeRun(57, 7.0, "threshold", 285, 55, 7, {
    heartRate: { avg: 167, max: 179 },
    weather: { temp: 11, wind: 7, conditions: "sunny" },
    gearId: "gear_3",
  }),
  makeRun(60, 16.0, "long", 338, 140, 8, {
    heartRate: { avg: 148, max: 162 },
    weather: { temp: 12, wind: 5, conditions: "sunny" },
    gearId: "gear_3",
  }),
  // 2-3 months ago
  makeRun(63, 6.5, "recovery", 398, 35, 6, {
    heartRate: { avg: 128, max: 141 },
    gearId: "gear_3",
  }),
  makeRun(65, 10.2, "endurance", 335, 80, 7, {
    heartRate: { avg: 152, max: 165 },
    gearId: "gear_3",
  }),
  makeRun(67, 9.0, "threshold", 278, 70, 8, {
    heartRate: { avg: 170, max: 184 },
    gearId: "gear_3",
  }),
  makeRun(70, 25.0, "long", 350, 245, 8, {
    heartRate: { avg: 143, max: 157 },
    gearId: "gear_3",
    notes: "Sortie longue pré-marathon",
  }),
  makeRun(73, 5.5, "recovery", 402, 25, 6, { gearId: "gear_3" }),
  makeRun(75, 12.5, "endurance", 322, 105, 8, { gearId: "gear_3" }),
  makeRun(78, 5.0, "interval", 256, 12, 9, {
    heartRate: { avg: 180, max: 194 },
    gearId: "gear_3",
    notes: "5x1km. 4:12/km de moyenne",
    isPersonalRecord: { "1km": true },
  }),
  makeRun(80, 8.0, "threshold", 282, 60, 7, { gearId: "gear_3" }),
  makeRun(83, 19.5, "long", 342, 178, 8, { gearId: "gear_3" }),
  makeRun(86, 6.0, "recovery", 395, 30, 6, { gearId: "gear_3" }),
  makeRun(88, 11.0, "endurance", 328, 90, 8, { gearId: "gear_3" }),
  makeRun(91, 8.5, "threshold", 276, 68, 8, { gearId: "gear_3" }),
  makeRun(94, 30.0, "long", 355, 290, 7, {
    heartRate: { avg: 141, max: 155 },
    gearId: "gear_3",
    notes: "Sortie longue maximale — 30km — préparation marathon",
    isPersonalRecord: { longest: true },
  }),
  makeRun(97, 6.5, "recovery", 408, 40, 5, { gearId: "gear_3" }),
  makeRun(100, 10.0, "endurance", 332, 80, 7, { gearId: "gear_3" }),
  makeRun(103, 7.5, "threshold", 288, 58, 7, { gearId: "gear_3" }),
  makeRun(106, 22.0, "long", 345, 210, 7, { gearId: "gear_3" }),
  makeRun(109, 5.2, "recovery", 405, 25, 6, { gearId: "gear_3" }),
  makeRun(112, 9.8, "endurance", 330, 75, 7, { gearId: "gear_3" }),
  makeRun(115, 5.0, "interval", 260, 18, 8, { gearId: "gear_3" }),
  makeRun(118, 14.0, "endurance", 325, 115, 8, { gearId: "gear_3" }),
]

export const MOCK_GOALS: Goal[] = [
  {
    id: "goal_1",
    type: "distance",
    period: "week",
    target: 60,
    unit: "km",
    label: "Distance hebdo",
    icon: "route",
    color: "#F4D03F",
  },
  {
    id: "goal_2",
    type: "runs",
    period: "week",
    target: 4,
    unit: "sorties",
    label: "Sorties par semaine",
    icon: "footprints",
    color: "#3498DB",
  },
  {
    id: "goal_3",
    type: "elevation",
    period: "month",
    target: 3000,
    unit: "m D+",
    label: "Dénivelé mensuel",
    icon: "mountain",
    color: "#9B59B6",
  },
  {
    id: "goal_4",
    type: "distance",
    period: "year",
    target: 2000,
    unit: "km",
    label: "Distance annuelle",
    icon: "trophy",
    color: "#E67E22",
  },
]

export const MOCK_PROFILE: UserProfile = {
  name: "Dylan",
  maxHR: 192,
  restHR: 48,
  weight: 72,
  theme: "dark",
  weekStart: "monday",
}
