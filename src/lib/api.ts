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

// --------------------------------------------------------------------------
// Referentiels (US-B4..B7) — contrat de app/routes/admin_referentiels.py
// --------------------------------------------------------------------------

export type VilleGeo = {
  id: string
  nom: string
  latitude: number | null
  longitude: number | null
  quartiers: string[]
}
export type RegionGeo = { id: string; nom: string; capitale: string; villes: VilleGeo[] }
export type PaysGeo = { pays: string; regions: RegionGeo[] }
export type VueGeographie = {
  pays: PaysGeo[]
  /** `resume` est une PHRASE (surcouche vide ou comptes) — jamais un objet. */
  surcouche: { resume: string; journal: unknown[]; version: number }
}

export function lireGeographie(): Promise<VueGeographie> {
  return api('/admin/referentiels/geographie')
}

/** `config_service.envoye=false` porte toujours sa RAISON — l'ecran l'affiche. */
export type EnvoiConfigService = { envoye: boolean; raison?: string } & Record<string, unknown>

export function ajouterRegion(demande: {
  pays: string
  nom: string
  capitale?: string
  population?: number
}): Promise<{ config_service: EnvoiConfigService; region: Record<string, unknown> }> {
  return api('/admin/referentiels/regions', { method: 'POST', body: demande })
}

export function ajouterVille(demande: {
  region_id: string
  nom: string
  latitude?: number
  longitude?: number
  population?: number
  poids_economique?: number
}): Promise<{
  config_service: EnvoiConfigService
  ville: Record<string, unknown>
  avertissements: string[]
}> {
  return api('/admin/referentiels/villes', { method: 'POST', body: demande })
}

export function ajouterQuartier(demande: {
  city_id: string
  nom: string
  zone_type?: string
  population?: number
}): Promise<{ config_service: EnvoiConfigService; quartier: Record<string, unknown> }> {
  return api('/admin/referentiels/quartiers', { method: 'POST', body: demande })
}

export type Telco = { nom: string; code: string; regex_msisdn: string; part_marche: number }

export function lireTelcos(): Promise<{ telcos: Record<string, Telco[]> }> {
  return api('/admin/referentiels/telcos')
}

export function ajouterTelco(demande: {
  pays: string
  network_name: string
  short_name: string
  regex_msisdn: string
  part_marche: number
  exemple_msisdn: string
  ussd_base_code?: string
}): Promise<{
  config_service: EnvoiConfigService
  telco: Record<string, unknown>
  somme_parts_du_pays: number
}> {
  return api('/admin/referentiels/telcos', { method: 'POST', body: demande })
}

export type CatalogueStatique = {
  comptes: Record<string, number>
  industries: string[]
  secteurs: Record<string, string[]>
  formes_juridiques: string[]
  /** `variants` = les EXCEPTIONS au profil par defaut : profession → profil.
   * C'est un OBJET (bug attrapé le 15/08 : type `number` → React error #31). */
  groupes: Record<
    string,
    { profil_defaut: string; professions: string[]; variants: Record<string, string> }
  >
  profils_revenu: Record<string, { mu: number; sigma: number; definition: string }>
  pays: string[]
  fonctions_dirigeant: { rang: number; francais: string; anglais: string; abreviation: string }[]
}

export function lireCatalogueStatique(): Promise<CatalogueStatique> {
  return api('/admin/referentiels/catalogue-statique')
}

/** La matiere qu'un 5e pays exigerait — chaque manque avec sa raison (US-B6). */
export type MatiereRequise = { matiere: string; pourquoi: string }

export function creerDevise(demande: {
  iso_name: string
  name_en: string
  name_fr: string
  accepts_decimal: boolean
}): Promise<{ devise: Record<string, unknown>; statut: string; note: string }> {
  return api('/admin/referentiels/devises', { method: 'POST', body: demande })
}

// --------------------------------------------------------------------------
// Entites a l'unite (Lot D + Lot H) — contrat de app/routes/admin_entites.py
// Le rite en DEUX temps (D-01) : /apercu ne fait AUCUNE ecriture ; la
// confirmation re-valide les MEMES champs puis pousse et RELIT (FRA-218).
// --------------------------------------------------------------------------

