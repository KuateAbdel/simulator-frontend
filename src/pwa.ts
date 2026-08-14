// src/pwa.ts
//
// Enregistrement du service worker (vite-plugin-pwa, mode `prompt`).
// La mise a jour se PROPOSE par un toast — elle ne s'impose jamais au
// milieu d'un geste d'admin (un rite D-01 interrompu serait un incident).
// Les DONNEES ne passent jamais par le SW (NetworkOnly sur l'API).

import { registerSW } from 'virtual:pwa-register'
import { translations } from './i18n'

function langueCourante(): 'fr' | 'en' {
  return localStorage.getItem('finzuu-loader-lang') === 'en' ? 'en' : 'fr'
}

export function installerPWA(): void {
  const rafraichir = registerSW({
    onNeedRefresh() {
      const t = translations[langueCourante()]
      // Toast minimal sans dependance au cycle React (le SW vit hors de l'arbre).
      const boite = document.createElement('div')
      boite.setAttribute('role', 'status')
      boite.style.cssText = [
        'position:fixed', 'bottom:20px', 'right:20px', 'z-index:9999',
        'background:#1a0a2e', 'color:#fff', 'padding:12px 16px',
        'border-radius:12px', 'box-shadow:0 8px 24px rgba(26,10,46,0.35)',
        "font-family:'DM Sans',sans-serif", 'font-size:13px',
        'display:flex', 'align-items:center', 'gap:12px',
      ].join(';')
      const texte = document.createElement('span')
      texte.textContent = t.pwa_update_available
      const bouton = document.createElement('button')
      bouton.textContent = t.pwa_reload
      bouton.style.cssText =
        'background:#c68cff;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-weight:600;cursor:pointer'
      bouton.onclick = () => void rafraichir(true)
      boite.append(texte, bouton)
      document.body.appendChild(boite)
    },
  })
}
