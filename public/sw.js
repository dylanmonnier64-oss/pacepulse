const CACHE_NAME = "pacepulse-v1"
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/runs",
  "/stats",
  "/goals",
  "/profile",
  "/manifest.json",
]

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url)

  // Network-first for API and dynamic routes
  if (url.pathname.startsWith("/api/") || e.request.method !== "GET") {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match(e.request).then((r) => r || new Response("Offline", { status: 503 }))
      )
    )
    return
  }

  // Cache-first for static assets
  if (
    url.pathname.match(/\.(js|css|woff2|woff|ttf|png|jpg|svg|ico)$/)
  ) {
    e.respondWith(
      caches.match(e.request).then(
        (cached) => cached || fetch(e.request).then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone))
          return res
        })
      )
    )
    return
  }

  // Stale-while-revalidate for pages
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request).then((res) => {
        caches.open(CACHE_NAME).then((c) => c.put(e.request, res.clone()))
        return res
      })
      return cached || network
    })
  )
})

self.addEventListener("push", (e) => {
  if (!e.data) return
  const data = e.data.json()
  e.waitUntil(
    self.registration.showNotification(data.title || "PacePulse", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      vibrate: [100, 50, 100],
      data: { url: "/health?questionnaire=1" },
    })
  )
})

self.addEventListener("notificationclick", (e) => {
  e.notification.close()
  const target = (e.notification.data && e.notification.data.url) || "/health"
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus()
          return client.navigate(target)
        }
      }
      return clients.openWindow(target)
    })
  )
})