/** US-D2 — le formulaire produit. COLLECT seulement, 3 interfaces par policy_type. */
export type ProduitDemande = {
  nom: string
  /** Code court du marqueur — DEMO_<code> partira dans short_name (CR-07). */
  code: string
  policy_type: 'CASH' | 'CASH_DAT' | 'PRODUCT'
  categorie: 'INDIVIDUAL' | 'CORPORATE'
  montant_min: number
  montant_max: number
  taux: number
  /** CASH_DAT seulement — OBLIGATOIRE la, INTERDIT ailleurs (422 nomme). */
  duree_mois?: number
  /** PRODUCT seulement — le mil se pese (KILOGRAM), le lait se mesure (LITER). */
  measure?: 'KILOGRAM' | 'LITER'
  measure_price?: number
}

/** Le taux d'usure du CDC — la borne est DOUBLEE en UI, l'autorite reste le 422. */
export const TAUX_USURE_MAX_ANNUEL_PCT = 24.0

export function apercuProduit(demande: ProduitDemande): Promise<{
  payload: Record<string, unknown>
  marqueur: string
  duree_mois: number | null
  note: string
}> {
  return api('/admin/entites/produits/apercu', { method: 'POST', body: demande })
}

export function creerProduit(demande: ProduitDemande): Promise<{
  product_id: string
  fiche_relue: Record<string, unknown> | null
  marqueur: string
  note: string
}> {
  return api('/admin/entites/produits', { method: 'POST', body: demande })
}

/** US-D1 — 3-4 champs saisis, ~40 composes par le Loader (sequence S3-03). */
export type CompanyDemande = {
  type_company: 'IMF' | 'BANK' | 'MERCHANT' | 'FONDATION'
  pays: 'CM' | 'CI' | 'BF' | 'SN'
  ville: string
  /** Raison sociale imposee — sinon le Loader la compose (patronyme reel). */
  nom?: string
}

export function apercuCompany(demande: CompanyDemande): Promise<{
  fiche: Record<string, unknown>
  /** L'EMAIL de l'Admin User annonce — une chaine (RapportOrganisation.admins_crees). */
  admin_annonce: string | null
  note: string
}> {
  return api('/admin/entites/companies/apercu', { method: 'POST', body: demande })
}

export function creerCompany(demande: CompanyDemande): Promise<{
  fiche: Record<string, unknown>
  /** Les EMAILS des Admin Users crees — des chaines, pas des objets. */
  admins_crees: string[]
  cascade_owner_verifiee: boolean
  note: string
}> {
  return api('/admin/entites/companies', { method: 'POST', body: demande })
}

/** Lot H — creer un groupe : description REQUISE, tag jamais ROOT/A4,
 * company_id vide = role GLOBAL, permissions par NOM (liste vivante). */
export type GroupeDemande = {
  nom: string
  description: string
  tag: 'STAFF' | 'COMPANY' | 'CUSTOMER'
  permissions: string[]
  company_id?: string
}

export function creerGroupe(demande: GroupeDemande): Promise<{
  groupe: { id: string; nom: string; tag: string; permissions: number }
  statut: string
  au_registre: boolean
  note: string
}> {
  return api('/admin/entites/groupes', { method: 'POST', body: demande })
}

/** La liste VIVANTE de user-service — jamais une copie en dur dans l'UI. */
export function lirePermissions(): Promise<{ permissions: string[]; compte: number; note: string }> {
  return api('/admin/referentiels/permissions')
}

export function creerPays(demande: {
  iso_name: string
  name_en: string
  name_fr: string
  dial_code: string
  region: string
  continent?: string
  devise_iso: string
  cities: string[]
  telcos_ids?: string[]
}): Promise<{
  pays: Record<string, unknown>
  statut: string
  note: string
  matiere_pour_generer: MatiereRequise[]
}> {
  return api('/admin/referentiels/pays', { method: 'POST', body: demande })
}
