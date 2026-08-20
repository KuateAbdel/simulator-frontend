// src/components/SectionOnglets.tsx
//
// Le GABARIT de section a onglets (refonte nav 20/08, modele du backoffice
// FinZuu) : une entree de sidebar = une section, ses ecrans = des ONGLETS.
// Les identifiants de page restent fins — changer d'onglet EST une navigation
// (setCurrentPage), donc la navigation croisee entre ecrans (« Preparer un
// run » depuis un etat vide, Preparer -> Progression apres confirmation…)
// atterrit naturellement sur le bon onglet de la bonne section.
//
// Chaque ecran garde son propre SectionHeader (titre + sous-titre) : l'onglet
// ne le prive pas de son identite, et le Header global suit l'onglet actif
// (PAGE_META) — la tracabilite user-story -> ecran ne bouge pas.

import type { ReactNode } from 'react'
import { TabBar } from './ui'
import { useApp } from '../context/AppContext'
import { navItemDe } from './Layout/nav'
import type { Page } from '../types'

export function SectionOnglets({ pages }: { pages: { page: Page; element: ReactNode }[] }) {
  const { t, currentPage, setCurrentPage } = useApp()
  // Si la page courante n'appartient pas a la section (transition), on
  // atterrit sur le premier onglet plutot que de rendre un ecran vide.
  const active = pages.some((p) => p.page === currentPage) ? currentPage : pages[0].page
  return (
    <div className="animate-fade-in">
      <TabBar
        tabs={pages.map((p) => ({ id: p.page, label: t(navItemDe(p.page).labelKey) }))}
        active={active}
        onChange={(id) => setCurrentPage(id as Page)}
      />
      <div className="mt-3">{pages.find((p) => p.page === active)?.element}</div>
    </div>
  )
}
