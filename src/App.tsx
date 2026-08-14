// src/App.tsx
//
// La garde d'auth du Loader (US-A1/A2) + le routeur des 6 epopees.
//   sans session          → Login
//   must_change_password  → ChangePassword (seule route ouverte, portee
//                           password_only cote backend)
//   session pleine        → Layout + page courante
// L'ErrorBoundary global tient l'invariant « jamais une page blanche ».

import React from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { ToastProvider } from './components/ui/loader'
import { Layout } from './components/Layout/Layout'
import { Login } from './pages/Login'
import { ChangePassword } from './pages/ChangePassword'
import { TableauDeBord } from './pages/TableauDeBord'
import { Configuration } from './pages/Configuration'
import { RunsPreparer } from './pages/RunsPreparer'
import { RunsProgression } from './pages/RunsProgression'
import { RunsHistorique } from './pages/RunsHistorique'
import { RefGeographie } from './pages/RefGeographie'
import { RefPaysMonnaies } from './pages/RefPaysMonnaies'
import { RefTelcos } from './pages/RefTelcos'
import { RefCatalogue } from './pages/RefCatalogue'
import { EnConstruction } from './pages/EnConstruction'

function Router() {
  const { currentPage } = useApp()
  if (currentPage === 'tableau-de-bord') return <TableauDeBord />
  if (currentPage === 'configuration') return <Configuration />
  if (currentPage === 'runs-preparer') return <RunsPreparer />
  if (currentPage === 'runs-progression') return <RunsProgression />
  if (currentPage === 'runs-historique') return <RunsHistorique />
  if (currentPage === 'ref-geographie') return <RefGeographie />
  if (currentPage === 'ref-pays-monnaies') return <RefPaysMonnaies />
  if (currentPage === 'ref-telcos') return <RefTelcos />
  if (currentPage === 'ref-catalogue') return <RefCatalogue />
  // Phases 5→7 : chaque ecran remplacera son squelette, un par un.
  return <EnConstruction page={currentPage} />
}

function Garde() {
  const { session } = useApp()
  if (!session) return <Login />
  if (session.mustChangePassword) return <ChangePassword />
  return (
    <Layout>
      <Router />
    </Layout>
  )
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { erreur: Error | null }
> {
  state = { erreur: null as Error | null }

  static getDerivedStateFromError(erreur: Error) {
    return { erreur }
  }

  render() {
    if (this.state.erreur) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--surface)' }}>
          <div className="card p-6 text-center" style={{ maxWidth: 420 }}>
            <p className="font-display font-bold text-base mb-2" style={{ color: 'var(--text-primary)' }}>
              FinZuu Loader
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              L&apos;interface a rencontré une erreur de rendu. / The interface hit a render error.
            </p>
            <p className="text-xs font-mono mb-4" style={{ color: '#b91c1c' }}>
              {this.state.erreur.message}
            </p>
            <button className="btn-primary mx-auto" onClick={() => window.location.reload()}>
              Recharger / Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <ToastProvider>
          <Garde />
        </ToastProvider>
      </AppProvider>
    </ErrorBoundary>
  )
}
