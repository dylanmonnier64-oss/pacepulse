"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, AlertTriangle } from "lucide-react"
import { getGear, saveGear } from "@/lib/storage"
import { useRuns } from "@/hooks/useRuns"
import type { Gear } from "@/lib/types"
import { generateId, hapticFeedback } from "@/lib/utils"

const MAX_KM = 800
const WARN_KM = 750

// ── Cracked sole SVG animation ────────────────────────────────────────────────
function CrackedSole() {
  return (
    <svg viewBox="0 0 80 40" width={80} height={40} style={{ overflow: "visible" }}>
      {/* Sole outline */}
      <ellipse cx={40} cy={22} rx={36} ry={14} fill="none"
        stroke="rgba(155,89,182,0.6)" strokeWidth={1.5} />
      {/* Toe cap */}
      <path d="M 4 22 Q 4 8 20 8 L 60 8 Q 76 8 76 22"
        fill="none" stroke="rgba(155,89,182,0.6)" strokeWidth={1.5} />
      {/* Crack 1 — heel */}
      <motion.path d="M 12 22 L 18 16 L 22 20 L 28 12"
        fill="none" stroke="#E74C3C" strokeWidth={1.5} strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
      />
      {/* Crack 2 — mid */}
      <motion.path d="M 38 28 L 42 20 L 46 25 L 50 16"
        fill="none" stroke="#E74C3C" strokeWidth={1.2} strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      />
      {/* Crack 3 — toe */}
      <motion.path d="M 60 20 L 64 14 L 68 18"
        fill="none" stroke="#E74C3C" strokeWidth={1} strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
      />
    </svg>
  )
}

// ── Progress bar with Lemon gradient ─────────────────────────────────────────
function ShoeProgressBar({ km }: { km: number }) {
  const pct = Math.min((km / MAX_KM) * 100, 100)
  // Gradient position: 0-33% yellow, 33-66% orange, 66-100% fuchsia
  const gradient = `linear-gradient(90deg, #F4D03F 0%, #E67E22 33%, #C0392B 66%, #9B59B6 100%)`

  return (
    <div className="relative h-2.5 rounded-full overflow-hidden"
      style={{ background: "rgba(255,255,255,0.08)" }}>
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: gradient }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
      />
    </div>
  )
}

