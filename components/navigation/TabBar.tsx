"use client"
import { useRef, useLayoutEffect, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Home, Activity, Heart, Users, Plus, X,
  Camera, Sparkles, AlertCircle, Send, ChevronDown, User,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { hapticFeedback, lgStyle } from "@/lib/utils"

/* ── Padel SVG icon ── */
function PadelIcon({ size = 20, strokeWidth = 1.6, style }: { size?: number; strokeWidth?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <ellipse cx="11" cy="10" rx="7" ry="8" />
      <line x1="11" y1="18" x2="8" y2="22" /><line x1="11" y1="18" x2="14" y2="22" />
      <line x1="7" y1="10" x2="15" y2="10" /><line x1="11" y1="6" x2="11" y2="14" />
    </svg>
  )
}
void PadelIcon

// 2 tabs left | FAB | 2 tabs right
const LEFT_TABS = [
  { href: "/dashboard", label: "Accueil",   Icon: Home },
  { href: "/activites", label: "Activités", Icon: Activity },
]
const RIGHT_TABS = [
  { href: "/soulmate", label: "Soulmate", Icon: Users },
]
const tabs = [...LEFT_TABS, ...RIGHT_TABS]

type FabAction = {
  id: string
  href?: string
  emoji: string
  label: string
  sub: string
  color: string
  border: string
}

const FAB_ACTIONS: FabAction[] = [
  { id: "checkin",   emoji: "🧠", label: "Check-in rapide",    sub: "Humeur + Forme du jour",    color: "rgba(212,175,55,0.08)",  border: "rgba(212,175,55,0.22)" },
  { id: "bobos",     emoji: "🩺", label: "Journal des Bobos",  sub: "Douleurs & blessures",      color: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.22)"  },
  { id: "run",       href: "/runs/new",            emoji: "🏃", label: "Ajouter un run",        sub: "Course à pied",             color: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.22)"  },
  { id: "padel",     href: "/activites?new=padel", emoji: "🎾", label: "Match de padel",        sub: "Enregistrer une partie",    color: "rgba(168,85,247,0.08)",  border: "rgba(168,85,247,0.22)" },
  { id: "forecasts", href: "/forecasts",           emoji: "🔮", label: "Prévisions",            sub: "Temps prédits & VDOT",      color: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.22)" },
  { id: "races",     href: "/races",               emoji: "🏁", label: "Courses",               sub: "Marathons & trails région", color: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.22)"  },
  { id: "profile",   href: "/profile",             emoji: "⚙️", label: "Mon profil",           sub: "Paramètres & données",      color: "rgba(148,113,247,0.08)", border: "rgba(148,113,247,0.22)" },
  { id: "nutrition", emoji: "📸", label: "Scan nutrition",     sub: "Analyser un repas",         color: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.22)" },
]

const pillGlass: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(28px) saturate(200%) url(#lg)",
  WebkitBackdropFilter: "blur(28px) saturate(200%)",
  border: "1px solid rgba(255,255,255,0.18)",
  boxShadow: [
    "0 4px 24px rgba(0,0,0,0.40)",
    "inset 3px  3px  0.5px -3.5px rgba(255,255,255,0.09)",
    "inset -3px -3px 0.5px -3.5px rgba(255,255,255,0.88)",
    "inset 1px  1px  1px   -0.5px rgba(255,255,255,0.60)",
    "inset -1px -1px 1px   -0.5px rgba(255,255,255,0.60)",
    "inset 0 0 8px 6px rgba(255,255,255,0.08)",
    "0 0 16px rgba(0,0,0,0.25)",
  ].join(","),
}

const activeBubble: React.CSSProperties = {
  background: "rgba(255,255,255,0.10)",
  backdropFilter: "blur(12px) saturate(160%)",
  WebkitBackdropFilter: "blur(12px) saturate(160%)",
  border: "1px solid rgba(255,255,255,0.22)",
  boxShadow: ["inset 0 1px 0 rgba(255,255,255,0.30)", "inset 0 -1px 0 rgba(0,0,0,0.15)", "0 2px 8px rgba(0,0,0,0.25)"].join(","),
  borderRadius: 12,
}

/* ═══════════════════════════════════════════════
   CHECKIN MODAL
═══════════════════════════════════════════════ */
type CheckinData = { date: string; humeur: number; forme: number; notes: string }

function SliderField({ label, emoji, value, onChange, colorStart, colorEnd }: {
  label: string; emoji: string; value: number; onChange: (v: number) => void
  colorStart: string; colorEnd: string
}) {
  const pct = ((value - 1) / 9) * 100
  const color = `hsl(${(pct / 100) * 120}, 80%, 52%)`
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <span className="text-[13px] font-black" style={{ color: "#FAFAFA" }}>{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="data-mono font-black text-[24px]" style={{ color }}>{value}</span>
          <span className="text-[10px]" style={{ color: "rgba(250,250,250,0.3)" }}>/10</span>
        </div>
      </div>
      <div className="relative h-10 flex items-center">
        <div className="absolute left-0 right-0 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-full rounded-full transition-all duration-150"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${colorStart}, ${colorEnd})` }} />
        </div>
        <input type="range" min={1} max={10} value={value} onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" style={{ zIndex: 2 }} />
        <div className="absolute pointer-events-none h-5 w-5 rounded-full border-2 shadow-lg"
          style={{ left: `calc(${pct}% - 10px)`, background: color, borderColor: "rgba(255,255,255,0.6)", boxShadow: `0 0 12px ${color}88`, zIndex: 1 }} />
      </div>
      <div className="flex justify-between px-0.5">
        <span className="text-[10px]" style={{ color: "rgba(250,250,250,0.2)" }}>Très bas</span>
        <span className="text-[10px]" style={{ color: "rgba(250,250,250,0.2)" }}>Excellent</span>
      </div>
    </div>
  )
}

function CheckinModal({ onClose }: { onClose: () => void }) {
  const [humeur, setHumeur] = useState(7)
  const [forme, setForme] = useState(7)
  const [notes, setNotes] = useState("")
  const [saved, setSaved] = useState(false)

  function save() {
    hapticFeedback()
    const profile = localStorage.getItem("pp_active_profile") ?? "dydz"
    const today = new Date().toISOString().split("T")[0]
    const key = `pp_checkins_${profile}`
    const existing = JSON.parse(localStorage.getItem(key) ?? "[]") as CheckinData[]
    const filtered = existing.filter(c => c.date !== today)
    filtered.unshift({ date: today, humeur, forme, notes })
    localStorage.setItem(key, JSON.stringify(filtered.slice(0, 90)))
    setSaved(true)
    setTimeout(onClose, 1100)
  }

  const avg = Math.round((humeur + forme) / 2)
  const avgColor = avg >= 7 ? "#22C55E" : avg >= 5 ? "#F4D03F" : "#EF4444"
  const avgEmoji = avg >= 8 ? "🔥" : avg >= 6 ? "✅" : avg >= 4 ? "😐" : "😴"

  return (
    <motion.div className="fixed inset-0 z-[60] flex flex-col justify-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
        onClick={onClose} />
      <motion.div className="relative rounded-t-[32px] overflow-hidden"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "88vh", overflowY: "auto" }}>

        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>

        <div className="px-5 pb-10 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(212,175,55,0.7)" }}>Bien-être quotidien</p>
              <h2 className="text-[22px] font-black" style={{ color: "#FAFAFA" }}>Check-in<span style={{ color: "var(--gold)" }}>.</span></h2>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-2xl"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <X size={16} style={{ color: "rgba(250,250,250,0.5)" }} />
            </motion.button>
          </div>

          {/* Score preview */}
          <div className="flex items-center gap-3 p-3 rounded-[18px]"
            style={{ background: `${avgColor}0d`, border: `1px solid ${avgColor}22` }}>
            <span className="text-2xl">{avgEmoji}</span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: `${avgColor}99` }}>Score du jour</p>
              <p className="data-mono font-black text-[18px]" style={{ color: avgColor }}>{avg}/10</p>
            </div>
          </div>

          {/* Sliders */}
          <SliderField label="Humeur" emoji="😊" value={humeur} onChange={setHumeur}
            colorStart="#F4D03F" colorEnd="#22C55E" />
          <SliderField label="Forme physique" emoji="⚡" value={forme} onChange={setForme}
            colorStart="#3B82F6" colorEnd="#A855F7" />

          {/* Notes */}
          <div className="space-y-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(250,250,250,0.32)" }}>Note du jour (optionnel)</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Comment tu te sens ?"
              className="w-full bg-transparent text-[13px] outline-none resize-none"
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14, padding: "12px 14px", color: "#FAFAFA",
              }} />
          </div>

          {/* Save */}
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.div key="saved" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="w-full py-4 rounded-[22px] flex items-center justify-center gap-2 font-black"
                style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#22C55E" }}>
                ✓ Check-in enregistré !
              </motion.div>
            ) : (
              <motion.button key="btn" whileTap={{ scale: 0.97 }} onClick={save}
                className="w-full py-4 rounded-[22px] flex items-center justify-center gap-2 font-black text-sm touch-feedback"
                style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.08))", border: "1px solid rgba(212,175,55,0.3)", color: "var(--gold)" }}>
                <Sparkles size={15} />
                Valider mon check-in
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════
   BOBOS MODAL — Body Pain Map
═══════════════════════════════════════════════ */
type PainType = "douleur aiguë" | "gêne" | "raideur" | "crampe"
type PainEntry = {
  id: string
  date: string
  zone: string
  zoneLabel: string
  intensity: number
  type: PainType
  notes: string
}

type PainZone = { id: string; label: string; cx: number; cy: number; r: number }

const PAIN_ZONES: PainZone[] = [
  { id: "cou",        label: "Cou / Nuque",    cx: 100, cy: 70,  r: 13 },
  { id: "epaule_g",   label: "Épaule G.",       cx: 58,  cy: 100, r: 15 },
  { id: "epaule_d",   label: "Épaule D.",       cx: 142, cy: 100, r: 15 },
  { id: "dos",        label: "Dos / Lombaires", cx: 100, cy: 168, r: 18 },
  { id: "hanche_g",   label: "Hanche G.",       cx: 72,  cy: 202, r: 14 },
  { id: "hanche_d",   label: "Hanche D.",       cx: 128, cy: 202, r: 14 },
  { id: "genou_g",    label: "Genou G.",         cx: 74,  cy: 285, r: 15 },
  { id: "genou_d",    label: "Genou D.",         cx: 126, cy: 285, r: 15 },
  { id: "mollet_g",   label: "Mollet G.",        cx: 74,  cy: 320, r: 13 },
  { id: "mollet_d",   label: "Mollet D.",        cx: 126, cy: 320, r: 13 },
  { id: "cheville_g", label: "Cheville G.",      cx: 72,  cy: 355, r: 12 },
  { id: "cheville_d", label: "Cheville D.",      cx: 128, cy: 355, r: 12 },
]

const PAIN_TYPES: { value: PainType; emoji: string }[] = [
  { value: "douleur aiguë", emoji: "⚡" },
  { value: "gêne",          emoji: "😣" },
  { value: "raideur",       emoji: "🧊" },
  { value: "crampe",        emoji: "⚙️" },
]

function BodyMap({ selected, onSelect, activeZones }: {
  selected: string | null
  onSelect: (id: string) => void
  activeZones: Set<string>
}) {
  return (
    <svg viewBox="0 0 200 400" width="160" height="320" style={{ display: "block", margin: "0 auto" }}>
      {/* Body silhouette */}
      {/* Head */}
      <circle cx="100" cy="38" r="27" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
      {/* Neck */}
      <rect x="91" y="64" width="18" height="18" rx="4" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      {/* Torso */}
      <rect x="56" y="80" width="88" height="120" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
      {/* Left arm */}
      <rect x="32" y="84" width="25" height="95" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
      {/* Right arm */}
      <rect x="143" y="84" width="25" height="95" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
      {/* Left leg */}
      <rect x="58" y="198" width="36" height="150" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
      {/* Right leg */}
      <rect x="106" y="198" width="36" height="150" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />

      {/* Pain zone hotspots */}
      {PAIN_ZONES.map(z => {
        const isSel = selected === z.id
        const isActive = activeZones.has(z.id)
        return (
          <g key={z.id} onClick={() => onSelect(z.id)} style={{ cursor: "pointer" }}>
            <circle cx={z.cx} cy={z.cy} r={z.r + 6} fill="transparent" />
            <circle cx={z.cx} cy={z.cy} r={z.r}
              fill={isSel ? "rgba(239,68,68,0.45)" : isActive ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.07)"}
              stroke={isSel ? "#EF4444" : isActive ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.18)"}
              strokeWidth={isSel ? 2 : 1}
              style={{ transition: "all 0.18s" }}
            />
            {isActive && !isSel && (
              <circle cx={z.cx} cy={z.cy} r={4} fill="rgba(239,68,68,0.7)" />
            )}
            {isSel && (
              <circle cx={z.cx} cy={z.cy} r={5} fill="#EF4444">
                <animate attributeName="r" values="5;8;5" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function BobosModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [intensity, setIntensity] = useState(5)
  const [painType, setPainType] = useState<PainType>("gêne")
  const [notes, setNotes] = useState("")
  const [saved, setSaved] = useState(false)
  const [entries, setEntries] = useState<PainEntry[]>([])

  useEffect(() => {
    const profile = localStorage.getItem("pp_active_profile") ?? "dydz"
    const data = JSON.parse(localStorage.getItem(`pp_bobos_${profile}`) ?? "[]") as PainEntry[]
    setEntries(data)
  }, [])

  const activeZones = new Set(entries.map(e => e.zone))
  const selectedZone = PAIN_ZONES.find(z => z.id === selected)

  function save() {
    if (!selected) return
    hapticFeedback()
    const profile = localStorage.getItem("pp_active_profile") ?? "dydz"
    const today = new Date().toISOString().split("T")[0]
    const entry: PainEntry = {
      id: `${Date.now()}`,
      date: today,
      zone: selected,
      zoneLabel: selectedZone?.label ?? selected,
      intensity,
      type: painType,
      notes,
    }
    const updated = [entry, ...entries.filter(e => !(e.zone === selected && e.date === today))].slice(0, 100)
    localStorage.setItem(`pp_bobos_${localStorage.getItem("pp_active_profile") ?? "dydz"}`, JSON.stringify(updated))
    setEntries(updated)
    setSaved(true)
    setTimeout(() => { setSaved(false); setSelected(null); setNotes("") }, 1200)
  }

  const intensityColor = intensity >= 8 ? "#EF4444" : intensity >= 5 ? "#FF6B1A" : "#F4D03F"

  return (
    <motion.div className="fixed inset-0 z-[60] flex flex-col justify-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(14px)" }}
        onClick={onClose} />
      <motion.div className="relative rounded-t-[32px] overflow-hidden"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "94vh", overflowY: "auto" }}>

        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>

        <div className="px-5 pb-10 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(239,68,68,0.7)" }}>Suivi des douleurs</p>
              <h2 className="text-[22px] font-black" style={{ color: "#FAFAFA" }}>Journal des Bobos<span style={{ color: "#EF4444" }}>.</span></h2>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-2xl"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <X size={16} style={{ color: "rgba(250,250,250,0.5)" }} />
            </motion.button>
          </div>

          <p className="text-[12px]" style={{ color: "rgba(250,250,250,0.42)" }}>
            Tape sur la zone douloureuse pour l'enregistrer
          </p>

          {/* Body map */}
          <div className="rounded-[22px] py-4" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(239,68,68,0.1)" }}>
            <BodyMap selected={selected} onSelect={id => { hapticFeedback(); setSelected(id); setSaved(false) }} activeZones={activeZones} />
          </div>

          {/* Selected zone detail */}
          <AnimatePresence mode="wait">
            {selected && selectedZone && (
              <motion.div key={selected} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Zone label */}
                <div className="flex items-center gap-2 p-3 rounded-[16px]"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#EF4444" }} />
                  <p className="font-black text-sm" style={{ color: "#EF4444" }}>{selectedZone.label}</p>
                </div>

                {/* Intensity */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(250,250,250,0.32)" }}>Intensité</p>
                    <span className="data-mono font-black text-[18px]" style={{ color: intensityColor }}>{intensity}/10</span>
                  </div>
                  <div className="relative h-8 flex items-center">
                    <div className="absolute left-0 right-0 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(intensity - 1) / 9 * 100}%`, background: `linear-gradient(90deg, #F4D03F, #EF4444)`, transition: "width 0.15s" }} />
                    </div>
                    <input type="range" min={1} max={10} value={intensity} onChange={e => setIntensity(Number(e.target.value))}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer" />
                    <div className="absolute pointer-events-none w-5 h-5 rounded-full border-2"
                      style={{ left: `calc(${(intensity - 1) / 9 * 100}% - 10px)`, background: intensityColor, borderColor: "rgba(255,255,255,0.6)", boxShadow: `0 0 10px ${intensityColor}88` }} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px]" style={{ color: "rgba(250,250,250,0.2)" }}>Légère</span>
                    <span className="text-[9px]" style={{ color: "rgba(250,250,250,0.2)" }}>Insupportable</span>
                  </div>
                </div>

                {/* Pain type */}
                <div className="space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(250,250,250,0.32)" }}>Type</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PAIN_TYPES.map(({ value, emoji }) => (
                      <motion.button key={value} whileTap={{ scale: 0.95 }}
                        onClick={() => { hapticFeedback(); setPainType(value) }}
                        className="py-2.5 px-3 rounded-[14px] text-[11px] font-black flex items-center gap-2 touch-feedback"
                        style={{
                          background: painType === value ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${painType === value ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"}`,
                          color: painType === value ? "#EF4444" : "rgba(250,250,250,0.45)",
                        }}>
                        <span>{emoji}</span>{value}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  placeholder="Détails (depuis quand, déclencheur…)"
                  className="w-full bg-transparent text-[12px] outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "10px 14px", color: "#FAFAFA" }} />

                {/* Save */}
                <AnimatePresence mode="wait">
                  {saved ? (
                    <motion.div key="ok" initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                      className="w-full py-3.5 rounded-[18px] flex items-center justify-center font-black"
                      style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#22C55E" }}>
                      ✓ Bobo enregistré !
                    </motion.div>
                  ) : (
                    <motion.button key="save" whileTap={{ scale: 0.97 }} onClick={save}
                      className="w-full py-3.5 rounded-[18px] flex items-center justify-center gap-2 font-black text-sm touch-feedback"
                      style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444" }}>
                      Enregistrer cette douleur
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent bobos */}
          {entries.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "rgba(239,68,68,0.12)" }} />
                <span className="text-[8px] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(239,68,68,0.35)" }}>Récents</span>
                <div className="flex-1 h-px" style={{ background: "rgba(239,68,68,0.12)" }} />
              </div>
              {entries.slice(0, 5).map(e => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-[14px]"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: e.intensity >= 7 ? "rgba(239,68,68,0.12)" : "rgba(255,107,26,0.12)", border: `1px solid ${e.intensity >= 7 ? "rgba(239,68,68,0.2)" : "rgba(255,107,26,0.2)"}` }}>
                    <span className="data-mono font-black text-[11px]" style={{ color: e.intensity >= 7 ? "#EF4444" : "#FF6B1A" }}>{e.intensity}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold truncate" style={{ color: "#FAFAFA" }}>{e.zoneLabel}</p>
                    <p className="text-[10px]" style={{ color: "rgba(250,250,250,0.35)" }}>{e.type} · {e.date.slice(5).replace("-", "/")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════
   NUTRITION SCAN MODAL
═══════════════════════════════════════════════ */
type NutritionResult = {
  foods: string[]
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  healthScore: number
  advice: string
}

function NutritionScanModal({ onClose }: { onClose: () => void }) {
  const [image, setImage] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<string>("image/jpeg")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<NutritionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setMediaType(file.type || "image/jpeg")
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      setImage(dataUrl)
      setResult(null)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  async function analyze() {
    if (!image) return
    setLoading(true)
    setError(null)
    try {
      const base64 = image.split(",")[1]
      const res = await fetch("/api/ai/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      })
      if (!res.ok) throw new Error("Erreur serveur")
      const data: NutritionResult = await res.json()
      setResult(data)
    } catch {
      setError("Impossible d'analyser cette image. Réessaie.")
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = result ? (result.healthScore >= 70 ? "#22C55E" : result.healthScore >= 45 ? "#F4D03F" : "#EF4444") : "#3B82F6"

  return (
    <motion.div className="fixed inset-0 z-[60] flex flex-col justify-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
        onClick={onClose} />
      <motion.div className="relative rounded-t-[32px] overflow-hidden"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "92vh", overflowY: "auto" }}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>
        <div className="px-5 pb-10 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(59,130,246,0.7)" }}>Intelligence Nutritionnelle</p>
              <h2 className="text-[20px] font-black" style={{ color: "#FAFAFA" }}>Scan<span style={{ color: "#3B82F6" }}>.</span></h2>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-2xl"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <X size={16} style={{ color: "rgba(250,250,250,0.5)" }} />
            </motion.button>
          </div>

          {!image ? (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { hapticFeedback(); fileRef.current?.click() }}
              className="w-full flex flex-col items-center gap-4 py-12 rounded-[24px] touch-feedback"
              style={{ background: "rgba(59,130,246,0.06)", border: "2px dashed rgba(59,130,246,0.25)" }}>
              <div className="w-14 h-14 rounded-[20px] flex items-center justify-center"
                style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" }}>
                <Camera size={24} style={{ color: "#3B82F6" }} />
              </div>
              <div className="text-center">
                <p className="font-black" style={{ color: "#FAFAFA" }}>Prendre une photo</p>
                <p className="text-[12px] mt-1" style={{ color: "rgba(250,250,250,0.38)" }}>ou importer depuis la galerie</p>
              </div>
            </motion.button>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-[20px] overflow-hidden" style={{ aspectRatio: "4/3" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Repas scanné" className="w-full h-full object-cover" />
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={() => { setImage(null); setResult(null); setError(null) }}
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-xl"
                  style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
                  <X size={14} style={{ color: "#FAFAFA" }} />
                </motion.button>
              </div>
              {!result && !loading && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => { hapticFeedback(); analyze() }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[18px] font-bold touch-feedback"
                  style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.12))", border: "1px solid rgba(59,130,246,0.35)", color: "#3B82F6" }}>
                  <Sparkles size={15} />
                  Analyser avec l&apos;IA
                </motion.button>
              )}
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

          {loading && (
            <div className="flex items-center justify-center gap-3 py-6">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 rounded-full border-2 flex-shrink-0"
                style={{ borderColor: "rgba(59,130,246,0.2)", borderTopColor: "#3B82F6" }} />
              <span className="text-sm font-medium" style={{ color: "rgba(250,250,250,0.4)" }}>Analyse en cours…</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-[16px]"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
              <AlertCircle size={16} style={{ color: "#EF4444" }} />
              <p className="text-[13px]" style={{ color: "rgba(250,250,250,0.65)" }}>{error}</p>
            </div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-[20px]"
                style={{ background: `${scoreColor}0a`, border: `1px solid ${scoreColor}20` }}>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: `${scoreColor}88` }}>Score nutritionnel</p>
                  <p className="data-mono font-black text-[32px] leading-none mt-1" style={{ color: scoreColor }}>{result.healthScore}</p>
                </div>
                <div className="text-right">
                  <p className="data-mono font-black text-[22px]" style={{ color: "#F4D03F" }}>{result.calories}</p>
                  <p className="text-[10px]" style={{ color: "rgba(250,250,250,0.35)" }}>kcal</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Protéines", val: result.protein, color: "#EF4444", unit: "g" },
                  { label: "Glucides",  val: result.carbs,   color: "#F4D03F", unit: "g" },
                  { label: "Lipides",   val: result.fat,     color: "#3B82F6", unit: "g" },
                ].map(({ label, val, color, unit }) => (
                  <div key={label} className="rounded-[16px] p-3 text-center"
                    style={{ background: `${color}0a`, border: `1px solid ${color}18` }}>
                    <p className="data-mono font-black text-[18px]" style={{ color }}>{val}<span className="text-[10px] font-medium ml-0.5">{unit}</span></p>
                    <p className="text-[9px] mt-0.5" style={{ color: "rgba(250,250,250,0.4)" }}>{label}</p>
                  </div>
                ))}
              </div>
              {result.foods.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(250,250,250,0.32)" }}>Aliments détectés</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.foods.map(f => (
                      <span key={f} className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(250,250,250,0.75)" }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-4 rounded-[18px]"
                style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)" }}>
                <Sparkles size={14} style={{ color: "var(--gold)", flexShrink: 0, marginTop: 1 }} />
                <p className="text-[12px] leading-relaxed" style={{ color: "rgba(250,250,250,0.7)" }}>{result.advice}</p>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setImage(null); setResult(null); fileRef.current?.click() }}
                className="w-full py-3 rounded-[16px] text-[12px] font-bold touch-feedback"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(250,250,250,0.5)" }}>
                Scanner un autre repas
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════
   TABBAR
