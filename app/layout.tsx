import type { Metadata, Viewport } from "next"
import "./globals.css"
import Toaster from "@/components/ui/Toaster"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0A0A0A",
}

export const metadata: Metadata = {
  title: "PacePulse Heritage Elite OS",
  description: "Performance tracking ultra-premium pour athlètes d'élite",
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
        {/* ── Global liquid-glass SVG filter (referenced via url(#lg)) ── */}
        <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden focusable="false">
          <defs>
            <filter id="lg" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.045 0.045" numOctaves="2" seed="4" result="noise" />
              <feGaussianBlur in="noise" stdDeviation="2.5" result="blurredNoise" />
              <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="12" xChannelSelector="R" yChannelSelector="B" result="displaced" />
              <feGaussianBlur in="displaced" stdDeviation="0.8" result="out" />
              <feComposite in="out" in2="out" operator="over" />
            </filter>
          </defs>
        </svg>

        {/* Apply profile theme before React hydrates to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              var p=localStorage.getItem('pp_active_profile')||'dydz';
              document.documentElement.setAttribute('data-profile',p);
              var m=localStorage.getItem('vomero_night_mode_manual');
              var h=new Date().getHours();
              var night=m?m==='night':(h>=20||h<6);
              document.documentElement.classList.add(night?'night-run':'day-run');
            })()`,
          }}
        />
        <Toaster />
        {children}
      </body>
    </html>
  )
}
