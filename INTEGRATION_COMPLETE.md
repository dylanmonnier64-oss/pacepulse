# ✅ Intégration Google Fit — COMPLÉTÉE

## 📦 Fichiers créés / modifiés

### Backend API

1. **`/app/api/google-fit/callback/route.ts`** ✅
   - OAuth callback handler
   - Échange code authorization → tokens (access + refresh)
   - Récupère le profil utilisateur (nom)
   - Redirige vers `/profile` avec les paramètres

2. **`/app/api/google-fit/activities/route.ts`** ✅
   - `GET` — Récupère les données santé (7 derniers jours)
   - `POST` — Synchronise avec Supabase + localStorage

3. **`/app/api/google-fit/refresh/route.ts`** ✅
   - Renouvelle le access token via refresh token
   - Appelé automatiquement si le token a expiré

### Frontend Components

4. **`/components/profile/GoogleFitCard.tsx`** ✅
   - Composant React pour la gestion Google Fit
   - Connect/disconnect
   - Synchronisation des données
   - Gestion des tokens (localStorage)
   - Affichage des résultats de sync

5. **`/app/(tabs)/profile/page.tsx`** ✅
   - Import du GoogleFitCard
   - Ajout d'une section "Santé & fitness" avec Google Fit
   - Placée après la section Strava

### Helpers

6. **`/lib/google-fit.ts`** ✅
   - `fetchGoogleFitAggregated()` — Données santé agrégées
   - `fetchGoogleFitActivities()` — Sessions d'exercice
   - `refreshGoogleFitToken()` — Renouvellement token

### Documentation

7. **`/GOOGLE_FIT_SETUP.md`** — Guide complet d'implémentation

---

## 🎯 Flux complet (maintenant intégré)

### 1️⃣ Utilisateur clique "Connecter Google Fit"
→ GoogleFitCard.tsx lance l'OAuth flow

### 2️⃣ Google demande l'autorisation
→ Scopes: activity.read, sleep.read, heart_rate.read

### 3️⃣ Utilisateur accepte
→ Redirection vers `/api/google-fit/callback?code=...`

### 4️⃣ Backend échange le code
→ Récupère access_token + refresh_token
→ Récupère le nom du profil utilisateur

### 5️⃣ Redirection vers `/profile?googlefit_ok=1&tokens...`
→ GoogleFitCard stocke les tokens dans localStorage

### 6️⃣ Utilisateur clique "Synchroniser"
→ Appel POST à `/api/google-fit/activities`
→ Backend fetch les données Google Fit
→ Stocke dans Supabase (table `health_devices`)
→ Affiche résultat: pas, distance, calories, etc.

### 7️⃣ Tokens expirés?
→ Appel auto POST `/api/google-fit/refresh`
→ Backend renouvelle via refresh_token
→ Continue la sync

---

## ✨ Fonctionnalités incluses

✅ OAuth 2.0 complet (Google)
✅ Gestion des tokens (localStorage + refresh auto)
✅ Synchronisation des données santé (7j)
✅ Persistence Supabase (fallback localStorage)
✅ UI complète (connect, sync, disconnect, résultats)
✅ Gestion d'erreurs robuste
✅ Messages de progression (fetching, saving, done)
✅ Déconnexion propre

---

## 📋 Avant de tester — IMPORTANT

### Étape 1: Créer OAuth Client ID dans Google Cloud Console

1. Va sur https://console.cloud.google.com
2. Sélectionne ton projet (ou en crée un)
3. Active l'API Google Fit
4. Crée des credentials → OAuth 2.0 Client ID (Web application)
5. Ajoute ces Redirect URIs:
   ```
   https://pacepulse-elite.netlify.app/api/google-fit/callback
   http://localhost:3000/api/google-fit/callback  (dev local)
   ```

### Étape 2: Ajouter à `.env.local`

```env
NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_FIT_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
```

(Les autres variables doivent déjà être configurées)

### Étape 3: Redémarrer le serveur

```bash
npm run dev
```

---

## 🧪 Test rapide

1. Va sur `/profile`
2. Cherche la section "Santé & fitness" avec le logo 🏃
3. Clique "Connecter Google Fit"
4. Suis l'OAuth de Google
5. De retour sur `/profile`, clique "Synchroniser"
6. Attends 3-5 sec, tu verras les données (pas, distance, activités, etc.)

---

## 🔗 Intégration avec le système de santé existant

Les données Google Fit sont **automatiquement stockées** dans:

- **Table Supabase** `health_devices` (device_id: "google-fit")
- **Endpoint existant** `/api/health` peut les récupérer
- **Hub Santé** (page `/health`) peut utiliser ces données

Format: même `HealthMetrics` que Health Auto Export
- `steps`, `distance`, `calories`
- `sleepHours`, `sleepMinutes`
- `heartRate` (current, avg7d, resting)
- `workouts` (activités)

---

## ⚙️ Variables d'environnement requises

```env
# Google Fit OAuth
NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID=227850...
GOOGLE_FIT_CLIENT_SECRET=4d7d56b35...

# Les autres (déjà configurées)
NEXT_PUBLIC_STRAVA_CLIENT_ID=...
STRAVA_CLIENT_SECRET=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
```

---

## 🐛 Dépannage

| Problème | Solution |
|----------|----------|
| "Client ID manquant" | Ajoute NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID à .env.local |
| "Connexion refusée" | Vérifie les scopes OAuth et les Redirect URIs |
| "Token expiré" | Normalement rechargé auto, sinon reconnecte |
| "Pas de données" | Vérifie que Google Fit a des données sur ton téléphone |
| Page blanche | Redémarrage serveur après ajout des env vars |

---

## 📊 Données récupérées

**Par jour** (agrégat 7j):
- Steps (pas)
- Distance (km)
- Calories brûlées
- Fréquence cardiaque (min, moy, max)
- Durée sommeil (h:min)
- Activités (running, cycling, etc.)

---

## ✅ Tout est prêt!

1. Crée l'OAuth Client ID → Copie les credentials
2. Ajoute-les à `.env.local`
3. Redémarrage serveur
4. Test sur `/profile`
5. C'est bon! 🚀

Les données se synced auto dans Supabase et seront accessibles via:
- `/api/health` (existant)
- `/api/google-fit/activities` (nouveau)
- Hub Santé (page `/health`)
