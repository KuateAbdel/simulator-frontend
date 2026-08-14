'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { DEFAULT_CONFIG, type LoaderConfig } from '@/lib/finzuu'

type CurrentRun = {
  id: string
  prefix: string
} | null

type LoaderState = {
  config: LoaderConfig
  setConfig: (updater: (prev: LoaderConfig) => LoaderConfig) => void
  currentRun: CurrentRun
  startRun: () => CurrentRun
}

const LoaderContext = createContext<LoaderState | null>(null)

const STORAGE_KEY = 'finzuu-loader-config'

function newRunId(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const seq = String(Math.floor(Math.random() * 900) + 100)
  return `RUN-${y}-${m}-${d}-${seq}`
}

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<LoaderConfig>(DEFAULT_CONFIG)
  const [currentRun, setCurrentRun] = useState<CurrentRun>(null)

  // Hydrate from sessionStorage (mock persistence, backend inactif)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) setConfigState(JSON.parse(raw))
    } catch {
      // ignore
    }
  }, [])

  const setConfig = useCallback(
    (updater: (prev: LoaderConfig) => LoaderConfig) => {
      setConfigState((prev) => {
        const next = updater(prev)
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {
          // ignore
        }
        return next
      })
    },
    [],
  )

  const startRun = useCallback(() => {
    const run = { id: newRunId(), prefix: 'DEMO_' }
    setCurrentRun(run)
    return run
  }, [])

  const value = useMemo(
    () => ({ config, setConfig, currentRun, startRun }),
    [config, setConfig, currentRun, startRun],
  )

  return <LoaderContext.Provider value={value}>{children}</LoaderContext.Provider>
}

export function useLoader() {
  const ctx = useContext(LoaderContext)
  if (!ctx) throw new Error('useLoader must be used within LoaderProvider')
  return ctx
}
