# Frontend Loader FinZuu — conception UX/UI détaillée

> Rédigé en lead ingénieur + designer produit UI/UX. Design system : JJB
> (violet `#c68cff` + vert `#19af58`, Sora/DM Sans, cartes douces, recharts).
> Vérité produit : les 6 épopées du backlog canonique (Confluence 67665922).
> Vérité technique : les 38 endpoints du backend. Principe : **le Loader est
> plus riche que la plateforme — l'écran le montre.**

---

## 1. Principes de design (les partis pris de senior)

1. **La richesse se voit.** Là où la plateforme a des villes plates, nous
   montrons l'arbre pays→région→ville→quartier. Là où elle ignore « à qui
   appartient quoi », nous colorons 4 statuts. L'UI est la preuve visible que
   le Loader sait plus.
2. **Les rites sont des parcours, pas des boutons.** Le D-01 (préparer→lire→
   confirmer) est un flux en étapes, avec « la dernière occasion de dire non »
   matérialisée. La purge en deux temps aussi.
3. **Aucun état muet.** Chargement (squelettes), vide (« rien, et voici
   pourquoi »), erreur (le motif NOMMÉ du backend), succès (toast). Jamais un
   écran figé, jamais « erreur 422 ».
4. **La beauté sert la lecture.** Hiérarchie typographique Sora/DM Sans,
   respiration (espaces), couleur sémantique (violet=marque, vert=à-nous/OK,
   ambre=attention, rouge=danger), micro-animations (fade-in, stagger).
5. **Bilingue natif.** FR par défaut, EN en un clic — chaque libellé passe par
   `t()`, rien en dur.

## 2. Design system (ce qu'on garde de JJB + ce que j'ajoute)

**Tokens** (JJB, inchangés) : primary `#c68cff` / dark `#a855f7`, secondary
`#19af58`, surface `#faf7ff`, texte `#1a0a2e`/`#6b5b8e`/`#a599be`, radius 12px,
ombres douces. Polices : Sora (titres), DM Sans (corps), JetBrains Mono
(chiffres, ids, montants).

**Composants réutilisés** : `Card`, `SectionHeader`, `StatusBadge`, `TabBar`,
`EmptyState`, `ChartTooltip`, `Sidebar`, `Header`.

**Composants que j'ajoute** (dans le même langage) :
- `KpiCard` — carte-chiffre générique (bordure haute colorée, icône teintée,
  valeur Mono, libellé, delta optionnel). Généralise le `StatCard` fintech.
- `StatutPill` — pastille des 4 statuts de réconciliation (à_nous vert,
  étranger gris, disparu ambre, marqué_inconnu violet).
- `HealthDot` — pastille de santé service (vert/rouge + latence ms).
- `Stepper` — le rite en étapes (préparer → confirmer), avec état par étape.
- `DataTable` — table triable/paginée, états vide/chargement intégrés.
- `FormField` / `Select` / `NumberField` — champs cohérents, erreur inline.
- `Toast` — retour succès/erreur (portail, auto-dismiss).
- `ConfirmDialog` — confirmation d'action sensible (DELETE, confirmer réel).
- `Tree` — arbre géo/écosystème déroulant (pays→région→ville→quartier).
- `CountrySelect` — **liste déroulante ISO** des pays (ta demande) — au lieu
  d'un champ texte libre.

## 3. Layout global

```
┌───────────┬──────────────────────────────────────────────┐
│ SIDEBAR   │ HEADER : fil d'ariane · [FR|EN] · session · ⏻ │
│ (violet   ├──────────────────────────────────────────────┤
│  sombre,  │                                              │
│  repliab.)│   CONTENU (surface #faf7ff, cartes, dataviz) │
│           │                                              │
│ 6 épopées │                                              │
└───────────┴──────────────────────────────────────────────┘
```

**Sidebar** (design JJB) — logo FinZuu, nav des 6 épopées avec sous-groupes :
```
◆ Tableau de bord        (US-E1)
Configuration            (US-B1/B2/B3)
Référentiels ▸
  · Géographie           (US-B5 — arbre riche)
  · Pays & Monnaies      (création config-service)
  · Telcos               (US-B7)
  · Catalogue            (US-B5)
Entités ▸
  · Company              (US-D1)
  · Produit              (US-D2)
  · Groupe / Rôle
Runs ▸
  · Préparer & lancer    (US-C1/C2 — rite D-01)
  · Progression          (US-C3/C4)
  · Historique & recette (US-C6)
Écosystème               (US-E2 — arbre navigable)
Population               (US-E3 — dataviz)
Inventaire               (réconciliation + adoption)
Traçabilité              (US-E4)
Purge                    (US-F1/F2)
```
**Header** — fil d'ariane, **sélecteur FR/EN**, minuteur de session (4 h),
avatar/déconnexion. Toast en portail en haut à droite.

