/**
 * /api/google-fit/activities
 *
 * GET: Fetch santé + activités depuis Google Fit et retourne les données
 *      Params: access_token (query ou header), startDate, endDate
 *
 * Retourne: HealthMetrics fusionnées avec les données Google Fit
 */

import { NextRequest, NextResponse } from "next/server"
import { fetchGoogleFitAggregated, fetchGoogleFitActivities, refreshGoogleFitToken } from "@/lib/google-fit"
import type { HealthMetrics } from "@/lib/healthTypes"

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Récupérer le token depuis query ou Authorization header
    let accessToken = request.nextUrl.searchParams.get("access_token")
    if (!accessToken) {
      const authHeader = request.headers.get("authorization")
      if (authHeader?.startsWith("Bearer ")) {
        accessToken = authHeader.slice(7)
      }
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing access_token parameter or Authorization header" },
        { status: 400 }
      )
    }

    // Dates
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 derniers jours

    const startTimeMs = startDate.getTime()
    const endTimeMs = endDate.getTime()

    console.log(`[google-fit] fetching data from ${startDate.toISOString()} to ${endDate.toISOString()}`)

    // Fetch données santé agrégées
    const healthData = await fetchGoogleFitAggregated(accessToken, startTimeMs, endTimeMs)

    // Fetch activités
    const workouts = await fetchGoogleFitActivities(accessToken, startTimeMs, endTimeMs)

    const result: HealthMetrics = {
      ...healthData,
      workouts: workouts.length > 0 ? workouts : undefined,
    }

    return NextResponse.json({
      success: true,
      data: result,
      fetchedAt: new Date().toISOString(),
      range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    })
  } catch (err) {
    console.error("[google-fit/activities] error:", err)
    return NextResponse.json(
      {
        error: "Failed to fetch Google Fit data",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * POST: Enregistrer / synchroniser les données Google Fit avec Supabase
 *       Body: { access_token, refresh_token?, device_name? }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { access_token, refresh_token, device_name = "Google Fit" } = body

    if (!access_token) {
      return NextResponse.json({ error: "Missing access_token" }, { status: 400 })
    }

    // Fetch les données
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)

    const healthData = await fetchGoogleFitAggregated(
      access_token,
      startDate.getTime(),
      endDate.getTime()
    )
    const workouts = await fetchGoogleFitActivities(access_token, startDate.getTime(), endDate.getTime())

    const metrics = {
      ...healthData,
      workouts: workouts.length > 0 ? workouts : undefined,
    }

    // Si Supabase est configuré, stocker les données
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes("placeholder")) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/health_devices`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify({
            device_id: "google-fit",
            device_name,
            last_sync: new Date().toISOString(),
            data: metrics,
          }),
        })
        console.log("[google-fit] data synced to Supabase")
      } catch (err) {
        console.error("[google-fit] Supabase sync error:", err)
      }
    }

    return NextResponse.json({
      success: true,
      data: metrics,
      synced_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error("[google-fit/activities POST] error:", err)
    return NextResponse.json(
      { error: "Failed to sync Google Fit data" },
      { status: 500 }
    )
  }
}
