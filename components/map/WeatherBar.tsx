/**
 * WeatherBar — Barre météo + soleil temps réel
 * Props: weather, sunData (from useRouteEngine)
 */
"use client"
import { motion, AnimatePresence } from "framer-motion"
import type { WeatherData, SunData } from "@/lib/route-engine"

const OWM_ICON = (icon: string) => `https://openweathermap.org/img/wn/${icon}.png`

function Countdown({ minutes, label }: { minutes: number; label: string }) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return (
    <motion.div
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: "rgba(244,208,63,0.15)", border: "1px solid rgba(244,208,63,0.4)", color: "#F4D03F" }}
      animate={{ opacity: [1, 0.6, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <span>⏱</span>
      <span>{label} {h > 0 ? `${h}h` : ""}{m}min</span>
    </motion.div>
  )
}

export default function WeatherBar({ weather, sunData }: { weather: WeatherData | null; sunData: SunData | null }) {
  const goldenWindow =
    (sunData?.minutesToSunset !== null && sunData?.minutesToSunset !== undefined && sunData.minutesToSunset <= 90 && sunData.minutesToSunset >= 0) ||
    (sunData?.minutesToSunrise !== null && sunData?.minutesToSunrise !== undefined && sunData.minutesToSunrise <= 60 && sunData.minutesToSunrise >= 0)

  const isSunset = sunData?.minutesToSunset !== null && sunData?.minutesToSunset !== undefined && sunData.minutesToSunset >= 0 && sunData.minutesToSunset <= 90
  const isSunrise = sunData?.minutesToSunrise !== null && sunData?.minutesToSunrise !== undefined && sunData.minutesToSunrise >= 0 && sunData.minutesToSunrise <= 60

  return (
    <div className="flex flex-col gap-1.5">
      {/* Golden hour alert */}
      <AnimatePresence>
        {goldenWindow && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-bold"
            style={{ background: "rgba(244,208,63,0.2)", border: "1px solid rgba(244,208,63,0.5)", color: "#F4D03F" }}
          >
            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
              {isSunset ? "🌅" : "🌄"}
            </motion.span>
            <span>
              {isSunset
                ? `Coucher de soleil dans ${sunData?.minutesToSunset}min — Lance-toi maintenant`
                : `Lever de soleil dans ${sunData?.minutesToSunrise}min — Conditions parfaites`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weather row */}
      <div
        className="flex items-center gap-3 px-3 py-2 rounded-2xl overflow-x-auto"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {weather ? (
          <>
            {/* Weather icon */}
            <img src={OWM_ICON(weather.icon)} alt={weather.description} className="w-7 h-7 flex-shrink-0" style={{ filter: "drop-shadow(0 0 4px rgba(244,208,63,0.4))" }} />
            <span className="text-sm font-bold flex-shrink-0">{weather.temp}°C</span>
            <span className="text-xs text-text-muted capitalize flex-shrink-0">{weather.description}</span>
            <div className="flex items-center gap-1 flex-shrink-0 text-xs text-text-muted">
              <span>💨</span><span>{weather.wind}km/h</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 text-xs text-text-muted">
              <span>💧</span><span>{weather.humidity}%</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div className="w-4 h-4 rounded-full border-2 border-text-muted border-t-transparent animate-spin" />
            <span>Météo...</span>
          </div>
        )}

        {/* Divider */}
        {sunData && <div className="w-px h-5 bg-white/10 flex-shrink-0 mx-1" />}

        {sunData && (
          <>
            <div className="flex items-center gap-1 flex-shrink-0 text-xs text-text-muted">
              <span>🌄</span><span>{sunData.sunrise}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 text-xs text-text-muted">
              <span>🌅</span><span>{sunData.sunset}</span>
            </div>
            {isSunset && sunData.minutesToSunset !== null && (
              <Countdown minutes={sunData.minutesToSunset!} label="coucher" />
            )}
            {isSunrise && sunData.minutesToSunrise !== null && (
              <Countdown minutes={sunData.minutesToSunrise!} label="lever" />
            )}
          </>
        )}
      </div>
    </div>
  )
}
