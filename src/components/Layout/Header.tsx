// src/components/Layout/Header.tsx
//
// Le header du Loader : titre de page + user story realisee (tracabilite
// visible), bascule FR/EN, compte a rebours REEL de session (4 h), sortie.
// Les gadgets fintech de la base JJB (QR, filtres, alertes mock) sont partis.

import { Clock, Globe, LogOut, Menu } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { navItemDe } from './nav'

function formaterCompteARebours(secondes: number): string {
  const h = Math.floor(secondes / 3600)
  const m = Math.floor((secondes % 3600) / 60)
  const s = secondes % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export function Header() {
  const { t, lang, setLang, currentPage, sessionSecondsLeft, seDeconnecter, estMobile, setSidebarOpen } =
    useApp()
  const item = navItemDe(currentPage)

  // Sous 15 minutes, le minuteur passe en ambre : la peremption se VOIT venir.
  const bientotPerimee = sessionSecondsLeft > 0 && sessionSecondsLeft < 15 * 60

  return (
    <header
      className="flex items-center justify-between px-5 py-3 border-b"
      style={{
        background: '#fff',
        borderColor: 'var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 8px rgba(198,140,255,0.07)',
        minHeight: 56,
      }}
    >
      {/* Gauche — hamburger (mobile) + titre + user story de l'ecran */}
      <div className="flex items-center gap-3 min-w-0">
        {estMobile && (
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="menu"
            className="flex-shrink-0 flex items-center justify-center rounded-lg"
            style={{
              width: 36,
              height: 36,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            <Menu size={17} />
          </button>
        )}
        <h1
          className="font-display font-bold text-base truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {t(item.labelKey)}
        </h1>
        <span className="badge-primary hidden sm:inline-block flex-shrink-0 font-mono">
          {item.stories}
        </span>
      </div>

      {/* Droite */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Compte a rebours de session — la verite du jeton, pas un chrono decoratif */}
        <span
          className="session-timer hidden sm:flex items-center gap-1.5"
          title={t('session_expires_in')}
          style={
            bientotPerimee
              ? { background: '#fef9c3', color: '#92400e' }
              : undefined
          }
        >
          <Clock size={11} />
          {formaterCompteARebours(sessionSecondsLeft)}
        </span>

        {/* Bascule FR/EN */}
        <button
          className="flex items-center gap-1 text-xs font-medium rounded-lg px-2 py-1 border transition-all"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
            background: 'transparent',
            cursor: 'pointer',
            height: 32,
          }}
          onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          title={t('language')}
        >
          <Globe size={13} />
          {lang.toUpperCase()}
        </button>

        {/* Deconnexion */}
        <button
          className="btn-ghost text-xs px-3"
          style={{ height: 32 }}
          onClick={() => seDeconnecter()}
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">{t('logout')}</span>
        </button>
      </div>
    </header>
  )
}
