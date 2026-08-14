// src/context/AppContext.tsx
//
// L'etat global du Loader : langue (FR/EN), navigation, et LA SESSION.
// Plus aucun mock — la session vient du backend (US-A1/A2), le jeton vit
// dans sessionStorage (via lib/api), la peremption 4 h est comptee a rebours.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { Page, Session } from '../types'
import type { Lang, TranslationKey } from '../i18n'
import { translations } from '../i18n'
import * as api from '../lib/api'

const SESSION_KEY = 'finzuu-loader-session'
const LANG_KEY = 'finzuu-loader-lang'

// localStorage (pas sessionStorage) : la session survit au refresh ET a la
// fermeture — contrairement a la plateforme FinZuu qui deconnecte au F5.
// La seule autorite de fin de session est la peremption du jeton (4 h).
function lireSession(): Session | null {
  try {
    const brut = localStorage.getItem(SESSION_KEY)
    if (!brut || !api.getToken()) return null
    const session = JSON.parse(brut) as Session
    if (session.expiresAt <= Date.now()) return null
    return session
  } catch {
    return null
  }
}

interface AppContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TranslationKey) => string
  currentPage: Page
  setCurrentPage: (p: Page) => void
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  /** null = pas connecte → ecran de login. */
  session: Session | null
  /** Secondes restantes avant peremption du jeton (4 h max). */
  sessionSecondsLeft: number
  seConnecter: (email: string, motDePasse: string) => Promise<void>
  changerMotDePasse: (ancien: string, nouveau: string) => Promise<void>
  seDeconnecter: (motif?: 'expiree') => void
  /** Motif affiche sur l'ecran de login (ex. session expiree). */
  motifDeconnexion: 'expiree' | null
}

const AppContext = createContext<AppContextType>({} as AppContextType)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const memorisee = localStorage.getItem(LANG_KEY)
    return memorisee === 'en' ? 'en' : 'fr'
  })
  const [currentPage, setCurrentPage] = useState<Page>('tableau-de-bord')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [session, setSession] = useState<Session | null>(lireSession)
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(0)
  const [motifDeconnexion, setMotifDeconnexion] = useState<'expiree' | null>(null)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem(LANG_KEY, l)
  }, [])

  const t = useCallback(
    (key: TranslationKey): string =>
      (translations[lang] as Record<string, string>)[key] ?? key,
    [lang],
  )

  const seDeconnecter = useCallback((motif?: 'expiree') => {
    api.logout()
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
    setCurrentPage('tableau-de-bord')
    setMotifDeconnexion(motif ?? null)
  }, [])

  const installerSession = useCallback((email: string, jeton: api.SessionJeton) => {
    const nouvelle: Session = {
      email,
      expiresAt: Date.now() + jeton.expires_in * 1000,
      mustChangePassword: jeton.must_change_password,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(nouvelle))
    setSession(nouvelle)
    setMotifDeconnexion(null)
  }, [])

  const seConnecter = useCallback(
    async (email: string, motDePasse: string) => {
      const jeton = await api.login(email, motDePasse)
      installerSession(email.trim().toLowerCase(), jeton)
    },
    [installerSession],
  )

  const changerMotDePasse = useCallback(
    async (ancien: string, nouveau: string) => {
      if (!session) return
      const jeton = await api.changerMotDePasse(ancien, nouveau)
      installerSession(session.email, jeton)
    },
    [session, installerSession],
  )

  // Compte a rebours de la session : a zero, la deconnexion est DITE (jamais
  // un ecran qui echoue en silence avec un jeton mort).
  useEffect(() => {
    if (!session) {
      setSessionSecondsLeft(0)
      return
    }
    const calculer = () =>
      Math.max(0, Math.round((session.expiresAt - Date.now()) / 1000))
    setSessionSecondsLeft(calculer())
    const timer = setInterval(() => {
      const restant = calculer()
      setSessionSecondsLeft(restant)
      if (restant <= 0) seDeconnecter('expiree')
    }, 1000)
    return () => clearInterval(timer)
  }, [session, seDeconnecter])

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t,
        currentPage,
        setCurrentPage,
        sidebarOpen,
        setSidebarOpen,
        session,
        sessionSecondsLeft,
        seConnecter,
        changerMotDePasse,
        seDeconnecter,
        motifDeconnexion,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
