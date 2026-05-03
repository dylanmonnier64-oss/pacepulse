#!/usr/bin/env node
/**
 * gen-routes.js
 * Generates routes-bordeaux.json and 20 GeoJSON files for Bordeaux running routes.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const GEOJSON_DIR = path.join(DATA_DIR, 'geojson');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Linear interpolation between two values */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Generate a plausible running-route LineString around a centre point.
 * For loop routes the last coordinate snaps back close to the first.
 */
function generateCoordinates(centerLng, centerLat, radiusLng, radiusLat, numPoints, isLoop) {
  const coords = [];
  // Create an irregular polygon-like path by stepping around an ellipse
  // with random perturbations so it looks organic.
  const seed = centerLng + centerLat; // deterministic per route
  let rng = seed;
  function rand() {
    // Simple LCG
    rng = (rng * 1664525 + 1013904223) & 0xffffffff;
    return (rng >>> 0) / 0xffffffff;
  }

  // Build a series of control angles with slight jitter
  const angles = [];
  for (let i = 0; i < numPoints - (isLoop ? 1 : 0); i++) {
    const baseAngle = (i / (numPoints - (isLoop ? 1 : 0))) * 2 * Math.PI;
    const jitter = (rand() - 0.5) * 0.4;
    angles.push(baseAngle + jitter);
  }
  // Sort so route doesn't cross itself too badly
  angles.sort((a, b) => a - b);

  for (let i = 0; i < angles.length; i++) {
    const angle = angles[i];
    // Radial jitter: 60-100% of radius
    const r = 0.6 + rand() * 0.4;
    const lng = parseFloat((centerLng + Math.cos(angle) * radiusLng * r).toFixed(5));
    const lat = parseFloat((centerLat + Math.sin(angle) * radiusLat * r).toFixed(5));
    coords.push([lng, lat]);
  }

  if (isLoop) {
    // Close the loop — snap to near the first point with tiny offset
    const first = coords[0];
    coords.push([
      parseFloat((first[0] + (rand() - 0.5) * 0.0002).toFixed(5)),
      parseFloat((first[1] + (rand() - 0.5) * 0.0002).toFixed(5)),
    ]);
  }

  return coords;
}

// ---------------------------------------------------------------------------
// Route definitions
// ---------------------------------------------------------------------------

