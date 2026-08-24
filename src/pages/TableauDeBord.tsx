// src/pages/TableauDeBord.tsx — US-E1, l'atterrissage. PHASE 2 : le vrai.
//
// GET /admin/dashboard : sante des 10 sondes (9 services FinZuu + Faker),
// dernier run, compteurs de NOS collections, alertes d'integrite.
// 4 etats tenus partout ; l'ecran vide est HONNETE (Mongo serveur vierge
// = un fait a montrer, pas une erreur) ; rafraichissement auto 60 s.

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Activity,
  Banknote,
  Bell,
  Building2,
  Dices,
  Fingerprint,
  GitBranch,
  HandCoins,
  Landmark,
  Package,
  Smartphone,
  RefreshCw,
  SlidersHorizontal,
  Store,
  UserCheck,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { Card, SectionHeader, StatusBadge } from '../components/ui'
import { Banniere, HealthDot, KpiCard, Skeleton } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import { ApiError, lireDashboard, type VueDashboard } from '../lib/api'
import type { TranslationKey } from '../i18n'

// Demande JJB (20/08) : le cockpit parle METIER — chaque sonde porte un
// pictogramme et un libelle bilingue, jamais un nom technique en « -service ».
// Le nom technique RESTE dans le tooltip : la tracabilite vers le vrai
// service n'est pas sacrifiee a l'habillage. Une sonde inconnue (backend
// plus recent que ce build) s'affiche sans casser, nom nettoye + icone neutre.
const SONDE_META: Record<string, { icone: LucideIcon; labelKey: TranslationKey }> = {
  'user-service': { icone: Users, labelKey: 'svc_user' },
  'config-service': { icone: SlidersHorizontal, labelKey: 'svc_config' },
  'identity-service': { icone: Fingerprint, labelKey: 'svc_identity' },
  'account-service': { icone: Wallet, labelKey: 'svc_account' },
  'company-service': { icone: Building2, labelKey: 'svc_company' },
  'product-service': { icone: Package, labelKey: 'svc_product' },
  'depositary-service': { icone: Store, labelKey: 'svc_depositary' },
  'client-service': { icone: UserRound, labelKey: 'svc_client' },
  'collect-service': { icone: HandCoins, labelKey: 'svc_collect' },
  // Les trois services ajoutes le 24/08. `ussd-service` manquait au releve
  // alors qu'il porte le canal par lequel les clients accedent au systeme ;
  // les deux autres ont ete DECOUVERTS dans les journaux de transparence des
  // certificats — le Loader les ignorait, donc personne ne voyait ni leur
  // etat ni leur changement de version.
  'ussd-service': { icone: Smartphone, labelKey: 'svc_ussd' },
  'bulk-paiement-service': { icone: Banknote, labelKey: 'svc_bulk_paiement' },
  'notification-service': { icone: Bell, labelKey: 'svc_notification' },
  faker: { icone: Dices, labelKey: 'svc_faker' },
}

type Etat =
  | { statut: 'chargement' }
  | { statut: 'pret'; vue: VueDashboard; maj: Date }
  | { statut: 'erreur'; message: string }

const INTERVALLE_RAFRAICHISSEMENT_MS = 60_000

export function TableauDeBord() {
  const { t } = useApp()
  const [etat, setEtat] = useState<Etat>({ statut: 'chargement' })
  /** Libelle METIER d'une sonde — repli : le nom technique sans « -service ». */
  const libelleSonde = (nom: string) => {
    const meta = SONDE_META[nom]
    return meta ? t(meta.labelKey) : nom.replace(/-service$/, '')
  }
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
                  {etat.vue.services.filter((s) => s.etat === 'down').map((s) => libelleSonde(s.nom)).join(', ')}
                </strong>{' '}
                — {t('dash_service_down_banner')}
              </Banniere>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-6 stagger">
            {etat.vue.services.map((service) => {
              const meta = SONDE_META[service.nom]
              const Icone = meta?.icone ?? Activity
              const technique =
                service.erreur ?? (service.http !== null ? `HTTP ${service.http}` : undefined)
              return (
                <HealthDot
                  key={service.nom}
                  nom={libelleSonde(service.nom)}
                  etat={service.etat}
                  latenceMs={service.latence_ms}
                  detail={technique}
                  // Le tooltip garde le NOM TECHNIQUE : l'habillage metier ne
                  // coupe jamais la tracabilite vers le service reel.
                  technique={technique ? `${service.nom} · ${technique}` : service.nom}
                  icone={<Icone size={14} />}
                />
              )
            })}
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
