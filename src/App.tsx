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
import { EntitesCompany } from './pages/EntitesCompany'
import { EntitesProduit } from './pages/EntitesProduit'
import { EntitesGroupe } from './pages/EntitesGroupe'
import { AdminComptes } from './pages/AdminComptes'
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
  if (currentPage === 'entites-company') return <EntitesCompany />
  if (currentPage === 'entites-produit') return <EntitesProduit />
  if (currentPage === 'entites-groupe') return <EntitesGroupe />
  if (currentPage === 'admin-comptes') return <AdminComptes />
  // Phases 6→7 : chaque ecran remplacera son squelette, un par un.
  return <EnConstruction page={currentPage} />
}

/** Un crash d'ECRAN reste local : la sidebar survit, l'erreur est nommee sur
 * place, et changer de page (key) reinitialise la frontiere. */
class PageBoundary extends React.Component<
  { pageKey: string; children: React.ReactNode },
  { erreur: Error | null }
> {
  state = { erreur: null as Error | null }

  static getDerivedStateFromError(erreur: Error) {
    return { erreur }
  }

  render() {
    if (this.state.erreur) {
      return (
        <div className="card p-5" role="alert">
          <p className="font-display font-bold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
            Cet écran a rencontré une erreur de rendu — le reste du cockpit fonctionne.
          </p>
          <p className="text-xs font-mono mb-3" style={{ color: '#b91c1c' }}>
            {this.state.erreur.message}
          </p>
          <button className="btn-primary text-xs" onClick={() => this.setState({ erreur: null })}>
            Réessayer / Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function Garde() {
  const { session, currentPage } = useApp()
  if (!session) return <Login />
  if (session.mustChangePassword) return <ChangePassword />
  return (
    <Layout>
      <PageBoundary pageKey={currentPage} key={currentPage}>
        <Router />
      </PageBoundary>
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