// ── Single shoe card ──────────────────────────────────────────────────────────
function ShoeCard({ gear, kmFromRuns, onDelete }: {
  gear: Gear
  kmFromRuns: number
  onDelete: (id: string) => void
}) {
  const totalKm  = kmFromRuns
  const pct      = Math.min((totalKm / MAX_KM) * 100, 100)
  const worn     = totalKm >= MAX_KM
  const almostWorn = totalKm >= WARN_KM && !worn

  const statusColor = worn
    ? "#9B59B6"
    : almostWorn
    ? "#E67E22"
    : totalKm > 400
    ? "#F39C12"
    : "#27AE60"

  return (
    <motion.div
      className="rounded-3xl p-4 relative overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: worn
          ? "1px solid rgba(155,89,182,0.5)"
          : almostWorn
          ? "1px solid rgba(230,126,34,0.4)"
          : "1px solid rgba(255,255,255,0.08)",
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 8px 30px rgba(244,208,63,0.3)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* Glow at max */}
      {worn && (
        <div className="absolute inset-0 pointer-events-none rounded-3xl"
          style={{ background: "radial-gradient(ellipse at top right, rgba(155,89,182,0.15) 0%, transparent 70%)" }} />
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${gear.color || "#F4D03F"}20` }}>
            👟
          </div>
          <div>
            <p className="text-sm font-bold">{gear.name}</p>
            <p className="text-[10px]" style={{ color: "rgba(245,245,245,0.4)" }}>{gear.brand}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {almostWorn && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: "rgba(230,126,34,0.15)", border: "1px solid rgba(230,126,34,0.4)" }}>
              <AlertTriangle size={9} style={{ color: "#E67E22" }} />
              <span className="text-[9px] font-bold" style={{ color: "#E67E22" }}>Bientôt</span>
            </div>
          )}
          <button onClick={() => { hapticFeedback(); onDelete(gear.id) }}
            className="w-6 h-6 flex items-center justify-center rounded-full opacity-30 hover:opacity-70"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <X size={12} />
          </button>
        </div>
      </div>

      <ShoeProgressBar km={totalKm} />

      <div className="flex items-center justify-between mt-2">
        <p className="text-xs font-bold stat-num" style={{ color: statusColor }}>
          {Math.round(totalKm)} km
        </p>
        <p className="text-[10px]" style={{ color: "rgba(245,245,245,0.4)" }}>
          / {MAX_KM} km · {pct.toFixed(0)}%
        </p>
      </div>

      {/* Cracked sole + CTA at 800km */}
      <AnimatePresence>
        {worn && (
          <motion.div
            className="mt-3 pt-3 flex flex-col gap-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="flex items-center gap-3">
              <CrackedSole />
              <div>
                <p className="text-xs font-bold" style={{ color: "#9B59B6" }}>Semelle à bout</p>
                <p className="text-[10px]" style={{ color: "rgba(245,245,245,0.4)" }}>
                  {Math.round(totalKm - MAX_KM)} km au-delà de la limite
                </p>
              </div>
            </div>
            <motion.button
              className="w-full py-2.5 rounded-2xl font-bold text-sm"
              style={{ background: "linear-gradient(135deg, #9B59B6, #C44AFF)", color: "#fff" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => hapticFeedback()}
            >
              Remplacer cette paire →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Add shoe modal ─────────────────────────────────────────────────────────────
function AddShoeModal({ onAdd, onClose }: { onAdd: (g: Gear) => void; onClose: () => void }) {
  const [name, setName]   = useState("")
  const [brand, setBrand] = useState("")
  const COLORS = ["#F4D03F", "#E67E22", "#9B59B6", "#3498DB", "#27AE60", "#E74C3C"]
  const [color, setColor] = useState(COLORS[0])

  const submit = () => {
    if (!name) return
    hapticFeedback()
    onAdd({
      id: generateId(),
      name,
      brand: brand || "Marque inconnue",
      model: "",
      color,
      km: 0,
      totalKmAtPurchase: 0,
      isActive: true,
      addedDate: new Date().toISOString(),
      runIds: [],
    })
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div className="relative w-full rounded-t-3xl p-5 flex flex-col gap-4"
        style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.1)" }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">Nouvelle paire</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}><X size={16} /></button>
        </div>
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="Nom (ex: Nike Vomero 17)"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F5F5" }} />
        <input value={brand} onChange={e => setBrand(e.target.value)}
          placeholder="Marque (ex: Nike)"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F5F5" }} />
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className="w-8 h-8 rounded-full flex-shrink-0 transition-transform"
              style={{ background: c, transform: color === c ? "scale(1.25)" : "scale(1)",
                boxShadow: color === c ? `0 0 8px ${c}` : "none" }} />
          ))}
        </div>
        <button onClick={submit} disabled={!name}
          className="w-full py-3.5 rounded-2xl font-black text-sm"
          style={{ background: name ? "#F4D03F" : "rgba(255,255,255,0.06)", color: name ? "#0A0A0A" : "rgba(245,245,245,0.3)" }}>
          Ajouter la paire
        </button>
      </motion.div>
    </motion.div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function ShoeTracker() {
  const { runs } = useRuns()
  const [shoes, setShoes]       = useState<Gear[]>([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setShoes(getGear().filter(g => g.isActive))
  }, [])

  // Auto-compute km from Strava runs per shoe
  const kmPerShoe = (shoeId: string): number => {
    const gear = shoes.find(s => s.id === shoeId)
    if (!gear) return 0
    const fromRuns = runs.filter(r => r.gearId === shoeId).reduce((s, r) => s + r.distance, 0)
    return gear.totalKmAtPurchase + fromRuns
  }

  const addShoe = (g: Gear) => {
    saveGear(g)
    setShoes(prev => [...prev, g])
    setShowModal(false)
  }

  const deleteShoe = (id: string) => {
    const shoe = getGear().find(g => g.id === id)
    if (shoe) saveGear({ ...shoe, isActive: false })
    setShoes(prev => prev.filter(s => s.id !== id))
  }

  return (
    <>
      <AnimatePresence>
        {showModal && <AddShoeModal onAdd={addShoe} onClose={() => setShowModal(false)} />}
      </AnimatePresence>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(245,245,245,0.4)" }}>
            👟 Vomero Digital Garage
          </p>
          <button onClick={() => { hapticFeedback(); setShowModal(true) }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: "#F4D03F", color: "#0A0A0A" }}>
            <Plus size={12} /> Ajouter
          </button>
        </div>

        {shoes.length === 0 ? (
          <div className="text-center py-8 rounded-3xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}>
            <p className="text-3xl mb-2">👟</p>
            <p className="text-sm text-text-muted">Aucune paire enregistrée</p>
          </div>
        ) : (
          shoes.map(shoe => (
            <ShoeCard key={shoe.id} gear={shoe} kmFromRuns={kmPerShoe(shoe.id)} onDelete={deleteShoe} />
          ))
        )}
      </div>
    </>
  )
}