const routeDefinitions = [
  // 1 — Quais Garonne
  {
    id: 'route-001',
    name: 'Boucle des Quais au Crépuscule',
    distance_km: 8,
    elevation_gain_m: 15,
    terrain_type: 'quais',
    surface: 'goudron',
    difficulty: 'débutant',
    loop: true,
    start_coordinates: [-0.5700, 44.835],
    points_of_interest: ["Miroir d'eau", 'Place de la Bourse', 'Pont de Pierre'],
    scenic_score: 9,
    sunset_score: 10,
    sunrise_score: 7,
    wet_weather_compatible: true,
    zones: ['Quais Garonne'],
    center: [-0.562, 44.840],
    radius: [0.008, 0.006],
  },
  // 2 — Quais Garonne (longer)
  {
    id: 'route-002',
    name: 'Grands Quais Nord-Sud',
    distance_km: 12,
    elevation_gain_m: 20,
    terrain_type: 'quais',
    surface: 'goudron',
    difficulty: 'intermédiaire',
    loop: false,
    start_coordinates: [-0.5680, 44.850],
    points_of_interest: ['Chartrons', 'Pont Jacques-Chaban-Delmas', 'Cité du Vin'],
    scenic_score: 8,
    sunset_score: 9,
    sunrise_score: 8,
    wet_weather_compatible: true,
    zones: ['Quais Garonne', 'Chartrons'],
    center: [-0.563, 44.843],
    radius: [0.010, 0.010],
  },
  // 3 — Parc Bordelais
  {
    id: 'route-003',
    name: 'Spirale du Parc Bordelais',
    distance_km: 5,
    elevation_gain_m: 30,
    terrain_type: 'parc',
    surface: 'chemin terre',
    difficulty: 'débutant',
    loop: true,
    start_coordinates: [-0.6070, 44.847],
    points_of_interest: ['Roserie du Parc', 'Lac du Parc', 'Allée principale'],
    scenic_score: 7,
    sunset_score: 6,
    sunrise_score: 8,
    wet_weather_compatible: false,
    zones: ['Parc Bordelais'],
    center: [-0.607, 44.847],
    radius: [0.005, 0.004],
  },
  // 4 — Parc Bordelais (trail)
  {
    id: 'route-004',
    name: 'Trail des Sous-Bois',
    distance_km: 7,
    elevation_gain_m: 55,
    terrain_type: 'trail',
    surface: 'terre',
    difficulty: 'intermédiaire',
    loop: true,
    start_coordinates: [-0.6100, 44.845],
    points_of_interest: ['Clairière Nord', 'Ruisseau du Parc'],
    scenic_score: 7,
    sunset_score: 5,
    sunrise_score: 9,
    wet_weather_compatible: false,
    zones: ['Parc Bordelais'],
    center: [-0.610, 44.846],
    radius: [0.006, 0.005],
  },
  // 5 — Lac de Bordeaux
  {
    id: 'route-005',
    name: 'Tour du Lac de Bordeaux',
    distance_km: 9,
    elevation_gain_m: 10,
    terrain_type: 'lac',
    surface: 'goudron',
    difficulty: 'débutant',
    loop: true,
    start_coordinates: [-0.6140, 44.873],
    points_of_interest: ['Plage du Lac', 'Base nautique', 'Parc des Expositions'],
    scenic_score: 8,
    sunset_score: 9,
    sunrise_score: 8,
    wet_weather_compatible: true,
    zones: ['Lac de Bordeaux'],
    center: [-0.614, 44.873],
    radius: [0.009, 0.006],
  },
  // 6 — Lac de Bordeaux (long)
  {
    id: 'route-006',
    name: 'Grand Tour Lac & Forêt',
    distance_km: 15,
    elevation_gain_m: 25,
    terrain_type: 'lac',
    surface: 'mixte',
    difficulty: 'intermédiaire',
    loop: true,
    start_coordinates: [-0.6140, 44.875],
    points_of_interest: ['Plage du Lac', 'Bois de Bordeaux', 'Stade Nautique'],
    scenic_score: 8,
    sunset_score: 8,
    sunrise_score: 9,
    wet_weather_compatible: true,
    zones: ['Lac de Bordeaux'],
    center: [-0.618, 44.874],
    radius: [0.014, 0.009],
  },
  // 7 — Darwin / Bastide
  {
    id: 'route-007',
    name: 'Bastide Créative',
    distance_km: 6,
    elevation_gain_m: 18,
    terrain_type: 'urbain',
    surface: 'goudron',
    difficulty: 'débutant',
    loop: true,
    start_coordinates: [-0.5480, 44.843],
    points_of_interest: ['Darwin Ecosystème', 'Jardin Botanique', 'Pont de Pierre'],
    scenic_score: 7,
    sunset_score: 7,
    sunrise_score: 8,
    wet_weather_compatible: true,
    zones: ['Darwin', 'Bastide'],
    center: [-0.548, 44.843],
    radius: [0.006, 0.005],
  },
  // 8 — Bastide (longue)
  {
    id: 'route-008',
    name: 'Bastide à Bouliac Aller-Retour',
    distance_km: 18,
    elevation_gain_m: 120,
    terrain_type: 'mixte',
    surface: 'mixte',
    difficulty: 'avancé',
    loop: false,
    start_coordinates: [-0.5480, 44.843],
    points_of_interest: ['Darwin Ecosystème', 'Côteaux de Bouliac', 'Point de vue Garonne'],
    scenic_score: 9,
    sunset_score: 9,
    sunrise_score: 7,
    wet_weather_compatible: false,
    zones: ['Darwin', 'Bastide', 'Bouliac'],
    center: [-0.530, 44.820],
    radius: [0.020, 0.024],
  },
  // 9 — Bouliac
  {
    id: 'route-009',
    name: 'Coteaux de Bouliac',
    distance_km: 10,
    elevation_gain_m: 145,
    terrain_type: 'trail',
    surface: 'terre',
    difficulty: 'avancé',
    loop: true,
    start_coordinates: [-0.5130, 44.796],
    points_of_interest: ['Belvédère de Bouliac', 'Vignobles de Bouliac', 'Chapelle'],
    scenic_score: 10,
    sunset_score: 10,
    sunrise_score: 9,
    wet_weather_compatible: false,
    zones: ['Bouliac'],
    center: [-0.513, 44.796],
    radius: [0.010, 0.008],
  },
  // 10 — Bouliac (court)
  {
    id: 'route-010',
    name: 'Sentier des Vignes',
    distance_km: 4,
    elevation_gain_m: 80,
    terrain_type: 'trail',
    surface: 'terre',
    difficulty: 'intermédiaire',
    loop: true,
    start_coordinates: [-0.5140, 44.797],
    points_of_interest: ['Vignes de Bouliac', 'Belvédère'],
    scenic_score: 9,
    sunset_score: 10,
    sunrise_score: 8,
    wet_weather_compatible: false,
    zones: ['Bouliac'],
    center: [-0.514, 44.797],
    radius: [0.004, 0.003],
  },
  // 11 — Mérignac
  {
    id: 'route-011',
    name: 'Boucle Mérignac Soleil',
    distance_km: 11,
    elevation_gain_m: 35,
    terrain_type: 'urbain',
    surface: 'goudron',
    difficulty: 'intermédiaire',
    loop: true,
    start_coordinates: [-0.6440, 44.840],
    points_of_interest: ["Étang de l'Alouette", 'Parc de Mussonville', 'Allée de Boutaut'],
    scenic_score: 6,
    sunset_score: 6,
    sunrise_score: 7,
    wet_weather_compatible: true,
    zones: ['Mérignac'],
    center: [-0.644, 44.840],
    radius: [0.011, 0.008],
  },
  // 12 — Mérignac (long)
  {
    id: 'route-012',
    name: 'Marathon Mérignac-Bordeaux',
    distance_km: 22,
    elevation_gain_m: 60,
    terrain_type: 'urbain',
    surface: 'goudron',
    difficulty: 'avancé',
    loop: false,
    start_coordinates: [-0.6440, 44.840],
    points_of_interest: ['Mérignac', 'Caudéran', 'Parc Bordelais', 'Quais'],
    scenic_score: 6,
    sunset_score: 7,
    sunrise_score: 6,
    wet_weather_compatible: true,
    zones: ['Mérignac', 'Parc Bordelais', 'Quais Garonne'],
    center: [-0.608, 44.842],
    radius: [0.038, 0.012],
  },
  // 13 — Pessac
  {
    id: 'route-013',
    name: 'Forêt de Pessac',
    distance_km: 13,
    elevation_gain_m: 50,
    terrain_type: 'trail',
    surface: 'terre',
    difficulty: 'intermédiaire',
    loop: true,
    start_coordinates: [-0.6300, 44.808],
    points_of_interest: ['Forêt de Pessac', 'Lac de Beauséjour', 'Domaine Universitaire'],
    scenic_score: 7,
    sunset_score: 6,
    sunrise_score: 8,
    wet_weather_compatible: false,
    zones: ['Pessac'],
    center: [-0.630, 44.808],
    radius: [0.013, 0.010],
  },
  // 14 — Pessac (court)
  {
    id: 'route-014',
    name: 'Boucle du Campus',
    distance_km: 5,
    elevation_gain_m: 20,
    terrain_type: 'parc',
    surface: 'mixte',
    difficulty: 'débutant',
    loop: true,
    start_coordinates: [-0.6290, 44.809],
    points_of_interest: ['Campus Talence', 'ENSAM', 'Parc paysager'],
    scenic_score: 5,
    sunset_score: 5,
    sunrise_score: 6,
    wet_weather_compatible: true,
    zones: ['Pessac'],
    center: [-0.629, 44.809],
    radius: [0.005, 0.004],
  },
  // 15 — Chartrons
  {
    id: 'route-015',
    name: 'Chartrons & Bacalan Riverside',
    distance_km: 8,
    elevation_gain_m: 12,
    terrain_type: 'quais',
    surface: 'goudron',
    difficulty: 'débutant',
    loop: true,
    start_coordinates: [-0.5720, 44.849],
    points_of_interest: ['Marché des Chartrons', 'Hangar 14', 'Cité du Vin'],
    scenic_score: 8,
    sunset_score: 9,
    sunrise_score: 7,
    wet_weather_compatible: true,
    zones: ['Chartrons'],
    center: [-0.572, 44.849],
    radius: [0.008, 0.006],
  },
  // 16 — Chartrons (long)
  {
    id: 'route-016',
    name: 'Chartrons à Lormont',
    distance_km: 16,
    elevation_gain_m: 40,
    terrain_type: 'mixte',
    surface: 'mixte',
    difficulty: 'intermédiaire',
    loop: false,
    start_coordinates: [-0.5720, 44.849],
    points_of_interest: ['Chartrons', 'Pont Chaban-Delmas', 'Lormont', 'Belvédère'],
    scenic_score: 8,
    sunset_score: 8,
    sunrise_score: 8,
    wet_weather_compatible: true,
    zones: ['Chartrons', 'Bastide'],
    center: [-0.556, 44.858],
    radius: [0.020, 0.012],
  },
  // 17 — Saint-Michel
  {
    id: 'route-017',
    name: 'Saint-Michel & Victoire',
    distance_km: 6,
    elevation_gain_m: 10,
    terrain_type: 'urbain',
    surface: 'goudron',
    difficulty: 'débutant',
    loop: true,
    start_coordinates: [-0.5680, 44.830],
    points_of_interest: ['Basilique Saint-Michel', 'Cours Victor Hugo', 'Place de la Victoire'],
    scenic_score: 7,
    sunset_score: 7,
    sunrise_score: 6,
    wet_weather_compatible: true,
    zones: ['Saint-Michel'],
    center: [-0.568, 44.830],
    radius: [0.006, 0.005],
  },
  // 18 — Saint-Michel (nuit)
  {
    id: 'route-018',
    name: 'Traversée des Lumières',
    distance_km: 9,
    elevation_gain_m: 15,
    terrain_type: 'urbain',
    surface: 'goudron',
    difficulty: 'débutant',
    loop: false,
    start_coordinates: [-0.5680, 44.830],
    points_of_interest: ['Basilique Saint-Michel', 'Quais', 'Pont de Pierre', 'Place Pey Berland'],
    scenic_score: 9,
    sunset_score: 10,
    sunrise_score: 8,
    wet_weather_compatible: true,
    zones: ['Saint-Michel', 'Quais Garonne'],
    center: [-0.566, 44.834],
    radius: [0.009, 0.007],
  },
  // 19 — Caudéran (Parc Bordelais)
  {
    id: 'route-019',
    name: 'Caudéran & Parc en Boucle',
    distance_km: 10,
    elevation_gain_m: 35,
    terrain_type: 'mixte',
    surface: 'mixte',
    difficulty: 'intermédiaire',
    loop: true,
    start_coordinates: [-0.6080, 44.846],
    points_of_interest: ['Caudéran', 'Parc Bordelais', 'Square du Docteur Schweitzer'],
    scenic_score: 6,
    sunset_score: 6,
    sunrise_score: 7,
    wet_weather_compatible: true,
    zones: ['Parc Bordelais'],
    center: [-0.608, 44.846],
    radius: [0.010, 0.007],
  },
  // 20 — Grand Tour Bordeaux
  {
    id: 'route-020',
    name: 'Grand Tour de Bordeaux',
    distance_km: 20,
    elevation_gain_m: 85,
    terrain_type: 'urbain',
    surface: 'goudron',
    difficulty: 'avancé',
    loop: true,
    start_coordinates: [-0.5700, 44.835],
    points_of_interest: ['Quais', 'Chartrons', 'Parc Bordelais', 'Caudéran', 'Pessac', 'Saint-Michel'],
    scenic_score: 9,
    sunset_score: 8,
    sunrise_score: 8,
    wet_weather_compatible: true,
    zones: ['Quais Garonne', 'Chartrons', 'Parc Bordelais', 'Saint-Michel'],
    center: [-0.590, 44.840],
    radius: [0.030, 0.020],
  },
];

