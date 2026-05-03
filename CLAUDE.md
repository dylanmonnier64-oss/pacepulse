@AGENTS.md

# PacePulse — CLAUDE.md

> Fiche de référence complète pour reprendre le projet à tout moment.

---

## 🌐 URLs de production

| App | URL |
|-----|-----|
| **PacePulse** | https://pacepulse-elite.netlify.app |
| **Portfolio Dylan** | https://dylan-monnier-portfolio.netlify.app |

---

## 🚀 Deploy Netlify

### Commande de déploiement (PacePulse)

```bash
cd "/Users/ladydz/Desktop/dylan claude/pacepulse"
NETLIFY_AUTH_TOKEN=nfp_vEFgPSmbW9EyU7u6vxsgxnKp2gm8GAvK049b \
NETLIFY_SITE_ID=7eeaa4ea-a3af-4152-9782-fe3715357926 \
npx netlify-cli deploy --prod
```

### Commande de déploiement (Portfolio)

```bash
cd "/Users/ladydz/Desktop/dylan claude/portfolio"
NETLIFY_AUTH_TOKEN=nfp_PxFMhN8joDHwA42MVf3TzGBTMm5GBtP8062b \
NETLIFY_SITE_ID=39f1637a-f074-49dc-a826-36dc0656bf9e \
npx netlify-cli deploy --prod
```

### IDs Netlify

| Site | Site ID | Slug |
|------|---------|------|
| PacePulse | `7eeaa4ea-a3af-4152-9782-fe3715357926` | `pacepulse-elite` |
| Portfolio | `39f1637a-f074-49dc-a826-36dc0656bf9e` | `dylan-monnier-portfolio` |

### Token Netlify

```
nfp_vEFgPSmbW9EyU7u6vxsgxnKp2gm8GAvK049b
```

> Email compte : dylan.monnier64@gmail.com

---

## ⚙️ Stack technique

- **Framework** : Next.js 16.2.4, App Router
- **CSS** : Tailwind v4 (syntaxe `@theme`, `@utility`) — PAS de `tailwind.config.js`
- **Animations** : Framer Motion 12 (`motion.div`, `AnimatePresence`, `useMotionValue`)
- **Base de données** : Supabase (`@supabase/supabase-js`) + fallback localStorage
- **IA** : Anthropic Claude API (`claude-opus-4-5`)
- **Push** : Web Push API, clés VAPID
- **Charts** : Recharts
- **Maps** : Leaflet + react-leaflet
- **Polices** : DM Sans, JetBrains Mono, Bebas Neue (Google Fonts)

---

## 🎨 Design System — Heritage Elite OS

### Couleurs clés (CSS vars dans `:root`)

```css
--app-bg: #0A0A0A
--gold: #D4AF37          /* accent principal */
--gold-dark: #B8962E
--gold-glow: rgba(212,175,55,0.35)
--primary: #F4D03F       /* jaune vif */
--orange: #FF6B1A
--purple: #A855F7
--text: #FAFAFA
```

### Patterns de composants

```tsx
// Carte standard
<div style={{
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 22,
}} />

// Carte premium (VitalityScore / FatigueRing)
<div style={{
  background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
  border: "1px solid rgba(255,255,255,0.09)",
  boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
}} />

// Liquid glass button → utiliser lgStyle() depuis lib/utils
import { lgStyle } from "@/lib/utils"
<div style={lgStyle("rgba(212,175,55,0.08)")} />
```

### Règles impératives

- `"use client"` sur **tous** les composants avec state, hooks ou event handlers
- Texte principal : `#FAFAFA` (pas `white`)
- Numbers/data : classe `data-mono` (JetBrains Mono)
- Labels : `text-[9px] font-bold uppercase tracking-[0.18em]` color `rgba(250,250,250,0.32)`
- Label gold : `text-[9px] font-bold uppercase tracking-[0.22em]` color `var(--gold)`
- Hover cards : `whileHover={{ y: -3, boxShadow: \`0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color}28\` }}`
- Orbe animé : `animate={{ top: [...], left: [...] }}` radial-gradient avec blur
- Touch : classe `touch-feedback` sur tout ce qui est cliquable
- Haptic : `onClick={hapticFeedback}` depuis `lib/utils`

---

## 📁 Architecture des fichiers

