/**
 * MapView — Leaflet + OpenStreetMap (100% gratuit, aucune clé API)
 * Tiles: CartoDB Dark Matter — fond noir, style premium
 * Deps: leaflet (npm)
 */
"use client"
import { useEffect, useRef } from "react"
import type { BordeauxRoute, RunHistoryEntry } from "@/lib/route-engine"

interface MapViewProps {
  selectedRoute: BordeauxRoute | null
  runHistory: RunHistoryEntry[]
  showHeatmap: boolean
}

// Bordeaux center [lat, lng] — Leaflet uses lat/lng (opposite of Mapbox)
const CENTER: [number, number] = [44.837, -0.579]

// Interpolate hex color between two colors at ratio t (0→1)
function lerpColor(from: string, to: string, t: number): string {
  const hex = (s: string) => [
    parseInt(s.slice(1, 3), 16),
    parseInt(s.slice(3, 5), 16),
    parseInt(s.slice(5, 7), 16),
  ]
  const [r1, g1, b1] = hex(from)
  const [r2, g2, b2] = hex(to)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${b})`
}

// Gradient: yellow → orange → fuchsia
function routeColor(t: number): string {
  if (t < 0.5) return lerpColor("#F4D03F", "#E67E22", t * 2)
  return lerpColor("#E67E22", "#9B59B6", (t - 0.5) * 2)
}

export default function MapView({ selectedRoute, runHistory, showHeatmap }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import("leaflet").Map | null>(null)
  const routeLayersRef = useRef<import("leaflet").Layer[]>([])
  const heatLayersRef = useRef<import("leaflet").Layer[]>([])
  const gpsMarkerRef = useRef<import("leaflet").CircleMarker | null>(null)

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import("leaflet").then(L => {
      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const map = L.map(containerRef.current!, {
        center: CENTER,
        zoom: 13,
        zoomControl: false,
        attributionControl: true,
      })

      mapRef.current = map

      // CartoDB Dark Matter — free, no key, premium dark look
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map)

      // Custom zoom control (bottom right)
      L.control.zoom({ position: "bottomright" }).addTo(map)

      // GPS position
      navigator.geolocation?.getCurrentPosition(
        ({ coords }) => {
          const latlng: [number, number] = [coords.latitude, coords.longitude]
          map.flyTo(latlng, 14, { duration: 1.2 })

          if (gpsMarkerRef.current) gpsMarkerRef.current.remove()
          gpsMarkerRef.current = L.circleMarker(latlng, {
            radius: 8,
            color: "#fff",
            weight: 3,
            fillColor: "#F4D03F",
            fillOpacity: 1,
          })
            .addTo(map)
            .bindPopup("Tu es ici")
        },
        undefined,
        { timeout: 8000 }
      )
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Draw selected route with neon gradient
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedRoute) return

    import("leaflet").then(L => {
      // Clear previous route layers
      routeLayersRef.current.forEach(l => map.removeLayer(l))
      routeLayersRef.current = []

      fetch(selectedRoute.geojson_path)
        .then(r => r.json())
        .then(geojson => {
          const coords: [number, number][] =
            geojson.features?.[0]?.geometry?.coordinates ?? []

          if (!coords.length) return

          const total = coords.length - 1

          // Glow layer (wider, low opacity)
          const glow = L.polyline(
            coords.map(([lng, lat]) => [lat, lng] as [number, number]),
            { color: "#F4D03F", weight: 12, opacity: 0.18, lineCap: "round" }
          ).addTo(map)
          routeLayersRef.current.push(glow)

          // Gradient: draw segment-by-segment
          for (let i = 0; i < total; i++) {
            const t = i / Math.max(total - 1, 1)
            const [lng1, lat1] = coords[i]
            const [lng2, lat2] = coords[i + 1]
            const seg = L.polyline([[lat1, lng1], [lat2, lng2]], {
              color: routeColor(t),
              weight: 4,
              opacity: 0.95,
              lineCap: "round",
            }).addTo(map)
            routeLayersRef.current.push(seg)
          }

          // Start marker
          const [sLng, sLat] = coords[0]
          const startMarker = L.circleMarker([sLat, sLng], {
            radius: 7,
            color: "#fff",
            weight: 2,
            fillColor: "#F4D03F",
            fillOpacity: 1,
          }).addTo(map).bindPopup(`🏁 Départ — ${selectedRoute.name}`)
          routeLayersRef.current.push(startMarker)

          // Fit bounds
          const latlngs = coords.map(([lng, lat]) => [lat, lng] as [number, number])
          map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], animate: true, duration: 0.8 })
        })
        .catch(() => {})
    })
  }, [selectedRoute])

  // Heatmap from run history (circle markers)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    import("leaflet").then(async L => {
      // Remove previous heat layers
      heatLayersRef.current.forEach(l => map.removeLayer(l))
      heatLayersRef.current = []

      if (!showHeatmap || !runHistory.length) return

      // Count passages per route
      const counts: Record<string, number> = {}
      runHistory.forEach(h => { counts[h.route_id] = (counts[h.route_id] ?? 0) + 1 })

      // Fetch GeoJSON for each run history entry and draw heat circles
      const seen = new Set<string>()
      for (const entry of runHistory) {
        if (seen.has(entry.route_id)) continue
        seen.add(entry.route_id)

        const routePath = `/data/geojson/${entry.route_id}.json`
        try {
          const res = await fetch(routePath)
          if (!res.ok) continue
          const geojson = await res.json()
          const coords: [number, number][] = geojson.features?.[0]?.geometry?.coordinates ?? []
          const passages = counts[entry.route_id] ?? 1
          const t = Math.min((passages - 1) / 4, 1) // 1 passage=0, 5+=1
          const color = lerpColor("#F4D03F", "#9B59B6", t)

          // Sample every 3rd point for performance
          for (let i = 0; i < coords.length; i += 3) {
            const [lng, lat] = coords[i]
            const circle = L.circleMarker([lat, lng], {
              radius: 5 + passages * 2,
              color: "transparent",
              fillColor: color,
              fillOpacity: 0.18 + t * 0.25,
            }).addTo(map)
            heatLayersRef.current.push(circle)
          }
        } catch {}
      }
    })
  }, [showHeatmap, runHistory])

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-3xl overflow-hidden"
      style={{ background: "#0A0A0A" }}
    />
  )
}
