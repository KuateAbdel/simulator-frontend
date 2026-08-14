import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

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
const proxyApi = {
  '/admin': { target: 'https://simul.api.fintech4esg.com', changeOrigin: true },
  '/health': { target: 'https://simul.api.fintech4esg.com', changeOrigin: true },
}

export default defineConfig({
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
