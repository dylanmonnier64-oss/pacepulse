import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import type { HealthLog } from "@/lib/types"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" })

export interface MonthlyReport {
  global_score: number
  fatigue_trend: "amélioration" | "stable" | "dégradation"
  narrative: string
  highlight: string
  alert: string
  recommendations: [string, string, string]
  sleep_verdict: string
  activity_verdict: string
  generated_at: string
}

export async function POST(req: NextRequest) {
  try {
    const { healthLogs, profile } = await req.json() as { healthLogs: HealthLog[]; profile: string }

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "YOUR_ANTHROPIC_KEY") {
      const mock: MonthlyReport = {
        global_score: 68,
        fatigue_trend: "stable",
        narrative: "Configure ta clé ANTHROPIC_API_KEY pour activer l'analyse mensuelle personnalisée. Tes 30 jours de données sont bien chargés !",
        highlight: "Données Apple Health importées avec succès.",
        alert: "Clé API Anthropic manquante dans .env.local.",
        recommendations: ["Configure ANTHROPIC_API_KEY", "Connecte Strava pour tes runs", "Remplis le journal chaque soir"],
        sleep_verdict: "Données disponibles sur 6 nuits",
        activity_verdict: "20 jours actifs sur 30",
        generated_at: new Date().toISOString(),
      }
      return NextResponse.json(mock)
    }

    const userName = profile === "dydz" ? "Dylan" : "l'athlète"
    const logs = healthLogs.slice(0, 30)

    const summary = logs.map(l => {
      const sleep = l.sleep_hours != null ? `${l.sleep_hours}h${l.sleep_minutes ?? 0}` : "—"
      const fc = l.heart_rate_avg ? `${l.heart_rate_avg}bpm` : "—"
      return `${l.date}: ${l.steps?.toLocaleString() ?? "?"}pas | cal:${l.calories ?? "?"} | FC:${fc} | sommeil:${sleep}`
    }).join("\n")

    const avgSteps = Math.round(logs.filter(l => l.steps).reduce((s, l) => s + (l.steps ?? 0), 0) / logs.filter(l => l.steps).length)
    const activeDays = logs.filter(l => (l.steps ?? 0) >= 5000).length
    const withHR = logs.filter(l => l.heart_rate_avg)
    const avgHR = withHR.length ? Math.round(withHR.reduce((s, l) => s + (l.heart_rate_avg ?? 0), 0) / withHR.length) : null
    const withSleep = logs.filter(l => l.sleep_hours != null)
    const avgSleep = withSleep.length ? +(withSleep.reduce((s, l) => s + (l.sleep_hours ?? 0) + (l.sleep_minutes ?? 0) / 60, 0) / withSleep.length).toFixed(1) : null

    const prompt = `Tu es un coach santé expert en médecine sportive. Analyse le mois d'activité de ${userName} et génère un rapport mensuel en français.

## Données brutes (${logs.length} jours)
${summary}

## Stats clés calculées
- Moyenne quotidienne: ${avgSteps.toLocaleString()} pas/jour
- Jours actifs (>5000 pas): ${activeDays}/${logs.length}
- FC repos moyenne: ${avgHR ? `${avgHR} bpm` : "insuffisamment de données"}
- Sommeil moyen: ${avgSleep ? `${Math.floor(avgSleep)}h${Math.round((avgSleep % 1) * 60)}` : "peu de nuits enregistrées"}

## Instructions
- Identifie les tendances et patterns sur le mois complet
- Note que les calories récentes (~1000+ kcal) reflètent des journées très actives
- Sois direct, précis, bienveillant (coach premium)
- Réponds UNIQUEMENT avec du JSON valide

## Format JSON requis
{
  "global_score": <0-100, score de forme global du mois>,
  "fatigue_trend": "<amélioration|stable|dégradation>",
  "narrative": "<3-4 phrases de bilan mensuel personnalisé, mentionne les chiffres clés>",
  "highlight": "<meilleure performance ou fait remarquable du mois, 1 phrase>",
  "alert": "<point d'attention principal, 1 phrase actionnable>",
  "recommendations": ["<conseil 1>", "<conseil 2>", "<conseil 3>"],
  "sleep_verdict": "<verdict sommeil du mois, 1 phrase courte>",
  "activity_verdict": "<verdict activité du mois, 1 phrase courte>"
}`

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    })

    const rawText = message.content[0].type === "text" ? message.content[0].text : "{}"
    const json = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const parsed = JSON.parse(json)

    const report: MonthlyReport = {
      global_score: Math.min(100, Math.max(0, Number(parsed.global_score) || 60)),
      fatigue_trend: parsed.fatigue_trend ?? "stable",
      narrative: String(parsed.narrative ?? ""),
      highlight: String(parsed.highlight ?? ""),
      alert: String(parsed.alert ?? ""),
      recommendations: [
        String(parsed.recommendations?.[0] ?? ""),
        String(parsed.recommendations?.[1] ?? ""),
        String(parsed.recommendations?.[2] ?? ""),
      ],
      sleep_verdict: String(parsed.sleep_verdict ?? ""),
      activity_verdict: String(parsed.activity_verdict ?? ""),
      generated_at: new Date().toISOString(),
    }

    return NextResponse.json(report)
  } catch (err) {
    console.error("[Rapport IA]", err)
    return NextResponse.json({ error: "Rapport indisponible" }, { status: 500 })
  }
}
