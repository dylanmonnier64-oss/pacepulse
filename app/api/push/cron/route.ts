import { NextRequest, NextResponse } from "next/server"
import webpush from "web-push"
import { createServiceClient } from "@/lib/supabase"

webpush.setVapidDetails(
  process.env.VAPID_MAILTO ?? "mailto:hello@pacepulse.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? ""
)

export async function GET(req: NextRequest) {
  // Protect the cron endpoint
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET ?? "pacepulse-cron"
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")

    if (error) {
      console.error("[Cron] fetch subscriptions:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const payload = JSON.stringify({
      title: "PacePulse — Journal Santé 🏃",
      body: "22h — Remplis ton bilan du jour ! Sommeil, FC, activité…",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: "/health?questionnaire=1" },
    })

    let sent = 0
    let failed = 0

    await Promise.allSettled(
      (subscriptions ?? []).map(async (row) => {
        try {
          await webpush.sendNotification(
            row.subscription as webpush.PushSubscription,
            payload
          )
          sent++
        } catch (err) {
          console.error("[Cron] send failed for", row.user_profile, err)
          failed++
          // Remove expired subscriptions
          if ((err as { statusCode?: number }).statusCode === 410) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", row.id)
          }
        }
      })
    )

    return NextResponse.json({ ok: true, sent, failed })
  } catch (err) {
    console.error("[Cron] unexpected:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