## 4. Les écrans, élaborés en détail

### 4.1 Tableau de bord (US-E1) — l'atterrissage
- **But** : la santé, d'un coup d'œil. `GET /admin/dashboard`, `/ecosysteme`.
- **Haut** : 10 `HealthDot` (9 services + Faker), latence ms, vert/rouge. Une
  bannière ambre si un service tombe (« product-service injoignable — les
  runs qui en dépendent échoueront »).
- **KPI** (`KpiCard` en grille 6) : companies, lenders, kiosques, clients,
  produits à-nous, dernier run (statut). Chiffres en Mono.
- **Dernier run** : carte avec `StatusBadge`, mode (DRY/REAL), date, lien
  « voir le rapport ».
- **Alertes** : intentions orphelines, réservations Faker en vol (si > 0).
- États : squelettes au chargement ; si backend down, chaque carte le dit.

### 4.2 Configuration (US-B1/B2/B3)
- **But** : lire la config résolue AVEC l'origine de chaque valeur, éditer.
- **Layout** : deux colonnes. À gauche, les **volumes** (`NumberField` :
  clients, companies, lenders, kiosques, personnel) avec bornes ; à droite, la
  **période** (180 j), le **périmètre lending** (toggle), les **pays actifs**.
- **Origine visible** : chaque paramètre montre un petit tag « CDC / surcouche /
  run » (US-B1 exige la provenance).
- **Pays** : chips activables (US-B3) — vert = actif. Désactiver ne touche
  JAMAIS config-service (dit sous la chip).
- **Garde EF-55** : si un run tourne, les champs passent en lecture seule avec
  bandeau « run en cours — configuration verrouillée » (409 anticipé côté UI).
- **Enregistrer** : `PUT /admin/configuration`, toast succès, ou 409 nommé.

### 4.3 Référentiels — Géographie (US-B5) — LA vitrine de la richesse
- **But** : montrer l'arbre que la plateforme n'a pas.
- **`Tree`** déroulant : Pays → Région → Ville (GPS) → Quartier. Compteurs par
  niveau (51 régions, 50 villes, 82 quartiers). Recherche filtrante.
