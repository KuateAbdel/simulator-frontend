// src/pages/RunsPreparer.tsx — US-C1/US-C2, LE rite D-01. PHASE 3.
//
// ① Preparer : POST /admin/runs (DRY_RUN seul — le chemin REAL direct
//    n'existe pas dans le backend). Suivi par polling jusqu'a l'etat final.
// ② Lire : le rapport INTEGRAL + l'empreinte figee D-10 + « la derniere
//    occasion de dire non » matérialisée en bandeau.
// ③ Confirmer : ConfirmDialog explicite → POST /{id}/confirmer. 409
//    « perimetre change » → retour structurel a l'etape ① avec le motif.
//
// A la montee de l'ecran, une preparation DRY terminee existante est
// REPRISE a l'etape ② : recharger la page ne perd pas le rite en cours.

import { useCallback, useEffect, useRef, useState } from 'react'
import { PlayCircle, RotateCcw } from 'lucide-react'
import { Card, SectionHeader } from '../components/ui'
import { Banniere, ConfirmDialog, Skeleton, Stepper, useToast } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import {
  ApiError,
  confirmerRun,
  lireProgression,
  lireRun,
  listerRuns,
  preparerRun,
  type Palier,
  type StatutRun,
} from '../lib/api'
import { CLE_RUN_SUIVI, EnTeteRun, PaliersListe, RapportIntegral, useMessageDe } from './runs-commun'

const TERMINAUX: StatutRun[] = ['COMPLETED', 'FAILED', 'PARTIAL']

type Etat =
  | { phase: 'chargement' }
  | { phase: 'repos' } // etape ① — pret a preparer
  | { phase: 'preparation'; runId: string; statut: StatutRun; paliers: Palier[] }
  | {
      phase: 'lecture' // etape ② — rapport pret
      runId: string
      statut: StatutRun
      rapport: string
      empreinte: Record<string, unknown>
    }

