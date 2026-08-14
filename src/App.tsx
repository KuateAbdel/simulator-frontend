// src/App.tsx
import React from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { Layout } from './components/Layout/Layout'
import { Overview } from './pages/Overview'
import { Onboarding } from './pages/Onboarding'
import { Bulk } from './pages/Bulk'
import { Clients } from './pages/Clients'
import { Lender } from './pages/Lender'
import { Analytics } from './pages/Analytics'
import { BackOffice } from './pages/BackOffice'

function Router() {
  const { currentPage } = useApp()

  switch (currentPage) {
    case 'overview':    return <Overview />
    case 'onboarding':  return <Onboarding />
    case 'bulk':        return <Bulk />
    case 'clients':     return <Clients />
    case 'lender':      return <Lender />
    case 'analytics':   return <Analytics />
    case 'backoffice':  return <BackOffice />
    default:            return <Overview />
  }
}

export default function App() {
  return (
    <AppProvider>
      <Layout>
        <Router />
      </Layout>
    </AppProvider>
  )
}
