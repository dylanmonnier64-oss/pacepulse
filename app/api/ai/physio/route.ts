import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" })

export interface PhysioMessage {
  role: "user" | "assistant"
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json() as {
      messages: PhysioMessage[]
      context?: string
    }

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "YOUR_ANTHROPIC_KEY") {
      return NextResponse.json({ reply: "Configure ta clé ANTHROPIC_API_KEY pour activer l'IA Physio." })
    }

    const system = `Tu es un physiothérapeute du sport expert, spécialisé dans les blessures de course à pied. Tu parles exclusivement en français.

Ton rôle :
- Écouter les douleurs et symptômes décrits par le sportif
- Identifier les causes probables (surcharge, mauvaise posture, matériel, etc.)
- Proposer des exercices de kinésithérapie précis et détaillés (avec sets, reps, durée)
- Recommander le repos ou la reprise progressive selon la gravité
- Alerter si les symptômes nécessitent une consultation médicale urgente
- Toujours rassurer et motiver le sportif

Règles importantes :
- Ne jamais diagnostiquer formellement (tu n'es pas médecin)
- Toujours recommander un médecin si douleur aiguë, gonflement important, ou douleur > 7/10
- Tes exercices doivent être réalisables à la maison, sans matériel
- Sois précis : "3 séries de 12 répétitions, 30 secondes de repos"
- Réponds en 2-4 paragraphes maximum, avec une section exercices si pertinent${context ? `\n\nContexte sportif : ${context}` : ""}`

    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 800,
      system,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })

    const reply = response.content[0].type === "text" ? response.content[0].text : "Je n'ai pas pu générer une réponse."
    return NextResponse.json({ reply })
  } catch (err) {
    console.error("[AI Physio]", err)
    return NextResponse.json({ reply: "Erreur du service IA. Réessaie dans un moment." }, { status: 500 })
  }
}
