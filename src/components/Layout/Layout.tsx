// src/components/Layout/Layout.tsx
import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ background: 'var(--surface)', padding: '20px 24px' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
