import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" })

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json() as {
      imageBase64: string
      mediaType: string
    }

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "YOUR_ANTHROPIC_KEY") {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY non configuré" }, { status: 503 })
    }

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    const safeType = validTypes.includes(mediaType) ? mediaType : "image/jpeg"

    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 600,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: safeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: `Tu es un nutritionniste expert spécialisé en nutrition sportive. Analyse ce repas et retourne UNIQUEMENT un JSON valide sans markdown :
{
  "foods": ["aliment 1", "aliment 2"],
  "calories": 450,
  "protein": 28,
  "carbs": 52,
  "fat": 14,
  "fiber": 6,
  "healthScore": 72,
  "advice": "conseil court personnalisé en français pour un sportif"
}
Règles : valeurs en grammes sauf calories (kcal) et healthScore (0-100 selon qualité nutritionnelle). Sois précis mais réaliste sur les estimations.`,
          },
        ],
      }],
    })

    const rawText = response.content[0].type === "text" ? response.content[0].text : "{}"
    const clean = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const data = JSON.parse(clean)
    return NextResponse.json(data)
  } catch (err) {
    console.error("[AI Nutrition]", err)
    return NextResponse.json({ error: "Analyse impossible. Réessaie avec une photo plus nette." }, { status: 500 })
  }
}
