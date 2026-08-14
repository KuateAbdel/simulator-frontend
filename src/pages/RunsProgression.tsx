// src/pages/RunsProgression.tsx — US-C3 (progression) / US-C4 (arret). PHASE 3.
//
// Suit le run pose par la confirmation (sessionStorage), sinon le plus
// recent. Polling 3 s tant que l'etat n'est pas terminal. L'arret est un
// geste confirme (danger) : le backend clot en FAILED — etat terminal VRAI.

import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, StopCircle } from 'lucide-react'
import { Card, SectionHeader } from '../components/ui'
import { Banniere, ConfirmDialog, Skeleton, useToast } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import {
  arreterRun,
  lireProgression,
  listerRuns,
  type ProgressionRun,
  type StatutRun,
} from '../lib/api'
import { CLE_RUN_SUIVI, EnTeteRun, PaliersListe, useMessageDe } from './runs-commun'

const TERMINAUX: StatutRun[] = ['COMPLETED', 'FAILED', 'PARTIAL']

type Etat =
  | { phase: 'chargement' }
  | { phase: 'vide' }
  | { phase: 'suivi'; progression: ProgressionRun }
  | { phase: 'erreur'; message: string }

export function RunsProgression() {
  const { t } = useApp()
  const { pousser } = useToast()
  const messageDe = useMessageDe()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [dialogueArret, setDialogueArret] = useState(false)
  const [arretEnCours, setArretEnCours] = useState(false)
  const runIdRef = useRef<string | null>(null)

  const charger = useCallback(async () => {
    try {
      let cible = runIdRef.current ?? sessionStorage.getItem(CLE_RUN_SUIVI)
      if (!cible) {
        const { runs } = await listerRuns()
        cible = runs[0]?.run_id ?? null
      }
      if (!cible) {
        setEtat({ phase: 'vide' })
        return
      }
      runIdRef.current = cible
      const progression = await lireProgression(cible)
      setEtat({ phase: 'suivi', progression })
    } catch (err) {
      setEtat({ phase: 'erreur', message: messageDe(err) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void charger()
  }, [charger])

  // Polling tant que le run n'est pas terminal.
  useEffect(() => {
    if (etat.phase !== 'suivi' || TERMINAUX.includes(etat.progression.statut)) return
    const timer = setInterval(() => void charger(), 3000)
    return () => clearInterval(timer)
  }, [etat, charger])

  const arreter = async () => {
    if (etat.phase !== 'suivi' || arretEnCours) return
    setArretEnCours(true)
    try {
      await arreterRun(etat.progression.run_id)
      pousser('succes', t('run_arret_demande'))
      setDialogueArret(false)
      await charger()
    } catch (err) {
      pousser('erreur', messageDe(err))
      setDialogueArret(false)
    } finally {
      setArretEnCours(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title={t('run_suivi_titre')}
        subtitle={t('nav_runs_progression')}
        action={
          <button className="btn-ghost text-xs" style={{ height: 30 }} onClick={() => void charger()}>
            <RefreshCw size={12} />
            {t('run_actualiser')}
          </button>
        }
      />

      {etat.phase === 'chargement' && <Skeleton height={140} />}
      {etat.phase === 'vide' && (
        <Card>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {t('run_aucun')}
          </p>
        </Card>
      )}
      {etat.phase === 'erreur' && <Banniere ton="danger">{etat.message}</Banniere>}

      {etat.phase === 'suivi' && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <EnTeteRun
              statut={etat.progression.statut}
              mode={etat.progression.mode}
              runId={etat.progression.run_id}
            />
            {etat.progression.en_cours_dans_ce_processus &&
              !TERMINAUX.includes(etat.progression.statut) && (
                <button
                  className="text-xs font-semibold rounded-lg px-3"
                  style={{ height: 32, border: 'none', cursor: 'pointer', background: '#b91c1c', color: '#fff' }}
                  onClick={() => setDialogueArret(true)}
                >
                  <StopCircle size={12} style={{ display: 'inline', marginRight: 4 }} />
                  {t('run_arreter')}
                </button>
              )}
          </div>
          <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
            {t('run_paliers')} ({etat.progression.paliers.length})
          </p>
          <PaliersListe paliers={etat.progression.paliers} />
        </Card>
      )}

      <ConfirmDialog
        ouvert={dialogueArret}
        titre={t('run_arreter_titre')}
        libelleConfirmer={t('run_arreter')}
        libelleAnnuler={t('cancel')}
        danger
        enCours={arretEnCours}
        onConfirmer={() => void arreter()}
        onAnnuler={() => setDialogueArret(false)}
      >
        {t('run_arreter_texte')}
      </ConfirmDialog>
    </div>
  )
}
