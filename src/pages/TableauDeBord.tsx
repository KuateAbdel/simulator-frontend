// src/pages/TableauDeBord.tsx — US-E1, l'atterrissage.
//
// Phase 1 : la sonde de vie REELLE du backend (GET /health, route publique)
// — le premier appel de bout en bout de l'app, avec ses 4 etats tenus.
// Le tableau de bord complet (10 HealthDot, KPI, dernier run, alertes)
// arrive en phase 2 sur GET /admin/dashboard.

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Card, SectionHeader } from '../components/ui'
import { useApp } from '../context/AppContext'
import { ApiError, apiBase, health } from '../lib/api'
import { EnConstruction } from './EnConstruction'

type EtatSante =
  | { statut: 'chargement' }
  | { statut: 'ok' }
  | { statut: 'erreur'; message: string }

export function TableauDeBord() {
  const { t } = useApp()
  const [etat, setEtat] = useState<EtatSante>({ statut: 'chargement' })

  const sonder = useCallback(async () => {
    setEtat({ statut: 'chargement' })
    try {
      await health()
      setEtat({ statut: 'ok' })
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 0
          ? t('error_backend_unreachable')
          : `${t('error_named')} ${String(err instanceof ApiError ? err.detail : err)}`
      setEtat({ statut: 'erreur', message })
    }
  }, [t])

  useEffect(() => {
    void sonder()
  }, [sonder])

  const couleurPastille =
    etat.statut === 'ok' ? 'var(--secondary)' : etat.statut === 'erreur' ? '#ef4444' : '#f59e0b'

  return (
    <div className="animate-fade-in">
      <SectionHeader title={t('nav_dashboard')} subtitle={t('backend_health')} />

      <Card className="mb-5" style={{ maxWidth: 480 }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{
                background: couleurPastille,
                boxShadow: `0 0 8px ${couleurPastille}`,
              }}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {etat.statut === 'chargement' && t('backend_checking')}
                {etat.statut === 'ok' && t('backend_ok')}
                {etat.statut === 'erreur' && t('backend_down')}
              </p>
              <p className="text-xs font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                {apiBase() || 'proxy local → simul.api.fintech4esg.com'}
              </p>
            </div>
          </div>
          <button
            className="btn-ghost text-xs flex-shrink-0"
            style={{ height: 30 }}
            onClick={() => void sonder()}
            disabled={etat.statut === 'chargement'}
          >
            <RefreshCw size={12} />
            {t('retry')}
          </button>
        </div>
        {etat.statut === 'erreur' && (
          <p
            className="text-xs rounded-lg px-3 py-2 mt-3"
            style={{ background: '#fee2e2', color: '#b91c1c' }}
            role="alert"
          >
            {etat.message}
          </p>
        )}
      </Card>

      <EnConstruction page="tableau-de-bord" sansTitre />
    </div>
  )
}
