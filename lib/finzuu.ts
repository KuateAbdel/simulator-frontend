// Domaine FinZuu Loader — types et données mock (backend non actif)

export type Environment = 'TEST' | 'DEMO'

export const COUNTRIES = [
  { code: 'CM', name: 'Cameroun' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'SN', name: 'Sénégal' },
] as const

export type CountryCode = (typeof COUNTRIES)[number]['code']

export type Volumes = {
  companies: string
  lenders: string
  kiosques: string
  personnel: string
  clients: string
}

export type LoaderOptions = {
  historiqueCredit: boolean
  vieFinanciere: boolean
  simulationComportementale: boolean
}

export type LoaderConfig = {
  environment: Environment
  countries: CountryCode[]
  periodDays: number
  volumes: Volumes
  options: LoaderOptions
}

export const DEFAULT_CONFIG: LoaderConfig = {
  environment: 'TEST',
  countries: ['CM', 'CI', 'BF', 'SN'],
  periodDays: 180,
  volumes: {
    companies: '12 – 20',
    lenders: '16',
    kiosques: '40 – 80',
    personnel: '60 – 100',
    clients: '~ 2 000',
  },
  options: {
    historiqueCredit: true,
    vieFinanciere: true,
    simulationComportementale: true,
  },
}

// Modules de génération (écran Exécution)
export type ModuleStatus = 'termine' | 'en_cours' | 'en_attente'

export type GenModule = {
  label: string
  progress: number
  status: ModuleStatus
}

export const GEN_MODULES: GenModule[] = [
  { label: 'Initialisation', progress: 100, status: 'termine' },
  { label: 'Référentiels (Pays, Régions, Villes…)', progress: 100, status: 'termine' },
  { label: 'Companies', progress: 100, status: 'termine' },
  { label: 'Lenders', progress: 85, status: 'en_cours' },
  { label: 'Branches & Agences', progress: 60, status: 'en_cours' },
  { label: 'Kiosques & Dépositaires', progress: 40, status: 'en_cours' },
  { label: 'Personnel & Agents', progress: 20, status: 'en_cours' },
  { label: 'Clients & Comptes', progress: 0, status: 'en_attente' },
  { label: 'Historique crédit', progress: 0, status: 'en_attente' },
  { label: 'Vie financière (180 jours)', progress: 0, status: 'en_attente' },
]

// Résultats (écran Résultats)
export const RESULT_SUMMARY = {
  pays: 4,
  clients: 2018,
  comptes: 2018,
  prets: 3845,
  epargne: 2214,
}

export type EntityResult = {
  entity: string
  cree: number
  reussi: number
  echecs: number
}

export const ENTITY_RESULTS: EntityResult[] = [
  { entity: 'Companies', cree: 15, reussi: 15, echecs: 0 },
  { entity: 'Lenders', cree: 16, reussi: 16, echecs: 0 },
  { entity: 'Branches', cree: 45, reussi: 45, echecs: 0 },
  { entity: 'Agences', cree: 88, reussi: 88, echecs: 0 },
  { entity: 'Kiosques / Dépositaires', cree: 62, reussi: 62, echecs: 0 },
  { entity: 'Personnel', cree: 78, reussi: 78, echecs: 0 },
  { entity: 'Clients', cree: 2018, reussi: 2018, echecs: 0 },
  { entity: 'Comptes', cree: 2018, reussi: 2018, echecs: 0 },
  { entity: 'Prêts', cree: 3845, reussi: 3845, echecs: 0 },
]

// Runs existants (mock)
export type RunStatus = 'termine' | 'en_cours' | 'echoue'

export type RunSummary = {
  id: string
  status: RunStatus
  environment: Environment
  date: string
}

export const MOCK_RUNS: RunSummary[] = [
  { id: 'RUN-2026-07-22-001', status: 'termine', environment: 'TEST', date: '22 juil. 2026' },
  { id: 'RUN-2026-07-21-004', status: 'termine', environment: 'DEMO', date: '21 juil. 2026' },
  { id: 'RUN-2026-07-21-002', status: 'echoue', environment: 'TEST', date: '21 juil. 2026' },
  { id: 'RUN-2026-07-20-001', status: 'termine', environment: 'DEMO', date: '20 juil. 2026' },
]

export const RESET_ESTIMATE = {
  types: 9,
  total: 18000,
}

export function countryNames(codes: CountryCode[]): string {
  return codes
    .map((c) => COUNTRIES.find((x) => x.code === c)?.name ?? c)
    .join(', ')
}
