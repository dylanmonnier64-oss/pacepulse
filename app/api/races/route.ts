/**
 * API Courses & Marathons — Région Bordelaise (200 km)
 *
 * Données statiques enrichies. Pour connecter un vrai CMS (Contentful,
 * Supabase, Airtable…), remplacez SEED_RACES par un appel API ici et
 * conservez le même format RaceEvent en sortie.
 */
import { NextRequest, NextResponse } from "next/server"

export type RaceType = "route" | "trail" | "marathon" | "cross" | "urban"

export interface RaceDistance {
  label: string        // ex: "10 km", "Semi-marathon"
  km: number           // valeur numérique pour les filtres
}

export interface RaceEvent {
  id: string
  name: string
  slug: string
  date: string           // YYYY-MM-DD
  city: string
  department: string     // ex: "Gironde (33)"
  distanceFromBordeaux: number  // km à vol d'oiseau
  distances: RaceDistance[]
  type: RaceType
  description: string
  highlights: string[]   // points forts de la course
  url: string
  featured: boolean
  elevation?: number     // D+ en mètres (pour les trails)
  maxParticipants?: number
  edition?: number       // n° d'édition
}

// ── Catalogue des courses ─────────────────────────────────────────
const SEED_RACES: RaceEvent[] = [
  {
    id: "race-001",
    slug: "semi-marathon-bordeaux-2026",
    name: "Semi-Marathon de Bordeaux",
    date: "2026-05-17",
    city: "Bordeaux",
    department: "Gironde (33)",
    distanceFromBordeaux: 0,
    distances: [
      { label: "Semi-marathon", km: 21.1 },
      { label: "10 km", km: 10 },
    ],
    type: "route",
    description: "Le grand semi-marathon urbain qui longe les quais de la Garonne et traverse les plus beaux quartiers de Bordeaux.",
    highlights: ["Parcours plat et rapide", "Vue sur les quais UNESCO", "Ambiance festive"],
    url: "https://www.semi-marathon-bordeaux.com",
    featured: true,
    maxParticipants: 8000,
    edition: 23,
  },
  {
    id: "race-002",
    slug: "course-des-quais-bordeaux-2026",
    name: "Course des Quais de Bordeaux",
    date: "2026-06-14",
    city: "Bordeaux",
    department: "Gironde (33)",
    distanceFromBordeaux: 0,
    distances: [
      { label: "10 km", km: 10 },
      { label: "5 km", km: 5 },
      { label: "2 km enfants", km: 2 },
    ],
    type: "route",
    description: "Course populaire et familiale le long des quais classés au patrimoine mondial de l'UNESCO, en plein cœur de Bordeaux.",
    highlights: ["Parcours iconique des quais", "Catégories toutes distances", "Village running"],
    url: "https://www.coursedesquais.com",
    featured: false,
    maxParticipants: 5000,
    edition: 12,
  },
  {
    id: "race-003",
    slug: "trail-blaye-gironde-2026",
    name: "Trail de la Citadelle — Blaye",
    date: "2026-06-28",
    city: "Blaye",
    department: "Gironde (33)",
    distanceFromBordeaux: 48,
    distances: [
      { label: "32 km", km: 32 },
      { label: "16 km", km: 16 },
      { label: "8 km", km: 8 },
    ],
    type: "trail",
    description: "Trail sur les hauteurs de la Citadelle Vauban de Blaye avec des panoramas exceptionnels sur l'estuaire de la Gironde.",
    highlights: ["Site UNESCO Citadelle Vauban", "Vues sur l'estuaire", "Terrain varié"],
    url: "https://www.trail-citadelle-blaye.fr",
    featured: false,
    elevation: 420,
    maxParticipants: 1200,
    edition: 7,
  },
  {
    id: "race-004",
    slug: "10km-merignac-2026",
    name: "10 km de Mérignac",
    date: "2026-07-05",
    city: "Mérignac",
    department: "Gironde (33)",
    distanceFromBordeaux: 9,
    distances: [
      { label: "10 km", km: 10 },
      { label: "5 km", km: 5 },
    ],
    type: "route",
    description: "Course populaire estivale organisée par l'Athletic Club Mérignac, idéale pour battre son record sur 10 km.",
    highlights: ["Parcours certifié IAAF", "Chrono officiel", "Ravitaillements fréquents"],
    url: "https://www.acm33.fr",
    featured: false,
    maxParticipants: 2500,
  },
  {
    id: "race-005",
    slug: "marathon-medoc-2026",
    name: "Marathon du Médoc",
    date: "2026-09-05",
    city: "Pauillac",
    department: "Gironde (33)",
    distanceFromBordeaux: 55,
    distances: [
      { label: "Marathon", km: 42.195 },
    ],
    type: "marathon",
    description: "Le marathon le plus festif au monde ! Déguisements obligatoires, 23 ravitaillements en vins de Bordeaux AOC et gastronomie locale tout au long des 42 km dans les vignobles du Médoc.",
    highlights: ["Déguisements obligatoires", "23 ravitaillements en vins AOC", "Châteaux du Médoc", "Record du monde de convivialité"],
    url: "https://www.marathondumedoc.com",
    featured: true,
    maxParticipants: 9000,
    edition: 42,
  },
  {
    id: "race-006",
    slug: "trail-vignes-cognac-2026",
    name: "Trail des Vignes de Cognac",
    date: "2026-08-23",
    city: "Cognac",
    department: "Charente (16)",
    distanceFromBordeaux: 112,
    distances: [
      { label: "50 km", km: 50 },
      { label: "25 km", km: 25 },
      { label: "12 km", km: 12 },
    ],
    type: "trail",
    description: "Ultra-trail serpentant à travers les vignobles de Cognac, entre chais et champs de vignes avec une ambiance unique entre sport et patrimoine.",
    highlights: ["Vignobles et chais", "Dégustation de Cognac à l'arrivée", "Paysages Charente"],
    url: "https://www.trail-vignes-cognac.fr",
    featured: false,
    elevation: 680,
    maxParticipants: 1800,
    edition: 5,
  },
  {
    id: "race-007",
    slug: "semi-pessac-2026",
    name: "Semi-Marathon de Pessac",
    date: "2026-09-20",
    city: "Pessac",
    department: "Gironde (33)",
    distanceFromBordeaux: 10,
    distances: [
      { label: "Semi-marathon", km: 21.1 },
      { label: "10 km", km: 10 },
    ],
    type: "route",
    description: "Semi-marathon en pleine agglomération bordelaise, parcours rapide idéal pour les qualifications Boston et Paris.",
    highlights: ["Parcours qualificatif", "Chrono chip certifié", "Zone d'échauffement"],
    url: "https://www.semi-pessac.fr",
    featured: false,
    maxParticipants: 3000,
    edition: 15,
  },
  {
    id: "race-008",
    slug: "marathon-de-pau-2026",
    name: "Marathon de Pau",
    date: "2026-10-18",
    city: "Pau",
    department: "Pyrénées-Atlantiques (64)",
    distanceFromBordeaux: 200,
    distances: [
      { label: "Marathon", km: 42.195 },
      { label: "Semi-marathon", km: 21.1 },
      { label: "10 km", km: 10 },
    ],
    type: "marathon",
    description: "Marathon labellisé en cadre majestueux avec vue sur les Pyrénées. Parcours connu pour sa rapidité et son organisation impeccable.",
    highlights: ["Vue sur les Pyrénées", "Parcours plat et rapide", "Label FFA", "Ambiance cosmopolite"],
    url: "https://www.marathondepau.com",
    featured: true,
    maxParticipants: 7000,
    edition: 31,
  },
  {
    id: "race-009",
    slug: "corrida-libourne-2026",
    name: "Corrida Pédestre de Libourne",
    date: "2026-10-31",
    city: "Libourne",
    department: "Gironde (33)",
    distanceFromBordeaux: 32,
    distances: [
      { label: "10 km", km: 10 },
      { label: "5 km", km: 5 },
    ],
    type: "route",
    description: "Corrida d'automne dans les rues historiques de Libourne, cité médiévale entre Dordogne et Isle. Une course conviviale et bien organisée.",
    highlights: ["Cœur historique de Libourne", "Ambiance automnale", "Nombreux déguisements"],
    url: "https://www.corrida-libourne.fr",
    featured: false,
    maxParticipants: 1500,
    edition: 18,
  },
  {
    id: "race-010",
    slug: "trail-contreforts-pyrenees-2026",
    name: "Trail des Contreforts des Pyrénées",
    date: "2026-10-25",
    city: "Oloron-Sainte-Marie",
    department: "Pyrénées-Atlantiques (64)",
    distanceFromBordeaux: 178,
    distances: [
      { label: "70 km", km: 70 },
      { label: "42 km", km: 42 },
      { label: "22 km", km: 22 },
    ],
    type: "trail",
    description: "Trail de montagne en zone Natura 2000 sur les contreforts pyrénéens. Cadre sauvage et sommets à plus de 1 500 m pour les plus téméraires.",
    highlights: ["Sommets à 1 500 m", "Zone Natura 2000", "Assistance bénévole complète"],
    url: "https://www.trail-contreforts.fr",
    featured: false,
    elevation: 3200,
    maxParticipants: 900,
    edition: 9,
  },
  {
    id: "race-011",
    slug: "cross-blanquefort-2026",
    name: "Grand Cross de Blanquefort",
    date: "2026-11-08",
    city: "Blanquefort",
    department: "Gironde (33)",
    distanceFromBordeaux: 15,
    distances: [
      { label: "10 km", km: 10 },
      { label: "6 km", km: 6 },
      { label: "4 km", km: 4 },
    ],
    type: "cross",
    description: "Cross du Médoc dans un parc naturel boisé, idéal pour travailler le foncier en fin de saison et préparer l'hiver.",
    highlights: ["Terrain naturel", "Catégories jeunes", "Qualificatif régional"],
    url: "https://www.athletic-medoc.fr",
    featured: false,
    maxParticipants: 800,
    edition: 22,
  },
  {
    id: "race-012",
    slug: "10km-bergerac-2026",
    name: "10 km de Bergerac",
    date: "2026-11-15",
    city: "Bergerac",
    department: "Dordogne (24)",
    distanceFromBordeaux: 90,
    distances: [
      { label: "10 km", km: 10 },
      { label: "5 km", km: 5 },
    ],
    type: "route",
    description: "Course automnale dans la capitale du Bergeracois, entre Dordogne et vignobles. Parcours plat longeant la rivière.",
    highlights: ["Bords de Dordogne", "Vignobles bergeracois", "Course familiale"],
    url: "https://www.10km-bergerac.fr",
    featured: false,
    maxParticipants: 1200,
    edition: 11,
  },
  {
    id: "race-013",
    slug: "trail-arcachon-dune-2026",
    name: "Trail de la Dune du Pilat",
    date: "2026-07-19",
    city: "Arcachon",
    department: "Gironde (33)",
    distanceFromBordeaux: 60,
    distances: [
      { label: "21 km", km: 21 },
      { label: "11 km", km: 11 },
    ],
    type: "trail",
    description: "Trail unique en son genre sur la plus haute dune d'Europe et les forêts de pins landaises du Bassin d'Arcachon.",
    highlights: ["Dune du Pilat", "Forêt des Landes", "Vue sur le Bassin d'Arcachon"],
    url: "https://www.trail-dune-pilat.fr",
    featured: true,
    elevation: 580,
    maxParticipants: 1500,
    edition: 8,
  },
  {
    id: "race-014",
    slug: "urban-running-bordeaux-2026",
    name: "Bordeaux Urban Running",
    date: "2026-06-07",
    city: "Bordeaux",
    department: "Gironde (33)",
    distanceFromBordeaux: 0,
    distances: [
      { label: "10 km", km: 10 },
      { label: "5 km", km: 5 },
    ],
    type: "urban",
    description: "Course nocturne illuminée à travers les monuments emblématiques de Bordeaux : Place de la Bourse, Grand Théâtre, Chartrons. Ambiance électrique garantie.",
    highlights: ["Course nocturne", "Monuments illuminés", "DJ et animation"],
    url: "https://www.bordeaux-urban-running.fr",
    featured: false,
    maxParticipants: 4000,
    edition: 4,
  },
  {
    id: "race-015",
    slug: "marathon-perigueux-2026",
    name: "Marathon de Périgueux",
    date: "2026-09-27",
    city: "Périgueux",
    department: "Dordogne (24)",
    distanceFromBordeaux: 125,
    distances: [
      { label: "Marathon", km: 42.195 },
      { label: "Semi-marathon", km: 21.1 },
      { label: "10 km", km: 10 },
    ],
    type: "marathon",
    description: "Marathon culturel traversant la cité gallo-romaine et médiévale de Périgueux, classée au patrimoine mondial. Parcours riche en histoire et en patrimoine.",
    highlights: ["Cathédrale Saint-Front", "Vieille ville médiévale", "Gastronomie Périgord"],
    url: "https://www.marathon-perigueux.fr",
    featured: false,
    maxParticipants: 4500,
    edition: 16,
  },
]