export function RunsPreparer() {
  const { t, setCurrentPage } = useApp()
  const { pousser } = useToast()
  const messageDe = useMessageDe()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [erreur, setErreur] = useState<string | null>(null)
  const [dialogueOuvert, setDialogueOuvert] = useState(false)
  const [confirmationEnCours, setConfirmationEnCours] = useState(false)
  const vivant = useRef(true)

  useEffect(() => {
    vivant.current = true
    return () => {
      vivant.current = false
    }
  }, [])

  const chargerLecture = useCallback(async (runId: string) => {
    const detail = await lireRun(runId)
    if (!vivant.current) return
    setEtat({
      phase: 'lecture',
      runId,
      statut: detail.statut,
      rapport: detail.rapport ?? '',
      empreinte: detail.configuration ?? {},
    })
  }, [])

  // Reprise : une preparation DRY terminee existante s'ouvre a l'etape ②.
  useEffect(() => {
    void (async () => {
      try {
        const { runs } = await listerRuns()
        const dernier = runs[0]
        if (dernier && dernier.mode === 'DRY_RUN' && TERMINAUX.includes(dernier.statut)) {
          await chargerLecture(dernier.run_id)
        } else if (
          dernier &&
          !TERMINAUX.includes(dernier.statut)
        ) {
          // Un run est en cours (DRY ou REAL) : on le montre en suivi ①.
          setEtat({ phase: 'preparation', runId: dernier.run_id, statut: dernier.statut, paliers: [] })
        } else {
          setEtat({ phase: 'repos' })
        }
      } catch (err) {
        if (!vivant.current) return
        setErreur(messageDe(err))
        setEtat({ phase: 'repos' })
      }
    })()
    // messageDe est stable au sens pratique ; ce chargement ne se refait qu'a la montee.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Polling pendant la preparation.
  useEffect(() => {
    if (etat.phase !== 'preparation') return
    const timer = setInterval(() => {
      void (async () => {
        try {
          const progression = await lireProgression(etat.runId)
          if (!vivant.current) return
          if (TERMINAUX.includes(progression.statut)) {
            clearInterval(timer)
            await chargerLecture(etat.runId)
          } else {
            setEtat({
              phase: 'preparation',
              runId: etat.runId,
              statut: progression.statut,
              paliers: progression.paliers,
            })
          }
        } catch {
          // panne transitoire de polling : on retentera au tick suivant
        }
      })()
    }, 2000)
    return () => clearInterval(timer)
  }, [etat, chargerLecture])

  const preparer = async () => {
    setErreur(null)
    try {
      const lance = await preparerRun()
      setEtat({ phase: 'preparation', runId: lance.run_id, statut: lance.statut, paliers: [] })
    } catch (err) {
      setErreur(messageDe(err))
    }
  }

  const confirmer = async () => {
    if (etat.phase !== 'lecture' || confirmationEnCours) return
    setConfirmationEnCours(true)
    setErreur(null)
    try {
      const reel = await confirmerRun(etat.runId)
      sessionStorage.setItem(CLE_RUN_SUIVI, reel.run_id)
      pousser('succes', t('run_confirme_toast'))
      setCurrentPage('runs-progression')
    } catch (err) {
      setDialogueOuvert(false)
      if (err instanceof ApiError && err.status === 409 && String(err.detail).includes('re-preparer')) {
        // Le rite se referme : retour structurel a l'etape ①.
        setErreur(`${t('run_perimetre_change')} — ${String(err.detail)}`)
        setEtat({ phase: 'repos' })
      } else {
        setErreur(messageDe(err))
      }
    } finally {
      setConfirmationEnCours(false)
    }
  }

  const indexEtape = etat.phase === 'lecture' ? 1 : 0

  return (
    <div className="animate-fade-in">
      <SectionHeader title={t('run_rite_titre')} subtitle={t('run_rite_sous_titre')} />
      <Stepper
        etapes={[t('run_etape_preparer'), t('run_etape_lire'), t('run_etape_confirmer')]}
        courante={indexEtape}
      />

      {erreur && (
        <div className="mb-4">
          <Banniere ton="danger">{erreur}</Banniere>
        </div>
      )}

      {etat.phase === 'chargement' && <Skeleton height={140} />}

      {etat.phase === 'repos' && (
        <Card style={{ maxWidth: 560 }}>
          <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
            {t('run_preparer_note')}
          </p>
          <button className="btn-primary text-xs" style={{ height: 36 }} onClick={() => void preparer()}>
            <PlayCircle size={14} />
            {t('run_preparer_action')}
          </button>
        </Card>
      )}

      {etat.phase === 'preparation' && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <EnTeteRun statut={etat.statut} runId={etat.runId} />
            <span className="text-xs animate-pulse" style={{ color: 'var(--primary-dark)' }}>
              {t('run_en_preparation')}
            </span>
          </div>
          <PaliersListe paliers={etat.paliers} />
        </Card>
      )}

      {etat.phase === 'lecture' && (
        <>
          <div className="mb-3">
            <Banniere ton="attention">
              <strong>{t('run_derniere_occasion')}</strong>
            </Banniere>
          </div>
          <Card className="mb-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <EnTeteRun statut={etat.statut} mode="DRY_RUN" runId={etat.runId} />
              <div className="flex gap-2">
                <button
                  className="btn-ghost text-xs"
                  style={{ height: 32 }}
                  onClick={() => {
                    setEtat({ phase: 'repos' })
                    setErreur(null)
                  }}
                >
                  <RotateCcw size={12} />
                  {t('run_re_preparer')}
                </button>
                <button
                  className="btn-primary text-xs"
                  style={{ height: 32 }}
                  onClick={() => setDialogueOuvert(true)}
                >
                  {t('run_confirmer_action')}
                </button>
              </div>
            </div>
            <p className="text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
              {t('run_rapport_titre')}
            </p>
            <RapportIntegral rapport={etat.rapport} vide="run_rapport_vide" />
          </Card>

          <Card>
            <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
              {t('run_empreinte')}
            </p>
            <div
              className="rounded-xl border overflow-auto font-mono text-[10px] p-3"
              style={{ borderColor: 'var(--border)', maxHeight: 200, whiteSpace: 'pre' }}
            >
              {JSON.stringify(etat.empreinte, null, 2)}
            </div>
          </Card>

          <ConfirmDialog
            ouvert={dialogueOuvert}
            titre={t('run_confirmer_titre')}
            libelleConfirmer={t('run_confirmer_action')}
            libelleAnnuler={t('cancel')}
            danger
            enCours={confirmationEnCours}
            onConfirmer={() => void confirmer()}
            onAnnuler={() => setDialogueOuvert(false)}
          >
            {t('run_confirmer_texte')}
          </ConfirmDialog>
        </>
      )}
    </div>
  )
}
