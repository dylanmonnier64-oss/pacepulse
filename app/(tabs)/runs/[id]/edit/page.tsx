"use client"
import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Check } from "lucide-react"
import Link from "next/link"
import { useRuns } from "@/hooks/useRuns"
import type { RunType, WeatherCondition } from "@/lib/types"
import { hapticFeedback } from "@/lib/utils"
import { calculateTSS } from "@/lib/calculations"
import Button from "@/components/ui/Button"
import { toast } from "@/lib/toast"

const typeOptions: RunType[] = ["endurance", "threshold", "interval", "long", "recovery"]
const typeLabels: Record<RunType, string> = {
  endurance: "Endurance", threshold: "Seuil", interval: "Fractionné", long: "Sortie longue", recovery: "Récupération"
}
const typeColors: Record<RunType, string> = {
  endurance: "#3498DB", threshold: "#E67E22", interval: "#E74C3C", long: "#9B59B6", recovery: "#27AE60"
}
const weatherOptions: WeatherCondition[] = ["sunny", "cloudy", "rainy", "windy", "snow", "humid"]
const weatherEmoji: Record<WeatherCondition, string> = {
  sunny: "☀️", cloudy: "☁️", rainy: "🌧️", windy: "💨", snow: "❄️", humid: "💧"
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-bold uppercase tracking-widest text-text-muted block mb-2">{children}</label>
}

