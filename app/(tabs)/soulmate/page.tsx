"use client"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Heart, Users, Send, ShoppingCart, Image as ImageIcon,
  X, Sparkles, ChevronRight, Trash2, Plus,
} from "lucide-react"
import { hapticFeedback, lgStyle } from "@/lib/utils"
import LogoPP from "@/components/ui/LogoPP"

/* ── Types ── */
type Profile = "dydz" | "mans"
type Nudge = { id: string; from: Profile; to: Profile; message: string; date: string; read: boolean }
type SharedPhoto = { id: string; author: Profile; dataUrl: string; caption: string; date: string }
type CheckinData = { date: string; humeur: number; forme: number; notes: string }
type PainEntry = { id: string; date: string; zone: string; zoneLabel: string; intensity: number; type: string; notes: string }
type GroceryItem = { name: string; category: string; quantity: string }

/* ── Partner data (Manon mock) ── */
const MANS_MOCK = {
  name: "Manon",
  avatar: "mans",
  recentRun: { km: 8.2, pace: "5:45", date: "Hier" },
  weeklyKm: 24,
  totalRuns: 47,
  checkin: { humeur: 8, forme: 7 },
  streak: 5,
}

const NUDGE_PRESETS = [
  { emoji: "🔥", text: "Tu assures, continue comme ça !" },
  { emoji: "💪", text: "Beau run aujourd'hui !" },
  { emoji: "🏆", text: "On est inarrêtables ensemble !" },
  { emoji: "❤️",  text: "Je pense à toi, bonne séance !" },
  { emoji: "🎯", text: "Objectif en vue, lâche rien !" },
  { emoji: "😴", text: "N'oublie pas de te reposer !" },
]

/* ── Helpers ── */
function getProfile(): Profile {
  if (typeof window === "undefined") return "dydz"
  return (localStorage.getItem("pp_active_profile") ?? "dydz") as Profile
}
function partner(p: Profile): Profile { return p === "dydz" ? "mans" : "dydz" }
function getCheckins(p: Profile): CheckinData[] {
  try { return JSON.parse(localStorage.getItem(`pp_checkins_${p}`) ?? "[]") } catch { return [] }
}
function getBobos(p: Profile): PainEntry[] {
  try { return JSON.parse(localStorage.getItem(`pp_bobos_${p}`) ?? "[]") } catch { return [] }
}
function getNudges(p: Profile): Nudge[] {
  try { return JSON.parse(localStorage.getItem(`pp_nudges_${p}`) ?? "[]") } catch { return [] }
}
function getPhotos(): SharedPhoto[] {
  try { return JSON.parse(localStorage.getItem("pp_shared_photos") ?? "[]") } catch { return [] }
}

/* ── Avatar initials ── */
function Avatar({ profile, size = 40 }: { profile: Profile; size?: number }) {
  const initials = profile === "dydz" ? "DY" : "MA"
  const bg = profile === "dydz" ? "linear-gradient(135deg, #D4AF37, #B8962E)" : "linear-gradient(135deg, #A855F7, #7C3AED)"
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.35, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 900, fontSize: size * 0.32, color: "#FAFAFA", letterSpacing: "-0.02em" }}>{initials}</span>
    </div>
  )
}

