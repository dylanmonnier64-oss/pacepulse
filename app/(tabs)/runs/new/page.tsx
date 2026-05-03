"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Check } from "lucide-react"
import Link from "next/link"
import { useRuns } from "@/hooks/useRuns"
import type { Run, RunType, WeatherCondition } from "@/lib/types"
import { generateId, hapticFeedback, lgStyle } from "@/lib/utils"
import { calculateTSS } from "@/lib/calculations"
import Button from "@/components/ui/Button"
import { toast } from "@/lib/toast"

const typeOptions: RunType[] = ["endurance", "threshold", "interval", "long", "recovery"]
const typeLabels: Record<RunType, string> = {
  endurance: "Endurance",
  threshold: "Seuil",
  interval: "Fractionné",
  long: "Sortie longue",
  recovery: "Récupération",
}
const typeColors: Record<RunType, string> = {
  endurance: "#3498DB",
  threshold: "#E67E22",
  interval: "#E74C3C",
  long: "#9B59B6",
  recovery: "#27AE60",
}
const weatherOptions: WeatherCondition[] = ["sunny", "cloudy", "rainy", "windy", "snow", "humid"]
const weatherEmoji: Record<WeatherCondition, string> = {
  sunny: "☀️", cloudy: "☁️", rainy: "🌧️", windy: "💨", snow: "❄️", humid: "💧",
}
const weatherLabels: Record<WeatherCondition, string> = {
  sunny: "Ensoleillé", cloudy: "Nuageux", rainy: "Pluvieux",
  windy: "Venteux", snow: "Neige", humid: "Humide",
}

/* Label sémantique lié à son input via htmlFor */
function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs font-bold uppercase tracking-widest block mb-2"
      style={{ color: "rgba(250,250,250,0.45)" }}
    >
      {children}
    </label>
  )
}

