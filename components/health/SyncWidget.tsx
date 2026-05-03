/**
 * SyncWidget — Pastille de statut de synchronisation Apple Santé
 * Affichée en haut à droite de chaque page, ouvre un panneau de détail
 */
"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useHealthData } from "@/hooks/useHealthData"

const STATUS_COLOR = {
  synced: "#27AE60",
  stale: "#F4D03F",
  offline: "#E74C3C",
}

const STATUS_LABEL = {
  synced: "Synchronisé",
  stale: "Mise à jour partielle",
  offline: "Hors ligne",
}

export default function SyncWidget() {
  const [open, setOpen] = useState(false)
  const { healthData, syncStatus, lastSync, deviceCount, refresh } = useHealthData()

  const color = STATUS_COLOR[syncStatus]

  return (
    <>
      {/* Pill */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-full touch-feedback"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <motion.div
          className="rounded-full flex-shrink-0"
          style={{ width: 8, height: 8, background: color }}
          animate={syncStatus === "offline"
            ? { opacity: [1, 0.3, 1] }
            : syncStatus === "stale"
            ? { scale: [1, 1.3, 1] }
            : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-[10px] font-semibold" style={{ color: "rgba(245,245,245,0.6)" }}>
          {deviceCount > 0 ? `${deviceCount} montre${deviceCount > 1 ? "s" : ""}` : "Santé"}
        </span>
      </button>

      {/* Detail panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
              style={{
                width: "min(320px, 90vw)",
                background: "#0F0F0F",
                borderLeft: "1px solid rgba(255,255,255,0.1)",
                paddingTop: "env(safe-area-inset-top, 0)",
              }}
            >
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Apple Santé</p>
                  <p className="text-lg font-black">{STATUS_LABEL[syncStatus]}</p>
                </div>
                <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center touch-feedback"
                  style={{ background: "rgba(255,255,255,0.08)" }}>
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {/* Last sync */}
                <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Dernière sync</p>
                  <p className="text-sm font-bold">{lastSync ?? "—"}</p>
                </div>

                {/* Devices */}
                {healthData?.devices && Object.entries(healthData.devices).length > 0 ? (
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2">Montres connectées</p>
                    <div className="flex flex-col gap-2">
                      {Object.entries(healthData.devices).map(([id, device]) => {
                        const lastSyncDate = device.lastSync ? new Date(device.lastSync) : null
                        const minsAgo = lastSyncDate ? Math.floor((Date.now() - lastSyncDate.getTime()) / 60000) : null
                        const devStatus = minsAgo === null ? "offline" : minsAgo < 60 ? "synced" : minsAgo < 120 ? "stale" : "offline"
                        return (
                          <div key={id} className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-semibold capitalize">{device.name ?? id}</p>
                              <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[devStatus] }} />
                            </div>
                            <p className="text-[10px] text-text-muted">
                              {minsAgo !== null
                                ? minsAgo < 60 ? `Il y a ${minsAgo}min` : `Il y a ${Math.floor(minsAgo / 60)}h`
                                : "Jamais synchronisé"}
                            </p>
                            {device.data?.heartRate?.resting && (
                              <p className="text-[10px] text-text-muted mt-1">FC repos : {device.data.heartRate.resting} bpm</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.1)" }}>
                    <p className="text-2xl mb-2">⌚️</p>
                    <p className="text-sm font-semibold mb-1">Aucune montre connectée</p>
                    <p className="text-xs text-text-muted leading-relaxed">Configure Health Auto Export sur ton iPhone pour synchroniser tes données.</p>
                  </div>
                )}

                {/* Merged metrics */}
                {healthData?.merged && (
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2">Métriques fusionnées</p>
                    <div className="grid grid-cols-2 gap-2">
                      {healthData.merged.steps !== undefined && (
                        <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <p className="text-[10px] text-text-muted">Pas</p>
                          <p className="text-base font-bold">{healthData.merged.steps.toLocaleString()}</p>
                        </div>
                      )}
                      {healthData.merged.heartRate?.resting && (
                        <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <p className="text-[10px] text-text-muted">FC repos</p>
                          <p className="text-base font-bold">{healthData.merged.heartRate.resting} bpm</p>
                        </div>
                      )}
                      {healthData.merged.calories !== undefined && (
                        <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <p className="text-[10px] text-text-muted">Calories</p>
                          <p className="text-base font-bold">{healthData.merged.calories} kcal</p>
                        </div>
                      )}
                      {healthData.merged.distance !== undefined && (
                        <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <p className="text-[10px] text-text-muted">Distance</p>
                          <p className="text-base font-bold">{healthData.merged.distance.toFixed(1)} km</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Setup instructions */}
                <div className="rounded-2xl p-4" style={{ background: "rgba(244,208,63,0.06)", border: "1px solid rgba(244,208,63,0.2)" }}>
                  <p className="text-xs font-bold mb-2" style={{ color: "#F4D03F" }}>Configuration</p>
                  <ol className="text-[10px] text-text-muted space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Installe Health Auto Export sur iPhone</li>
                    <li>URL : <span className="font-mono" style={{ color: "#F4D03F" }}>pacepulse-dydz.netlify.app/api/health</span></li>
                    <li>Méthode : POST, Format : JSON</li>
                    <li>Ajoute un champ <span className="font-mono">device_id</span> avec le nom de ta montre</li>
                    <li>Intervalle : 1h recommandé</li>
                  </ol>
                </div>
              </div>

              {/* Refresh button */}
              <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <button
                  onClick={() => { refresh(); setOpen(false) }}
                  className="w-full rounded-2xl py-3 text-sm font-bold touch-feedback"
                  style={{ background: "rgba(244,208,63,0.15)", color: "#F4D03F", border: "1px solid rgba(244,208,63,0.3)" }}
                >
                  Actualiser
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