/* ── Section divider ── */
function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(212,175,55,0.25), transparent)" }} />
      <span className="text-[8px] font-bold uppercase tracking-[0.25em]" style={{ color: "rgba(212,175,55,0.4)" }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(270deg, rgba(212,175,55,0.25), transparent)" }} />
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MY CHECKIN CARD
═══════════════════════════════════════════════ */
function MyCheckinCard({ profile }: { profile: Profile }) {
  const checkins = getCheckins(profile)
  const today = new Date().toISOString().split("T")[0]
  const todayCheckin = checkins.find(c => c.date === today)

  if (!todayCheckin) {
    return (
      <div className="rounded-[20px] p-4 flex items-center gap-3"
        style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.12)" }}>
        <span className="text-2xl">🌅</span>
        <div>
          <p className="text-[12px] font-black" style={{ color: "#FAFAFA" }}>Pas encore de check-in</p>
          <p className="text-[10px] mt-0.5" style={{ color: "rgba(250,250,250,0.38)" }}>Fais ton check-in via le bouton +</p>
        </div>
      </div>
    )
  }

  const avg = Math.round((todayCheckin.humeur + todayCheckin.forme) / 2)
  const color = avg >= 7 ? "#22C55E" : avg >= 5 ? "#F4D03F" : "#EF4444"
  const emoji = avg >= 8 ? "🔥" : avg >= 6 ? "✅" : avg >= 4 ? "😐" : "😴"

  return (
    <div className="rounded-[20px] p-4 space-y-3"
      style={{ background: `${color}0a`, border: `1px solid ${color}18` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <p className="text-[12px] font-black" style={{ color: "#FAFAFA" }}>Mon check-in du jour</p>
        </div>
        <span className="data-mono font-black text-[18px]" style={{ color }}>{avg}/10</span>
      </div>
      <div className="flex gap-4">
        {[
          { label: "Humeur", val: todayCheckin.humeur, emoji: "😊" },
          { label: "Forme",  val: todayCheckin.forme,  emoji: "⚡" },
        ].map(({ label, val, emoji: e }) => (
          <div key={label} className="flex-1 flex items-center gap-2">
            <span className="text-base">{e}</span>
            <div className="flex-1">
              <div className="flex justify-between mb-0.5">
                <span className="text-[9px]" style={{ color: "rgba(250,250,250,0.35)" }}>{label}</span>
                <span className="data-mono text-[10px] font-black" style={{ color }}>{val}/10</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full" style={{ width: `${(val / 10) * 100}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   PARTNER OVERVIEW CARD
═══════════════════════════════════════════════ */
function PartnerCard({ myProfile }: { myProfile: Profile }) {
  const partnerProfile = partner(myProfile)
  const isManon = partnerProfile === "mans"
  const data = isManon ? MANS_MOCK : null
  const partnerCheckins = isManon ? null : getCheckins(partnerProfile)
  const partnerToday = partnerCheckins?.find(c => c.date === new Date().toISOString().split("T")[0])

  const accentColor = partnerProfile === "mans" ? "#A855F7" : "#D4AF37"
  const name = partnerProfile === "dydz" ? "Dylan" : "Manon"

  const humeur = isManon ? MANS_MOCK.checkin.humeur : (partnerToday?.humeur ?? null)
  const forme = isManon ? MANS_MOCK.checkin.forme : (partnerToday?.forme ?? null)

  return (
    <div className="rounded-[22px] overflow-hidden"
      style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}18` }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}55, transparent)` }} />

      <div className="p-4 space-y-4 relative">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar profile={partnerProfile} size={44} />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: `${accentColor}88` }}>Partenaire</p>
              <p className="font-black text-[16px]" style={{ color: "#FAFAFA" }}>{name}</p>
            </div>
          </div>
          {data && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#22C55E" }} />
              <span className="text-[9px] font-black" style={{ color: "#22C55E" }}>{data.streak}j streak</span>
            </div>
          )}
        </div>

        {/* Stats row */}
        {data && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Run récent", val: `${data.recentRun.km}km`, sub: data.recentRun.date },
              { label: "Cette semaine", val: `${data.weeklyKm}km`, sub: "total" },
              { label: "Total runs", val: `${data.totalRuns}`, sub: "sorties" },
            ].map(({ label, val, sub }) => (
              <div key={label} className="text-center rounded-[14px] py-2.5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="data-mono font-black text-[14px]" style={{ color: "#FAFAFA" }}>{val}</p>
                <p className="text-[8px]" style={{ color: "rgba(250,250,250,0.28)" }}>{sub}</p>
                <p className="text-[7px] mt-0.5" style={{ color: "rgba(250,250,250,0.2)" }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Partner checkin */}
        {(humeur !== null && forme !== null) && (
          <div className="flex gap-3">
            {[{ label: "Humeur", val: humeur, emoji: "😊" }, { label: "Forme", val: forme, emoji: "⚡" }].map(({ label, val, emoji: e }) => (
              <div key={label} className="flex-1 flex items-center gap-2 rounded-[12px] px-3 py-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-sm">{e}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[8px]" style={{ color: "rgba(250,250,250,0.3)" }}>{label}</span>
                    <span className="data-mono text-[10px] font-black" style={{ color: accentColor }}>{val}/10</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(val / 10) * 100}%`, background: accentColor }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   NUDGE SYSTEM
═══════════════════════════════════════════════ */
function NudgeSection({ myProfile }: { myProfile: Profile }) {
  const partnerProfile = partner(myProfile)
  const partnerName = partnerProfile === "mans" ? "Manon" : "Dylan"
  const [received, setReceived] = useState<Nudge[]>([])
  const [sent, setSent] = useState(false)
  const [custom, setCustom] = useState("")
  const [showCustom, setShowCustom] = useState(false)

  useEffect(() => {
    const myNudges = getNudges(myProfile)
    setReceived(myNudges.filter(n => n.to === myProfile && !n.read).slice(0, 3))
  }, [myProfile])

  function sendNudge(text: string) {
    hapticFeedback()
    const nudge: Nudge = {
      id: `${Date.now()}`,
      from: myProfile,
      to: partnerProfile,
      message: text,
      date: new Date().toISOString(),
      read: false,
    }
    const existing = getNudges(partnerProfile)
    localStorage.setItem(`pp_nudges_${partnerProfile}`, JSON.stringify([nudge, ...existing].slice(0, 50)))
    setSent(true)
    setCustom("")
    setShowCustom(false)
    setTimeout(() => setSent(false), 2000)
  }

  function markRead(id: string) {
    const updated = getNudges(myProfile).map(n => n.id === id ? { ...n, read: true } : n)
    localStorage.setItem(`pp_nudges_${myProfile}`, JSON.stringify(updated))
    setReceived(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Received nudges */}
      <AnimatePresence>
        {received.map(nudge => (
          <motion.div key={nudge.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex items-start gap-3 p-3.5 rounded-[18px]"
            style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.18)" }}>
            <span className="text-xl flex-shrink-0">💌</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold" style={{ color: "rgba(168,85,247,0.8)" }}>
                {nudge.from === "mans" ? "Manon" : "Dylan"} t'a envoyé un mot
              </p>
              <p className="text-[13px] mt-0.5 leading-relaxed" style={{ color: "#FAFAFA" }}>{nudge.message}</p>
            </div>
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => markRead(nudge.id)}
              className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <X size={12} style={{ color: "rgba(250,250,250,0.4)" }} />
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Send nudge */}
      <div className="space-y-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(250,250,250,0.32)" }}>
          Envoyer un mot à {partnerName}
        </p>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div key="sent" initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="py-3.5 rounded-[18px] flex items-center justify-center gap-2 font-black"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.22)", color: "#22C55E" }}>
              ✓ Message envoyé !
            </motion.div>
          ) : (
            <motion.div key="presets" className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {NUDGE_PRESETS.map(({ emoji, text }) => (
                  <motion.button key={text} whileTap={{ scale: 0.95 }} onClick={() => sendNudge(`${emoji} ${text}`)}
                    className="text-left px-3 py-3 rounded-[16px] touch-feedback"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <span className="text-base block mb-1">{emoji}</span>
                    <span className="text-[11px] leading-snug" style={{ color: "rgba(250,250,250,0.65)" }}>{text}</span>
                  </motion.button>
                ))}
              </div>

              {/* Custom message */}
              {showCustom ? (
                <div className="flex gap-2">
                  <input value={custom} onChange={e => setCustom(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && custom.trim()) sendNudge(custom.trim()) }}
                    placeholder="Ton message personnel…"
                    className="flex-1 bg-transparent text-[12px] outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.22)", borderRadius: 14, padding: "10px 14px", color: "#FAFAFA" }}
                    autoFocus />
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => custom.trim() && sendNudge(custom.trim())}
                    disabled={!custom.trim()}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(168,85,247,0.18)", border: "1px solid rgba(168,85,247,0.3)" }}>
                    <Send size={14} style={{ color: "#A855F7" }} />
                  </motion.button>
                </div>
              ) : (
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowCustom(true)}
                  className="w-full py-2.5 rounded-[14px] text-[11px] font-bold touch-feedback"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(250,250,250,0.35)" }}>
                  + Message personnalisé
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   SHARED ALBUM
═══════════════════════════════════════════════ */
function SharedAlbum({ myProfile }: { myProfile: Profile }) {
  const [photos, setPhotos] = useState<SharedPhoto[]>([])
  const [caption, setCaption] = useState("")
  const [preview, setPreview] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState<SharedPhoto | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setPhotos(getPhotos()) }, [])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function addPhoto() {
    if (!preview) return
    hapticFeedback()
    const photo: SharedPhoto = {
      id: `${Date.now()}`,
      author: myProfile,
      dataUrl: preview,
      caption,
      date: new Date().toISOString().split("T")[0],
    }
    const updated = [photo, ...photos].slice(0, 30)
    localStorage.setItem("pp_shared_photos", JSON.stringify(updated))
    setPhotos(updated)
    setPreview(null)
    setCaption("")
  }

  function deletePhoto(id: string) {
    hapticFeedback()
    const updated = photos.filter(p => p.id !== id)
    localStorage.setItem("pp_shared_photos", JSON.stringify(updated))
    setPhotos(updated)
  }

  return (
    <div className="space-y-4">
      {/* Add photo */}
      {preview ? (
        <div className="space-y-3">
          <div className="relative rounded-[18px] overflow-hidden" style={{ aspectRatio: "4/3" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="w-full h-full object-cover" />
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setPreview(null); setCaption("") }}
              className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.6)" }}>
              <X size={14} style={{ color: "#FAFAFA" }} />
            </motion.button>
          </div>
          <input value={caption} onChange={e => setCaption(e.target.value)}
            placeholder="Légende (optionnel)…"
            className="w-full bg-transparent text-[12px] outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 14px", color: "#FAFAFA" }} />
          <motion.button whileTap={{ scale: 0.97 }} onClick={addPhoto}
            className="w-full py-3 rounded-[14px] font-bold text-sm touch-feedback"
            style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.25)", color: "var(--gold)" }}>
            Ajouter à l'album
          </motion.button>
        </div>
      ) : (
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => { hapticFeedback(); fileRef.current?.click() }}
          className="w-full flex items-center justify-center gap-3 py-5 rounded-[20px] touch-feedback"
          style={{ background: "rgba(212,175,55,0.04)", border: "2px dashed rgba(212,175,55,0.2)" }}>
          <ImageIcon size={20} style={{ color: "rgba(212,175,55,0.5)" }} />
          <span className="text-[13px] font-bold" style={{ color: "rgba(212,175,55,0.7)" }}>Ajouter une photo</span>
        </motion.button>
      )}

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

      {/* Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {photos.map(photo => (
            <motion.div key={photo.id} className="relative rounded-[16px] overflow-hidden"
              style={{ aspectRatio: "1" }}
              whileTap={{ scale: 0.97 }} onClick={() => setFullscreen(photo)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.dataUrl} alt={photo.caption} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }} />
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <div className="flex items-center justify-between">
                  <Avatar profile={photo.author} size={20} />
                  {photo.caption && <p className="text-[10px] font-medium truncate ml-1.5 flex-1" style={{ color: "#FAFAFA" }}>{photo.caption}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-center text-[12px] py-4" style={{ color: "rgba(250,250,250,0.25)" }}>
          Votre album partagé est vide
        </p>
      )}

      {/* Fullscreen */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div className="fixed inset-0 z-[70] flex flex-col items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: "rgba(0,0,0,0.92)" }}
            onClick={() => setFullscreen(null)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fullscreen.dataUrl} alt={fullscreen.caption} className="max-w-full max-h-[80vh] object-contain rounded-[16px]" />
            {fullscreen.caption && (
              <p className="mt-4 text-[14px] font-medium" style={{ color: "rgba(250,250,250,0.7)" }}>{fullscreen.caption}</p>
            )}
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={e => { e.stopPropagation(); deletePhoto(fullscreen.id); setFullscreen(null) }}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>
              <Trash2 size={12} />
              Supprimer
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   GROCERY LIST AI
═══════════════════════════════════════════════ */
function GrocerySection({ myProfile }: { myProfile: Profile }) {
  const [items, setItems] = useState<GroceryItem[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`pp_grocery_${myProfile}`) ?? "[]") as GroceryItem[]
      setItems(saved)
    } catch { /* */ }
  }, [myProfile])

  async function generate() {
    hapticFeedback()
    setLoading(true)
    setError(null)
    try {
      const checkins = getCheckins(myProfile).slice(0, 7)
      const bobos = getBobos(myProfile).slice(0, 5)
      const res = await fetch("/api/ai/grocery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: myProfile, checkins, bobos }),
      })
      if (!res.ok) throw new Error()
      const data: { items: GroceryItem[] } = await res.json()
      setItems(data.items)
      setChecked(new Set())
      localStorage.setItem(`pp_grocery_${myProfile}`, JSON.stringify(data.items))
    } catch {
      setError("Impossible de générer la liste. Réessaie.")
    } finally {
      setLoading(false)
    }
  }

  function toggleCheck(name: string) {
    hapticFeedback()
    setChecked(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const grouped = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, GroceryItem[]>)

  const categoryEmoji: Record<string, string> = {
    "Protéines": "🥩",
    "Glucides complexes": "🌾",
    "Produits laitiers": "🥛",
    "Graisses saines": "🥑",
    "Légumes": "🫛",
    "Fruits": "🍌",
    "Compléments": "💊",
    "Divers": "🛒",
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] font-black" style={{ color: "#FAFAFA" }}>Liste de courses IA</p>
          <p className="text-[10px] mt-0.5" style={{ color: "rgba(250,250,250,0.35)" }}>Optimisée pour la perf sportive</p>
        </div>
        <motion.button whileTap={{ scale: 0.93 }} onClick={generate} disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] font-bold text-[11px] touch-feedback"
          style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.22)", color: "var(--gold)" }}>
          {loading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
              className="w-3.5 h-3.5 rounded-full border-2" style={{ borderColor: "rgba(212,175,55,0.2)", borderTopColor: "var(--gold)" }} />
          ) : <Sparkles size={12} />}
          {loading ? "Génère…" : items.length ? "Regénérer" : "Générer"}
        </motion.button>
      </div>

      {error && (
        <p className="text-[12px] px-3 py-2 rounded-[12px]" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#EF4444" }}>{error}</p>
      )}

      {items.length === 0 && !loading && (
        <div className="py-8 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-[20px] flex items-center justify-center"
            style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.12)" }}>
            <ShoppingCart size={22} style={{ color: "rgba(212,175,55,0.4)" }} />
          </div>
          <p className="text-[12px] text-center" style={{ color: "rgba(250,250,250,0.3)" }}>
            Génère ta liste de courses personnalisée<br />adaptée à ta récupération
          </p>
        </div>
      )}

      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <span className="text-sm">{categoryEmoji[cat] ?? "🛒"}</span>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(212,175,55,0.55)" }}>{cat}</p>
          </div>
          {catItems.map(item => (
            <motion.button key={item.name} whileTap={{ scale: 0.98 }} onClick={() => toggleCheck(item.name)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-[14px] touch-feedback"
              style={{ background: checked.has(item.name) ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${checked.has(item.name) ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.06)"}` }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: checked.has(item.name) ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)", border: `1px solid ${checked.has(item.name) ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.12)"}` }}>
                {checked.has(item.name) && <span className="text-[9px]" style={{ color: "#22C55E" }}>✓</span>}
              </div>
              <div className="flex-1 text-left">
                <p className="text-[12px] font-bold" style={{ color: checked.has(item.name) ? "rgba(250,250,250,0.4)" : "#FAFAFA", textDecoration: checked.has(item.name) ? "line-through" : "none" }}>{item.name}</p>
              </div>
              <span className="text-[10px]" style={{ color: "rgba(250,250,250,0.3)" }}>{item.quantity}</span>
            </motion.button>
          ))}
        </div>
      ))}

      {items.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px]" style={{ color: "rgba(250,250,250,0.25)" }}>{checked.size}/{items.length} articles cochés</p>
          {checked.size > 0 && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setChecked(new Set())}
              className="text-[10px] font-bold" style={{ color: "rgba(250,250,250,0.3)" }}>
              Tout décocher
            </motion.button>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MY BOBOS SUMMARY
═══════════════════════════════════════════════ */
function MyBobosSummary({ myProfile }: { myProfile: Profile }) {
  const bobos = getBobos(myProfile).slice(0, 3)
  if (bobos.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(239,68,68,0.55)" }}>Mes douleurs récentes</p>
      {bobos.map(b => (
        <div key={b.id} className="flex items-center gap-3 px-3 py-2.5 rounded-[14px]"
          style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)" }}>
          <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: b.intensity >= 7 ? "rgba(239,68,68,0.15)" : "rgba(255,107,26,0.12)" }}>
            <span className="data-mono font-black text-[10px]" style={{ color: b.intensity >= 7 ? "#EF4444" : "#FF6B1A" }}>{b.intensity}</span>
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold" style={{ color: "#FAFAFA" }}>{b.zoneLabel}</p>
            <p className="text-[9px]" style={{ color: "rgba(250,250,250,0.35)" }}>{b.type}</p>
          </div>
          <p className="text-[9px]" style={{ color: "rgba(250,250,250,0.25)" }}>{b.date.slice(5).replace("-", "/")}</p>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════ */
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } } }

type Tab = "duo" | "messages" | "album" | "courses"
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "duo",     label: "Duo",      emoji: "👫" },
  { id: "messages",label: "Messages", emoji: "💌" },
  { id: "album",   label: "Album",    emoji: "📸" },
  { id: "courses", label: "Courses",  emoji: "🛒" },
]

export default function SoulmatePage() {
  const [myProfile, setMyProfile] = useState<Profile>("dydz")
  const [activeTab, setActiveTab] = useState<Tab>("duo")

  useEffect(() => {
    setMyProfile(getProfile())
  }, [])

  const partnerProfile = partner(myProfile)
  const myName = myProfile === "dydz" ? "Dylan" : "Manon"

  return (
    <motion.div className="flex flex-col gap-5" variants={stagger} initial="hidden" animate="show">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoPP size={30} />
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--gold)" }}>Heritage Elite OS</p>
            <h1 className="text-[20px] font-black tracking-tight leading-none" style={{ color: "#FAFAFA" }}>
              Soulmate<span style={{ color: "var(--gold)" }}>.</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ ...lgStyle("rgba(212,175,55,0.06)"), border: "1px solid rgba(212,175,55,0.15)" }}>
          <Avatar profile={myProfile} size={22} />
          <ChevronRight size={12} style={{ color: "rgba(250,250,250,0.3)" }} />
          <Avatar profile={partnerProfile} size={22} />
        </div>
      </motion.div>

      {/* Profile switcher */}
      <motion.div variants={fadeUp} className="flex gap-2">
        {(["dydz", "mans"] as Profile[]).map(p => (
          <motion.button key={p} whileTap={{ scale: 0.95 }} onClick={() => { hapticFeedback(); setMyProfile(p) }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[16px] font-bold text-[12px] touch-feedback"
            style={{
              background: myProfile === p ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${myProfile === p ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.08)"}`,
              color: myProfile === p ? "var(--gold)" : "rgba(250,250,250,0.35)",
            }}>
            <Avatar profile={p} size={20} />
            {p === "dydz" ? "Dylan" : "Manon"}
          </motion.button>
        ))}
      </motion.div>

      {/* Tab switcher */}
      <motion.div variants={fadeUp} className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {TABS.map(tab => (
          <motion.button key={tab.id} whileTap={{ scale: 0.93 }} onClick={() => { hapticFeedback(); setActiveTab(tab.id) }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black whitespace-nowrap touch-feedback flex-shrink-0"
            style={{
              background: activeTab === tab.id ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${activeTab === tab.id ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.06)"}`,
              color: activeTab === tab.id ? "var(--gold)" : "rgba(250,250,250,0.38)",
            }}>
            <span>{tab.emoji}</span>{tab.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-5">

          {activeTab === "duo" && (
            <>
              <MyCheckinCard profile={myProfile} />
              <MyBobosSummary myProfile={myProfile} />
              <Divider label={`Vue de ${partnerProfile === "mans" ? "Manon" : "Dylan"}`} />
              <PartnerCard myProfile={myProfile} />
            </>
          )}

          {activeTab === "messages" && (
            <>
              <div className="flex items-center gap-3 px-4 py-3 rounded-[18px]"
                style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.14)" }}>
                <Heart size={15} style={{ color: "#A855F7" }} />
                <p className="text-[12px]" style={{ color: "rgba(250,250,250,0.55)" }}>
                  Envoie une pensée à {partnerProfile === "mans" ? "Manon" : "Dylan"} — elle arrive instantanément
                </p>
              </div>
              <NudgeSection myProfile={myProfile} />
            </>
          )}

          {activeTab === "album" && (
            <>
              <div className="flex items-center gap-2 px-1">
                <Users size={14} style={{ color: "rgba(212,175,55,0.6)" }} />
                <p className="text-[11px] font-bold" style={{ color: "rgba(250,250,250,0.45)" }}>
                  Album partagé — {myName} &amp; {partnerProfile === "mans" ? "Manon" : "Dylan"}
                </p>
              </div>
              <SharedAlbum myProfile={myProfile} />
            </>
          )}

          {activeTab === "courses" && (
            <GrocerySection myProfile={myProfile} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 py-2">
        <div className="h-px flex-1" style={{ background: "rgba(212,175,55,0.08)" }} />
        <span className="text-[8px] uppercase tracking-[0.3em]" style={{ color: "rgba(212,175,55,0.2)" }}>PacePulse Soulmate OS</span>
        <div className="h-px flex-1" style={{ background: "rgba(212,175,55,0.08)" }} />
      </motion.div>

    </motion.div>
  )
}

/* suppressed lint */
void Plus