export default function NewRunPage() {
  const router = useRouter()
  const { addRun } = useRuns()
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    distanceKm: "", distanceM: "",
    durationH: "", durationMin: "", durationSec: "",
    type: "endurance" as RunType,
    elevation: "",
    feeling: 7,
    notes: "",
    hrAvg: "", hrMax: "",
    temp: "", wind: "",
    weather: "sunny" as WeatherCondition,
    date: new Date().toISOString().split("T")[0],
  })

  const set = (field: string, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSave = () => {
    hapticFeedback()
    const distKm = parseFloat(form.distanceKm || "0") + parseFloat(form.distanceM || "0") / 1000
    if (!distKm) return

    const duration =
      parseInt(form.durationH  || "0") * 3600 +
      parseInt(form.durationMin || "0") * 60  +
      parseInt(form.durationSec || "0")
    const pace = duration > 0 && distKm > 0 ? Math.round(duration / distKm) : 0

    const run: Run = {
      id: generateId(),
      date: new Date(form.date).toISOString(),
      distance: distKm, duration, pace,
      elevation: parseInt(form.elevation || "0"),
      type: form.type,
      feeling: form.feeling,
      notes: form.notes,
      heartRate: form.hrAvg
        ? { avg: parseInt(form.hrAvg), max: parseInt(form.hrMax || form.hrAvg) }
        : undefined,
      weather: form.temp
        ? { temp: parseInt(form.temp), wind: parseInt(form.wind || "0"), conditions: form.weather }
        : undefined,
    }
    run.tss = calculateTSS(run)
    addRun(run)
    toast.success("Sortie enregistrée !")
    setSaved(true)
    setTimeout(() => router.push("/runs"), 800)
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" role="status" aria-live="polite">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #27AE60, #2ECC71)" }}
          aria-hidden
        >
          <Check size={36} className="text-white" />
        </motion.div>
        <p className="text-xl font-bold">Run enregistré !</p>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col gap-5"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{ background: "#0D1B2A", borderRadius: 24, padding: "20px 16px", margin: "0 -16px" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/runs"
          aria-label="Retour à la liste des sorties"
          className="touch-feedback w-10 h-10 rounded-2xl flex items-center justify-center"
          style={lgStyle()}
        >
          <ArrowLeft size={18} aria-hidden />
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "rgba(250,250,250,0.4)" }}>
            Nouveau
          </p>
          <h1 className="text-xl font-black">Ajouter un run</h1>
        </div>
      </div>

      {/* ── Date ── */}
      <div>
        <FieldLabel htmlFor="run-date">Date</FieldLabel>
        <input id="run-date" type="date" value={form.date}
          onChange={(e) => set("date", e.target.value)} />
      </div>

      {/* ── Type de séance ── */}
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ color: "rgba(250,250,250,0.45)" }}>
          Type de séance
        </legend>
        <div className="grid grid-cols-3 gap-2" role="group">
          {typeOptions.map((t) => {
            const active = form.type === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => { hapticFeedback(); set("type", t) }}
                aria-pressed={active}
                aria-label={`Type : ${typeLabels[t]}`}
                className="touch-feedback py-2 px-3 rounded-2xl text-xs font-bold transition-all"
                style={{
                  background: active ? typeColors[t] + "28" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${active ? typeColors[t] : "rgba(255,255,255,0.1)"}`,
                  color: active ? typeColors[t] : "rgba(245,245,245,0.6)",
                  minHeight: 44,
                }}
              >
                {typeLabels[t]}
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* ── Distance ── */}
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ color: "rgba(250,250,250,0.45)" }}>
          Distance
        </legend>
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="dist-km" className="sr-only">Kilomètres</label>
            <input id="dist-km" type="number" placeholder="0" inputMode="decimal"
              value={form.distanceKm} onChange={(e) => set("distanceKm", e.target.value)} />
            <p className="text-[10px] mt-1 px-1" style={{ color: "rgba(250,250,250,0.38)" }}>km</p>
          </div>
          <div className="flex-1">
            <label htmlFor="dist-m" className="sr-only">Mètres</label>
            <input id="dist-m" type="number" placeholder="000" inputMode="numeric"
              value={form.distanceM} onChange={(e) => set("distanceM", e.target.value)} />
            <p className="text-[10px] mt-1 px-1" style={{ color: "rgba(250,250,250,0.38)" }}>mètres</p>
          </div>
        </div>
      </fieldset>

      {/* ── Durée ── */}
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ color: "rgba(250,250,250,0.45)" }}>
          Durée
        </legend>
        <div className="flex gap-2">
          {(["durationH", "durationMin", "durationSec"] as const).map((field, i) => {
            const ids = ["dur-h", "dur-min", "dur-sec"]
            const units = ["heures", "minutes", "secondes"]
            const short = ["h", "min", "sec"]
            return (
              <div key={field} className="flex-1">
                <label htmlFor={ids[i]} className="sr-only">{units[i]}</label>
                <input id={ids[i]} type="number" placeholder="0" inputMode="numeric"
                  value={form[field]} onChange={(e) => set(field, e.target.value)} />
                <p className="text-[10px] mt-1 px-1" style={{ color: "rgba(250,250,250,0.38)" }}>
                  {short[i]}
                </p>
              </div>
            )
          })}
        </div>
      </fieldset>

      {/* ── Dénivelé ── */}
      <div>
        <FieldLabel htmlFor="run-elevation">Dénivelé positif (m)</FieldLabel>
        <input id="run-elevation" type="number" placeholder="0" inputMode="numeric"
          value={form.elevation} onChange={(e) => set("elevation", e.target.value)} />
      </div>

      {/* ── Fréquence cardiaque ── */}
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ color: "rgba(250,250,250,0.45)" }}>
          Fréquence cardiaque (optionnel)
        </legend>
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="hr-avg" className="sr-only">FC moyenne en bpm</label>
            <input id="hr-avg" type="number" placeholder="FC moy." inputMode="numeric"
              value={form.hrAvg} onChange={(e) => set("hrAvg", e.target.value)} />
            <p className="text-[10px] mt-1 px-1" style={{ color: "rgba(250,250,250,0.38)" }}>bpm moy.</p>
          </div>
          <div className="flex-1">
            <label htmlFor="hr-max" className="sr-only">FC max en bpm</label>
            <input id="hr-max" type="number" placeholder="FC max" inputMode="numeric"
              value={form.hrMax} onChange={(e) => set("hrMax", e.target.value)} />
            <p className="text-[10px] mt-1 px-1" style={{ color: "rgba(250,250,250,0.38)" }}>bpm max</p>
          </div>
        </div>
      </fieldset>

      {/* ── Météo ── */}
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ color: "rgba(250,250,250,0.45)" }}>
          Météo (optionnel)
        </legend>
        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <label htmlFor="weather-temp" className="sr-only">Température en °C</label>
            <input id="weather-temp" type="number" placeholder="Temp." inputMode="numeric"
              value={form.temp} onChange={(e) => set("temp", e.target.value)} />
            <p className="text-[10px] mt-1 px-1" style={{ color: "rgba(250,250,250,0.38)" }}>°C</p>
          </div>
          <div className="flex-1">
            <label htmlFor="weather-wind" className="sr-only">Vent en km/h</label>
            <input id="weather-wind" type="number" placeholder="Vent" inputMode="numeric"
              value={form.wind} onChange={(e) => set("wind", e.target.value)} />
            <p className="text-[10px] mt-1 px-1" style={{ color: "rgba(250,250,250,0.38)" }}>km/h</p>
          </div>
        </div>
        {/* Conditions météo — emoji buttons avec aria-label */}
        <div role="group" aria-label="Conditions météo" className="flex gap-2">
          {weatherOptions.map((w) => {
            const active = form.weather === w
            return (
              <button
                key={w}
                type="button"
                onClick={() => { hapticFeedback(); set("weather", w) }}
                aria-pressed={active}
                aria-label={weatherLabels[w]}
                title={weatherLabels[w]}
                className="touch-feedback w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{
                  ...(active ? lgStyle("rgba(244,208,63,0.15)") : lgStyle()),
                  border: `1px solid ${active ? "rgba(244,208,63,0.35)" : "rgba(255,255,255,0.10)"}`,
                }}
              >
                <span aria-hidden>{weatherEmoji[w]}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* ── Difficulté ressentie ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <FieldLabel htmlFor="run-feeling">Difficulté ressentie</FieldLabel>
          <span
            className="text-sm font-black tabular-nums px-3 py-1 rounded-full"
            aria-live="polite"
            aria-atomic="true"
            style={{
              background: form.feeling <= 3 ? "rgba(39,174,96,0.2)"  : form.feeling <= 6 ? "rgba(244,208,63,0.2)"  : "rgba(231,76,60,0.2)",
              color:      form.feeling <= 3 ? "#27AE60"               : form.feeling <= 6 ? "#F4D03F"               : "#E74C3C",
              border: `1px solid ${form.feeling <= 3 ? "rgba(39,174,96,0.4)" : form.feeling <= 6 ? "rgba(244,208,63,0.4)" : "rgba(231,76,60,0.4)"}`,
            }}
          >
            {form.feeling}/10
          </span>
        </div>
        <input
          id="run-feeling"
          type="range" min={0} max={10}
          value={form.feeling}
          onChange={(e) => set("feeling", parseInt(e.target.value))}
          aria-label={`Difficulté ressentie : ${form.feeling} sur 10`}
          aria-valuemin={0} aria-valuemax={10} aria-valuenow={form.feeling}
          className="w-full"
          style={{ accentColor: "#F4D03F" }}
        />
        <div className="flex justify-between text-[10px] px-1 mt-1" style={{ color: "rgba(250,250,250,0.38)" }}>
          <span>Très facile</span>
          <span>Maximum</span>
        </div>
      </div>

      {/* ── Notes ── */}
      <div>
        <FieldLabel htmlFor="run-notes">Notes</FieldLabel>
        <textarea
          id="run-notes"
          placeholder="Comment s'est passée cette sortie ?"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          style={{ resize: "none" }}
        />
      </div>

      {/* ── Enregistrer ── */}
      <Button variant="zoom" fullWidth size="lg" onClick={handleSave}
        aria-label="Enregistrer la sortie">
        <Check size={18} aria-hidden />
        Enregistrer
      </Button>

      <div className="h-4" />
    </motion.div>
  )
}
