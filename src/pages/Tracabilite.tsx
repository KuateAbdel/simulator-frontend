// src/pages/Tracabilite.tsx — US-E4, « d'ou vient cette entite ? ». PHASE 6.
//
// Le VERDICT d'abord (banniere) : « journal clos » vert, ou l'ambre chiffre
// des orphelines a verifier a la main. Puis la matiere : le registre Faker
// par pays, les ecritures du journal par type, les dernieres entrees, et
// les deux listes d'orphelines — une anomalie absente de l'ecran serait une
// anomalie cachee.

import { useCallback, useEffect, useState } from 'react'
import { ClipboardList, Fingerprint } from 'lucide-react'
import { Card, SectionHeader } from '../components/ui'
import { Banniere, Skeleton } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import { lireTracabilite, type VueTracabilite } from '../lib/api'
import { usePagination } from '../hooks/usePagination'
import { Pager } from '../components/Pager'
import { useMessageDe } from './runs-commun'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'pret'; vue: VueTracabilite }
  | { phase: 'vide'; message: string }
  | { phase: 'erreur'; message: string }

export function Tracabilite() {
  const { t, setCurrentPage } = useApp()
  const messageDe = useMessageDe()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })

  const charger = useCallback(async () => {
    setEtat({ phase: 'chargement' })
    try {
      const vue = await lireTracabilite()
      if (vue.run_id === null) {
        setEtat({ phase: 'vide', message: vue.note ?? t('tra_vide') })
      } else {
        setEtat({ phase: 'pret', vue })
      }
    } catch (err) {
      setEtat({ phase: 'erreur', message: messageDe(err) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t])

  useEffect(() => {
    void charger()
  }, [charger])

  const entrees = etat.phase === 'pret' ? (etat.vue.journal?.dernieres_entrees ?? []) : []
  const pgEntrees = usePagination(entrees, 10)

  if (etat.phase === 'chargement') {
    return (
      <div className="space-y-3">
        <Skeleton height={28} width={280} />
        <Skeleton height={260} />
      </div>
    )
  }
  if (etat.phase === 'vide' || etat.phase === 'erreur') {
    return (
      <div>
        <SectionHeader title={t('tra_titre')} subtitle={t('tra_sous_titre')} />
        <Banniere ton={etat.phase === 'erreur' ? 'danger' : 'info'}>
          {etat.message}
          {etat.phase === 'vide' && (
            <>
              {' — '}
              <button
                className="underline font-semibold"
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                onClick={() => setCurrentPage('runs-preparer')}
              >
                {t('eco_aller_preparer')}
              </button>
            </>
          )}
        </Banniere>
        {etat.phase === 'erreur' && (
          <button className="btn-ghost text-xs mt-3" onClick={() => void charger()}>
            {t('retry')}
          </button>
        )}
      </div>
    )
  }

  const { vue } = etat
  const orphelinesAudit = vue.journal?.intentions_orphelines ?? []
  const orphelinesFaker = vue.registre_faker?.reservations_orphelines ?? []
  const journalClos = orphelinesAudit.length === 0 && orphelinesFaker.length === 0

  return (
    <div className="animate-fade-in">
      <SectionHeader title={t('tra_titre')} subtitle={t('tra_sous_titre')} />
      <p className="text-[10px] font-mono mb-3" style={{ color: 'var(--text-muted)' }}>
        run {vue.run_id}
      </p>

      {/* LE VERDICT — d'abord */}
      <Banniere ton={journalClos ? 'succes' : 'attention'}>{vue.reconciliation}</Banniere>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        {/* Registre Faker */}
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Fingerprint size={14} style={{ color: 'var(--primary-dark)' }} />
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('tra_faker_titre')}
            </p>
          </div>
          <p className="text-[10px] mb-3" style={{ color: 'var(--text-muted)' }}>
            {t('tra_faker_note')}
          </p>
          {Object.keys(vue.registre_faker?.par_pays ?? {}).length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {t('empty_no_data')}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(vue.registre_faker?.par_pays ?? {}).map(([pays, compte]) => (
                <span key={pays} className="badge-primary font-mono">
                  {pays} · {compte}
                </span>
              ))}
            </div>
          )}
          {orphelinesFaker.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-semibold mb-1" style={{ color: '#92400e' }}>
                {t('tra_faker_orphelines')} ({orphelinesFaker.length})
              </p>
              <div className="space-y-0.5" style={{ maxHeight: 160, overflowY: 'auto' }}>
                {orphelinesFaker.map((o) => (
                  <p key={o.client_id} className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {o.pays} · {o.client_id} · seed {o.seed}
                  </p>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Journal */}
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList size={14} style={{ color: 'var(--primary-dark)' }} />
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('tra_journal_titre')}
            </p>
            <span className="badge-primary font-mono">
              {vue.journal?.nb_entrees ?? 0} {t('tra_entrees')}
            </span>
          </div>
          {Object.keys(vue.journal?.ecritures_par_type ?? {}).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.entries(vue.journal?.ecritures_par_type ?? {}).map(([type, compte]) => (
                <span key={type} className="badge-secondary font-mono">
                  {type} · {compte}
                </span>
              ))}
            </div>
          )}
          {(vue.journal?.dernieres_entrees ?? []).length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {t('empty_no_data')}
            </p>
          ) : (
            <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('tra_col_type')}</th>
                    <th>{t('tra_col_action')}</th>
                    <th>{t('tra_col_quand')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pgEntrees.pageItems.map((e, i) => (
                    <tr key={i}>
                      <td className="font-mono text-[11px]">{e.entity_type}</td>
                      <td className="font-mono text-[11px]">{e.action}</td>
                      <td className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {new Date(e.horodatage).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager
              page={pgEntrees.page}
              nbPages={pgEntrees.nbPages}
              size={pgEntrees.size}
              total={pgEntrees.total}
              from={pgEntrees.from}
              to={pgEntrees.to}
              onPage={pgEntrees.setPage}
              onSize={pgEntrees.setSize}
            />
            </>
          )}
          {orphelinesAudit.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-semibold mb-1" style={{ color: '#92400e' }}>
                {t('tra_journal_orphelines')} ({orphelinesAudit.length})
              </p>
              <div className="space-y-0.5" style={{ maxHeight: 160, overflowY: 'auto' }}>
                {orphelinesAudit.map((o) => (
                  <p key={o.entity_id} className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {o.entity_type} · {o.entity_id} → {o.cible}
                  </p>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
