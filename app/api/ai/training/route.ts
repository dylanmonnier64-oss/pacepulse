import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import type { Run } from "@/lib/types"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" })

export async function POST(req: NextRequest) {
  try {
    const { runs, profile, goal, goalDate, level } = await req.json() as {
      runs: Run[]
      profile: string
      goal: string
      goalDate?: string
      level?: string
    }

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "YOUR_ANTHROPIC_KEY") {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY non configuré" }, { status: 503 })
    }

    const recent = runs.slice(0, 20)
    const avgPace = recent.length
      ? Math.round(recent.reduce((s, r) => s + r.pace, 0) / recent.length)
      : 360
    const avgKmWeek = recent.length
      ? Math.round(recent.reduce((s, r) => s + r.distance, 0) / Math.max(1, recent.length / 4))
      : 20
    const userName = profile === "dydz" ? "Dylan" : "Mans"
    const paceStr = `${Math.floor(avgPace / 60)}:${String(avgPace % 60).padStart(2, "0")}`

    const prompt = `Tu es un coach running expert. Génère un plan d'entraînement personnalisé pour ${userName}.

## Profil
- Niveau : ${level || "intermédiaire"}
- Allure moyenne récente : ${paceStr}/km
- Volume moyen/semaine : ${avgKmWeek} km
- Objectif : ${goal}${goalDate ? ` pour le ${goalDate}` : ""}
- Derniers runs : ${recent.slice(0, 5).map(r => `${r.distance}km (${r.type})`).join(", ")}

## Instructions
- Génère exactement 4 semaines de plan (semaine 1 à 4)
- Chaque semaine a 4-5 séances réparties sur les jours
- Types de séances : Endurance, Tempo, Interval, Long run, Récup
- Adapte la charge progressivement (+10% max par semaine)
- Sois précis sur les allures et distances
- Réponds UNIQUEMENT en JSON valide

## Format JSON requis
{
  "title": "<nom du plan>",
  "goal": "<objectif reformulé>",
  "weekly_km": <volume moyen cible>,
  "weeks": [
    {
      "week": 1,
      "theme": "<thème de la semaine>",
      "total_km": <km total>,
      "sessions": [
        {
          "day": "<Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche>",
          "type": "<Endurance|Tempo|Interval|Long run|Récupération|Repos>",
          "distance": <km ou 0 si repos>,
          "duration": <minutes>,
          "pace": "<allure cible ex: 5:30/km ou null si repos>",
          "description": "<description courte de la séance>"
        }
      ]
    }
  ],
  "tips": ["<conseil 1>", "<conseil 2>", "<conseil 3>"]
}`

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    })

    const rawText = message.content[0].type === "text" ? message.content[0].text : "{}"
    const json = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const plan = JSON.parse(json)

    return NextResponse.json({ ...plan, generated_at: new Date().toISOString() })
  } catch (err) {
    console.error("[AI Training]", err)
    return NextResponse.json({ error: "Génération du plan indisponible" }, { status: 500 })
  }
}
