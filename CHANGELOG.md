# Changelog — FinZuu Loader (webapp)

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le
versionnage [SemVer](https://semver.org/lang/fr/). La version affichée dans
l'app (bas de sidebar + login) vient de `package.json`, injectée au build
avec le commit court — elle ne peut pas mentir.

## [1.1.1] — 2026-08-16

### Corrigé
- **Configuration : React #310** (« erreur de rendu », tout l'écran dans le
  PageBoundary) — les hooks du bloc Scénarios étaient déclarés APRÈS les
  returns anticipés (chargement/erreur) : nombre de hooks différent entre
  deux rendus. Hooks remontés avant tout return ; banc navigateur 6/6
  (rendu complet, scénario sauvé, aller-retour d'onglet, zéro erreur
  console).

## [1.1.0] — 2026-08-16

**Le cockpit complet du 16/08** — les décisions et recommandations validées
par Yaniv, écrans compris.

### Ajouté
- **Dépositaire US-D3 refondu** : naît d'un QUARTIER + une company À NOUS —
  2 champs saisis, nom `DEMO_Kiosque <quartier>` et devise DÉRIVÉE affichés,
  incohérence company↔quartier dite (422 nommé). Licences UC-07 par company.
- **États là-bas** : dépositaires/telcos/devises — l'état `is_active` se VOIT
  et se CHANGE, refus de désactivation MESURÉ (références inverses).
- **Aperçu Company modifiable** : les 4 champs saisis se corrigent en place +
  « Recomposer » ; **« Autre variante » 🎲** — même demande+variante = même
  fiche (CR-03), variante suivante = AUTRE tirage cohérent.
- **Scénarios nommés** : sauver la demande de configuration courante en
  preset, l'appliquer par LE chemin du PUT (gardes comprises), 409 homonyme.
- **Diff payload↔relecture** : après chaque création à l'unité, la table
  envoyé↔relu champ par champ (DiffTable — perdu/écrasé/ajouté) **doublée du
  VERDICT DU BACKEND** (`diff_relecture`, l'autorité) — ce que la plateforme
  perd (FRA-199 `currency`) ou écrase se dit à l'écran, jamais à l'œil.
  Câblé sur Produit, Company (fiche RELUE, plus l'écho du POST), Groupe,
  Dépositaire.

## [1.0.0] — 2026-08-15

**Les 8 phases du plan sont tenues** — le cockpit couvre les 6 épopées du
backlog canonique, hébergé et déployé par pipeline.

### Ajouté
- **Utilisateurs (RBAC)** : Super-Admin est un RÔLE multi-comptes — création
  par email réel (mot de passe initial affiché une fois), désactivation
  réversible motivée, gardes anti-lock-out ; « changer MON mot de passe »
  accessible à tout moment depuis le header.
- **Phase 6** : Écosystème (arbre Branche→Agence→Kiosque), Population
  (mesure/cible par pays, histogramme des soldes avec frontière EF-68,
  occupations, naissances, index inverse P-01), Traçabilité (verdict de
  réconciliation, orphelines des deux registres), Inventaire (4 statuts,
  adoption A-13, DELETE relu), Purge (rite 2 temps, résidus à verdicts).
- **Phase 8 — polish** : a11y (focus visible, `prefers-reduced-motion`,
  Échap sur les dialogues avec focus sur l'action sûre, `lang` dynamique,
  aria des boutons icône), titre d'onglet par page, `noscript` honnête.

### Corrigé
- Catalogue : `variants` est un objet profession→profil (exceptions au
  profil par défaut) — plus de crash React #31, rendu en chips explicites.

## [0.5.0] — 2026-08-15

Première version HÉBERGÉE : https://simul.fintech4esg.com (phases 1→5 du
plan, plus la 7 — CI/CD — livrée en avance). v1.0.0 quand les 8 phases
seront tenues (inventaire/purge, écosystème/population/traçabilité, polish).

### Ajouté
- **Phase 1 — fondation** : auth réelle US-A1/A2 (session 4 h comptée à
  rebours, survit au refresh), reset par email US-A4 v2, nav des 6 épopées
  (user story affichée par écran), PWA (coquille en précache, données JAMAIS
  en cache), garde d'auth + ErrorBoundary.
- **Phase 2 — cockpit** : Tableau de bord US-E1 (santé 10 services en
  direct, compteurs, alertes, auto-refresh) + Configuration US-B1/B2/B3
  (origine par valeur, quotas verrouillés dits, 409 EF-55 nommé).
- **Phase 3 — les runs** : le rite D-01 à l'écran (préparer DRY → lire le
  rapport TENU/VIOLÉ → confirmer sur empreinte figée), progression en
  polling, historique append-only.
- **Phase 4 — référentiels** : Géographie (arbre pays→région→ville→quartier,
  badges « part à config-service / reste chez nous »), Pays & Monnaies
  (CountrySelect ISO, matière-pour-générer), Telcos (4 invariants doublés à
  la frappe), Catalogue statique.
- **Phase 5 — entités à l'unité** : Produit US-D2 (3 interfaces par
  policy_type, aperçu = payload exact, fiche relue), Company US-D1 (ville du
  référentiel EF-02, aperçu = fiche composée ~40 champs), Groupe Lot H
  (permissions vivantes, familles dérivées + recherche + actions groupées).
- **Responsive réel** : sous 768 px la sidebar devient un tiroir superposé
  (fermée par défaut, hamburger, se referme à la navigation) — le contenu
  garde toute la largeur de l'écran.
- **Versionning affiché** : `Loader vX.Y.Z · commit` en bas de sidebar et
  sur le login, injecté au build.
- **CI/CD** : CI (tsc strict + build + URL API prouvée dans le bundle) puis
  CD (rsync SSH en user `apps`, hôte par empreinte, santé = l'index en ligne
  sert le bundle exact du build). Main protégée.

### Corrigé
- Crash de rendu Géographie (`surcouche.resume` est une chaîne) qui avalait
  tout le cockpit — remplacé par un garde-fou PAR PAGE (l'erreur reste
  locale, la sidebar survit).
- `admin_annonce` (email) rendu caractère par caractère dans un tableau.
- Devise ISO 4217 CONNUE par pays (CM→XAF…) pré-remplie, carte Monnaie
  pré-remplissable depuis un pays.
