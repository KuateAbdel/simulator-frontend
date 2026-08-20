// Couche d'integration API — le VRAI backend du Loader.
//
// Zidane avait tout mocke ; ceci est la piece manquante : chaque appel part
// vers `NEXT_PUBLIC_API_URL` (= https://simul.api.fintech4esg.com), avec le
// jeton JWT du Super-Admin en Bearer. Le contrat suit exactement l'OpenAPI
// publie sur /docs (le meme backend).

import type { RoleLoader } from '../types'

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
  /** RBAC — le role du compte, remonte pour projeter le bon dashboard. */
  role: RoleLoader
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

// Scenarios nommes (16/08) — des presets de ConfigurationDemande rejouables.
// Appliquer passe par LE chemin du PUT cote backend : gardes comprises.

export type Scenario = {
  nom: string
  demande: ConfigurationDemande
  cree_par: string
  cree_le: string
}

export function listerScenarios(): Promise<{ scenarios: Scenario[]; compte: number; note: string }> {
  return api('/admin/configuration/scenarios')
}

export function sauverScenario(nom: string, demande: ConfigurationDemande): Promise<{ scenario: Scenario; note: string }> {
  return api('/admin/configuration/scenarios', { method: 'POST', body: { nom, demande } })
}

export function supprimerScenario(nom: string): Promise<{ supprime: string }> {
  return api(`/admin/configuration/scenarios/${encodeURIComponent(nom)}`, { method: 'DELETE' })
}

