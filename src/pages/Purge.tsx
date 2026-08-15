// src/pages/Purge.tsx — US-F1/F2, la purge HONNETE. PHASE 6.
//
// Le rite en deux temps, comme les runs : ① PREPARER (aucune ecriture) rend
// les deux colonnes chiffrees — le purgeable (NOS groupes, seule action
// reversible de la v1) et les RESIDUS MARQUES, chacun avec le verdict mesure
// qui explique POURQUOI il restera (aucun DELETE sur companies, clients,
// identites, comptes...). ② CONFIRMER exige la case explicite + le dialogue
// danger. ③ Le RESULTAT redit les residus — la purge ne les fait jamais
// disparaitre du compte-rendu.

import { useState } from 'react'
import { Eraser, ListChecks, ShieldAlert } from 'lucide-react'
import { Card, SectionHeader } from '../components/ui'
import { Banniere, ConfirmDialog, Stepper, useToast } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import {
  confirmerPurge,
  preparerPurge,
  type ResiduMarque,
  type VuePurgePreparee,
} from '../lib/api'
import { FautesBloc, fautesDe } from './entites-commun'

type Etape =
  | { phase: 'accueil' }
  | { phase: 'preparee'; vue: VuePurgePreparee }
  | {
      phase: 'purgee'
      supprimes: string[]
      echecs: { groupe: string; motif: string }[]
      residus: Record<string, ResiduMarque>
      note: string
    }

