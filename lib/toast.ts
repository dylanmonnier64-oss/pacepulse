// ── Lightweight singleton toast event bus ──
// Usage: import { toast } from "@/lib/toast"
//        toast.success("Sortie sauvegardée")
//        toast.error("Erreur lors de la sauvegarde")
//        toast.info("Données synchronisées")

export type ToastVariant = "success" | "error" | "info" | "warning"

export interface ToastMessage {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
}

type Listener = (toasts: ToastMessage[]) => void

let _toasts: ToastMessage[] = []
const _listeners: Set<Listener> = new Set()

function notify() {
  _listeners.forEach((l) => l([..._toasts]))
}

function add(message: string, variant: ToastVariant, duration = 3200) {
  const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  _toasts = [..._toasts, { id, message, variant, duration }]
  notify()
  setTimeout(() => remove(id), duration + 400)
}

function remove(id: string) {
  _toasts = _toasts.filter((t) => t.id !== id)
  notify()
}

export function subscribe(listener: Listener): () => void {
  _listeners.add(listener)
  return () => { _listeners.delete(listener) }
}

export const toast = {
  success: (msg: string, duration?: number) => add(msg, "success", duration),
  error:   (msg: string, duration?: number) => add(msg, "error",   duration),
  info:    (msg: string, duration?: number) => add(msg, "info",    duration),
  warning: (msg: string, duration?: number) => add(msg, "warning", duration),
  remove,
}