export default function EditRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { runs, updateRun } = useRuns()
  const [saved, setSaved] = useState(false)
  const [ready, setReady] = useState(false)

  const run = runs.find(r => r.id === id)

  const [form, setForm] = useState({
    distanceKm: "",
    distanceM: "",
    durationH: "",
    durationMin: "",
    durationSec: "",
    type: "endurance" as RunType,
    elevation: "",
    feeling: 5,
    notes: "",
    hrAvg: "",
    hrMax: "",
    temp: "",
    wind: "",
    weather: "sunny" as WeatherCondition,
    date: new Date().toISOString().split("T")[0],
  })

  // Pre-fill form when run loads
  useEffect(() => {
    if (!run || ready) return
    const totalSec = run.duration
    setForm({
      distanceKm: Math.floor(run.distance).toString(),
      distanceM: Math.round((run.distance % 1) * 1000).toString(),
      durationH: Math.floor(totalSec / 3600).toString(),
      durationMin: Math.floor((totalSec % 3600) / 60).toString(),
      durationSec: (totalSec % 60).toString(),
      type: run.type,
      elevation: run.elevation.toString(),
      feeling: run.feeling,
      notes: run.notes,
      hrAvg: run.heartRate?.avg.toString() ?? "",
      hrMax: run.heartRate?.max.toString() ?? "",
      temp: run.weather?.temp.toString() ?? "",
      wind: run.weather?.wind.toString() ?? "",
      weather: run.weather?.conditions ?? "sunny",
      date: new Date(run.date).toISOString().split("T")[0],
    })
    setReady(true)
  }, [run, ready])

  const set = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }))

  const handleSave = () => {
    if (!run) return
    hapticFeedback()
    const distKm = parseFloat(form.distanceKm || "0") + parseFloat(form.distanceM || "0") / 1000
    if (!distKm) return

    const duration =
      parseInt(form.durationH || "0") * 3600 +
      parseInt(form.durationMin || "0") * 60 +
      parseInt(form.durationSec || "0")
    const pace = duration > 0 && distKm > 0 ? Math.round(duration / distKm) : 0

    const updated = {
      ...run,
      date: new Date(form.date).toISOString(),
      distance: distKm,
      duration,
      pace,
      elevation: parseInt(form.elevation || "0"),
      type: form.type,
      feeling: form.feeling,
      notes: form.notes,
      heartRate: form.hrAvg ? { avg: parseInt(form.hrAvg), max: parseInt(form.hrMax || form.hrAvg) } : undefined,
      weather: form.temp ? { temp: parseInt(form.temp), wind: parseInt(form.wind || "0"), conditions: form.weather } : undefined,
    }
    updated.tss = calculateTSS(updated)
    updateRun(updated)
    toast.success("Modifications enregistrées")
    setSaved(true)
    setTimeout(() => router.push(`/runs/${id}`), 800)
  }

  if (!run) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="text-text-muted">Run introuvable</p>
      <Link href="/runs" className="text-primary font-semibold">← Retour</Link>
    </div>
  )

  if (saved) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #27AE60, #2ECC71)" }}>
        <Check size={36} className="text-white" />
      </motion.div>
      <p className="text-xl font-bold">Run modifié !</p>
    </div>
  )

  return (
    <motion.div className="flex flex-col gap-5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      style={{ background: "#0D1B2A", borderRadius: 24, padding: "20px 16px", margin: "0 -16px" }}>

      <div className="flex items-center gap-3">
        <Link href={`/runs/${id}`} className="touch-feedback w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.06)" }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Modifier</p>
          <h1 className="text-xl font-black">Éditer ce run</h1>
        </div>
      </div>

      <div><Label>Date</Label>
        <input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
      </div>

      <div><Label>Type de séance</Label>
        <div className="grid grid-cols-3 gap-2">
          {typeOptions.map(t => (
            <button key={t} onClick={() => { hapticFeedback(); set("type", t) }}
              className="touch-feedback py-2 px-3 rounded-2xl text-xs font-bold"
              style={{
                background: form.type === t ? typeColors[t] + "30" : "rgba(255,255,255,0.05)",
                border: `1px solid ${form.type === t ? typeColors[t] : "rgba(255,255,255,0.1)"}`,
                color: form.type === t ? typeColors[t] : "rgba(245,245,245,0.6)", minHeight: 44,
              }}>
              {typeLabels[t]}
            </button>
          ))}
        </div>
      </div>

      <div><Label>Distance</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <input type="number" placeholder="0" inputMode="decimal" value={form.distanceKm} onChange={e => set("distanceKm", e.target.value)} />
            <p className="text-[10px] text-text-muted mt-1 px-1">km</p>
          </div>
          <div className="flex-1">
            <input type="number" placeholder="000" inputMode="numeric" value={form.distanceM} onChange={e => set("distanceM", e.target.value)} />
            <p className="text-[10px] text-text-muted mt-1 px-1">mètres</p>
          </div>
        </div>
      </div>

      <div><Label>Durée</Label>
        <div className="flex gap-2">
          {["durationH", "durationMin", "durationSec"].map((field, i) => (
            <div key={field} className="flex-1">
              <input type="number" placeholder="0" inputMode="numeric"
                value={form[field as keyof typeof form] as string}
                onChange={e => set(field, e.target.value)} />
              <p className="text-[10px] text-text-muted mt-1 px-1">{["h", "min", "sec"][i]}</p>
            </div>
          ))}
        </div>
      </div>

      <div><Label>Dénivelé positif (m)</Label>
        <input type="number" placeholder="0" inputMode="numeric" value={form.elevation} onChange={e => set("elevation", e.target.value)} />
      </div>

      <div><Label>Fréquence cardiaque (optionnel)</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <input type="number" placeholder="FC moy." inputMode="numeric" value={form.hrAvg} onChange={e => set("hrAvg", e.target.value)} />
            <p className="text-[10px] text-text-muted mt-1 px-1">bpm moy.</p>
          </div>
          <div className="flex-1">
            <input type="number" placeholder="FC max" inputMode="numeric" value={form.hrMax} onChange={e => set("hrMax", e.target.value)} />
            <p className="text-[10px] text-text-muted mt-1 px-1">bpm max</p>
          </div>
        </div>
      </div>

      <div><Label>Météo (optionnel)</Label>
        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <input type="number" placeholder="Temp." inputMode="numeric" value={form.temp} onChange={e => set("temp", e.target.value)} />
            <p className="text-[10px] text-text-muted mt-1 px-1">°C</p>
          </div>
          <div className="flex-1">
            <input type="number" placeholder="Vent" inputMode="numeric" value={form.wind} onChange={e => set("wind", e.target.value)} />
            <p className="text-[10px] text-text-muted mt-1 px-1">km/h</p>
          </div>
        </div>
        <div className="flex gap-2">
          {weatherOptions.map(w => (
            <button key={w} onClick={() => { hapticFeedback(); set("weather", w) }}
              className="touch-feedback w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ background: form.weather === w ? "rgba(244,208,63,0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${form.weather === w ? "#F4D03F" : "rgba(255,255,255,0.1)"}` }}>
              {weatherEmoji[w]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Difficulté (0-10)</Label>
          <span className="text-sm font-black tabular-nums px-3 py-1 rounded-full"
            style={{
              background: form.feeling <= 3 ? "rgba(39,174,96,0.2)" : form.feeling <= 6 ? "rgba(244,208,63,0.2)" : "rgba(231,76,60,0.2)",
              color: form.feeling <= 3 ? "#27AE60" : form.feeling <= 6 ? "#F4D03F" : "#E74C3C",
              border: `1px solid ${form.feeling <= 3 ? "rgba(39,174,96,0.4)" : form.feeling <= 6 ? "rgba(244,208,63,0.4)" : "rgba(231,76,60,0.4)"}`,
            }}>
            {form.feeling}/10
          </span>
        </div>
        <input type="range" min={0} max={10} value={form.feeling}
          onChange={e => set("feeling", parseInt(e.target.value))}
          className="w-full" style={{ accentColor: "#F4D03F" }} />
        <div className="flex justify-between text-[10px] text-text-muted px-1 mt-1">
          <span>Très facile</span><span>Maximum</span>
        </div>
      </div>

      <div><Label>Notes</Label>
        <textarea placeholder="Comment s'est passée cette sortie ?" value={form.notes}
          onChange={e => set("notes", e.target.value)} rows={3} style={{ resize: "none" }} />
      </div>

      <Button variant="zoom" fullWidth size="lg" onClick={handleSave}>
        <Check size={18} />Enregistrer les modifications
      </Button>
      <div className="h-4" />
    </motion.div>
  )
}
