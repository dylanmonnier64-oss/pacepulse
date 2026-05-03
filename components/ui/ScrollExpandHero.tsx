"use client"

import { useEffect, useRef, useState, ReactNode } from "react"
import Image from "next/image"
import { motion } from "framer-motion"

interface ScrollExpandHeroProps {
  /** Unsplash or any img src */
  imageSrc: string
  /** Text displayed split — word 1 slides left, rest slides right */
  title?: string
  /** Small caption above title */
  eyebrow?: string
  /** "Scroll to reveal" hint */
  scrollHint?: string
  /** Content revealed after full expansion */
  children?: ReactNode
  /** ID of the scroll container (default: "app-scroll") */
  scrollContainerId?: string
}

export default function ScrollExpandHero({
  imageSrc,
  title,
  eyebrow,
  scrollHint = "Faites défiler",
  children,
  scrollContainerId = "app-scroll",
}: ScrollExpandHeroProps) {
  const [progress, setProgress] = useState(0)          // 0→1: expansion animation
  const [expanded, setExpanded]   = useState(false)    // fully expanded = content unlocked
  const touchStartY = useRef(0)

  const getContainer = () =>
    document.getElementById(scrollContainerId) as HTMLDivElement | null

  useEffect(() => {
    const container = getContainer()
    if (!container) return

    /* ── Wheel (desktop) ── */
    const onWheel = (e: WheelEvent) => {
      if (expanded) {
        /* Already expanded — collapse only if container is scrolled back to top */
        if (e.deltaY < 0 && container.scrollTop <= 4) {
          setExpanded(false)
        }
        return // let container scroll normally
      }

      /* Expansion phase — prevent normal scroll */
      e.preventDefault()
      setProgress(prev => {
        const next = Math.min(1, Math.max(0, prev + e.deltaY * 0.001))
        if (next >= 1) { setExpanded(true); container.scrollTop = 0 }
        return next
      })
    }

    /* ── Touch (mobile) ── */
    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
    }
    const onTouchMove = (e: TouchEvent) => {
      if (expanded) {
        if (e.touches[0].clientY - touchStartY.current > 30 && container.scrollTop <= 4) {
          setExpanded(false)
          touchStartY.current = e.touches[0].clientY
        }
        return
      }
      e.preventDefault()
      const delta = touchStartY.current - e.touches[0].clientY
      touchStartY.current = e.touches[0].clientY
      setProgress(prev => {
        const next = Math.min(1, Math.max(0, prev + delta * 0.007))
        if (next >= 1) { setExpanded(true); container.scrollTop = 0 }
        return next
      })
    }
    const onTouchEnd = () => { touchStartY.current = 0 }

    container.addEventListener("wheel",      onWheel,      { passive: false })
    container.addEventListener("touchstart", onTouchStart, { passive: true  })
    container.addEventListener("touchmove",  onTouchMove,  { passive: false })
    container.addEventListener("touchend",   onTouchEnd)

    return () => {
      container.removeEventListener("wheel",      onWheel)
      container.removeEventListener("touchstart", onTouchStart)
      container.removeEventListener("touchmove",  onTouchMove)
      container.removeEventListener("touchend",   onTouchEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, scrollContainerId])

  /* Derived sizes */
  const imgW        = 220 + progress * 600  // px → grows to full width
  const imgH        = 300 + progress * 340  // px → grows to full height
  const textShiftVw = progress * 40          // vw for title split

  const firstWord  = title?.split(" ")[0]   ?? ""
  const restTitle  = title?.split(" ").slice(1).join(" ") ?? ""

  return (
    <div className="overflow-x-hidden">
      {/* ── Hero section ── */}
      <section
        className="relative flex flex-col items-center justify-center"
        style={{ minHeight: "100dvh" }}
      >
        {/* Expanding image */}
        <div
          className="relative overflow-hidden rounded-3xl transition-[width,height,border-radius] duration-75"
          style={{
            width:  `min(${imgW}px, 96vw)`,
            height: `min(${imgH}px, 85dvh)`,
            borderRadius: progress > 0.9 ? 0 : 28,
            boxShadow: `0 ${12 - progress * 12}px ${40 - progress * 40}px rgba(0,0,0,0.55)`,
          }}
        >
          <Image
            src={imageSrc}
            alt={title ?? "Hero"}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Dark overlay — fades as expanded */}
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: 0.45 - progress * 0.3 }}
            transition={{ duration: 0.05 }}
            style={{ background: "rgba(0,0,0,0.55)" }}
          />
          {/* Gold vignette ring */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: `inset 0 0 ${60 - progress * 60}px rgba(244,208,63,0.15)`,
              transition: "box-shadow 0.1s",
            }}
          />
        </div>

        {/* Title — splits apart as image expands */}
        {title && (
          <div
            className="absolute z-10 flex flex-col items-center gap-1 text-center pointer-events-none"
            style={{ top: "50%", transform: "translateY(-50%)" }}
          >
            {eyebrow && (
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
                style={{ color: "rgba(250,250,250,0.55)" }}>
                {eyebrow}
              </p>
            )}
            <p
              className="text-4xl font-black text-white"
              style={{ transform: `translateX(-${textShiftVw}vw)`, transition: "transform 0.05s" }}
            >
              {firstWord}
            </p>
            <p
              className="text-4xl font-black text-white"
              style={{ transform: `translateX(${textShiftVw}vw)`, transition: "transform 0.05s" }}
            >
              {restTitle}
            </p>
          </div>
        )}

        {/* Scroll hint — fades as you scroll */}
        {!expanded && (
          <motion.div
            className="absolute bottom-8 flex flex-col items-center gap-2 pointer-events-none"
            animate={{ opacity: Math.max(0, 1 - progress * 3) }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "rgba(250,250,250,0.5)" }}>
              {scrollHint}
            </p>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="w-[1px] h-8 rounded-full"
              style={{ background: "linear-gradient(180deg, rgba(244,208,63,0.8), transparent)" }}
            />
          </motion.div>
        )}
      </section>

      {/* ── Revealed content ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
