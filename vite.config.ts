import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// VERSIONNING de la webapp (demande Yaniv 15/08) — une seule source de
// verite : package.json (SemVer, tags git, CHANGELOG). Injectee AU BUILD
// avec le commit court : la version affichee ne peut pas mentir.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string
}
let commit = 'dev'
try {
  commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim()
} catch {
  // hors depot git (archive) : 'dev' assume
}

// PWA — exigence JJB/boss : le Loader s'installe depuis le navigateur comme
// une app (icone bureau, fenetre autonome). DOCTRINE DE CACHE : la coquille
// (HTML/JS/CSS/polices/icones) est en cache pour un demarrage instantane ;
// les DONNEES ne le sont JAMAIS — elles viennent du backend en direct, un
// cache de donnees serait un mensonge (etat vivant : runs, sante, registres).
// DEV LOCAL — le backend n'autorise (CORS strict, jamais '*') que l'origine
// de production https://simul.fintech4esg.com (mesure du 14/08 : preflight
// 200 pour elle, 400 pour localhost). En local on passe donc par ce proxy :
// VITE_API_URL vide dans .env → appels same-origin → Vite relaie vers l'API
// (serveur-a-serveur, hors du perimetre CORS). La prod appelle en direct.
// Cible par défaut = prod (comportement inchangé). En dev local, on peut
// pointer vers un backend local en exportant VITE_PROXY_TARGET=http://localhost:8000.
const PROXY_TARGET = process.env.VITE_PROXY_TARGET ?? 'https://simul.api.fintech4esg.com'
const proxyApi = {
  '/admin': { target: PROXY_TARGET, changeOrigin: true },
  '/health': { target: PROXY_TARGET, changeOrigin: true },
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_COMMIT__: JSON.stringify(commit),
  },
  server: { proxy: proxyApi },
  preview: { proxy: proxyApi },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // la mise a jour se PROPOSE (toast), ne s'impose pas
      includeAssets: ['favicon.png', 'logo-finzuu.png'],
      manifest: {
        name: 'FinZuu Loader',
        short_name: 'Loader',
        description:
          'Pilotage du simulateur FinZuu — runs, référentiels, réconciliation.',
        lang: 'fr',
        display: 'standalone',
        start_url: '/',
        background_color: '#1a0a2e',
        theme_color: '#1a0a2e',
        icons: [
          { src: '/icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icone-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icone-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // L'API : reseau SEULEMENT, jamais de cache — verite en direct.
            urlPattern: /^https:\/\/simul\.api\.fintech4esg\.com\/.*/,
            handler: 'NetworkOnly',
          },
          {
            // Les polices Google font partie de la coquille : cache stable.
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'polices',
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
