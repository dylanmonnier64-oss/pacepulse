/**
 * /api/health/remind — Cron 21h (19h UTC)
 * Envoie une notification push avec un résumé des données de la montre du jour.
 * Les données sont pré-chargées dans le questionnaire quand l'utilisateur l'ouvre.
 */

import { NextRequest, NextResponse } from "next/server"
import webpush from "web-push"
import { createServiceClient } from "@/lib/supabase"

webpush.setVapidDetails(
  process.env.VAPID_MAILTO ?? "mailto:hello@pacepulse.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? ""
)

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET ?? "pacepulse-cron"
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Lire les données de santé actuelles
    const baseUrl = req.nextUrl.origin
    let stepsInfo = ""
    try {
      const healthRes = await fetch(`${baseUrl}/api/health`)
      if (healthRes.ok) {
        const healthData = await healthRes.json()
        const merged = healthData?.merged
        if (merged?.steps) {
          stepsInfo = ` · ${merged.steps.toLocaleString("fr-FR")} pas`
        }
      }
    } catch { /* ignore */ }

    const supabase = createServiceClient()
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")

    const payload = JSON.stringify({
      title: `PacePulse — Bilan du soir ⌚${stepsInfo}`,
      body: "Tes données de la montre sont prêtes. Complète ton journal en 30 sec !",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: "/health?questionnaire=1" },
    })

    let sent = 0
    await Promise.allSettled(
      (subscriptions ?? []).map(async (row) => {
        try {
          await webpush.sendNotification(
            row.subscription as webpush.PushSubscription,
            payload
          )
          sent++
        } catch (err) {
          if ((err as { statusCode?: number }).statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", row.id)
          }
        }
      })
    )

    return NextResponse.json({ ok: true, sent })
  } catch (err) {
    console.error("[health/remind]", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
