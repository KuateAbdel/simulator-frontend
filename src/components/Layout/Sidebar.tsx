// src/components/Layout/Sidebar.tsx
//
// La sidebar JJB (degrade sombre, accent violet, repliable) rendue sur
// l'arbre de navigation du LOADER (nav.ts — 6 epopees, sous-groupes).

import { Building2, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { NAV_GROUPS } from './nav'

export function Sidebar() {
  const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen, t, session, seDeconnecter } =
    useApp()

  const initiales = session
    ? session.email.slice(0, 2).toUpperCase()
    : '··'

  return (
    <aside
      className="sidebar flex flex-col h-full relative flex-shrink-0"
      style={{ width: sidebarOpen ? 230 : 64 }}
    >
      {/* Logo */}
      <div className="flex items-center px-4 py-5 border-b border-white/10">
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-xl"
          style={{
            width: 32,
            height: 32,
            background: 'var(--primary)',
            boxShadow: '0 4px 12px rgba(198,140,255,0.5)',
          }}
        >
          <Building2 size={16} color="#fff" />
        </div>
        {sidebarOpen && (
          <div className="ml-3 overflow-hidden">
            <span className="font-display font-bold text-white text-base tracking-tight whitespace-nowrap block leading-tight">
              {t('app_name')}
            </span>
            <span className="text-[10px] whitespace-nowrap block" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {t('app_tagline')}
            </span>
          </div>
        )}
      </div>

      {/* Navigation — les 6 epopees */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {NAV_GROUPS.map((groupe, gi) => (
          <div key={gi} className="px-2 mb-1">
            {groupe.labelKey && sidebarOpen && (
              <p
                className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                {t(groupe.labelKey)}
              </p>
            )}
            {groupe.labelKey && !sidebarOpen && (
              <div className="mx-3 my-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.12)' }} />
            )}
            <div className="space-y-0.5">
              {groupe.items.map((item) => {
                const actif = currentPage === item.page
                const Icone = item.icon
                return (
                  <button
                    key={item.page}
                    onClick={() => setCurrentPage(item.page)}
                    className="w-full flex items-center rounded-xl transition-all duration-150"
                    style={{
                      padding: sidebarOpen ? '8px 12px' : '8px 0',
                      justifyContent: sidebarOpen ? 'flex-start' : 'center',
                      background: actif ? 'rgba(198,140,255,0.18)' : 'transparent',
                      color: actif ? 'var(--primary)' : 'rgba(255,255,255,0.55)',
                      borderLeft: actif ? '3px solid var(--primary)' : '3px solid transparent',
                      border: 'none',
                      borderLeftStyle: 'solid',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (!actif) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                        e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!actif) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
                      }
                    }}
                    title={!sidebarOpen ? t(item.labelKey) : item.stories}
                  >
                    <span className="flex-shrink-0">
                      <Icone size={17} />
                    </span>
                    {sidebarOpen && (
                      <span className="ml-3 text-[13px] font-medium whitespace-nowrap overflow-hidden">
                        {t(item.labelKey)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bas — session reelle + deconnexion */}
      <div className="px-3 py-3 border-t border-white/10">
        <div
          className="flex items-center gap-2 p-2 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.05)', justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
        >
          <div
            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'var(--primary)' }}
            title={session?.email}
          >
            {initiales}
          </div>
          {sidebarOpen && (
            <>
              <div className="overflow-hidden flex-1">
                <p className="text-white text-xs font-semibold truncate">{session?.email}</p>
                <p className="text-white/40 text-[10px] truncate">Super-Admin</p>
              </div>
              <button
                onClick={() => seDeconnecter()}
                title={t('logout')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.45)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bouton replier/deplier */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute -right-3 top-16 z-50 flex items-center justify-center rounded-full border"
        style={{
          width: 24,
          height: 24,
          background: '#fff',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow)',
          color: 'var(--primary-dark)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        title={sidebarOpen ? '‹' : '›'}
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </aside>
  )
}
