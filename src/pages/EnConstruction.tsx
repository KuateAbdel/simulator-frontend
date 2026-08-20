// src/pages/EnConstruction.tsx
//
// Le squelette HONNETE des ecrans des phases 2→7 : il dit ce que l'ecran
// realisera (user stories) et QUAND (phase du plan) — jamais une page
// blanche, jamais un mock qui fait semblant.

import { Hammer } from 'lucide-react'
import { SectionHeader } from '../components/ui'
import { useApp } from '../context/AppContext'
import { navItemDe } from '../components/Layout/nav'
import type { Page } from '../types'

export function EnConstruction({ page, sansTitre = false }: { page: Page; sansTitre?: boolean }) {
  const { t } = useApp()
  const item = navItemDe(page)

  return (
    <div className="animate-fade-in">
      {!sansTitre && <SectionHeader title={t(item.labelKey)} subtitle={item.stories} />}
      <div
        className="card flex flex-col items-center justify-center text-center px-6 py-14"
        style={{ borderStyle: 'dashed', boxShadow: 'none' }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'var(--primary-light)' }}
        >
          <Hammer size={20} style={{ color: 'var(--primary-dark)' }} />
        </div>
        <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
          {t('under_construction')}
        </p>
        <p className="text-xs mb-3 font-mono" style={{ color: 'var(--primary-dark)' }}>
          {item.stories}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)', maxWidth: 380 }}>
          {t('phase1_done')}
        </p>
      </div>
    </div>
  )
}
