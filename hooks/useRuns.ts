"use client"
import { useState, useEffect, useCallback } from "react"
import type { Run } from "@/lib/types"
import { getRuns, saveRun, deleteRun, initStorage } from "@/lib/storage"

export function useRuns() {
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initStorage()
    setRuns(getRuns())
    setLoading(false)
  }, [])

  const addRun = useCallback((run: Run) => {
    saveRun(run)
    setRuns(getRuns())
  }, [])

  const updateRun = useCallback((run: Run) => {
    saveRun(run)
    setRuns(getRuns())
  }, [])

  const removeRun = useCallback((id: string) => {
    deleteRun(id)
    setRuns(getRuns())
  }, [])

  const refresh = useCallback(() => {
    setRuns(getRuns())
  }, [])

  return { runs, loading, addRun, updateRun, removeRun, refresh }
}
