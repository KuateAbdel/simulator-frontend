/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Injectees au BUILD par vite.config.ts (define) — la version de la webapp
// Loader vient de package.json, le commit de git. Jamais tapees a la main.
declare const __APP_VERSION__: string
declare const __APP_COMMIT__: string