- **Chaque nœud** dit ce qui « part » ou « reste » : la ville a un badge
  « ↗ config-service » ; région/quartier ont « ⌂ chez nous » (avec l'info-
  bulle : config-service n'a pas ce concept). **C'est la pédagogie anti-
  corruption, visible.**

### 4.4 Référentiels — Pays & Monnaies (création config-service)
- **But** : créer pays / monnaie, hiérarchie imposée, envoi à config-service.
- **Monnaie d'abord** (une devise doit exister pour un pays) : formulaire
  (`iso_name` 3 lettres, name_fr/en, décimales) → `POST /devises`.
- **Pays** : `CountrySelect` (liste ISO) → pré-remplit name_fr/en/indicatif ;
  `Select` devise (résolue) ; liste de villes (chips ajoutables) ; telcos
  (multi-select existants). → `POST /pays`. 409 « existe déjà » et 422 devise
  affichés en clair.
- **Nuance dite** : encart « créer le pays le DÉCLARE ; ne l'ajoute pas au
  périmètre de génération (EF-05) ».

### 4.5 Référentiels — Telcos (US-B7)
- Formulaire aller complet : nom, court, regex (avec **preuve** `exemple_msisdn`
  validée en direct), part de marché, pays. Les 4 invariants vérifiés côté UI
  avant envoi (regex compilable + ancrée, somme des parts ≤ 100).

### 4.6 Entités — Company (US-D1) & Produit (US-D2)
- **Company** : 3-4 champs saisis (type, pays, ville, nom) → **aperçu** (les
  ~40 champs composés, le territoire résolu) → **confirmer**. Rite en 2 temps
  (`Stepper`). Refus territoire = message pédagogique.
- **Produit** : 3 interfaces selon `policy_type` (CASH / CASH_DAT / PRODUCT)
  via `TabBar`. Double clé d'unicité (code + nom) vérifiée. Aperçu → confirmer.

### 4.7 Runs — Préparer & lancer (US-C1/C2) — LE rite D-01
- **`Stepper` 3 étapes** : ① Préparer (DRY) → ② Lire le rapport → ③ Confirmer.
- ① `POST /admin/runs {DRY_RUN}` : lance à blanc. Squelette pendant.
- ② **Le rapport complet** : quotas par pays, solde total qui SERA déposé, 12
  produits, refus avant réseau avec motifs. Bandeau : « la dernière occasion
  de dire non ». Empreinte figée affichée.
- ③ `POST /{id}/confirmer` : confirmation explicite (`ConfirmDialog`). Si la
  config a changé → 409 « re-préparer », dit en clair, retour étape ①.

### 4.8 Runs — Progression (US-C3/C4)
- **Temps réel** (`GET /{id}/progression`, polling) : `Stepper` des paliers
  (rôles → orga → catalogue → dépositaires → clients…), barre par palier,
  compteurs créés/échoués. Bouton **Arrêter** (`ConfirmDialog`, US-C4).
- Journal live en bas (les dernières lignes d'audit).

### 4.9 Runs — Historique & recette (US-C6)
- `DataTable` des runs (append-only) : id, mode, statut, date. Clic → rapport
  du run : recette CR-01→CR-12 (chaque critère TENU / VIOLÉ / N-V avec sa
  raison), réconciliation, registre Faker.

### 4.10 Écosystème (US-E2) — l'arbre navigable
- `Tree` : Pays → Company → Branche → Agence → Kiosque → Clients/Agents.
  Descente au clic, compteurs. C'est org_hierarchy rendue lisible.

### 4.11 Population (US-E3) — la dataviz de la richesse
- **recharts** : histogramme des **576 professions** (top 20), courbe des
  **soldes** (frontière 150 000 marquée — EF-68), camembert des **4 profils
  comportementaux**, barres **naissances par pays** + part étrangère.
  Mesure vs cible (quotas EF-22/23/24) côte à côte.

### 4.12 Inventaire (réconciliation + adoption) — « ce qui est à nous »
- **3 onglets** (`TabBar`) : Groupes · Produits · Companies.
- Chaque ligne : nom + `StatutPill` (4 couleurs). En tête, les **comptes** par
  statut + le **nombre d'anomalies**.
- **Adoption A-13** : sélection multiple des « étrangers » qui sont en fait à
  nous → bouton « Adopter » (`ConfirmDialog`) → ils passent verts.
- **Supprimer un groupe à nous** : action de ligne (`ConfirmDialog`), 403 sur
  un étranger dit en clair.

### 4.13 Traçabilité (US-E4)
- Registre Faker : chaque client consommé (msisdn → entité), réconciliation,
  intentions orphelines. `DataTable` filtrable par run.

### 4.14 Purge (US-F1/F2) — le rite en deux temps
- ① Préparer : `POST /purge/preparer` → deux colonnes (purgeable = groupes à
  nous ; résidus permanents avec leur **verdict mesuré** — « aucun DELETE,
  D-DEP-3 »…). ② Confirmer (`ConfirmDialog`) : seuls les groupes partent, le
  rapport redit les résidus. Rien de caché.

## 5. Transverse

- **États** partout : `Skeleton`, `EmptyState`, erreur nommée, `Toast` succès.
- **Auth guard** : sans jeton → `/login` ; 401 → purge + `/login` (session 4h).
- **i18n** : FR/EN, sélecteur header, tout via `t()`.
- **A11y** : focus visibles, ARIA, contrastes AA, navigation clavier.
- **Responsive** : le cockpit tient sur un laptop 1280 ; sidebar repliable.
- **Micro-UX** : fade-in au montage, stagger des grilles, hover qui soulève
  les cartes, transitions douces — la signature JJB.

## 6. QA, invariants d'interface & responsive (discipline senior QA lead)

La même exigence que le backend s'applique à l'écran : des invariants tenus,
zéro bug d'interface, une adaptation à toute taille d'écran.

### 6.1 Les invariants d'interface (le backend reste l'AUTORITÉ)
L'UI **anticipe** les règles pour un retour immédiat, mais ne se substitue
JAMAIS au backend — elle double, elle ne remplace pas (comme le GET-avant-POST
double l'index unique).
- **Hiérarchie « rien en l'air »** (EF-02) : le champ Ville est désactivé tant
  qu'une région n'est pas choisie ; Région tant qu'un pays ne l'est pas.
- **Formats** : `iso_name` 2/3 lettres majuscules, indicatif numérique, email
  valide, MSISDN conforme au regex du telco — vérifiés AVANT l'envoi.
- **Telco** : regex compilable ET ancrée (`^…$`), somme des parts ≤ 100 —
  calculée en direct, le bouton reste bloqué sinon.
- **Unicité** : le formulaire prévient (« ce code existe déjà ») dès la saisie
  quand c'est lisible, mais le **409 du backend fait foi** et s'affiche nommé.
- **Verrou EF-55** : un run en cours passe les écrans d'écriture en lecture
  seule (bandeau), sans attendre le 409 — mais le 409 reste géré.
- **Règle d'or** : toute validation d'UI est un CONFORT ; l'erreur nommée du
  backend est la vérité, toujours affichée telle quelle.

### 6.2 Zéro bug d'interface (robustesse défensive)
- **TypeScript strict** : `strict: true`, pas de `any` non maîtrisé, les types
  des réponses backend explicités.
- **Rendu défensif** : jamais de plantage sur une donnée absente
  (`?.`, valeurs par défaut) ; une liste vide n'est pas une erreur.
- **Error Boundary** global : une exception de rendu affiche un écran de
  secours, jamais une page blanche.
- **Chaque appel** a ses 4 états (chargement/vide/erreur/succès) — un état
  oublié est un bug, on ne l'oublie pas.
- **Idempotence UI** : double-clic sur « Confirmer » ne lance pas deux runs
  (bouton désactivé pendant l'appel).
- **Lint + type-check en CI** : rien ne se déploie qui ne compile pas
  proprement (miroir du ruff+mypy backend).

### 6.3 Responsive — s'adapte à N'IMPORTE QUELLE taille
- **Mobile-first**, breakpoints Tailwind (`sm 640` / `md 768` / `lg 1024` /
  `xl 1280` / `2xl`).
- **Sidebar** : repliée en rail d'icônes < `lg`, tiroir superposé sur mobile
  (déjà dans le design JJB, on le pousse jusqu'au bout).
- **Grilles KPI** : 6 colonnes en `xl`, 3 en `md`, 2 en `sm`, 1 sur mobile —
  reflow fluide.
- **Tables** (`DataTable`) : défilement horizontal dans leur propre conteneur
  (`overflow-x-auto`), jamais la page qui déborde.
- **Charts recharts** : `ResponsiveContainer`, se redimensionnent seuls.
- **Formulaires** : une colonne sur mobile, deux sur large. Cibles tactiles
  ≥ 44 px.
- **Cible testée** : de 360 px (téléphone) à 1920 px (large), sans casse.

### 6.4 Accessibilité & tests
- **A11y** : rôles/labels ARIA, focus visibles, contrastes AA, navigation
  clavier complète (le rite D-01 se fait au clavier).
- **Tests de composants** (Vitest + Testing Library) sur les briques critiques :
  garde d'auth, calcul « somme des parts ≤ 100 », `CountrySelect`, le
  `Stepper` du rite, la coloration des 4 statuts. **Un comportement = un test**,
  comme le backend.

## 6-bis. PWA — installable comme une app (exigence JJB)

Le Loader doit s'**installer depuis le navigateur** et se comporter comme une
app de bureau, tout en restant servi par le web (il ne « vit » pas dans la
machine — pas de confusion : le contenu passe toujours par le réseau, l'app
n'est qu'une coquille installée).

- **`vite-plugin-pwa`** : génère le `manifest.webmanifest` (nom « FinZuu
  Loader », icônes 192/512, thème violet `#c68cff`, `display: standalone`,
  couleur de fond) + un service worker.
- **Installable** : bandeau « Installer l'application » (event
  `beforeinstallprompt`), icône sur le bureau / le dock, fenêtre autonome sans
  barre d'URL.
- **Cache de coquille** (app shell) : le HTML/JS/CSS et les assets sont mis en
  cache pour un démarrage instantané. **Les DONNÉES ne sont jamais mises en
  cache** — elles viennent toujours du backend en direct (le Loader manipule
  de l'état vivant, un cache de données serait un mensonge). Réseau requis pour
  agir : si hors-ligne, écran clair « backend requis ».
- **Mise à jour** : le SW détecte une nouvelle version → toast « nouvelle
  version disponible, recharger ».
- **Le frontend = le rendu visuel de TOUT le système** : l'orchestration
  (paliers, runs), l'architecture (arbre écosystème), les référentiels, la
  réconciliation — tout se voit, dans le bon ordre, interactif et responsive.

## 7. Ordre de construction (phases, chacune déployable)

1. Fondation : design system adapté, auth guard, i18n, layout + nav 6 épopées.
2. Tableau de bord (US-E1) + Configuration (US-B1/2/3).
3. Runs — le rite D-01 (US-C1→C6) : le cœur.
4. Référentiels : géographie + créations pays/monnaie/telco/région/ville.
5. Entités (US-D1/D2).
6. Écosystème + Population (US-E2/E3, dataviz).
7. Inventaire + Traçabilité + Purge (réconciliation, US-E4/F1/F2).
8. Polish : responsive, a11y, états vides, aide contextuelle, EN complet.
