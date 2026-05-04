import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const state = searchParams.get("state") || "dydz"

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/profile?googlefit_error=access_denied`, request.url)
    )
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID
  const clientSecret = process.env.GOOGLE_FIT_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL(`/profile?googlefit_error=not_configured`, request.url)
    )
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${new URL(request.url).origin}/api/google-fit/callback`,
      }).toString(),
    })

    if (!tokenRes.ok) {
      console.error("[googlefit callback] token exchange failed:", tokenRes.status)
      return NextResponse.redirect(
        new URL(`/profile?googlefit_error=token_failed`, request.url)
      )
    }

    const data = await tokenRes.json()

    // Récupérer les infos du profil utilisateur
    let userName = "Google Fit User"
    try {
      const profileRes = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: { Authorization: `Bearer ${data.access_token}` },
        }
      )
      if (profileRes.ok) {
        const profile = await profileRes.json()
        userName = profile.name || profile.email || "Google Fit"
      }
    } catch {
      // Fallback silencieux si la requête profil échoue
    }

    const params = new URLSearchParams({
      googlefit_ok: "1",
      googlefit_profile: state,
      googlefit_access_token: data.access_token,
      googlefit_refresh_token: data.refresh_token || "",
      googlefit_expires_at: String(data.expires_in ? Date.now() + data.expires_in * 1000 : 0),
      googlefit_user_name: userName,
    })

    return NextResponse.redirect(new URL(`/profile?${params.toString()}`, request.url))
  } catch (err) {
    console.error("[googlefit callback] error:", err)
    return NextResponse.redirect(
      new URL(`/profile?googlefit_error=network`, request.url)
    )
  }
}
