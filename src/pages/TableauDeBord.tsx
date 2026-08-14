// src/pages/TableauDeBord.tsx — US-E1, l'atterrissage. PHASE 2 : le vrai.
//
// GET /admin/dashboard : sante des 10 sondes (9 services FinZuu + Faker),
// dernier run, compteurs de NOS collections, alertes d'integrite.
// 4 etats tenus partout ; l'ecran vide est HONNETE (Mongo serveur vierge
// = un fait a montrer, pas une erreur) ; rafraichissement auto 60 s.

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Activity,
  GitBranch,
  Landmark,
  RefreshCw,
  Store,
  UserCheck,
  Users,
} from 'lucide-react'
import { Card, SectionHeader, StatusBadge } from '../components/ui'
import { Banniere, HealthDot, KpiCard, Skeleton } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import { ApiError, lireDashboard, type VueDashboard } from '../lib/api'

type Etat =
  | { statut: 'chargement' }
  | { statut: 'pret'; vue: VueDashboard; maj: Date }
  | { statut: 'erreur'; message: string }

const INTERVALLE_RAFRAICHISSEMENT_MS = 60_000

export function TableauDeBord() {
  const { t } = useApp()
  const [etat, setEtat] = useState<Etat>({ statut: 'chargement' })
  // La premiere charge montre des squelettes ; les rafraichissements suivants
  // gardent la vue en place (jamais un ecran qui clignote toutes les 60 s).
  const dejaCharge = useRef(false)

  const charger = useCallback(async () => {
    if (!dejaCharge.current) setEtat({ statut: 'chargement' })
    try {
      const vue = await lireDashboard()
      dejaCharge.current = true
      setEtat({ statut: 'pret', vue, maj: new Date() })
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 0
          ? t('error_backend_unreachable')
          : `${t('error_named')} ${String(err instanceof ApiError ? err.detail : err)}`
      setEtat({ statut: 'erreur', message })
    }
  }, [t])

  useEffect(() => {
    void charger()
    const timer = setInterval(() => void charger(), INTERVALLE_RAFRAICHISSEMENT_MS)
    return () => clearInterval(timer)
  }, [charger])

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title={t('dash_services_title')}
        subtitle={t('dash_services_subtitle')}
        action={
          <div className="flex items-center gap-2">
            {etat.statut === 'pret' && (
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                {t('dash_maj')} {etat.maj.toLocaleTimeString()}
              </span>
            )}
            <button
              className="btn-ghost text-xs"
              style={{ height: 30 }}
              onClick={() => void charger()}
              disabled={etat.statut === 'chargement'}
            >
              <RefreshCw size={12} />
              {t('dash_rafraichir')}
            </button>
          </div>
        }
      />

      {etat.statut === 'erreur' && (
        <div className="mb-5">
          <Banniere ton="danger">{etat.message}</Banniere>
        </div>
      )}

      {/* ── Sante des 10 sondes ──────────────────────────────────────────── */}
      {etat.statut === 'chargement' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-6">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} height={52} />
          ))}
        </div>
      ) : etat.statut === 'pret' ? (
        <>
          {etat.vue.services.some((s) => s.etat === 'down') && (
            <div className="mb-3">
              <Banniere ton="attention">
                <strong>
                  {etat.vue.services.filter((s) => s.etat === 'down').map((s) => s.nom).join(', ')}
                </strong>{' '}
                — {t('dash_service_down_banner')}
              </Banniere>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-6 stagger">
            {etat.vue.services.map((service) => (
              <HealthDot
                key={service.nom}
                nom={service.nom}
                etat={service.etat}
                latenceMs={service.latence_ms}
                detail={service.erreur ?? (service.http !== null ? `HTTP ${service.http}` : undefined)}
              />
            ))}
          </div>
        </>
      ) : null}

      {/* ── Dernier run + compteurs ─────────────────────────────────────── */}
      <SectionHeader title={t('dash_dernier_run')} />
      {etat.statut === 'chargement' ? (
        <Skeleton height={90} />
      ) : etat.statut === 'pret' && etat.vue.dernier_run === null ? (
        <Card className="mb-6">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {t('dash_aucun_run')}
          </p>
        </Card>
      ) : etat.statut === 'pret' && etat.vue.dernier_run !== null ? (
        <>
          <Card className="mb-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={etat.vue.dernier_run.statut.toLowerCase()} />
              <span className="badge-primary font-mono">{etat.vue.dernier_run.mode}</span>
              <span className="text-xs font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                {etat.vue.dernier_run.run_id}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {etat.vue.dernier_run.nb_checkpoints} {t('dash_checkpoints')}
              </span>
            </div>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-6 stagger">
            <KpiCard libelle={t('dash_kpi_branches')} valeur={etat.vue.compteurs.branches ?? 0} icone={<GitBranch size={16} />} />
            <KpiCard libelle={t('dash_kpi_agences')} valeur={etat.vue.compteurs.agences ?? 0} icone={<Landmark size={16} />} couleur="var(--primary-dark)" />
            <KpiCard libelle={t('dash_kpi_kiosques')} valeur={etat.vue.compteurs.kiosques ?? 0} icone={<Store size={16} />} couleur="var(--secondary)" />
            <KpiCard libelle={t('dash_kpi_agents')} valeur={etat.vue.compteurs.agents ?? 0} icone={<UserCheck size={16} />} couleur="#f59e0b" />
            <KpiCard libelle={t('dash_kpi_clients')} valeur={etat.vue.compteurs.clients ?? 0} icone={<Users size={16} />} couleur="var(--secondary-dark)" />
            <KpiCard
              libelle={t('dash_kpi_ecritures')}
              valeur={Object.values(etat.vue.compteurs.ecritures_par_type ?? {}).reduce((a, b) => a + b, 0)}
              icone={<Activity size={16} />}
              couleur="#6b5b8e"
            />
          </div>
        </>
      ) : null}

      {/* ── Alertes d'integrite ─────────────────────────────────────────── */}
      {etat.statut === 'pret' && etat.vue.alertes.length > 0 && (
        <>
          <SectionHeader title={t('dash_alertes')} />
          <div className="space-y-2">
            {etat.vue.alertes.map((alerte) => (
              <Banniere key={alerte} ton="attention">
                {alerte}
              </Banniere>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
