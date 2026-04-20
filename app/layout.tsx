import type { Metadata, Viewport } from "next"
import "./globals.css"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0A0A0A",
}

export const metadata: Metadata = {
  title: "PacePulse",
  description: "Votre coach running personnel — dépassez vos limites",
  applicationName: "PacePulse",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PacePulse",
  },
  icons: {
    apple: "/icons/icon-192.png",
    icon: "/icons/icon-192.png",
  },
  formatDetection: { telephone: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className="min-h-screen antialiased"
        style={{ background: "#0A0A0A", color: "#F5F5F5" }}
      >
        {/* Apply profile theme before React hydrates to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var p=localStorage.getItem('pp_active_profile')||'dydz';document.documentElement.setAttribute('data-profile',p)})()`,
          }}
        />
        {children}
      </body>
    </html>
  )
}
