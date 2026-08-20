// src/types/index.ts
//
// Les types du LOADER — plus aucun type fintech de la base JJB.
// La navigation suit les 6 epopees du backlog canonique (Confluence 67665922).

/** Chaque entree de la sidebar est une page. Les groupes sont dans NAV_GROUPS. */
export type Page =
  | 'tableau-de-bord' // US-E1
  | 'configuration' // US-B1/B2/B3
  | 'admin-comptes' // RBAC — le role Super-Admin, multi-comptes
  | 'admin-journal' // Audit — qui a fait quoi, quand (super_admin)
  | 'ref-geographie' // US-B5 — l'arbre riche
  | 'ref-pays-monnaies' // creation config-service (US-B6 + devises)
  | 'ref-telcos' // US-B7
  | 'ref-catalogue' // US-B5
  | 'entites-company' // US-D1
  | 'entites-produit' // US-D2
  | 'entites-groupe' // POST /admin/entites/groupes
  | 'entites-depositaire' // US-D3 — quartier + company à nous
  | 'runs-preparer' // US-C1/C2 — le rite D-01
  | 'runs-progression' // US-C3/C4
  | 'runs-historique' // US-C6
  | 'ecosysteme' // US-E2
  | 'population' // US-E3
  | 'inventaire' // reconciliation 4 statuts + adoption A-13
  | 'tracabilite' // US-E4
  | 'purge' // US-F1/F2

/** Les 3 roles RBAC du Loader (matrice FZ-RBAC-LOADER). Ordre de privilege
 *  croissant : viewer < admin < super_admin. C'est le backend (403) qui fait
 *  autorite ; ce type ne sert qu'a la PROJECTION de l'UI. */
export type RoleLoader = 'viewer' | 'admin' | 'super_admin'

/** Rang de privilege — sert aux comparaisons de projection UI. */
export const RANG_ROLE: Record<RoleLoader, number> = { viewer: 0, admin: 1, super_admin: 2 }

/** Vrai si `role` atteint au moins `min` (projection UI ; l'API reste juge). */
export function roleAuMoins(role: RoleLoader, min: RoleLoader): boolean {
  return RANG_ROLE[role] >= RANG_ROLE[min]
}

/** La session du Loader (jeton 4 h emis par /admin/auth/login). */
export interface Session {
  email: string
  /** Epoch ms de peremption, calcule depuis `expires_in` a la connexion. */
  expiresAt: number
  /** US-A2 — tant que vrai, la seule route ouverte est le changement de mdp. */
  mustChangePassword: boolean
  /** RBAC — le role porte par le compte, remonte au login. */
  role: RoleLoader
}
