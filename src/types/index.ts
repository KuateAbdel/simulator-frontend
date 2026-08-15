// src/types/index.ts
//
// Les types du LOADER — plus aucun type fintech de la base JJB.
// La navigation suit les 6 epopees du backlog canonique (Confluence 67665922).

/** Chaque entree de la sidebar est une page. Les groupes sont dans NAV_GROUPS. */
export type Page =
  | 'tableau-de-bord' // US-E1
  | 'configuration' // US-B1/B2/B3
  | 'admin-comptes' // RBAC — le role Super-Admin, multi-comptes
  | 'ref-geographie' // US-B5 — l'arbre riche
  | 'ref-pays-monnaies' // creation config-service (US-B6 + devises)
  | 'ref-telcos' // US-B7
  | 'ref-catalogue' // US-B5
  | 'entites-company' // US-D1
  | 'entites-produit' // US-D2
  | 'entites-groupe' // POST /admin/entites/groupes
  | 'runs-preparer' // US-C1/C2 — le rite D-01
  | 'runs-progression' // US-C3/C4
  | 'runs-historique' // US-C6
  | 'ecosysteme' // US-E2
  | 'population' // US-E3
  | 'inventaire' // reconciliation 4 statuts + adoption A-13
  | 'tracabilite' // US-E4
  | 'purge' // US-F1/F2

/** La session Super-Admin du Loader (jeton 4 h emis par /admin/auth/login). */
export interface Session {
  email: string
  /** Epoch ms de peremption, calcule depuis `expires_in` a la connexion. */
  expiresAt: number
  /** US-A2 — tant que vrai, la seule route ouverte est le changement de mdp. */
  mustChangePassword: boolean
}
