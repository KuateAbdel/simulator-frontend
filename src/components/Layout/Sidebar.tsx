// src/components/Layout/Sidebar.tsx
import React from 'react'
import {
  LayoutDashboard, Users, CreditCard, Banknote, BarChart3,
  Settings, ChevronLeft, ChevronRight, Building2, TrendingUp,
  Zap
} from 'lucide-react'
import type { Page } from '../../types'
import { useApp } from '../../context/AppContext'

interface NavItem {
  page: Page
  icon: React.ReactNode
  labelKey: keyof ReturnType<typeof useApp>['t'] extends (k: infer K) => string ? K : never
}

export function Sidebar() {
  const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen, t } = useApp()

  const navItems: { page: Page; icon: React.ReactNode; label: string }[] = [
    { page: 'overview', icon: <LayoutDashboard size={18} />, label: t('nav_overview') },
    { page: 'onboarding', icon: <Users size={18} />, label: t('nav_onboarding') },
    { page: 'bulk', icon: <Zap size={18} />, label: t('nav_bulk') },
    { page: 'clients', icon: <CreditCard size={18} />, label: t('nav_clients') },
    { page: 'lender', icon: <Banknote size={18} />, label: t('nav_lender') },
    { page: 'analytics', icon: <BarChart3 size={18} />, label: t('nav_analytics') },
    { page: 'backoffice', icon: <Settings size={18} />, label: t('nav_backoffice') },
  ]

  return (
    <aside
      className="sidebar flex flex-col h-full relative"
      style={{ width: sidebarOpen ? 220 : 64 }}
    >
      {/* Logo */}
      <div className="flex items-center px-4 py-5 border-b border-white/10">
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-xl"
          style={{ width: 32, height: 32, background: 'var(--primary)', boxShadow: '0 4px 12px rgba(198,140,255,0.5)' }}
        >
          <Building2 size={16} color="#fff" />
        </div>
        {sidebarOpen && (
          <span
            className="ml-3 font-display font-bold text-white text-lg tracking-tight whitespace-nowrap overflow-hidden"
            style={{ transition: 'opacity 0.2s', opacity: sidebarOpen ? 1 : 0 }}
          >
            Finzuu
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <div className="px-2 space-y-1">
          {navItems.map((item) => {
            const active = currentPage === item.page
            return (
              <button
                key={item.page}
                onClick={() => setCurrentPage(item.page)}
                className="w-full flex items-center rounded-xl transition-all duration-150 group"
                style={{
                  padding: sidebarOpen ? '9px 12px' : '9px 0',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  background: active
                    ? 'rgba(198,140,255,0.18)'
                    : 'transparent',
                  color: active ? 'var(--primary)' : 'rgba(255,255,255,0.55)',
                  borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
                  if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)'
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
                  if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)'
                }}
                title={!sidebarOpen ? item.label : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {sidebarOpen && (
                  <span className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Bottom — user mini */}
      {sidebarOpen && (
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'var(--primary)' }}
            >
              SR
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-xs font-semibold truncate">Sophie R.</p>
              <p className="text-white/40 text-[10px] truncate">Portfolio Mgr</p>
            </div>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute -right-3 top-16 z-50 flex items-center justify-center rounded-full border"
        style={{
          width: 24, height: 24,
          background: '#fff',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow)',
          color: 'var(--primary-dark)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        title={sidebarOpen ? 'Réduire' : 'Agrandir'}
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </aside>
  )
}
