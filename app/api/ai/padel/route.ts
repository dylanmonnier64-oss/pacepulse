import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import type { PadelSession, PadelAIAdvice } from "@/lib/types"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" })

export async function POST(req: NextRequest) {
  try {
    const { sessions, profile } = await req.json() as { sessions: PadelSession[]; profile: string }

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "YOUR_ANTHROPIC_KEY") {
      const mock: PadelAIAdvice = {
        form_score: 68,
        trend: "stable",
        narrative: "Configure ta clé ANTHROPIC_API_KEY pour activer l'analyse padel IA personnalisée.",
        tip: "Continue à noter tes sessions pour obtenir des conseils précis.",
        generated_at: new Date().toISOString(),
      }
      return NextResponse.json(mock)
    }

    const userName = profile === "dydz" ? "Dylan" : "le joueur"
    const recent = sessions.slice(0, 10)

    const sessionsSummary = recent.map((s) => {
      const date = new Date(s.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })
      return `- ${date}: ${s.result === "victoire" ? "✅ Victoire" : "❌ Défaite"} | Note jeu: ${s.rating}/10 | Durée: ${s.duration}min${s.comment ? ` | Commentaire: "${s.comment}"` : ""}`
    }).join("\n")

    const wins = recent.filter((s) => s.result === "victoire").length
    const avgRating = +(recent.reduce((s, p) => s + p.rating, 0) / recent.length).toFixed(1)
    const trend = recent.length >= 3
      ? recent.slice(0, 3).reduce((s, p) => s + p.rating, 0) / 3 > recent.slice(-3).reduce((s, p) => s + p.rating, 0) / 3
        ? "en hausse" : "stable"
      : "stable"

    const prompt = `Tu es un coach padel expert. Analyse les performances récentes de ${userName} et donne un conseil personnalisé en français.

## Dernières sessions (${recent.length})
${sessionsSummary}

## Stats calculées
- Victoires: ${wins}/${recent.length} (${Math.round((wins / recent.length) * 100)}%)
- Note de jeu moyenne: ${avgRating}/10
- Tendance récente: ${trend}

## Instructions
- Analyse le niveau de forme padel basé sur les victoires/défaites et les notes de jeu
- Prends en compte les commentaires du joueur pour identifier les points faibles
- Sois direct, motivant, précis (coach premium padel)
- Réponds UNIQUEMENT avec du JSON valide, aucun texte avant ou après

## Format JSON requis
{
  "form_score": <0-100, score de forme padel actuel>,
  "trend": "<en hausse|stable|en baisse>",
  "narrative": "<2-3 phrases d'analyse de la forme padel actuelle, basée sur les résultats et les notes>",
  "tip": "<1 conseil technique ou tactique concret et actionnable pour la prochaine session>"
}`

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    })

    const rawText = message.content[0].type === "text" ? message.content[0].text : "{}"
    const json = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const parsed = JSON.parse(json)

    const advice: PadelAIAdvice = {
      form_score: Math.min(100, Math.max(0, Number(parsed.form_score) || 60)),
      trend: parsed.trend ?? "stable",
      narrative: String(parsed.narrative ?? ""),
      tip: String(parsed.tip ?? ""),
      generated_at: new Date().toISOString(),
    }

    return NextResponse.json(advice)
  } catch (err) {
    console.error("[AI Padel]", err)
    return NextResponse.json({ error: "Analyse indisponible" }, { status: 500 })
  }
}
