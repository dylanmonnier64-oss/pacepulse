"use client"
import { useEffect, useRef } from "react"

const COLORS = ["#F4D03F", "#E67E22", "#9B59B6", "#27AE60", "#E74C3C", "#3498DB"]

export default function Confetti({ active }: { active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active || !containerRef.current) return
    const container = containerRef.current

    const pieces = Array.from({ length: 60 }, (_, i) => {
      const el = document.createElement("div")
      el.className = "confetti-piece"
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      const size = Math.random() * 8 + 4
      const x = Math.random() * 100
      const duration = Math.random() * 2 + 2
      const delay = Math.random() * 0.5

      el.style.cssText = `
        left: ${x}vw;
        top: 0;
        width: ${size}px;
        height: ${size * 0.6}px;
        background: ${color};
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
      `
      container.appendChild(el)
      return el
    })

    const timeout = setTimeout(() => {
      pieces.forEach((p) => p.remove())
    }, 4000)

    return () => {
      clearTimeout(timeout)
      pieces.forEach((p) => p.remove())
    }
  }, [active])

  return <div ref={containerRef} className="fixed inset-0 pointer-events-none z-50 overflow-hidden" />
}
