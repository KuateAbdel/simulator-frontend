// src/context/AppContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Page, FilterState, StaffProfile, Alert } from '../types'
import type { Lang } from '../i18n'
import { translations } from '../i18n'

interface AppContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: keyof typeof translations['fr']) => string
  currentPage: Page
  setCurrentPage: (p: Page) => void
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  filters: FilterState
  setFilters: (f: FilterState) => void
  resetFilters: () => void
  staff: StaffProfile
  alerts: Alert[]
  markAlertRead: (id: string) => void
  sessionSeconds: number
  selectedClientId: string | null
  setSelectedClientId: (id: string | null) => void
}

const defaultFilters: FilterState = {
  clientId: '',
  score: '',
  segment: '',
  category: '',
  branch: '',
  phone: '',
  operator: '',
}

const defaultStaff: StaffProfile = {
  id: 'STF-00421',
  name: 'Sophie Renard',
  role: 'Portfolio Manager',
  branch: 'Dakar Centre',
  enrollmentDate: '2022-03-10',
  phone: '+221 77 000 1234',
  email: 'sophie.renard@finzuu.io',
}

const defaultAlerts: Alert[] = [
  { id: 'A1', type: 'danger', message: 'CLI-002 PAR 60 — Paiement en retard', time: '10:32', read: false },
  { id: 'A2', type: 'warning', message: '3 offres expirent dans 48h', time: '09:15', read: false },
  { id: 'A3', type: 'info', message: 'Rapport mensuel disponible', time: '08:00', read: true },
  { id: 'A4', type: 'success', message: 'Décaissement LP-002 validé', time: '07:45', read: true },
]

const AppContext = createContext<AppContextType>({} as AppContextType)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('fr')
  const [currentPage, setCurrentPage] = useState<Page>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [alerts, setAlerts] = useState<Alert[]>(defaultAlerts)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setInterval(() => setSessionSeconds(s => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const t = useCallback((key: keyof typeof translations['fr']): string => {
    return (translations[lang] as Record<string, string>)[key] ?? key
  }, [lang])

  const resetFilters = useCallback(() => setFilters(defaultFilters), [])

  const markAlertRead = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
  }, [])

  return (
    <AppContext.Provider value={{
      lang, setLang, t,
      currentPage, setCurrentPage,
      sidebarOpen, setSidebarOpen,
      filters, setFilters, resetFilters,
      staff: defaultStaff,
      alerts, markAlertRead,
      sessionSeconds,
      selectedClientId, setSelectedClientId,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
