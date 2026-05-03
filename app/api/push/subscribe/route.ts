import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const { subscription, user_profile } = await req.json()
    if (!subscription || !user_profile) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        { user_profile, subscription, updated_at: new Date().toISOString() },
        { onConflict: "user_profile" }
      )

    if (error) {
      console.error("[Push Subscribe]", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[Push Subscribe] unexpected:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
