"use client"
import { useEffect, useState, useCallback } from "react"

const STORAGE_KEY = "vomero_night_mode_manual"
const NIGHT_CLASS = "night-run"
const DAY_CLASS   = "day-run"

function isNightHour(): boolean {
  const h = new Date().getHours()
  return h >= 20 || h < 6
}

export interface NightModeOutput {
  isNight: boolean
  isManual: boolean
  toggle: () => void
  forceDay: () => void
  forceNight: () => void
  resetAuto: () => void
}

export function useNightMode(): NightModeOutput {
  const [isNight, setIsNight]   = useState(false)
  const [isManual, setIsManual] = useState(false)

  // Apply class to <html>
  const apply = useCallback((night: boolean) => {
    const root = document.documentElement
    root.classList.remove(NIGHT_CLASS, DAY_CLASS)
    root.classList.add(night ? NIGHT_CLASS : DAY_CLASS)
    setIsNight(night)
  }, [])

  // Init from storage or auto
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setIsManual(true)
      apply(stored === "night")
    } else {
      apply(isNightHour())
    }

    // Tick auto every minute when not manual
    const interval = setInterval(() => {
      const s = localStorage.getItem(STORAGE_KEY)
      if (s === null) apply(isNightHour())
    }, 60_000)

    return () => clearInterval(interval)
  }, [apply])

  const toggle = useCallback(() => {
    const next = !isNight
    localStorage.setItem(STORAGE_KEY, next ? "night" : "day")
    setIsManual(true)
    apply(next)
  }, [isNight, apply])

  const forceDay = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "day")
    setIsManual(true)
    apply(false)
  }, [apply])

  const forceNight = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "night")
    setIsManual(true)
    apply(true)
  }, [apply])

  const resetAuto = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setIsManual(false)
    apply(isNightHour())
  }, [apply])

  return { isNight, isManual, toggle, forceDay, forceNight, resetAuto }
}