/** La reponse est la vue RESOLUE — la meme que le PUT. */
export function appliquerScenario(nom: string): Promise<VueConfiguration> {
  return api(`/admin/configuration/scenarios/${encodeURIComponent(nom)}/appliquer`, { method: 'POST' })
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

export type QuartierGeo = { id: string; nom: string; zone_type: string }
export type VilleGeo = {
  id: string
  nom: string
  latitude: number | null
  longitude: number | null
  quartiers: string[]
  /** ADDITIF 16/08 — l'ecran Depositaire choisit un quartier PAR IDENTIFIANT. */
  quartiers_detail?: QuartierGeo[]
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
  /** Les secteurs ajoutés par le Super-Admin (surcouche, US-B5+) — pour les
   * distinguer à l'écran des 112 du classeur. Absent = aucun ajout. */
  secteurs_surcouche?: string[]
  /** Idem pour les industries ajoutées (le niveau haut, rare). */
  industries_surcouche?: string[]
  /** Marqueurs de surcouche pour les autres dimensions. */
  formes_surcouche?: string[]
  professions_surcouche?: string[]
  dirigeants_surcouche?: number[]
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

/** Le catalogue PRODUITS du Loader (UC-11) — LENDING (Annexe E) + COLLECT. */
export type ProduitCatalogue = {
  nom: string
  type: 'LENDING' | 'COLLECT'
  categorie: string
  policy_type?: string
  code?: string
  duree_jours?: number
  montant_min?: number
  montant_max?: number
}
export type ProduitsCatalogue = {
  lending: ProduitCatalogue[]
  collect: ProduitCatalogue[]
  comptes: { lending: number; collect: number }
}
export function lireProduitsCatalogue(): Promise<ProduitsCatalogue> {
  return api('/admin/referentiels/produits-catalogue')
}

/** `US-B5+` — ajoute un secteur d'activité dans la surcouche (base immuable).
 * Le secteur ne peut se rattacher qu'à des industries existantes (les 6). */
export function ajouterSecteur(demande: {
  label: string
  industries: string[]
  /** Liaison générative : types d'entreprise (IMF, BANK, MERCHANT, FONDATION,
   * FUNDING_PROVIDER) pour lesquels ce secteur est un connexe tiré au run. */
  types?: string[]
}): Promise<{
  secteur: { label: string; industries: string[] }
  surcouche: { resume: string; version: number }
}> {
  return api('/admin/referentiels/secteurs', { method: 'POST', body: demande })
}

/** `US-B5+` — ajoute une industrie (le niveau haut, rare) dans la surcouche. */
export function ajouterIndustrie(demande: { label: string }): Promise<{
  industrie: string
  surcouche: { resume: string; version: number }
}> {
  return api('/admin/referentiels/industries', { method: 'POST', body: demande })
}

/** Retire un secteur AJOUTÉ (surcouche réversible). Le classeur reste intact. */
export function retirerSecteur(label: string): Promise<{
  retire: string
  surcouche: { resume: string; version: number }
}> {
  return api(`/admin/referentiels/secteurs/${encodeURIComponent(label)}`, { method: 'DELETE' })
}

/** Retire une industrie AJOUTÉE (surcouche). Refuse (409) si un secteur y est rattaché. */
export function retirerIndustrie(label: string): Promise<{
  retire: string
  surcouche: { resume: string; version: number }
}> {
  return api(`/admin/referentiels/industries/${encodeURIComponent(label)}`, { method: 'DELETE' })
}

/** `US-B5+` — les autres dimensions du catalogue, toutes via la surcouche. */
export function ajouterForme(label: string): Promise<unknown> {
  return api('/admin/referentiels/formes', { method: 'POST', body: { label } })
}
export function retirerForme(label: string): Promise<unknown> {
  return api(`/admin/referentiels/formes/${encodeURIComponent(label)}`, { method: 'DELETE' })
}
export function ajouterDirigeant(demande: {
  rang: number
  francais: string
  anglais: string
  abreviation?: string
}): Promise<unknown> {
  return api('/admin/referentiels/dirigeants', { method: 'POST', body: demande })
}
export function retirerDirigeant(rang: number): Promise<unknown> {
  return api(`/admin/referentiels/dirigeants/${rang}`, { method: 'DELETE' })
}
export function ajouterProfession(demande: { groupe: string; label: string }): Promise<unknown> {
  return api('/admin/referentiels/professions', { method: 'POST', body: demande })
}
export function retirerProfession(label: string): Promise<unknown> {
  return api(`/admin/referentiels/professions/${encodeURIComponent(label)}`, { method: 'DELETE' })
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
// Phase 6 — Ecosysteme US-E2, Population US-E3, Tracabilite US-E4,
// Inventaire (4 statuts + adoption A-13 + DELETE), Purge US-F1/F2.
// Contrats de admin_dashboard.py / admin_inventaire.py / admin_purge.py.
// --------------------------------------------------------------------------

export type KiosqueEco = {
  id: string
  nom: string
  quartier: string | null
  depositary_id: string | null
  nb_agents: number
  nb_clients: number
}
export type AgenceEco = { id: string; nom: string; ville: string | null; kiosques: KiosqueEco[] }
export type BrancheEco = {
  id: string
  nom: string
  pays: string
  region: string | null
  company_id: string
  agences: AgenceEco[]
}
export type VueEcosysteme = {
  run_id: string | null
  comptes?: Record<string, number>
  branches: BrancheEco[]
  note?: string
}

export function lireEcosysteme(): Promise<VueEcosysteme> {
  return api('/admin/dashboard/ecosysteme')
}

/** Chaque quota porte MESURE et CIBLE — l'ecran les montre cote a cote. */
export type MesureCible = { mesure: number; cible: number }
export type QuotasPays = {
  pays: string
  clients: MesureCible
  corporate: MesureCible
  femmes: MesureCible
  jeunes: MesureCible
  agricoles: MesureCible
  profils: Record<string, MesureCible>
}
export type VuePopulation = {
  run_id: string
  mode: 'DRY_RUN' | 'REAL'
  quotas_par_pays: QuotasPays[]
  occupations: { distinctes: number; total: number; top: Record<string, number> }
  soldes: { tranches: Record<string, number>; total_dote: number }
  naissances: { a_l_etranger: number; au_pays: number }
}

export function lirePopulation(): Promise<VuePopulation> {
  return api('/admin/dashboard/population')
}

export type VueIndexInverse = {
  run_id: string
  clients_par_produit: { product_id: string; marqueur: string; clients: number }[]
  clients_par_kiosque: { kiosque_id: string; nom: string; clients: number }[]
  note: string
}

export function lireIndexInverse(): Promise<VueIndexInverse> {
  return api('/admin/dashboard/index-inverse')
}

export type VueTracabilite = {
  run_id: string | null
  note?: string
  registre_faker?: {
    par_pays: Record<string, number>
    reservations_orphelines: { client_id: string; pays: string; seed: number }[]
  }
  journal?: {
    ecritures_par_type: Record<string, number>
    nb_entrees: number
    intentions_orphelines: { entity_type: string; entity_id: string; cible: string }[]
    dernieres_entrees: { entity_type: string; action: string; horodatage: string }[]
  }
  reconciliation?: string
}

export function lireTracabilite(): Promise<VueTracabilite> {
  return api('/admin/dashboard/tracabilite')
}

/** Les 4 statuts de la reconciliation — TOUJOURS presents, vides s'il le faut. */
export type StatutInventaire = 'a_nous' | 'disparu_la_bas' | 'marque_mais_inconnu' | 'etranger'
export type LigneInventaire = {
  id: string
  nom: string
  statut: StatutInventaire
  short_name?: string
  /** Depositaires : l'is_active de la plateforme (null si la fiche ne le porte pas). */
  actif?: boolean | null
}
export type VueInventaire = {
  a_nous: LigneInventaire[]
  disparu_la_bas: LigneInventaire[]
  marque_mais_inconnu: LigneInventaire[]
  etranger: LigneInventaire[]
  note?: string
} & Record<string, unknown>

export function lireInventaire(
  domaine: 'groupes' | 'produits' | 'companies' | 'depositaires',
): Promise<VueInventaire> {
  return api(`/admin/inventaire/${domaine}`)
}

// --------------------------------------------------------------------------
// US-D3 (16/08) — le depositaire naît d'un QUARTIER + une company A NOUS.
// Le Loader COMPOSE : nom Kiosque <Quartier> (sans prefixe, 20/08), devise du pays, coherence
// company<->quartier verifiee (pas de kiosque a Douala pour une company de
// Dakar — 422 INCOHERENCE nomme).
// --------------------------------------------------------------------------

export type DepositaireDemande = { quartier_id: string; company_id: string }

export type CompositionDepositaire = {
  marqueur: string
  devise: string
  pays: string
  ville: string
  quartier: string
  zone_type: string
  coherence_verifiee_par: string
  company_nom: string
}

export function apercuDepositaire(demande: DepositaireDemande): Promise<{
  payload: { name: string; currency: string; company_id: string }
  composition: CompositionDepositaire
  marqueur: string
  note: string
}> {
  return api('/admin/entites/depositaires/apercu', { method: 'POST', body: demande })
}

/** Le VERDICT du backend (16/08) — l'AUTORITE du diff payload<->relecture.
 * La DiffTable de l'UI est le double a l'ecran ; le serveur, lui, a confronte
 * le payload REELLEMENT envoye a la fiche RELUE, champ par champ. */
export type DiffRelecture = {
  fidele: boolean
  champs_compares: number
  divergences: Record<string, { envoye: unknown; relu: unknown }>
  absents_de_la_relecture: string[]
  verdict: string
}

export function creerDepositaire(demande: DepositaireDemande): Promise<{
  depositary_id: string
  fiche_relue: Record<string, unknown> | null
  diff_relecture: DiffRelecture
  composition: CompositionDepositaire
  marqueur: string
  statut: string
  note: string
}> {
  return api('/admin/entites/depositaires', { method: 'POST', body: demande })
}

// --------------------------------------------------------------------------
// Licences (16/08) — voir et ATTRIBUER une licence a une company A NOUS.
// UC-07 : la licence conditionne le catalogue (UC-11).
// --------------------------------------------------------------------------

export type PackageLicence = 'ALL' | 'READY_CASH' | 'READY_COLLECTE'

export function licencesDeCompany(companyId: string): Promise<{
  company_id: string
  licences: Record<string, unknown>[]
  compte: number
  note: string
}> {
  return api(`/admin/entites/companies/${encodeURIComponent(companyId)}/licences`)
}

export function creerLicenceCompany(
  companyId: string,
  packages: PackageLicence[],
): Promise<{
  company_id: string
  licences: Record<string, unknown>[]
  fenetre: { debut: string; fin: string }
  note: string
}> {
  return api(`/admin/entites/companies/${encodeURIComponent(companyId)}/licences`, {
    method: 'POST',
    body: { packages },
  })
}

export function supprimerGroupe(groupeId: string): Promise<{ supprime: string; verifie_par_relecture: boolean }> {
  return api(`/admin/inventaire/groupes/${encodeURIComponent(groupeId)}`, { method: 'DELETE' })
}

/** 16/08 — l'etat d'un depositaire se CHANGE la-bas (PATCH status mesure),
 * avec la verite D-DEP-8 portee par la reponse. */
export function changerEtatDepositaire(
  depositaireId: string,
  actif: boolean,
  motif: string,
): Promise<{
  id: string
  nom: string
  actif: boolean
  statut: string
  verite_d_dep_8: string
  note: string
}> {
  return api(`/admin/inventaire/depositaires/${encodeURIComponent(depositaireId)}/etat`, {
    method: 'PATCH',
    body: { actif, motif },
  })
}

export type TelcoConfig = {
  id: string
  nom: string
  code: string
  actif: boolean | null
  porteurs: string[]
}

export function lireTelcosConfig(): Promise<{ telcos: TelcoConfig[]; compte: number; note: string }> {
  return api('/admin/referentiels/telcos-config')
}

export function changerEtatTelco(
  telcoId: string,
  actif: boolean,
  motif: string,
): Promise<{ id: string; nom: string; actif: boolean; etat_relu: boolean | null; porteurs: string[]; note: string }> {
  return api(`/admin/referentiels/telcos-config/${encodeURIComponent(telcoId)}/etat`, {
    method: 'PATCH',
    body: { actif, motif },
  })
}

export type DeviseConfig = {
  id: string
  iso: string
  nom: string
  actif: boolean | null
  porteurs: string[]
}

export function lireDevisesConfig(): Promise<{ devises: DeviseConfig[]; compte: number; note: string }> {
  return api('/admin/referentiels/devises-config')
}

/** Toujours un 409 MESURE (100% des devises partagees) — l'appel existe pour
 * que le refus soit constatable, avec sa preuve. */
export function desactiverDeviseConfig(deviseId: string, motif: string): Promise<never> {
  return api(`/admin/referentiels/devises-config/${encodeURIComponent(deviseId)}/etat`, {
    method: 'PATCH',
    body: { actif: false, motif },
  })
}

export type IssueAdoption = { id: string; nom?: string; issue: 'adopte' | 'deja_au_registre' | 'introuvable' }

export function adopterGroupes(groupeIds: string[]): Promise<{
  issues: IssueAdoption[]
  comptes: { adoptes: number; deja_au_registre: number; introuvables: number }
  registre_apres: number
  note: string
}> {
  return api('/admin/inventaire/groupes/adoption', { method: 'POST', body: { groupe_ids: groupeIds } })
}

export type ResiduMarque = { compte: number; verdict: string; note?: string }
export type VuePurgePreparee = {
  purgeable: { groupes: { id: string; nom: string }[]; regle: string }
  residus_marques: Record<string, ResiduMarque>
  note: string
}

/** US-F1 — l'inventaire de purge : AUCUNE ecriture ne part d'ici. */
export function preparerPurge(): Promise<VuePurgePreparee> {
  return api('/admin/purge/preparer', { method: 'POST' })
}

export function confirmerPurge(supprimerGroupes: boolean): Promise<{
  supprimes: string[]
  echecs: { groupe: string; motif: string }[]
  residus_marques: Record<string, ResiduMarque>
  note: string
}> {
  return api('/admin/purge/confirmer', {
    method: 'POST',
    body: { supprimer_groupes: supprimerGroupes },
  })
}

// --------------------------------------------------------------------------
// Comptes Super-Admin (RBAC, 15/08) — contrat de app/routes/admin_comptes.py
// « Super-Admin » est un ROLE : plusieurs comptes, chacun son email REEL,
// son mot de passe, son cycle A2. Desactivation reversible, jamais de
// suppression.
// --------------------------------------------------------------------------

export type CompteAdmin = {
  email: string
  /** RBAC — 'viewer' | 'admin' | 'super_admin'. */
  role: RoleLoader
  actif: boolean
  must_change_password: boolean
  cree_par: string | null
  cree_le: string | null
  /** Posée au login (traçabilité 20/08) — null tant que jamais connecté. */
  derniere_connexion: string | null
}

export function listerComptes(): Promise<{ comptes: CompteAdmin[]; compte: number; note: string }> {
  return api('/admin/comptes')
}

export function creerCompte(
  email: string,
  role: RoleLoader,
): Promise<{
  compte: CompteAdmin
  /** Affiche UNE fois — jamais rejoue par aucune API. */
  mot_de_passe_initial: string
  email_envoye: boolean
  note: string
}> {
  // Le backend a un defaut FAIL-CLOSED 'viewer' ; on envoie le role choisi.
  return api('/admin/comptes', { method: 'POST', body: { email, role } })
}

export function changerEtatCompte(
  email: string,
  actif: boolean,
  motif: string,
): Promise<{ compte: CompteAdmin; note: string }> {
  return api(`/admin/comptes/${encodeURIComponent(email)}/etat`, {
    method: 'PUT',
    body: { actif, motif },
  })
}

/** Change le role RBAC d'un compte — PUT /admin/comptes/{email}/role.
 *  Super-Admin seulement (403 sinon), anti-lock-out sur le dernier super-admin
 *  (409), effectif au PROCHAIN login du compte (le jeton en cours garde son
 *  role). `note` porte ce rappel. */
export function changerRoleCompte(
  email: string,
  role: RoleLoader,
): Promise<{ compte: CompteAdmin; note: string }> {
  return api(`/admin/comptes/${encodeURIComponent(email)}/role`, {
    method: 'PUT',
    body: { role },
  })
}

// --------------------------------------------------------------------------
// Notifications in-app (20/08) — la boite du compte CONNECTE, jamais celle
// d'un autre (le backend borne au jeton). Le texte n'arrive PAS tout fait :
// `type` + `donnees` structurées, le rendu localisé FR/EN se fait à l'écran.
// --------------------------------------------------------------------------

export type NotificationAdmin = {
  id: string
  /** 'compte_cree' | 'role_change' | 'compte_desactive' | 'compte_reactive'… */
  type: string
  donnees: Record<string, unknown>
  lu: boolean
  quand: string
}

export function listerNotifications(): Promise<{
  notifications: NotificationAdmin[]
  non_lues: number
}> {
  return api('/admin/notifications')
}

/** Le compteur de la cloche — léger, sondé souvent. */
export function compterNonLues(): Promise<{ non_lues: number }> {
  return api('/admin/notifications/non-lues')
}

export function marquerNotifLue(id: string): Promise<{ lu: boolean }> {
  return api(`/admin/notifications/${encodeURIComponent(id)}/lu`, { method: 'PUT' })
}

export function marquerToutLu(): Promise<{ marquees: number }> {
  return api('/admin/notifications/tout-lu', { method: 'PUT' })
}

// --------------------------------------------------------------------------
// Journal d'administration (audit) — contrat de app/routes/admin_journal.py
// « Qui a fait quoi, quand ». Super-Admin seulement (403 sinon). Lecture seule.
// --------------------------------------------------------------------------

export type EntreeJournal = {
  quand: string
  operation: string
  entite: string
  cible: string
  acteur: string | null
  details: Record<string, unknown>
}

export function listerJournal(
  limite = 200,
): Promise<{ entrees: EntreeJournal[]; total: number; note: string }> {
  return api(`/admin/journal?limite=${limite}`)
}

// --------------------------------------------------------------------------
// Entites a l'unite (Lot D + Lot H) — contrat de app/routes/admin_entites.py
// Le rite en DEUX temps (D-01) : /apercu ne fait AUCUNE ecriture ; la
// confirmation re-valide les MEMES champs puis pousse et RELIT (FRA-218).
// --------------------------------------------------------------------------

/** US-D2 — le formulaire produit. COLLECT seulement, 3 interfaces par policy_type. */
export type ProduitDemande = {
  nom: string
  /** Code court — partira TEL QUEL dans short_name (sans prefixe, 20/08). */
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
  diff_relecture: DiffRelecture | null
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
  /** « Regenerer une variante » : meme demande+variante = meme fiche (CR-03),
   * variante suivante = AUTRE tirage coherent. */
  variante?: number
  /** US-D1 EDITABLE — industries/secteurs CHOISIS dans le referentiel via les
   * listes deroulantes. Absent/vide = derivation par type (comportement run). */
  industries?: string[]
  sectors?: string[]
  /** US-D1 EDITABLE — le DIRIGEANT compose, ajuste dans l'apercu. Tout champ
   * absent reste celui du Loader ; les invariants (format email, MAJUSCULES
   * id_number, piece non expiree, majorite) sont tenus cote serveur. */
  owner?: OwnerOverride
}

/** Champs du dirigeant editables dans l'apercu — tous optionnels. Dates au
 * format ISO `YYYY-MM-DD`. Le serveur valide et refuse en 422 lisible. */
export type OwnerOverride = {
  first_name?: string
  last_name?: string
  email?: string
  gender?: 'MALE' | 'FEMALE'
  date_of_birth?: string
  id_number?: string
  id_expire_on?: string
  phone?: string
}

export function apercuCompany(demande: CompanyDemande): Promise<{
  fiche: Record<string, unknown>
  /** L'EMAIL de l'Admin User annonce — une chaine (RapportOrganisation.admins_crees). */
  admin_annonce: string | null
  /** UC-07 — la licence qui sera creee avec la company (annonce d'apercu). */
  licence_annonce?: string
  note: string
}> {
  return api('/admin/entites/companies/apercu', { method: 'POST', body: demande })
}

export function creerCompany(demande: CompanyDemande): Promise<{
  fiche: Record<string, unknown>
  /** La fiche RELUE de la plateforme — la preuve, jamais l'echo du POST. */
  fiche_relue: Record<string, unknown> | null
  diff_relecture: DiffRelecture | null
  /** Les EMAILS des Admin Users crees — des chaines, pas des objets. */
  admins_crees: string[]
  cascade_owner_verifiee: boolean
  /** UC-07 (16/08) : la company naît AVEC sa licence — comme au run. */
  licence_creee: boolean
  licence_detail: string
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
  diff_relecture: DiffRelecture
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