function ResidusCartes({ residus }: { residus: Record<string, ResiduMarque> }) {
  const { t } = useApp()
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
        {t('pur_residus_titre')}
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {Object.entries(residus).map(([collection, residu]) => (
          <div key={collection} className="rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                {collection}
              </span>
              <span className="font-mono text-sm font-bold" style={{ color: residu.compte > 0 ? '#92400e' : 'var(--text-muted)' }}>
                {residu.compte}
              </span>
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)' }}>
              {residu.verdict}
            </p>
            {residu.note && (
              <p className="text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>
                {residu.note}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function Purge() {
  const { t } = useApp()
  const { pousser } = useToast()
  const [etape, setEtape] = useState<Etape>({ phase: 'accueil' })
  const [envoi, setEnvoi] = useState(false)
  const [fautes, setFautes] = useState<string[]>([])
  const [caseCochee, setCaseCochee] = useState(false)
  const [confirmerOuvert, setConfirmerOuvert] = useState(false)

  const preparer = async () => {
    if (envoi) return
    setEnvoi(true)
    setFautes([])
    try {
      setEtape({ phase: 'preparee', vue: await preparerPurge() })
      setCaseCochee(false)
    } catch (err) {
      setFautes(fautesDe(err))
    } finally {
      setEnvoi(false)
    }
  }

  const confirmer = async () => {
    if (envoi) return
    setEnvoi(true)
    setFautes([])
    try {
      const reponse = await confirmerPurge(true)
      setConfirmerOuvert(false)
      setEtape({
        phase: 'purgee',
        supprimes: reponse.supprimes,
        echecs: reponse.echecs,
        residus: reponse.residus_marques,
        note: reponse.note,
      })
      pousser('succes', `${reponse.supprimes.length} ${t('pur_supprimes_toast')}`)
    } catch (err) {
      setConfirmerOuvert(false)
      setFautes(fautesDe(err))
    } finally {
      setEnvoi(false)
    }
  }

  const indexEtape = etape.phase === 'accueil' ? 0 : etape.phase === 'preparee' ? 1 : 2

  return (
    <div className="animate-fade-in">
      <SectionHeader title={t('pur_titre')} subtitle={t('pur_sous_titre')} />
      <Stepper
        etapes={[t('pur_etape_preparer'), t('pur_etape_lire'), t('pur_etape_faite')]}
        courante={indexEtape}
      />
      <Banniere ton="info">{t('pur_doctrine')}</Banniere>

      <FautesBloc fautes={fautes} />

      {etape.phase === 'accueil' && (
        <Card className="mt-4">
          <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
            {t('pur_accueil')}
          </p>
          <button
            className="btn-primary text-xs"
            style={{ height: 32, opacity: envoi ? 0.6 : 1 }}
            disabled={envoi}
            onClick={() => void preparer()}
          >
            <ListChecks size={13} />
            {envoi ? t('loading') : t('pur_preparer')}
          </button>
        </Card>
      )}

      {etape.phase === 'preparee' && (
        <Card className="mt-4">
          {/* Colonne 1 — le purgeable */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Eraser size={14} style={{ color: 'var(--primary-dark)' }} />
              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t('pur_purgeable_titre')}
              </p>
              <span className="badge-primary font-mono">{etape.vue.purgeable.groupes.length}</span>
            </div>
            <p className="text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>
              {etape.vue.purgeable.regle}
            </p>
            {etape.vue.purgeable.groupes.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {t('pur_rien_a_purger')}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {etape.vue.purgeable.groupes.map((groupe) => (
                  <span
                    key={groupe.id}
                    className="text-[10px] rounded-full px-2 py-0.5"
                    style={{ background: 'var(--secondary-light)', color: 'var(--secondary-dark)' }}
                    title={groupe.id}
                  >
                    {groupe.nom}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Colonne 2 — les residus, verdict par verdict */}
          <ResidusCartes residus={etape.vue.residus_marques} />

          <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
            {etape.vue.note}
          </p>

          {/* La decision — case EXPLICITE puis dialogue danger */}
          <div className="border-t mt-4 pt-4" style={{ borderColor: 'var(--border)' }}>
            <label className="flex items-start gap-2 text-xs mb-3" style={{ color: 'var(--text-primary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={caseCochee}
                onChange={(e) => setCaseCochee(e.target.checked)}
                disabled={etape.vue.purgeable.groupes.length === 0}
              />
              <span>
                {t('pur_case')} ({etape.vue.purgeable.groupes.length})
              </span>
            </label>
            <div className="flex gap-2">
              <button className="btn-ghost text-xs" style={{ height: 32 }} onClick={() => setEtape({ phase: 'accueil' })}>
                {t('back')}
              </button>
              <button
                className="text-xs font-semibold rounded-lg px-4"
                style={{
                  height: 32,
                  border: 'none',
                  background: '#b91c1c',
                  color: '#fff',
                  cursor: caseCochee ? 'pointer' : 'default',
                  opacity: caseCochee && !envoi ? 1 : 0.5,
                }}
                disabled={!caseCochee || envoi}
                onClick={() => setConfirmerOuvert(true)}
              >
                <ShieldAlert size={12} style={{ display: 'inline', marginRight: 4 }} />
                {t('pur_executer')}
              </button>
            </div>
          </div>
        </Card>
      )}

      {etape.phase === 'purgee' && (
        <Card className="mt-4">
          <Banniere ton={etape.echecs.length === 0 ? 'succes' : 'attention'}>
            {etape.supprimes.length} {t('pur_supprimes_toast')}
            {etape.echecs.length > 0 && ` — ${etape.echecs.length} ${t('pur_echecs')}`}
          </Banniere>
          {etape.supprimes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {etape.supprimes.map((nom) => (
                <span key={nom} className="text-[10px] rounded-full px-2 py-0.5" style={{ background: 'var(--border)', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>
                  {nom}
                </span>
              ))}
            </div>
          )}
          {etape.echecs.length > 0 && (
            <div className="mt-3 space-y-1">
              {etape.echecs.map((echec) => (
                <p key={echec.groupe} className="text-[11px]" style={{ color: '#b91c1c' }}>
                  {echec.groupe} — {echec.motif}
                </p>
              ))}
            </div>
          )}
          <div className="mt-4">
            <ResidusCartes residus={etape.residus} />
          </div>
          <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
            {etape.note}
          </p>
          <button className="btn-primary text-xs mt-4" style={{ height: 32 }} onClick={() => void preparer()}>
            {t('pur_repreparer')}
          </button>
        </Card>
      )}

      <ConfirmDialog
        ouvert={confirmerOuvert}
        titre={t('pur_confirmer_titre')}
        libelleConfirmer={t('pur_executer')}
        libelleAnnuler={t('cancel')}
        danger
        enCours={envoi}
        onConfirmer={() => void confirmer()}
        onAnnuler={() => setConfirmerOuvert(false)}
      >
        {t('pur_confirmer_corps')}
      </ConfirmDialog>
    </div>
  )
}
