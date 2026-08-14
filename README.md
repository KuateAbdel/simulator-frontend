# FinZuu Loader — Frontend

Le cockpit du **Loader FinZuu** : l'interface Super-Admin qui pilote le
backend de simulation (`https://simul.api.fintech4esg.com`). PWA installable,
bilingue FR/EN, **TypeScript + Vite + React 18**, design system de JJB.

> Vérité produit : les 6 épopées du backlog canonique (Confluence 67665922).
> Vérité technique : les 38 endpoints du backend
> ([simulator-backend-loader](https://github.com/KuateAbdel/simulator-backend-loader)).
> Principe : **le Loader est plus riche que la plateforme — l'écran le montre.**
> Conception détaillée : `docs/CONCEPTION_UX_UI.md` · plan : `docs/PLAN_FRONTEND.md`.

## Démarrage

```bash
npm install
cp .env.example .env   # VITE_API_URL (défaut : simul.api.fintech4esg.com)
npm run dev            # http://localhost:5173
```

Build de production : `npm run build` (tsc strict puis vite build), aperçu :
`npm run preview`.

## Ce que c'est

- **Auth réelle** (US-A1/US-A2) : login Super-Admin, mot de passe forcé à la
  première connexion, session 4 h avec compte à rebours visible, garde d'auth.
- **Navigation = les 6 épopées** : Tableau de bord, Configuration,
  Référentiels (géographie/pays & monnaies/telcos/catalogue), Entités
  (company/produit/groupe), Runs (le rite D-01 : préparer → lire → confirmer),
  Écosystème, Population, Inventaire (réconciliation 4 statuts + adoption),
  Traçabilité, Purge. Chaque écran porte sa user story dans le header.
- **PWA** : installable depuis le navigateur (icône bureau, fenêtre
  autonome). La coquille est en cache ; **les données ne le sont jamais** —
  elles viennent du backend en direct (NetworkOnly sur l'API).
- **Zéro mock** : le backend est l'autorité ; ses erreurs nommées s'affichent
  telles quelles ; chaque appel tient ses 4 états (chargement/vide/erreur/
  succès).

## Design system (JJB)

- Couleurs : violet `#c68cff`/`#a855f7`, vert `#19af58`, surface `#faf7ff`,
  sidebar sombre `#1a0a2e → #2d1456`. Radius 12 px, ombres douces.
- Polices : Sora (titres), DM Sans (corps), JetBrains Mono (ids, montants).
- Responsive 360 → 1920 px, sidebar repliable, a11y AA.

## Structure

```
src/
├── components/
│   ├── Layout/        # Sidebar (6 épopées), Header (session, FR/EN), nav.ts
│   └── ui/            # Card, SectionHeader, badges, TabBar…
├── context/AppContext.tsx  # Langue, navigation, SESSION (JWT 4 h)
├── i18n/index.ts      # FR/EN — tout passe par t()
├── lib/api.ts         # Client API réel (Bearer, ApiError nommée)
├── pages/             # Login, ChangePassword, TableauDeBord, écrans à venir
├── pwa.ts             # Service worker (mise à jour proposée, jamais imposée)
└── types/index.ts     # Pages + Session
```

## Avancement (8 phases, chacune déployable)

1. ✅ **Fondation** : auth, garde, nav 6 épopées, i18n, PWA, Error Boundary.
2. Tableau de bord (US-E1) + Configuration (US-B1/2/3)
3. Runs — le rite D-01 (US-C1→C6)
4. Référentiels (arbre géo, créations pays/monnaie/telco)
5. Entités (US-D1/D2)
6. Écosystème + Population (US-E2/E3)
7. Inventaire + Traçabilité + Purge
8. Polish : responsive final, a11y, tests, CI/CD → `simul.fintech4esg.com`
