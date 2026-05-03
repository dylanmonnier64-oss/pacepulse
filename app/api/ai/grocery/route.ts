import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" })

export async function POST(req: NextRequest) {
  try {
    const { profile, checkins, bobos } = await req.json()

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "YOUR_ANTHROPIC_KEY") {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY non configuré" }, { status: 503 })
    }

    const avgHumeur = checkins.length
      ? Math.round(checkins.reduce((s: number, c: { humeur: number }) => s + c.humeur, 0) / checkins.length)
      : 7
    const avgForme = checkins.length
      ? Math.round(checkins.reduce((s: number, c: { forme: number }) => s + c.forme, 0) / checkins.length)
      : 7
    const recentBobos = bobos.slice(0, 3).map((b: { zoneLabel: string; intensity: number }) => `${b.zoneLabel} (${b.intensity}/10)`).join(", ")

    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `Tu es un nutritionniste sportif expert. Génère une liste de courses optimisée pour un coureur/sportif.

Profil: ${profile === "dydz" ? "Dylan (homme, coureur)" : "Manon (femme, coureuse)"}
Humeur moyenne (7j): ${avgHumeur}/10
Forme physique moyenne (7j): ${avgForme}/10
${recentBobos ? `Douleurs récentes: ${recentBobos}` : "Pas de douleurs signalées"}

RÈGLE ABSOLUE ET IMPÉRATIVE : AUCUN LÉGUME n'est autorisé dans la liste, à l'exception UNIQUE des haricots verts. Si tu veux inclure des légumes, remplace par des fruits ou des compléments. Cette règle est non négociable.

Retourne UNIQUEMENT un JSON valide sans markdown :
{
  "items": [
    { "name": "Blanc de poulet", "category": "Protéines", "quantity": "800g" },
    { "name": "Haricots verts surgelés", "category": "Légumes", "quantity": "500g" }
  ]
}

Catégories autorisées : "Protéines", "Glucides complexes", "Produits laitiers", "Graisses saines", "Légumes", "Fruits", "Compléments", "Divers"
Génère 18-24 articles. Adapte les quantités à une semaine pour 2 personnes.
Priorité : protéines élevées, glucides complexes, graisses saines, récupération musculaire.`,
      }],
    })

    const rawText = response.content[0].type === "text" ? response.content[0].text : "{}"
    const clean = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const data = JSON.parse(clean)

    // Enforce the no-vegetables rule server-side
    const bannedKeywords = ["carotte", "oignon", "tomate", "poivron", "courgette", "brocoli", "épinard", "salade", "laitue", "chou", "poireau", "radis", "navet", "betterave", "céleri", "asperge", "artichaut", "aubergine", "concombre", "fenouil", "persil", "coriandre", "basilic", "menthe"]
    const filtered = data.items.filter((item: { name: string; category: string }) => {
      const nameLower = item.name.toLowerCase()
      if (item.category === "Légumes") {
        const isGreenBeans = nameLower.includes("haricot") && (nameLower.includes("vert") || nameLower.includes("verts"))
        return isGreenBeans
      }
      return !bannedKeywords.some(kw => nameLower.includes(kw))
    })

    return NextResponse.json({ items: filtered })
  } catch (err) {
    console.error("[AI Grocery]", err)
    return NextResponse.json({ error: "Génération impossible. Réessaie." }, { status: 500 })
  }
}
