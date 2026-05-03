"use client"
import { useState, useEffect, useCallback } from "react"
import { getActiveProfile } from "@/lib/storage"

export type PushStatus = "unsupported" | "denied" | "granted" | "default" | "loading"

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>("loading")
  const profile = getActiveProfile()

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported")
      return
    }
    setStatus(Notification.permission as PushStatus)
  }, [])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!("serviceWorker" in navigator)) return false

    try {
      const reg = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) return false

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), user_profile: profile }),
      })

      if (res.ok) {
        setStatus("granted")
        return true
      }
      return false
    } catch (err) {
      console.error("[Push] subscribe error:", err)
      return false
    }
  }, [profile])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) return false
    const permission = await Notification.requestPermission()
    setStatus(permission as PushStatus)
    if (permission === "granted") return subscribe()
    return false
  }, [subscribe])

  return { status, requestPermission }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i)
  }
  return view
}
