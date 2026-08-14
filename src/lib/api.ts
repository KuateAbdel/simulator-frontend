// Couche d'integration API — le VRAI backend du Loader.
//
// Zidane avait tout mocke ; ceci est la piece manquante : chaque appel part
// vers `NEXT_PUBLIC_API_URL` (= https://simul.api.fintech4esg.com), avec le
// jeton JWT du Super-Admin en Bearer. Le contrat suit exactement l'OpenAPI
// publie sur /docs (le meme backend).

const BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ??
  'https://simul.api.fintech4esg.com'

const TOKEN_KEY = 'finzuu-loader-token'

// localStorage, PAS sessionStorage — decision du 14/08 (retour Yaniv) : la
// plateforme FinZuu deconnecte au refresh, le Loader NON. La session survit
// au F5, a la fermeture de l'onglet et de la fenetre PWA ; c'est la
// peremption du jeton (4 h, verifiee dans AppContext) qui fait foi.
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string): void {
  if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token)
}
export function clearToken(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  detail: unknown
  constructor(status: number, detail: unknown) {
    super(typeof detail === 'string' ? detail : `HTTP ${status}`)
    this.status = status
    this.detail = detail
  }
}

type Options = {
  method?: string
  body?: unknown
  auth?: boolean // defaut: true — attache le Bearer
}

// Jeton perime ou revoque : l'app doit reagir PARTOUT pareil (retour au
// login, motif dit) — le contexte s'enregistre ici, l'api l'appelle.
let surJetonInvalide: (() => void) | null = null
export function enregistrerSurJetonInvalide(cb: () => void): void {
  surJetonInvalide = cb
}

/** Appel bas niveau. Attache le jeton, parse le JSON, leve ApiError typee. */
export async function api<T = unknown>(chemin: string, opts: Options = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = opts
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${BASE}${chemin}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (e) {
    // Panne reseau : le backend est injoignable — on le DIT, jamais un ecran fige.
    throw new ApiError(0, `Backend injoignable (${(e as Error).message})`)
  }

  const texte = await res.text()
  let data: unknown = null
  try {
    data = texte ? JSON.parse(texte) : null
  } catch {
    data = texte
  }

  if (!res.ok) {
    // Un 401 sur un appel AUTHENTIFIE = jeton mort → deconnexion dite.
    if (res.status === 401 && auth) surJetonInvalide?.()
    // Le backend renvoie {detail: "..."} — on remonte le motif nomme tel quel.
    const detail =
      data && typeof data === 'object' && 'detail' in data
        ? (data as { detail: unknown }).detail
        : data
    throw new ApiError(res.status, detail)
  }
  return data as T
}

// --------------------------------------------------------------------------
// Contrats — un type par reponse du backend (extrait de l'OpenAPI)
// --------------------------------------------------------------------------

export type SessionJeton = {
  access_token: string
  token_type: string
  expires_in: number
  must_change_password: boolean
}

export const apiBase = () => BASE

// --------------------------------------------------------------------------
// Auth (US-A1/A2)
// --------------------------------------------------------------------------

export async function login(email: string, motDePasse: string): Promise<SessionJeton> {
  // Le champ s'appelle `mot_de_passe` cote backend (DemandeConnexion) — pas `password`.
  const jeton = await api<SessionJeton>('/admin/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, mot_de_passe: motDePasse },
  })
  setToken(jeton.access_token)
  return jeton
}

// --------------------------------------------------------------------------
// Sante (route publique — la preuve de vie du backend)
// --------------------------------------------------------------------------

export type Sante = { status: string }

export function health(): Promise<Sante> {
  return api<Sante>('/health', { auth: false })
}

export async function changerMotDePasse(ancien: string, nouveau: string): Promise<SessionJeton> {
  const jeton = await api<SessionJeton>('/admin/auth/password', {
    method: 'POST',
    body: { ancien, nouveau },
  })
  setToken(jeton.access_token)
  return jeton
}

export function logout(): void {
  clearToken()
}

// US-A4 v2 — reinitialisation par email (code Mailjet a 8 chiffres).

export function motDePasseOublie(email: string): Promise<{ detail: string; validite_minutes: number }> {
  return api('/admin/auth/mot-de-passe-oublie', {
    method: 'POST',
    auth: false,
    body: { email },
  })
}

export async function reinitialiserParCode(
  email: string,
  code: string,
  nouveau: string,
): Promise<SessionJeton> {
  const jeton = await api<SessionJeton>('/admin/auth/reinitialiser', {
    method: 'POST',
    auth: false,
    body: { email, code, nouveau },
  })
  setToken(jeton.access_token)
  return jeton
}

// --------------------------------------------------------------------------
// Dashboard (US-E1) — contrat extrait de app/routes/admin_dashboard.py
// --------------------------------------------------------------------------

export type SondeService = {
  nom: string
  etat: 'up' | 'down'
  http: number | null
  latence_ms: number
  erreur?: string
}

