import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PacePulse — Running Tracker",
    short_name: "PacePulse",
    description: "Votre coach running personnel — dépassez vos limites",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0A",
    theme_color: "#0A0A0A",
    orientation: "portrait",
    scope: "/",
    lang: "fr",
    categories: ["sports", "health", "fitness"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        // @ts-ignore - purpose is valid
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        // @ts-ignore
        purpose: "any maskable",
      },
    ],
  }
}
