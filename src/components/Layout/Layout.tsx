// src/components/Layout/Layout.tsx
//
// Desktop : sidebar en flux (230/64). Mobile (<768px) : la sidebar est un
// TIROIR superpose — le backdrop referme, le padding du main s'adapte.
import React, { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { navItemDe } from './nav'
import { useApp } from '../../context/AppContext'

export function Layout({ children }: { children: React.ReactNode }) {
  const { estMobile, sidebarOpen, setSidebarOpen, currentPage, t } = useApp()

  // L'onglet du navigateur DIT ou on est — « Population — FinZuu Loader ».
  useEffect(() => {
    document.title = `${t(navItemDe(currentPage).labelKey)} — FinZuu Loader`
  }, [currentPage, t])
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar />
      {estMobile && sidebarOpen && (
        <div
          className="fixed inset-0"
          style={{ background: 'rgba(26,10,46,0.5)', zIndex: 55 }}
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-6"
          style={{ background: 'var(--surface)' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
