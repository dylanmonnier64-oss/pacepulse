"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react"
import { subscribe, toast as toastApi, type ToastMessage } from "@/lib/toast"

const CONFIG: Record<ToastMessage["variant"], {
  icon: React.ElementType
  color: string
  bg: string
  border: string
}> = {
  success: {
    icon: CheckCircle,
    color: "#22C55E",
    bg: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.28)",
  },
  error: {
    icon: XCircle,
    color: "#EF4444",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.28)",
  },
  info: {
    icon: Info,
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.28)",
  },
  warning: {
    icon: AlertTriangle,
    color: "#F4D03F",
    bg: "rgba(244,208,63,0.12)",
    border: "rgba(244,208,63,0.28)",
  },
}

function ToastItem({ toast }: { toast: ToastMessage }) {
  const cfg = CONFIG[toast.variant]
  const Icon = cfg.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.92 }}
      animate={{ opacity: 1, y: 0,   scale: 1 }}
      exit={{   opacity: 0, y: -12, scale: 0.94 }}
      transition={{ type: "spring", damping: 26, stiffness: 340 }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        minWidth: 240,
        maxWidth: "calc(100vw - 32px)",
      }}
      role="alert"
      aria-live="polite"
    >
      <Icon size={16} style={{ color: cfg.color, flexShrink: 0 }} aria-hidden />
      <p className="flex-1 text-sm font-semibold" style={{ color: "#FAFAFA", lineHeight: 1.35 }}>
        {toast.message}
      </p>
      <button
        onClick={() => toastApi.remove(toast.id)}
        aria-label="Fermer la notification"
        className="opacity-40 hover:opacity-80 transition-opacity flex-shrink-0"
      >
        <X size={13} style={{ color: "#FAFAFA" }} aria-hidden />
      </button>
    </motion.div>
  )
}

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => subscribe(setToasts), [])

  return (
    <div
      aria-label="Notifications"
      className="fixed top-0 left-0 right-0 z-[999] flex flex-col items-center gap-2 pointer-events-none"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)", paddingLeft: 16, paddingRight: 16 }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto w-full flex justify-center">
            <ToastItem toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