```
app/
├── (tabs)/
│   ├── layout.tsx          # Fixed scroll container + TabBar
│   ├── dashboard/page.tsx  # Accueil
│   ├── runs/               # Gestion des sorties
│   ├── stats/page.tsx      # CTL/ATL/TSB
│   ├── goals/page.tsx      # Objectifs
│   ├── health/page.tsx     # Hub Santé ✨
│   ├── map/page.tsx        # Carte Leaflet
│   ├── training/page.tsx   # Plan entraînement
│   └── profile/page.tsx    # Profil
├── api/
│   ├── ai/analyse/         # Claude AI → analyse santé
│   ├── push/
│   │   ├── subscribe/      # Enregistrement push
│   │   └── cron/           # Cron 22h → notif push
│   ├── health/             # API santé générique
│   └── strava/callback/    # OAuth Strava
└── globals.css             # Tailwind @theme + utilities

components/
├── health/
│   ├── FatigueRing.tsx     # Ring SVG vitalité (Heritage style)
│   ├── AIInsightCard.tsx   # Carte analyse Claude
│   ├── HealthMetricCard.tsx # Carte métrique (orbe animé)
│   ├── TrendChart.tsx      # Graphique 7j (Recharts)
│   ├── DailyQuestionnaire.tsx # Bottom sheet formulaire
│   └── SyncWidget.tsx
├── dashboard/
│   ├── VitalityScore.tsx   # Ring principal dashboard
│   ├── HeroCard.tsx        # Dernière sortie
│   ├── StatsGrid.tsx       # Grille stats semaine
│   ├── WeeklyChart.tsx
│   ├── WeeklyRecap.tsx
│   └── HydrationWidget.tsx
├── navigation/
│   └── TabBar.tsx          # 7 onglets avec liquid glass
└── ui/
    ├── Toaster.tsx          # Toast notifications
    └── LogoPP.tsx

lib/
├── types.ts                # Run, HealthLog, AIHealthAnalysis, HealthFormState
├── supabase.ts             # Client public + service role
├── utils.ts                # lgStyle(), hapticFeedback(), formatters
├── storage.ts              # localStorage helpers
├── calculations.ts         # CTL/ATL/TSB, GAP, streak
└── design-tokens.ts        # vitality colors/thresholds

hooks/
├── useRuns.ts
├── useHealthLogs.ts        # Save/fetch logs (Supabase + localStorage)
└── usePushNotifications.ts # VAPID subscribe

public/
└── sw.js                   # Service worker (cache + push handler)
```

---

## 🏥 Hub Santé — Données collectées

Formulaire **DailyQuestionnaire** (4 étapes) :

| Champ | Type | Objectif |
|-------|------|---------|
| `steps` | number | /10 000 pas |
| `calories` | number | /500 kcal |
| `active_minutes` | number | /30 min |
| `active_breaks` | number | 0–6 pauses |
| `heart_rate_avg` | number | FC repos (bpm) |
| `sleep_hours` + `sleep_minutes` | number | Durée sommeil |

Interface `HealthFormState` dans `lib/types.ts`.

---

## 🔔 Push Notifications

- **Cron** : `vercel.json` → `"0 20 * * *"` (20h UTC = 22h Paris) → `/api/push/cron`
- **Auth cron** : header `Authorization: Bearer ${CRON_SECRET}`
- **Notification click** → ouvre `/health?questionnaire=1`
- **VAPID public** : `BIhArReFYgCplJ-VGp99fVdvhWkLLX1MwCnKHkGMoi_a-ucicYy8QFG5FGDeDTzaMuL6X9tDovpz7ahPWMYG-9Y`

---

## 🤖 Claude AI (Analyse Santé)

- Route : `app/api/ai/analyse/route.ts`
- Modèle : `claude-opus-4-5`
- Retourne : `AIHealthAnalysis` (fatigue_score, vitality_score, narrative, recommendation, sleep_quality, readiness)
- **Fallback mock** si `ANTHROPIC_API_KEY` non configuré

---

## 🗄️ Supabase

- Flag `SUPABASE_ENABLED` dans `hooks/useHealthLogs.ts` — désactive si URL non configurée
- **Fallback localStorage** automatique si Supabase absent
- Table : `health_logs` (upsert sur `user_profile,date`)
- Table : `push_subscriptions` (upsert sur `user_profile`)

---

## 🔑 Variables d'environnement (.env.local)

```env
# Strava OAuth
NEXT_PUBLIC_STRAVA_CLIENT_ID=227850
STRAVA_CLIENT_SECRET=4d7d56b357495792d1797db45ae8b7018064434c

# Supabase (à configurer sur https://supabase.com/dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Anthropic (https://console.anthropic.com)
ANTHROPIC_API_KEY=YOUR_KEY

# VAPID Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BIhArReFYgCplJ-VGp99fVdvhWkLLX1MwCnKHkGMoi_a-ucicYy8QFG5FGDeDTzaMuL6X9tDovpz7ahPWMYG-9Y
VAPID_PRIVATE_KEY=AfXUFc7H4hJYLmjkmm5ep-u3JTVxriF7ior4lV7KC6o
VAPID_MAILTO=mailto:dylan.monnier64@gmail.com
```

---

## 📋 Règles de développement

1. **Ne jamais** mettre `"use client"` dans un layout ou une page serveur
2. **Toujours** lire un fichier avant de le modifier (`Read` avant `Write`)
3. **Build avant deploy** : `npm run build` puis `netlify deploy --prod`
4. **Pas de `#1A1A1A`** comme background de page — utiliser `#050505` ou laisser hériter
5. **Toujours** utiliser `hapticFeedback` et `touch-feedback` sur les éléments interactifs
6. **Cron secret** : protéger `/api/push/cron` avec `Authorization: Bearer ${CRON_SECRET}`
7. **lgStyle()** pour les boutons liquid glass — ne pas recoder le style manuellement

---

## 🗺️ Profil utilisateur

- **Email** : dylan.monnier64@gmail.com
- **Profil app** : `dydz` (stocké dans localStorage)
- **Langue** : tout en **français** (UI + commentaires)
