// src/components/Layout/nav.ts
//
// L'ARBRE DE NAVIGATION du Loader — la traduction visuelle du backlog
// canonique (6 epopees, Confluence 67665922). Une seule source : la Sidebar
// le rend, le Header en tire le titre de page, le routeur ses pages.
//
// REFONTE 20/08 (audit UX du backoffice FinZuu, decision Yaniv « ne pas
// saturer la sidebar ») : la sidebar porte 8 ENTREES DE SECTION — le detail
// vit en ONGLETS dans chaque section (SectionOnglets). Les identifiants de
// page restent FINS (`runs-preparer`…) : la navigation croisee entre ecrans
// et la tracabilite user-story -> ecran ne bougent pas. PAGE_META garde le
// libelle et la story DE CHAQUE page (le Header suit l'onglet actif) ;
// NAV_ITEMS ne decrit que les 8 entrees.

import type { LucideIcon } from 'lucide-react'
import {
  Boxes,
  Building2,
  LayoutDashboard,
  Map,
  Network,
  PlayCircle,
  Settings2,
  UserCog,
} from 'lucide-react'
import type { Page, RoleLoader } from '../../types'
import type { TranslationKey } from '../../i18n'

/** Le libelle et la user story DE CHAQUE page (tracabilite CDC). Le Header
 *  affiche ceux de l'ONGLET actif, jamais un agrégat de section. */
export const PAGE_META: Record<Page, { labelKey: TranslationKey; stories: string }> = {
  'tableau-de-bord': { labelKey: 'nav_dashboard', stories: 'US-E1' },
  configuration: { labelKey: 'nav_configuration', stories: 'US-B1 · US-B2 · US-B3' },
  'admin-comptes': { labelKey: 'nav_administration', stories: 'RBAC · Audit' },
  'ref-geographie': { labelKey: 'nav_geographie', stories: 'US-B5' },
  'ref-pays-monnaies': { labelKey: 'nav_pays_monnaies', stories: 'US-B6' },
  'ref-telcos': { labelKey: 'nav_telcos', stories: 'US-B7' },
  'ref-catalogue': { labelKey: 'nav_catalogue', stories: 'US-B5' },
  'entites-company': { labelKey: 'nav_company', stories: 'US-D1' },
  'entites-produit': { labelKey: 'nav_produit', stories: 'US-D2' },
  'entites-groupe': { labelKey: 'nav_groupe', stories: 'Lot H' },
  'entites-depositaire': { labelKey: 'nav_depositaire', stories: 'US-D3' },
  'runs-preparer': { labelKey: 'nav_runs_preparer', stories: 'US-C1 · US-C2' },
  'runs-progression': { labelKey: 'nav_runs_progression', stories: 'US-C3 · US-C4' },
  'runs-historique': { labelKey: 'nav_runs_historique', stories: 'US-C6' },
  ecosysteme: { labelKey: 'nav_ecosysteme', stories: 'US-E2' },
  population: { labelKey: 'nav_population', stories: 'US-E3' },
  inventaire: { labelKey: 'nav_inventaire', stories: 'A-13 · réconciliation' },
  tracabilite: { labelKey: 'nav_tracabilite', stories: 'US-E4' },
  purge: { labelKey: 'nav_purge', stories: 'US-F1 · US-F2' },
}

export interface NavItem {
  /** Page d'ATTERRISSAGE de l'entree (premier onglet de la section). */
  page: Page
  labelKey: TranslationKey
  icon: LucideIcon
  /** Les stories couvertes par la section (tooltip sidebar). */
  stories: string
  /** TOUTES les pages de la section — sert a marquer l'entree active quand
   *  un onglet interne est ouvert. Absent = entree mono-page. */
  pages?: Page[]
  /** RBAC — role MINIMAL pour voir l'entree. Absent = visible par tous les
   *  roles. C'est une PROJECTION : l'API reste seule juge (403). */
  roleMin?: RoleLoader
}

/** Les 8 entrees de la sidebar — jamais plus (regle Yaniv 20/08 : un besoin
 *  nouveau devient un ONGLET d'une section existante, pas une entree). */
export const NAV_ITEMS: NavItem[] = [
  { page: 'tableau-de-bord', labelKey: 'nav_dashboard', icon: LayoutDashboard, stories: 'US-E1' },
  {
    page: 'runs-preparer',
    labelKey: 'nav_group_runs',
    icon: PlayCircle,
    stories: 'US-C1 → US-C6',
    pages: ['runs-preparer', 'runs-progression', 'runs-historique'],
  },
  {
    page: 'ecosysteme',
    labelKey: 'nav_observatoire',
    icon: Network,
    stories: 'US-E2 · US-E3 · US-E4',
    pages: ['ecosysteme', 'population', 'tracabilite'],
  },
  {
    page: 'entites-company',
    labelKey: 'nav_group_entites',
    icon: Building2,
    stories: 'US-D1 · US-D2 · US-D3 · Lot H',
    pages: ['entites-company', 'entites-produit', 'entites-groupe', 'entites-depositaire'],
  },
  {
    page: 'ref-geographie',
    labelKey: 'nav_group_referentiels',
    icon: Map,
    stories: 'US-B5 · US-B6 · US-B7',
    pages: ['ref-geographie', 'ref-pays-monnaies', 'ref-telcos', 'ref-catalogue'],
  },
  { page: 'configuration', labelKey: 'nav_configuration', icon: Settings2, stories: 'US-B1 · US-B2 · US-B3' },
  {
    page: 'inventaire',
    labelKey: 'nav_inventaire_purge',
    icon: Boxes,
    stories: 'A-13 · US-F1 · US-F2 · US-F3',
    pages: ['inventaire', 'purge'],
    // RBAC — l'entree n'avait AUCUN `roleMin` : elle s'affichait pour TOUS les
    // roles, et l'ecran Purge avec elle. L'API refusait bien en 403
    // (`exige_super_admin` sur `/preparer` comme sur `/confirmer`), mais offrir
    // une porte qu'on claque au nez n'est pas du controle d'acces : c'est une
    // fausse promesse. `US-F3` rend l'ecran capable de vider notre carte —
    // raison de plus pour qu'il ne soit meme pas visible ailleurs.
    roleMin: 'super_admin',
  },
  {
    page: 'admin-comptes',
    labelKey: 'nav_administration',
    icon: UserCog,
    stories: 'RBAC · Audit',
    roleMin: 'super_admin',
  },
]

/** Meta d'une page (libelle + story) — consommee par Header, Layout (titre
 *  d'onglet navigateur) et EnConstruction. */
export function navItemDe(page: Page): { labelKey: TranslationKey; stories: string } {
  const meta = PAGE_META[page]
  if (!meta) throw new Error(`page inconnue dans PAGE_META: ${page}`)
  return meta
}

/** L'entree de sidebar ACTIVE pour une page donnee (l'onglet interne compte). */
export function entreeActive(item: NavItem, page: Page): boolean {
  return item.page === page || (item.pages?.includes(page) ?? false)
}
