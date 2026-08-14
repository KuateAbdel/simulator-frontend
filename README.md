# FinZuu Loader — Frontend

Interface Super-Admin du Loader FinZuu (Next.js 16 / React 19 / Tailwind 4 /
shadcn-ui). Consomme le backend `simulator-backend-loader` via son API REST
(`https://simul.api.fintech4esg.com`, contrat OpenAPI sur `/docs`).

Base initiale : squelette de Folong-zidane (FINZUU_LOADER), complété et branché
au vrai backend. Déployé sur `https://simul.fintech4esg.com`.

## Développement
```bash
pnpm install
pnpm dev        # http://localhost:3000
```
`NEXT_PUBLIC_API_URL` pointe le backend (voir `.env.example`).
