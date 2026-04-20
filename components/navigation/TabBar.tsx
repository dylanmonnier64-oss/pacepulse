"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Route, BarChart2, Target, User } from "lucide-react"
import { hapticFeedback } from "@/lib/utils"

const tabs = [
  { href: "/dashboard", label: "Home", Icon: Home },
  { href: "/runs", label: "Runs", Icon: Route },
  { href: "/stats", label: "Stats", Icon: BarChart2 },
  { href: "/goals", label: "Objectifs", Icon: Target },
  { href: "/profile", label: "Profil", Icon: User },
]

export default function TabBar() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 no-select"
      style={{
        background: "rgba(10,10,10,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        paddingBottom: "var(--safe-bottom)",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <div className="flex items-center justify-around" style={{ height: "var(--tab-bar-height)" }}>
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              onClick={hapticFeedback}
              className="flex flex-col items-center justify-center gap-1 touch-feedback"
              style={{ minWidth: 60, minHeight: 44 }}
            >
              <div
                className="flex items-center justify-center rounded-2xl transition-all duration-200"
                style={{
                  width: 40,
                  height: 28,
                  background: active ? "rgba(244,208,63,0.15)" : "transparent",
                }}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  style={{ color: active ? "#F4D03F" : "rgba(245,245,245,0.45)" }}
                />
              </div>
              <span
                className="text-[10px] font-medium tracking-wide"
                style={{
                  color: active ? "#F4D03F" : "rgba(245,245,245,0.45)",
                  letterSpacing: "0.02em",
                }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
