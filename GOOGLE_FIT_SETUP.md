# Integration Google Fit — PacePulse

## 📁 Fichiers créés

### 1. `/app/api/google-fit/callback/route.ts`
- Handler OAuth callback
- Échange le code d'autorisation contre un access token
- Récupère les infos du profil utilisateur
- Redirige vers `/profile` avec les tokens en params URL

### 2. `/lib/google-fit.ts`
- `fetchGoogleFitAggregated()` — Récupère données santé agrégées (pas, distance, calories, HR, sommeil)
- `fetchGoogleFitActivities()` — Récupère les sessions d'activité
- `refreshGoogleFitToken()` — Renouvelle le refresh token

### 3. `/app/api/google-fit/activities/route.ts`
- `GET` — Retourne les données Google Fit (7 derniers jours)
- `POST` — Synchronise les données avec Supabase (table `health_devices`)

---

## 🔧 Configuration requise

### 1. Variables d'environnement (.env.local)
Ajoute ces deux lignes une fois que tu as les credentials de Google Cloud Console :

```env
NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_FIT_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
```

### 2. Récupérer les credentials

Va sur Google Cloud Console → Project → Credentials → Create OAuth 2.0 Client ID

**Paramètres requis :**
- Application type: **Web application**
- Authorized redirect URIs: `https://pacepulse-elite.netlify.app/api/google-fit/callback`
  (et `http://localhost:3000/api/google-fit/callback` pour le développement local)

### 3. Redémarrer le serveur
```bash
npm run dev
```

---

## 🚀 Utilisation

### Flux OAuth (depuis le frontend)

```typescript
// Dans ton composant de profil :
const googleFitAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
  client_id: process.env.NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID || "",
  redirect_uri: `${window.location.origin}/api/google-fit/callback`,
  response_type: "code",
  scope: [
    "https://www.googleapis.com/auth/fitness.activity.read",
    "https://www.googleapis.com/auth/fitness.sleep.read",
    "https://www.googleapis.com/auth/fitness.location.read",
    "https://www.googleapis.com/auth/fitness.heart_rate.read",
  ].join(" "),
  state: localStorage.getItem("profile") || "dydz",
}).toString()}`;

// Lancer le login
window.location.href = googleFitAuthUrl;
```

### Récupérer les données

```typescript
// GET — Juste les données (sans persistance)
const res = await fetch("/api/google-fit/activities?access_token=YOUR_TOKEN");
const healthData = await res.json();

// POST — Synchroniser avec Supabase
const res = await fetch("/api/google-fit/activities", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    access_token: googleFitToken,
    refresh_token: googleFitRefreshToken,
    device_name: "Google Fit",
  }),
});
```

---

## 📊 Format des données retournées

```typescript
{
  success: true,
  data: {
    steps: 8432,
    distance: 6.2,        // km
    calories: 450,
    sleepHours: 7,
    sleepMinutes: 30,
    heartRate: {
      current: 72,
      avg7d: 68,
      resting: 55,
    },
    workouts: [
      {
        type: "running",
        duration: 2400,    // secondes
        date: "2026-05-04T07:30:00.000Z",
      },
    ],
  },
  fetchedAt: "2026-05-04T17:30:00.000Z",
  range: {
    start: "2026-04-27T17:30:00.000Z",
    end: "2026-05-04T17:30:00.000Z",
  },
}
```

---

## ⚠️ Points importants

1. **Refresh Token** — Google Fit génère un refresh token une seule fois lors du premier OAuth. Conserve-le pour renouveler l'access token après 1h.

2. **Scopes requis** :**
   - `fitness.activity.read` — Activités et workout
   - `fitness.sleep.read` — Données de sommeil
   - `fitness.heart_rate.read` — Fréquence cardiaque
   - `fitness.location.read` — Localisation (optionnel)

3. **Données agrégées** — La librairie récupère les données des 7 derniers jours. À adapter dans `fetchGoogleFitAggregated()` si besoin d'une période différente.

4. **Stockage** — Les tokens doivent être stockés côté client (localStorage, cookie sécurisé) ou côté serveur (Supabase table dédiée). Le callback ne persiste rien automatiquement.

---

## 📖 Prochaines étapes

1. **Créer OAuth Client ID** dans Google Cloud Console
2. **Ajouter credentials** à .env.local
3. **Redémarrer le serveur**
4. **Ajouter un bouton** "Connect with Google Fit" dans `/profile` page
5. **Stocker les tokens** une fois reçus (localStorage ou Supabase)
6. **Appeler `/api/google-fit/activities`** pour tirer les données

---

## 🔗 Ressources

- [Google Fitness REST API Docs](https://developers.google.com/fit/rest)
- [OAuth 2.0 Flow Google](https://developers.google.com/identity/protocols/oauth2)
- [Data Types Reference](https://developers.google.com/fit/rest/v1/get-started#data_types)
