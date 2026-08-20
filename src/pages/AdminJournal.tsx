// src/pages/AdminJournal.tsx — le JOURNAL d'administration (audit).
//
// « Qui a fait quoi, quand » : les dernières actions d'administration
// (gestion des comptes/rôles, entités hors run), les plus récentes d'abord.
// Réservé au Super-Admin (la nav le cache aux autres ; l'API 403 sinon).
// LECTURE SEULE — aucune action, on ne fait que relire ce que d'autres ont
// inscrit.

import { useCallback, useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Card, SectionHeader } from '../components/ui'
import { Banniere, Skeleton } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import { usePagination } from '../hooks/usePagination'
import { Pager } from '../components/Pager'
import { listerJournal, type EntreeJournal } from '../lib/api'
import { useMessageDe } from './runs-commun'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'pret'; entrees: EntreeJournal[]; note: string }
  | { phase: 'erreur'; message: string }

/** Un résumé lisible des détails (email, rôle, motif…) — jamais un objet brut. */
function resumeDetails(details: Record<string, unknown>): string {
  const paires = Object.entries(details).filter(([, v]) => v !== null && v !== undefined && v !== '')
  if (paires.length === 0) return '—'
  return paires.map(([k, v]) => `${k}: ${String(v)}`).join(' · ')
}

export function AdminJournal() {
  const { t } = useApp()
  const messageDe = useMessageDe()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })

  const charger = useCallback(async () => {
    setEtat({ phase: 'chargement' })
    try {
      const reponse = await listerJournal()
      setEtat({ phase: 'pret', entrees: reponse.entrees, note: reponse.note })
    } catch (err) {
      setEtat({ phase: 'erreur', message: messageDe(err) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void charger()
  }, [charger])

  const entreesListe = etat.phase === 'pret' ? etat.entrees : []
  const pg = usePagination(entreesListe, 25)

  return (
    <div className="animate-fade-in">
      <SectionHeader title={t('jrn_titre')} subtitle={t('jrn_sous_titre')} />
      <Banniere ton="info">{t('jrn_doctrine')}</Banniere>

      <div className="mt-4">
        {etat.phase === 'chargement' && <Skeleton height={240} />}
        {etat.phase === 'erreur' && (
          <>
            <Banniere ton="danger">{etat.message}</Banniere>
            <button className="btn-ghost text-xs mt-2" onClick={() => void charger()}>
              {t('retry')}
            </button>
          </>
        )}
        {etat.phase === 'pret' && (
          <>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('jrn_col_quand')}</th>
                      <th>{t('jrn_col_acteur')}</th>
                      <th>{t('jrn_col_operation')}</th>
                      <th>{t('jrn_col_entite')}</th>
                      <th>{t('jrn_col_details')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pg.pageItems.map((e, i) => (
                      <tr key={`${e.quand}-${i}`}>
                        <td className="text-[11px] whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(e.quand).toLocaleString()}
                        </td>
                        <td className="font-mono text-[11px]">{e.acteur ?? '—'}</td>
                        <td>
                          <span className="badge-primary">{e.operation}</span>
                        </td>
                        <td className="text-[11px]">{e.entite}</td>
                        <td className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                          {resumeDetails(e.details)}
                        </td>
                      </tr>
                    ))}
                    {pg.total === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-xs py-6" style={{ color: 'var(--text-muted)' }}>
                          {t('jrn_vide')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pager
                page={pg.page}
                nbPages={pg.nbPages}
                size={pg.size}
                total={pg.total}
                from={pg.from}
                to={pg.to}
                onPage={pg.setPage}
                onSize={pg.setSize}
              />
              <p className="text-[10px] px-4 py-2" style={{ color: 'var(--text-muted)' }}>
                {etat.note}
              </p>
            </Card>
            <button className="btn-ghost text-xs mt-2" style={{ height: 28 }} onClick={() => void charger()}>
              <RotateCcw size={12} />
              {t('dash_rafraichir')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
