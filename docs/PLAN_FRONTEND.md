# Frontend Loader FinZuu — conception produit & plan d'exécution

> Rédigé en lead frontend / product / UX. Le frontend n'est pas un habillage
> du backend : c'est le **cockpit** du Super-Admin. Il doit refléter **chaque**
> capacité du backend (38 endpoints) avec de **vrais flux produit**, pas des
> écrans-vitrines. Base : coquille de Zidane (bon stack + thème FinZuu),
> complétée. Cible : `https://simul.fintech4esg.com`.

## 0. État de départ (mesuré)

Zidane : 10 pages, **0 appel backend**, données 100 % mock, la moitié des
écrans manquants. Couverture fonctionnelle **0 %**. Réutilisable : le thème
(violet + brand-green), les primitives (`Button`, `Card`, `PageHeader`,
`Toggle`, `StatusPill`), la sidebar/topbar. Déjà fait : `lib/api.ts` (client
réel) + login branché (US-A1/A2).

## 1. Le socle transverse (à bâtir AVANT les écrans)

- **Garde d'authentification** : rediriger vers `/login` si pas de jeton ;
  purge du jeton + redirection sur 401 (jeton expiré, session 4 h).
- **Couche de données** : hooks `useApi`/`useMutation` — chargement, erreur
  **nommée** (le `detail` du backend), vide, succès. Jamais un écran figé.
- **Retour visuel** : toasts (succès/erreur), squelettes de chargement,
  états vides explicites (« aucune donnée — voici pourquoi »).
- **Client API complet** : une fonction typée par endpoint (les 38), rangées
  par domaine (auth, config, référentiels, entités, runs, dashboard,
  inventaire, purge).
- **A11y & i18n** : tout en français, labels ARIA, focus visibles, responsive
  (le cockpit doit tenir sur un laptop).

## 2. Architecture de l'information (la nav qui REFLÈTE le backend)

La nav de Zidane ignore la moitié du backend. Nouvelle IA, par domaine métier :

```
Tableau de bord      santé des 10 services + Faker, compteurs, alertes (E1)
Configuration        volumes, quotas, période, périmètre lending (US-B1/2/3)
Référentiels
  ├─ Géographie      arbre pays→région→ville→quartier (lecture + création)
  ├─ Pays / Monnaies création (config-service) — formulaire + invariants
  ├─ Telcos          création + rattachement pays (US-B7)
  └─ Catalogue       les produits statiques (US-B5)
Entités (à l'unité)
  ├─ Company         aperçu → confirmer (US-D1)
  ├─ Produit         3 interfaces par policy_type (US-D2)
  └─ Groupe / Rôle   création + permissions
Runs
  ├─ Préparer        DRY_RUN, le rapport « dernière occasion de dire non » (D-01)
  ├─ Exécution       progression réelle, confirmer sur empreinte figée
  ├─ Résultats       mesures de population (US-E3), index inverse (P-01)
  └─ Historique      liste append-only, rapport par run
Inventaire           réconciliation ici↔là-bas : groupes / produits / companies
                     (4 statuts), adoption A-13, DELETE d'un groupe à nous
Purge                inventaire honnête + confirmation (US-F1/F2)
Traçabilité / Logs   journal d'exécution, réconciliation (E4)
Paramètres · Aide
```

## 3. Les écrans, un par un (mappés aux endpoints + états UX)

| Écran | Endpoints backend | Flux / états clés |
|---|---|---|
| Tableau de bord | `GET /admin/dashboard`, `/ecosysteme` | pastilles santé 10 services, alertes, refresh |
| Configuration | `GET/PUT /admin/configuration`, `PUT .../pays/{code}` | édition + 409 EF-55 pendant un run |
| Géographie | `GET /admin/referentiels/geographie` | arbre déroulant, GPS |
| Créer pays | `POST /admin/referentiels/pays` | formulaire, 409 existe, 422 devise |
| Créer monnaie | `POST /admin/referentiels/devises` | formulaire, 409 existe |
| Créer région/ville/quartier | `POST .../regions,villes,quartiers` | hiérarchie EF-02 imposée |
| Créer telco | `POST /admin/referentiels/telcos` | aller complet + 4 invariants |
| Permissions | `GET /admin/referentiels/permissions` | liste pour la création de groupe |
| Company / Produit / Groupe | `POST /admin/entites/*` (+ apercu) | aperçu → confirmer, refus nommés |
| Runs préparer/confirmer | `POST /admin/runs`, `/{id}/confirmer` | rite D-01, empreinte figée |
| Progression | `GET /admin/runs/{id}/progression` | polling, arrêt v1 |
| Historique | `GET /admin/runs` | liste, statuts |
| Population | `GET /admin/dashboard/population` | occupations, soldes, naissances |
| Index inverse | `GET /admin/dashboard/index-inverse` | clients/produit, clients/kiosque |
| Traçabilité | `GET /admin/dashboard/tracabilite` | journal, réconciliation |
| Inventaire | `GET /admin/inventaire/{groupes,produits,companies}` | 4 statuts colorés |
| Adoption | `POST /admin/inventaire/groupes/adoption` | sélection multiple |
| Supprimer groupe | `DELETE /admin/inventaire/groupes/{id}` | confirmation, 403 étranger |
| Purge | `POST /admin/purge/{preparer,confirmer}` | rite 2 temps |

## 4. Product & UX — les partis pris (pas de médiocre)

- **Le rite D-01 est un vrai parcours** : préparer (DRY) montre le rapport
  complet, on LIT, on confirme sur l'empreinte figée (409 « re-préparer » si
  la config a changé). L'écran matérialise « la dernière occasion de dire non ».
- **La réconciliation est visuelle** : 4 statuts = 4 couleurs (à_nous vert,
  étranger gris, disparu ambre, marqué-inconnu violet), comptes en tête.
- **Les refus sont pédagogiques** : le `detail` nommé du backend s'affiche tel
  quel (jamais « erreur 422 »).
- **La hiérarchie est guidée** : créer une ville propose d'abord la région ;
  rien « en l'air ».
- **Cohérence de marque** : violet FinZuu en primaire, brand-green pour le
  positif/à-nous, ambre/rouge pour alertes.

## 5. CI/CD & déploiement

Dockerfile Next.js (standalone, non-root) · GitHub Actions : lint + build +
type-check, puis déploiement SSH sur le serveur (user `apps`, conteneur
derrière le vhost `simul.fintech4esg.com`, port loopback dédié), même doctrine
que le backend (hôte par empreinte, `nginx -t`, santé vérifiée).

## 6. Phasage (chaque phase = commit + CI verte + déployable)

1. **Socle** : garde d'auth, hooks de données, client API complet, toasts. ← EN COURS
2. **Cockpit** : Tableau de bord + Configuration branchés.
3. **Runs** : préparer/confirmer/progression/résultats (le cœur du pilotage).
4. **Référentiels** : géo + création pays/monnaie/telco/région/ville/quartier.
5. **Entités** : company/produit/groupe à l'unité + permissions.
6. **Inventaire & purge** : réconciliation 4 statuts, adoption, DELETE, purge.
7. **CI/CD + déploiement** sur simul.fintech4esg.com.
8. **Polish** : responsive, a11y, états vides, aide contextuelle.
