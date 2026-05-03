import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import type { HealthLog, Run, AIHealthAnalysis } from "@/lib/types"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
})

function sportLabel(log: HealthLog): string {
  if (log.sport_type === "running") return `Course à pied (${log.active_minutes ?? "?"}min)`
  if (log.sport_type === "padel") return `Padel (${log.active_minutes ?? "?"}min)`
  // Fallback legacy
  if (log.exercise_done) return `Activité (${log.exercise_duration ?? log.active_minutes ?? "?"}min)`
  return "Repos"
}

function formatHealthLogs(logs: HealthLog[]): string {
  return logs.slice(0, 7).map((l) => {
    const sleep = l.sleep_hours != null
      ? `${l.sleep_hours}h${l.sleep_minutes ?? 0}min`
      : "non renseigné"
    return `- ${l.date}: ${l.steps ?? "?"} pas | FC ${l.heart_rate_avg ?? "?"}bpm | sommeil ${sleep} | sport: ${sportLabel(l)}`
  }).join("\n")
}

function formatRuns(runs: Run[]): string {
  return runs.slice(0, 7).map((r) => {
    const pace = `${Math.floor(r.pace / 60)}:${String(r.pace % 60).padStart(2, "0")}/km`
    return `- ${r.date.split("T")[0]}: ${r.distance}km | allure ${pace} | ressenti ${r.feeling}/10 | TSS ${r.tss ?? "?"}`
  }).join("\n")
}

function sportFatigueContext(log: HealthLog): string {
  if (log.sport_type === "running") {
    const dur = log.active_minutes ?? 0
    return `Sport pratiqué: COURSE À PIED (${dur}min)
Profil de fatigue spécifique:
- Fatigue cardiovasculaire élevée (VO2max, système aérobie sollicité)
- Fatigue musculaire membres inférieurs (quadriceps, mollets, ischio-jambiers)
- Impact articulaire (genoux, hanches, chevilles) selon le volume
- Fatigue cumulative sur plusieurs jours (CTL/ATL)
- FC de repos peut être élevée le lendemain après une longue sortie`
  }
  if (log.sport_type === "padel") {
    const dur = log.active_minutes ?? 0
    return `Sport pratiqué: PADEL (${dur}min)
Profil de fatigue spécifique:
- Fatigue explosive / anaérobie (sprints courts, changements de direction)
- Fatigue membres supérieurs (épaule de frappe, avant-bras, poignet)
- Fatigue neuromusculaire (réactivité, coordination)
- Stress articulaire latéral (genoux, chevilles lors des déplacements courts)
- Récupération différente du running: moins de fatigue cardiovasculaire systémique, mais fatigue musculaire explosive élevée`
  }
  return "Sport pratiqué: Repos (journée sans activité physique intense)"
}

export async function POST(req: NextRequest) {
  try {
    const { healthLogs, runs, profile } = await req.json() as {
      healthLogs: HealthLog[]
      runs: Run[]
      profile: string
    }

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "YOUR_ANTHROPIC_KEY") {
      const mock: AIHealthAnalysis = {
        fatigue_score: 3,
        vitality_score: 72,
        narrative: "Configure ta clé API Anthropic dans .env.local pour activer l'analyse IA personnalisée. En attendant, tes données sont bien enregistrées !",
        recommendation: "Continue à remplir ton journal quotidien pour des insights précis.",
        sleep_quality: "bonne",
        readiness: "normal",
        generated_at: new Date().toISOString(),
      }
      return NextResponse.json(mock)
    }

    const today = healthLogs[0]
    const userName = profile === "dydz" ? "Dylan" : "l'utilisateur"

    const prompt = `Tu es un coach santé expert en médecine sportive et récupération athlétique. Analyse les données de ${userName} et génère une analyse personnalisée en français.

Dylan pratique UNIQUEMENT deux sports: la course à pied et le padel. Ces deux sports ont des profils de fatigue très différents — tiens-en compte dans chaque analyse.

## Données de santé (7 derniers jours)
${formatHealthLogs(healthLogs)}

## Données d'entraînement running (7 derniers jours)
${runs.length ? formatRuns(runs) : "Aucune sortie enregistrée cette période."}

## Contexte sport du jour
${sportFatigueContext(today)}

## Instructions d'analyse
- Analyse la corrélation sommeil/performance et la FC de repos
- Pour la COURSE À PIED: évalue la fatigue cardiovasculaire + musculo-squelettique, l'impact sur la FC de repos J+1, le risque de surcharge cumulative
- Pour le PADEL: évalue la fatigue explosive (épaule, poignet, mouvements latéraux), la récupération neuromusculaire, distingue-la bien de la fatigue endurance
- Sur les jours de REPOS: analyse la qualité de récupération et si le corps récupère bien des séances précédentes
- Calibre le score de fatigue selon le type de sport: une séance padel intense = fatigue musculaire haute + fatigue cardiaque modérée; une longue sortie running = fatigue cardiovasculaire + fatigue musculaire membres inférieurs
- Sois direct, bienveillant et précis (coach premium, pas médecin)
- Réponds UNIQUEMENT avec du JSON valide, aucun texte avant ou après

## Format JSON attendu (obligatoire)
{
  "fatigue_score": <0-10, 0=frais, 10=épuisé>,
  "vitality_score": <0-100, score global de forme>,
  "narrative": "<3-4 phrases d'analyse personnalisée en français, mentionne le sport pratiqué et son impact spécifique>",
  "recommendation": "<1 conseil concret pour demain en français, adapté au sport du jour et à la récupération nécessaire>",
  "sleep_quality": "<excellent|bonne|moyenne|insuffisante>",
  "readiness": "<optimal|normal|fatigué|repos recommandé>"
}`

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    })

    const rawText = message.content[0].type === "text" ? message.content[0].text : "{}"
    const jsonText = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const parsed = JSON.parse(jsonText)

    const analysis: AIHealthAnalysis = {
      fatigue_score: Math.min(10, Math.max(0, Number(parsed.fatigue_score) || 5)),
      vitality_score: Math.min(100, Math.max(0, Number(parsed.vitality_score) || 50)),
      narrative: String(parsed.narrative ?? ""),
      recommendation: String(parsed.recommendation ?? ""),
      sleep_quality: parsed.sleep_quality ?? "moyenne",
      readiness: parsed.readiness ?? "normal",
      generated_at: new Date().toISOString(),
    }

    return NextResponse.json(analysis)
  } catch (err) {
    console.error("[AI Analyse]", err)
    return NextResponse.json({ error: "Analyse IA indisponible" }, { status: 500 })
  }
}
