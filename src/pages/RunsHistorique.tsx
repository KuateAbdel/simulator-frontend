// src/pages/RunsHistorique.tsx — US-C6, l'historique & la recette. PHASE 3.
//
// La table est APPEND-ONLY (aucune route de suppression n'existe au backend
// — et l'ecran le dit). Le detail montre la fiche, les paliers et le RAPPORT
// INTEGRAL, avec la recette CR-01→12 colorisee (TENU vert / VIOLE rouge).

import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Card, SectionHeader, StatusBadge } from '../components/ui'
import { Banniere, Skeleton } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import { usePagination } from '../hooks/usePagination'
import { Pager } from '../components/Pager'
import { lireRun, listerRuns, type DetailRun, type FicheRun } from '../lib/api'
import { EnTeteRun, PaliersListe, RapportIntegral, useMessageDe } from './runs-commun'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'liste'; runs: FicheRun[] }
  | { phase: 'detail'; detail: Partial<DetailRun> & { run_id: string; statut: string } }
  | { phase: 'erreur'; message: string }

export function RunsHistorique() {
  const { t } = useApp()
  const messageDe = useMessageDe()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })

  const chargerListe = useCallback(async () => {
    setEtat({ phase: 'chargement' })
    try {
      const { runs } = await listerRuns()
      setEtat({ phase: 'liste', runs })
    } catch (err) {
      setEtat({ phase: 'erreur', message: messageDe(err) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void chargerListe()
  }, [chargerListe])

  const runsListe = etat.phase === 'liste' ? etat.runs : []
  const pgRuns = usePagination(runsListe, 10)

  const ouvrirDetail = async (runId: string) => {
    setEtat({ phase: 'chargement' })
    try {
      setEtat({ phase: 'detail', detail: await lireRun(runId) })
    } catch (err) {
      setEtat({ phase: 'erreur', message: messageDe(err) })
    }
  }

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title={t('run_historique_titre')}
        subtitle={t('run_historique_note')}
        action={
          etat.phase === 'detail' ? (
            <button className="btn-ghost text-xs" style={{ height: 30 }} onClick={() => void chargerListe()}>
              <ArrowLeft size={12} />
              {t('run_retour_liste')}
            </button>
          ) : (
            <button className="btn-ghost text-xs" style={{ height: 30 }} onClick={() => void chargerListe()}>
              <RefreshCw size={12} />
              {t('run_actualiser')}
            </button>
          )
        }
      />

      {etat.phase === 'chargement' && <Skeleton height={180} />}
      {etat.phase === 'erreur' && <Banniere ton="danger">{etat.message}</Banniere>}

      {etat.phase === 'liste' &&
        (etat.runs.length === 0 ? (
          <Card>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {t('run_aucun')}
            </p>
          </Card>
        ) : (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>run</th>
                    <th>mode</th>
                    <th>{t('run_statut')}</th>
                    <th>{t('run_periode_sim')}</th>
                    <th>{t('run_paliers')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {pgRuns.pageItems.map((run) => (
                    <tr key={run.run_id}>
                      <td className="font-mono text-[10px]">{run.run_id.slice(0, 8)}…</td>
                      <td>
                        <span className="badge-primary font-mono">{run.mode}</span>
                      </td>
                      <td>
                        <StatusBadge status={run.statut.toLowerCase()} />
                      </td>
                      <td className="font-mono text-[10px]">
                        {run.sim_start_date} → {run.sim_end_date}
                      </td>
                      <td className="font-mono">{run.nb_checkpoints}</td>
                      <td>
                        <button
                          className="btn-ghost text-xs"
                          style={{ height: 28 }}
                          onClick={() => void ouvrirDetail(run.run_id)}
                        >
                          {t('run_voir_rapport')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager
              page={pgRuns.page}
              nbPages={pgRuns.nbPages}
              size={pgRuns.size}
              total={pgRuns.total}
              from={pgRuns.from}
              to={pgRuns.to}
              onPage={pgRuns.setPage}
              onSize={pgRuns.setSize}
            />
          </Card>
        ))}

      {etat.phase === 'detail' && (
        <>
          <Card className="mb-4">
            <div className="mb-3">
              <EnTeteRun
                statut={etat.detail.statut}
                mode={etat.detail.mode}
                runId={etat.detail.run_id}
              />
            </div>
            {etat.detail.sim_start_date && (
              <p className="text-[11px] font-mono mb-3" style={{ color: 'var(--text-muted)' }}>
                {t('run_periode_sim')} : {etat.detail.sim_start_date} → {etat.detail.sim_end_date}
              </p>
            )}
            <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
              {t('run_paliers')} ({etat.detail.checkpoints?.length ?? 0})
            </p>
            <PaliersListe paliers={etat.detail.checkpoints ?? []} />
          </Card>
          <Card>
            <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
              {t('run_rapport_integral')}
            </p>
            <RapportIntegral rapport={etat.detail.rapport ?? ''} vide="run_rapport_vide" />
          </Card>
        </>
      )}
    </div>
  )
}
