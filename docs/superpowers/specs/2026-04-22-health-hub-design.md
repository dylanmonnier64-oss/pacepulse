# PacePulse — Health Hub IA + Questionnaire Quotidien
**Date:** 2026-04-22 | **Statut:** Approuvé ✅

## Stack ajouté
- `@supabase/supabase-js` — stockage health_logs + push_subscriptions
- `web-push` — envoi Web Push notifications (VAPID)
- `@anthropic-ai/sdk` — analyse IA Claude

## Supabase Schema
```sql
health_logs (user_profile, date UNIQUE, steps, heart_rate_avg, exercise_done, exercise_duration, sleep_hours, sleep_minutes, ai_analysis JSONB)
push_subscriptions (user_profile UNIQUE, subscription JSONB)
```

## Routes API
- POST /api/push/subscribe — enregistre subscription Web Push
- GET  /api/push/cron     — envoie push à tous les users (cron 22h)
- POST /api/ai/analyse    — appel Claude API, retourne analyse santé

## Cron
vercel.json : cron GET /api/push/cron à "0 20 * * *" (UTC = 22h Paris)

## Onglet Santé (5e tab)
1. Indice de Vitalité (ring SVG, score 0-100)
2. Analyse IA Claude (carte narrative française)
3. Métriques du jour (Steps, FC, Sommeil, Activité)
4. Tendances 7 jours (Recharts)
5. Bouton "Remplir le journal" → DailyQuestionnaire bottom sheet

## Questionnaire (bottom sheet)
Steps → FC → Activité (toggle + durée conditionnelle) → Sommeil → Submit → Supabase → Claude

## Env vars requises
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY,
VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_MAILTO
