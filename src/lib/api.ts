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

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string): void {
  if (typeof window !== 'undefined') sessionStorage.setItem(TOKEN_KEY, token)
}
export function clearToken(): void {
  if (typeof window !== 'undefined') sessionStorage.removeItem(TOKEN_KEY)
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
  scope?: string
  must_change_password?: boolean
}

export const apiBase = () => BASE

// --------------------------------------------------------------------------
// Auth (US-A1/A2)
// --------------------------------------------------------------------------

export async function login(email: string, password: string): Promise<SessionJeton> {
  const jeton = await api<SessionJeton>('/admin/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  })
  setToken(jeton.access_token)
  return jeton
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
