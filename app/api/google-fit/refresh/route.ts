/**
 * /api/google-fit/refresh
 * POST: Renouvelle le refresh token Google Fit
 */

import { NextRequest, NextResponse } from "next/server"
import { refreshGoogleFitToken } from "@/lib/google-fit"

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Missing refreshToken" },
        { status: 400 }
      )
    }

    const result = await refreshGoogleFitToken(refreshToken)

    if (!result) {
      return NextResponse.json(
        { error: "Failed to refresh token" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      accessToken: result.accessToken,
      expiresAt: result.expiresAt,
    })
  } catch (err) {
    console.error("[google-fit/refresh] error:", err)
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}