═══════════════════════════════════════════════ */
export default function TabBar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const navRef    = useRef<HTMLDivElement>(null)
  const itemRefs  = useRef<(HTMLAnchorElement | null)[]>([])
  const [bubble,        setBubble]        = useState<{ left: number; width: number } | null>(null)
  const [ready,         setReady]         = useState(false)
  const [visible,       setVisible]       = useState(true)
  const [fabOpen,       setFabOpen]       = useState(false)
  const [nutritionOpen, setNutritionOpen] = useState(false)
  const [checkinOpen,   setCheckinOpen]   = useState(false)
  const [bobosOpen,     setBobosOpen]     = useState(false)
  const lastScrollY = useRef(0)
  const ticking    = useRef(false)

  const activeIdx = tabs.findIndex(t => pathname === t.href || pathname.startsWith(t.href + "/"))

  useLayoutEffect(() => {
    const nav    = navRef.current
    const active = itemRefs.current[activeIdx]
    if (!nav || !active || activeIdx < 0) return
    const nRect = nav.getBoundingClientRect()
    const aRect = active.getBoundingClientRect()
    const left  = aRect.left - nRect.left + aRect.width / 2 - 22
    setBubble({ left, width: 44 })
    if (!ready) setTimeout(() => setReady(true), 60)
  }, [activeIdx, ready])

  useEffect(() => {
    const container = document.getElementById("app-scroll")
    if (!container) return
    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        const current = container.scrollTop
        const delta   = current - lastScrollY.current
        if (current < 60)       setVisible(true)
        else if (delta > 6)     setVisible(false)
        else if (delta < -6)    setVisible(true)
        lastScrollY.current = current
        ticking.current = false
      })
    }
    container.addEventListener("scroll", onScroll, { passive: true })
    return () => container.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setVisible(true)
    lastScrollY.current = 0
    setFabOpen(false)
  }, [pathname])

  const handleFabAction = useCallback((action: FabAction) => {
    hapticFeedback()
    setFabOpen(false)
    if (action.id === "nutrition") setTimeout(() => setNutritionOpen(true), 180)
    else if (action.id === "checkin") setTimeout(() => setCheckinOpen(true), 180)
    else if (action.id === "bobos")   setTimeout(() => setBobosOpen(true), 180)
    else if (action.href)             router.push(action.href)
  }, [router])

  return (
    <>
      {/* FAB Overlay */}
      <AnimatePresence>
        {fabOpen && (
          <motion.div className="fixed inset-0 z-40 flex flex-col justify-end"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setFabOpen(false)}
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)" }}>
            <motion.div className="flex flex-col gap-2.5 px-5 pb-40"
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}>
              {FAB_ACTIONS.map((action, i) => (
                <motion.button key={action.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: (FAB_ACTIONS.length - 1 - i) * 0.05, duration: 0.25 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleFabAction(action)}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-[22px] touch-feedback text-left"
                  style={{ background: action.color, border: `1px solid ${action.border}`, ...lgStyle(action.color) }}>
                  <span className="text-2xl flex-shrink-0">{action.emoji}</span>
                  <div>
                    <p className="font-black text-sm" style={{ color: "#FAFAFA" }}>{action.label}</p>
                    <p className="text-[11px]" style={{ color: "rgba(250,250,250,0.42)" }}>{action.sub}</p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {nutritionOpen && <NutritionScanModal onClose={() => setNutritionOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {checkinOpen && <CheckinModal onClose={() => setCheckinOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {bobosOpen && <BobosModal onClose={() => setBobosOpen(false)} />}
      </AnimatePresence>

      {/* Tab Bar */}
      <motion.nav
        className="fixed bottom-0 left-0 right-0 z-50 no-select flex justify-center"
        animate={{ y: visible ? 0 : 120 }}
        transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.8 }}
        style={{ paddingBottom: "var(--safe-bottom)", willChange: "transform" }}>

        <div className="relative flex justify-center mx-4 mb-4" style={{ width: "calc(100vw - 32px)", maxWidth: 600 }}>
          {/* Pill */}
          <div ref={navRef} className="relative flex items-center w-full overflow-hidden"
            style={{ height: 64, ...pillGlass, borderRadius: 28 }}>

            {bubble && activeIdx >= 0 && (
              <motion.div
                animate={{ left: bubble.left, width: bubble.width }}
                transition={ready ? { type: "spring", stiffness: 340, damping: 30 } : { duration: 0 }}
                className="absolute pointer-events-none"
                style={{ top: 9, height: 32, ...activeBubble }} />
            )}

            {/* Left 3 tabs */}
            {LEFT_TABS.map(({ href, label, Icon }, i) => {
              const active = activeIdx === i
              return (
                <Link key={href} href={href}
                  ref={el => { itemRefs.current[i] = el }}
                  onClick={hapticFeedback}
                  className="relative z-10 flex flex-col items-center justify-center gap-0.5 no-select touch-feedback"
                  style={{ flex: 1, height: 64 }}>
                  <motion.div animate={active ? { scale: 1.06 } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    className="flex items-center justify-center" style={{ width: 32, height: 26 }}>
                    <Icon size={19} strokeWidth={active ? 2.2 : 1.6}
                      style={{ color: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.35)", filter: active ? "drop-shadow(0 0 6px rgba(255,255,255,0.6))" : "none", transition: "color 0.22s, filter 0.22s" }} />
                  </motion.div>
                  <span className="text-[8px] font-semibold tracking-wide"
                    style={{ color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.28)", transition: "color 0.22s" }}>
                    {label}
                  </span>
                </Link>
              )
            })}

            {/* Center gap for FAB */}
            <div style={{ width: 72, flexShrink: 0 }} />

            {/* Right 2 tabs */}
            {RIGHT_TABS.map(({ href, label, Icon }, i) => {
              const tabI = i + LEFT_TABS.length
              const active = activeIdx === tabI
              return (
                <Link key={href} href={href}
                  ref={el => { itemRefs.current[tabI] = el }}
                  onClick={hapticFeedback}
                  className="relative z-10 flex flex-col items-center justify-center gap-0.5 no-select touch-feedback"
                  style={{ flex: 1, height: 64 }}>
                  <motion.div animate={active ? { scale: 1.06 } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    className="flex items-center justify-center" style={{ width: 32, height: 26 }}>
                    <Icon size={19} strokeWidth={active ? 2.2 : 1.6}
                      style={{ color: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.35)", filter: active ? "drop-shadow(0 0 6px rgba(255,255,255,0.6))" : "none", transition: "color 0.22s, filter 0.22s" }} />
                  </motion.div>
                  <span className="text-[8px] font-semibold tracking-wide"
                    style={{ color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.28)", transition: "color 0.22s" }}>
                    {label}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* FAB */}
          <motion.button
            onClick={() => { hapticFeedback(); setFabOpen(f => !f) }}
            className="absolute left-1/2 -translate-x-1/2 touch-feedback"
            style={{ bottom: 8, zIndex: 10 }}
            whileTap={{ scale: 0.92 }}
            animate={{ rotate: fabOpen ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 18,
              background: fabOpen
                ? "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))"
                : "linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)",
              boxShadow: fabOpen
                ? "0 4px 16px rgba(0,0,0,0.4)"
                : "0 4px 20px rgba(212,175,55,0.5), 0 0 0 1px rgba(212,175,55,0.35), inset 0 1px 0 rgba(255,255,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: fabOpen ? "1px solid rgba(255,255,255,0.2)" : "none",
              transition: "background 0.22s, box-shadow 0.22s",
            }}>
              {fabOpen
                ? <X size={22} strokeWidth={2.5} style={{ color: "rgba(255,255,255,0.8)" }} />
                : <Plus size={24} strokeWidth={2.5} style={{ color: "#050505" }} />}
            </div>
          </motion.button>
        </div>
      </motion.nav>
    </>
  )
}

/* ── unused imports suppression ── */
void ChevronDown
void Send
