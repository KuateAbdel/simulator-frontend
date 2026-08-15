// src/components/Layout/nav.ts
//
// L'ARBRE DE NAVIGATION du Loader — la traduction visuelle du backlog
// canonique (6 epopees, Confluence 67665922). Une seule source : la Sidebar
// le rend, le Header en tire le titre de page, le routeur ses pages.
// Chaque entree porte sa user story — la tracabilite exigence → ecran.

import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Boxes,
  Building2,
  Eraser,
  FileClock,
  Globe2,
  LayoutDashboard,
  Map,
  Network,
  Package,
  PlayCircle,
  Radio,
  Settings2,
  ShieldCheck,
  Users,
  UserCog,
  Coins,
  ClipboardList,
} from 'lucide-react'
import type { Page } from '../../types'
import type { TranslationKey } from '../../i18n'

export interface NavItem {
  page: Page
  labelKey: TranslationKey
  icon: LucideIcon
  /** La ou les user stories que l'ecran realise (tracabilite CDC). */
  stories: string
  /** Phase du plan qui livre l'ecran (1 = deja la). */
  phase: number
}

export interface NavGroup {
  labelKey: TranslationKey | null // null = entrees de premier niveau
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: null,
    items: [
      { page: 'tableau-de-bord', labelKey: 'nav_dashboard', icon: LayoutDashboard, stories: 'US-E1', phase: 2 },
      { page: 'configuration', labelKey: 'nav_configuration', icon: Settings2, stories: 'US-B1 · US-B2 · US-B3', phase: 2 },
      { page: 'admin-comptes', labelKey: 'nav_comptes', icon: UserCog, stories: 'RBAC', phase: 5 },
    ],
  },
  {
    labelKey: 'nav_group_referentiels',
    items: [
      { page: 'ref-geographie', labelKey: 'nav_geographie', icon: Map, stories: 'US-B5', phase: 4 },
      { page: 'ref-pays-monnaies', labelKey: 'nav_pays_monnaies', icon: Globe2, stories: 'US-B6', phase: 4 },
      { page: 'ref-telcos', labelKey: 'nav_telcos', icon: Radio, stories: 'US-B7', phase: 4 },
      { page: 'ref-catalogue', labelKey: 'nav_catalogue', icon: Package, stories: 'US-B5', phase: 4 },
    ],
  },
  {
    labelKey: 'nav_group_entites',
    items: [
      { page: 'entites-company', labelKey: 'nav_company', icon: Building2, stories: 'US-D1', phase: 5 },
      { page: 'entites-produit', labelKey: 'nav_produit', icon: Coins, stories: 'US-D2', phase: 5 },
      { page: 'entites-groupe', labelKey: 'nav_groupe', icon: ShieldCheck, stories: 'Lot H', phase: 5 },
    ],
  },
  {
    labelKey: 'nav_group_runs',
    items: [
      { page: 'runs-preparer', labelKey: 'nav_runs_preparer', icon: PlayCircle, stories: 'US-C1 · US-C2', phase: 3 },
      { page: 'runs-progression', labelKey: 'nav_runs_progression', icon: Activity, stories: 'US-C3 · US-C4', phase: 3 },
      { page: 'runs-historique', labelKey: 'nav_runs_historique', icon: FileClock, stories: 'US-C6', phase: 3 },
    ],
  },
  {
    labelKey: null,
    items: [
      { page: 'ecosysteme', labelKey: 'nav_ecosysteme', icon: Network, stories: 'US-E2', phase: 6 },
      { page: 'population', labelKey: 'nav_population', icon: Users, stories: 'US-E3', phase: 6 },
      { page: 'inventaire', labelKey: 'nav_inventaire', icon: Boxes, stories: 'A-13 · réconciliation', phase: 7 },
      { page: 'tracabilite', labelKey: 'nav_tracabilite', icon: ClipboardList, stories: 'US-E4', phase: 7 },
      { page: 'purge', labelKey: 'nav_purge', icon: Eraser, stories: 'US-F1 · US-F2', phase: 7 },
    ],
  },
]

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)

export function navItemDe(page: Page): NavItem {
  const item = NAV_ITEMS.find((i) => i.page === page)
  if (!item) throw new Error(`page inconnue dans NAV_GROUPS: ${page}`)
  return item
}