// ---------------------------------------------------------------------------
// Build routes array (strip internal fields)
// ---------------------------------------------------------------------------

const routes = routeDefinitions.map(({ center, radius, ...route }) => ({
  ...route,
  geojson_path: `/data/geojson/${route.id}.json`,
}));

// ---------------------------------------------------------------------------
// Write routes-bordeaux.json
// ---------------------------------------------------------------------------

const routesPath = path.join(DATA_DIR, 'routes-bordeaux.json');
fs.writeFileSync(routesPath, JSON.stringify(routes, null, 2), 'utf8');
console.log(`Written: ${routesPath}`);

// ---------------------------------------------------------------------------
// Write GeoJSON files
// ---------------------------------------------------------------------------

for (const def of routeDefinitions) {
  const numPoints = 20 + Math.floor(Math.abs(Math.sin(def.center[0] * 1000)) * 21); // 20-40
  const coords = generateCoordinates(
    def.center[0],
    def.center[1],
    def.radius[0],
    def.radius[1],
    numPoints,
    def.loop,
  );

  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: def.name,
          distance_km: def.distance_km,
        },
        geometry: {
          type: 'LineString',
          coordinates: coords,
        },
      },
    ],
  };

  const geojsonPath = path.join(GEOJSON_DIR, `${def.id}.json`);
  fs.writeFileSync(geojsonPath, JSON.stringify(geojson, null, 2), 'utf8');
  console.log(`Written: ${geojsonPath}  (${coords.length} points)`);
}

console.log('\nDone. Generated 1 routes index + 20 GeoJSON files.');
