import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json() as { refreshToken: string }

    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID
    const clientSecret = process.env.STRAVA_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "not_configured" }, { status: 500 })
    }

    const res = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error("[Strava Refresh] échec:", res.status, body)
      return NextResponse.json({ error: "refresh_failed" }, { status: 400 })
    }

    const data = await res.json()
    return NextResponse.json({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
    })
  } catch (e) {
    console.error("[Strava Refresh]", e)
    return NextResponse.json({ error: "network_error" }, { status: 500 })
  }
}
