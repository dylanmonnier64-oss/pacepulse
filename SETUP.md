# PacePulse — Guide de configuration

## Fichiers créés (modules Maps IA + Apple Santé)

### Données
| Fichier | Rôle |
|---|---|
| `public/data/routes-bordeaux.json` | 20 parcours réels autour de Bordeaux |
| `public/data/geojson/route-001.json` … `route-020.json` | Tracés GeoJSON pour chaque parcours |

### Moteur IA
| Fichier | Rôle |
|---|---|
| `lib/route-engine.ts` | Algorithme de scoring 0-110pts, historique runs, recommandations |
| `lib/weather.ts` | Fetch météo OpenWeatherMap + lever/coucher Sunrise-Sunset API, cache 1h/24h |
| `hooks/useRouteEngine.ts` | Hook principal : météo + soleil + recommandations en temps réel |
| `hooks/useHealthData.ts` | Hook Apple Santé : multi-montres, polling 5min, status sync |

### Composants
| Fichier | Rôle |
|---|---|
| `components/map/MapView.tsx` | Carte Mapbox GL JS (client-only), style PacePulse Elite |
| `components/map/CoachBlock.tsx` | Bloc Coach IA du Jour, message contextuel, alerte Fenêtre Dorée |
| `components/map/WeatherBar.tsx` | Barre météo + compte à rebours solaire |
| `components/map/RunCards.tsx` | 3 cartes de recommandation avec score, raison, bouton Lancer |
| `components/health/SyncWidget.tsx` | Pastille de sync + panneau détail montres |

### API & Pages
| Fichier | Rôle |
|---|---|
| `app/api/health/route.ts` | Endpoint POST/GET pour Health Auto Export |
| `app/(tabs)/map/page.tsx` | Page principale Carte avec timer de run |

---

## Clés API à configurer

Ajoute ces variables dans ton fichier `.env.local` :

```env
# Mapbox — https://account.mapbox.com/access-tokens/
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiTON_USERNAME...

# OpenWeatherMap — https://openweathermap.org/api (gratuit jusqu'à 1000 req/jour)
NEXT_PUBLIC_OWM_API_KEY=ta_cle_owm_ici
```

### Obtenir une clé Mapbox (gratuit jusqu'à 50 000 chargements/mois)
1. Crée un compte sur mapbox.com
2. Va dans Account → Access Tokens
3. Copie le token "Default public token"
4. Colle-le dans `.env.local` comme `NEXT_PUBLIC_MAPBOX_TOKEN`

### Obtenir une clé OpenWeatherMap (gratuit, ~60 req/min)
1. Inscris-toi sur openweathermap.org
2. Va dans "My API Keys"
3. Copie la clé Default
4. Colle-la dans `.env.local` comme `NEXT_PUBLIC_OWM_API_KEY`

---

## Configuration Health Auto Export

**URL à entrer dans l'app Health Auto Export :**
```
https://pacepulse-dydz.netlify.app/api/health
```

**Paramètres :**
- Méthode : `POST`
- Format : `JSON`
- Intervalle : `1 heure` (recommandé)

**Champ obligatoire à ajouter dans le payload :**
```json
{
  "device_id": "mon_apple_watch",
  "name": "Apple Watch Series 9"
}
```

**Pour la Redmi Watch 5 Lite :**
```json
{
  "device_id": "redmi_watch_5_lite",
  "name": "Redmi Watch 5 Lite"
}
```

**Format complet attendu :**
```json
{
  "device_id": "apple_watch",
  "name": "Apple Watch",
  "data": {
    "steps": 8432,
    "heartRate": {
      "current": 72,
      "avg7d": 65,
      "resting": 52
    },
    "distance": 6.4,
    "calories": 420,
    "workouts": [
      {
        "type": "Running",
        "duration": 42,
        "distance": 8.2,
        "avgHR": 158,
        "date": "2026-04-20T18:30:00Z"
      }
    ]
  }
}
```

---

## Limitation serverless (Netlify)

L'endpoint `/api/health` utilise un **store en mémoire** — les données sont perdues à chaque cold-start.

### Pour une persistance permanente, connecte Supabase :
1. Crée une table `health_data` dans ton projet Supabase (déjà configuré dans le projet)
2. Remplace le store in-memory dans `app/api/health/route.ts` par des appels Supabase
3. Les commentaires dans le fichier indiquent exactement où faire les modifications

---

## Étapes manuelles restantes

1. **Obtenir et ajouter la clé Mapbox** (5 min) — voir ci-dessus
2. **Obtenir et ajouter la clé OpenWeatherMap** (5 min) — voir ci-dessus  
3. **Redéployer sur Netlify** après avoir ajouté les clés :
   ```bash
   ~/.npm-global/bin/netlify deploy --build --prod
   ```
   ⚠️ Sur Netlify, ajoute aussi les variables dans **Site Settings → Environment Variables** pour qu'elles soient disponibles en production.
4. **Configurer Health Auto Export** sur iPhone (voir ci-dessus)

---

*Généré automatiquement par Claude Code — PacePulse v2.0*