export type DernierRun = {
  run_id: string
  mode: 'DRY_RUN' | 'REAL'
  statut: 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'PARTIAL'
  nb_checkpoints: number
}

export type VueDashboard = {
  services: SondeService[]
  dernier_run: DernierRun | null
  /** branches/agences/kiosques/agents/clients + faker_par_pays + ecritures_par_type. */
  compteurs: Partial<{
    branches: number
    agences: number
    kiosques: number
    agents: number
    clients: number
    faker_par_pays: Record<string, number>
    ecritures_par_type: Record<string, number>
  }>
  alertes: string[]
}

export function lireDashboard(): Promise<VueDashboard> {
  return api<VueDashboard>('/admin/dashboard')
}

// --------------------------------------------------------------------------
// Configuration (US-B1/B2/B3) — contrat de app/routes/admin_configuration.py
// --------------------------------------------------------------------------

export type ValeurOrigine<T = number | null> = { valeur: T; origine: string }

export type PaysConfiguration = {
  actif: boolean
  motif_inactivite: string | null
  quantites: Record<string, ValeurOrigine>
  surcharges_regions: string[]
  surcharges_villes: string[]
}

export type VueConfiguration = {
  nb_clients: ValeurOrigine<number>
  repartition_clients: Record<string, number>
  pays: Record<string, PaysConfiguration>
  quotas_contractuels: Record<string, ValeurOrigine>
  conforme_au_cdc: boolean
  ecarts_au_cdc: string[]
  version: number
  modifie_par: string | null
  modifie_le: string | null
}

/** Fourchette (min, max) — EF-10/EF-16/UC-09. */
export type Fourchette = [number, number]

export type SurchargePaysDemande = {
  clients?: number
  companies?: Fourchette
  kiosques?: Fourchette
  staff?: Fourchette
  branches?: number
  agences?: number
  agents?: number
}

export type ConfigurationDemande = {
  nb_clients?: number
  pays?: Record<string, SurchargePaysDemande>
}

export function lireConfiguration(): Promise<VueConfiguration> {
  return api<VueConfiguration>('/admin/configuration')
}

export function modifierConfiguration(demande: ConfigurationDemande): Promise<VueConfiguration> {
  return api<VueConfiguration>('/admin/configuration', { method: 'PUT', body: demande })
}

export function changerEtatPays(code: string, actif: boolean, motif: string): Promise<VueConfiguration> {
  return api<VueConfiguration>(`/admin/configuration/pays/${encodeURIComponent(code)}`, {
    method: 'PUT',
    body: { actif, motif },
  })
}

// --------------------------------------------------------------------------
// Runs — le rite D-01 (US-C1..C6), contrat de app/routes/admin_runs.py
// --------------------------------------------------------------------------

export type StatutRun = 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'PARTIAL'

/** Un palier pose par l'orchestrateur a la fin de chaque phase. */
export type Palier = {
  phase: string
  horodatage: string
  detail: {
    issue?: string
    detail?: unknown
    duree_s?: number
    mode?: string
  } & Record<string, unknown>
}

export type FicheRun = {
  run_id: string
  mode: 'DRY_RUN' | 'REAL'
  statut: StatutRun
  sim_start_date: string
  sim_end_date: string
  nb_checkpoints: number
  /** L'empreinte D-10 de la configuration, FIGEE avec le run. */
  configuration: Record<string, unknown>
}

export type DetailRun = FicheRun & {
  checkpoints: Palier[]
  rapport: string
}

export type ProgressionRun = {
  run_id: string
  statut: StatutRun
  mode?: 'DRY_RUN' | 'REAL'
  paliers: Palier[]
  en_cours_dans_ce_processus?: boolean
}

/** US-C1 — la preparation : DRY_RUN toujours, 202 immediat. */
export function preparerRun(): Promise<{ run_id: string; mode: string; statut: StatutRun }> {
  return api('/admin/runs', { method: 'POST', body: { mode: 'DRY_RUN' } })
}

/** US-C2 — le REAL sur le perimetre FIGE de la preparation (409 si change). */
export function confirmerRun(
  preparationId: string,
): Promise<{ run_id: string; mode: string; statut: StatutRun; preparation_id: string }> {
  return api(`/admin/runs/${encodeURIComponent(preparationId)}/confirmer`, { method: 'POST' })
}

export function listerRuns(): Promise<{ runs: FicheRun[] }> {
  return api('/admin/runs')
}

/** Le detail peut etre PARTIEL quand le run est encore PENDING (pas en base). */
export function lireRun(runId: string): Promise<Partial<DetailRun> & { run_id: string; statut: StatutRun }> {
  return api(`/admin/runs/${encodeURIComponent(runId)}`)
}

export function lireProgression(runId: string): Promise<ProgressionRun> {
  return api(`/admin/runs/${encodeURIComponent(runId)}/progression`)
}

export function arreterRun(runId: string): Promise<{ run_id: string; action: string; consequence: string }> {
  return api(`/admin/runs/${encodeURIComponent(runId)}/arreter`, { method: 'POST' })
}
