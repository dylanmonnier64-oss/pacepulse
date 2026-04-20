import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const profile = searchParams.get("state") || "dydz"

  if (error || !code) {
    return NextResponse.redirect(new URL(`/profile?strava_error=access_denied`, request.url))
  }

  const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL(`/profile?strava_error=not_configured`, request.url))
  }

  try {
    const res = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    })

    if (!res.ok) {
      return NextResponse.redirect(new URL(`/profile?strava_error=token_failed`, request.url))
    }

    const data = await res.json()

    const params = new URLSearchParams({
      strava_ok: "1",
      strava_profile: profile,
      strava_access_token: data.access_token,
      strava_refresh_token: data.refresh_token,
      strava_expires_at: String(data.expires_at),
      strava_athlete_id: String(data.athlete?.id || ""),
      strava_athlete_name: data.athlete?.firstname || "",
    })

    return NextResponse.redirect(new URL(`/profile?${params.toString()}`, request.url))
  } catch {
    return NextResponse.redirect(new URL(`/profile?strava_error=network`, request.url))
  }
}