// ── Types des filtres ────────────────────────────────────────────
export interface RacesQuery {
  type?: RaceType | "all"
  distanceKm?: number | "all"
  month?: number | "all"     // 1-12
  maxDist?: number           // km de Bordeaux
  search?: string
  featured?: boolean
}

export interface RacesResponse {
  events: RaceEvent[]
  total: number
  filters: {
    types: Array<{ value: string; label: string; count: number }>
    distances: number[]
    months: number[]
  }
}

// ── Handler ──────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type      = (searchParams.get("type")     ?? "all") as RaceType | "all"
  const distKm    = searchParams.get("distanceKm")
  const month     = searchParams.get("month")
  const maxDist   = searchParams.get("maxDist")
  const search    = searchParams.get("search")?.toLowerCase() ?? ""
  const featured  = searchParams.get("featured") === "true"

  // Limiter aux 6 prochains mois depuis aujourd'hui
  const today    = new Date()
  const sixMonths = new Date(today)
  sixMonths.setMonth(sixMonths.getMonth() + 6)

  let events = SEED_RACES.filter(r => {
    const rDate = new Date(r.date)
    if (rDate < today || rDate > sixMonths) return false
    if (type !== "all" && r.type !== type) return false
    if (distKm && distKm !== "all") {
      const km = parseFloat(distKm)
      if (!r.distances.some(d => Math.abs(d.km - km) < 3)) return false
    }
    if (month && month !== "all") {
      if (rDate.getMonth() + 1 !== parseInt(month)) return false
    }
    if (maxDist) {
      if (r.distanceFromBordeaux > parseInt(maxDist)) return false
    }
    if (featured && !r.featured) return false
    if (search) {
      const hay = `${r.name} ${r.city} ${r.department} ${r.description}`.toLowerCase()
      if (!hay.includes(search)) return false
    }
    return true
  })

  events = events.sort((a, b) => a.date.localeCompare(b.date))

  const typeLabels: Record<RaceType, string> = {
    route: "Route",
    trail: "Trail",
    marathon: "Marathon",
    cross: "Cross",
    urban: "Urbaine",
  }

  const typeCounts = (["route", "trail", "marathon", "cross", "urban"] as RaceType[]).map(t => ({
    value: t,
    label: typeLabels[t],
    count: SEED_RACES.filter(r => r.type === t && new Date(r.date) >= today && new Date(r.date) <= sixMonths).length,
  }))

  const response: RacesResponse = {
    events,
    total: events.length,
    filters: {
      types: typeCounts,
      distances: [5, 10, 21.1, 42.195],
      months: [...new Set(SEED_RACES
        .filter(r => { const d = new Date(r.date); return d >= today && d <= sixMonths })
        .map(r => new Date(r.date).getMonth() + 1)
      )].sort((a, b) => a - b),
    },
  }

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
