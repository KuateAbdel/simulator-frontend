// src/pages/AdminComptes.tsx — gestion des UTILISATEURS du Loader (RBAC).
//
// « Super-Admin » est un ROLE : chaque personne a SON compte (email reel —
// c'est la que part le code « mot de passe oublie »), son mot de passe
// change librement sans toucher les autres, son cycle premiere-connexion.
// Un compte se DESACTIVE (motif trace), jamais ne se supprime : le journal
// reste attribuable. Le mot de passe initial d'un compte cree s'affiche UNE
// SEULE fois — l'ecran le dit et propose la copie.

import { useCallback, useEffect, useState } from 'react'
import { Copy, RotateCcw, UserCheck, UserPlus, UserX } from 'lucide-react'
import { Card, SectionHeader } from '../components/ui'
import { Banniere, ConfirmDialog, Skeleton, useToast } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import {
  changerEtatCompte,
  creerCompte,
  listerComptes,
  type CompteAdmin,
} from '../lib/api'
import { useMessageDe } from './runs-commun'
import { ChampLabel, FautesBloc, fautesDe } from './entites-commun'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'pret'; comptes: CompteAdmin[]; note: string }
  | { phase: 'erreur'; message: string }

type Creation = {
  compte: CompteAdmin
  motDePasseInitial: string
  emailEnvoye: boolean
  note: string
}

export function AdminComptes() {
  const { t, session } = useApp()
  const { pousser } = useToast()
  const messageDe = useMessageDe()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [fEmail, setFEmail] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [fautes, setFautes] = useState<string[]>([])
  const [creation, setCreation] = useState<Creation | null>(null)
  // Desactivation : la cible + le motif, confirmes en dialogue.
  const [cible, setCible] = useState<CompteAdmin | null>(null)
  const [fMotif, setFMotif] = useState('')

  const charger = useCallback(async () => {
    setEtat({ phase: 'chargement' })
    try {
      const reponse = await listerComptes()
      setEtat({ phase: 'pret', comptes: reponse.comptes, note: reponse.note })
    } catch (err) {
      setEtat({ phase: 'erreur', message: messageDe(err) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void charger()
  }, [charger])

  const creer = async () => {
    if (envoi || fEmail.trim() === '') return
    setEnvoi(true)
    setFautes([])
    try {
      const reponse = await creerCompte(fEmail.trim().toLowerCase())
      setCreation({
        compte: reponse.compte,
        motDePasseInitial: reponse.mot_de_passe_initial,
        emailEnvoye: reponse.email_envoye,
        note: reponse.note,
      })
      setFEmail('')
      pousser('succes', `${t('cpt_cree')} ${reponse.compte.email}`)
      await charger()
    } catch (err) {
      setFautes(fautesDe(err))
    } finally {
      setEnvoi(false)
    }
  }

  const basculerEtat = async () => {
    if (!cible || envoi) return
    if (fMotif.trim().length < 3) {
      pousser('erreur', t('cpt_motif_note'))
      return
    }
    setEnvoi(true)
    setFautes([])
    try {
      const reponse = await changerEtatCompte(cible.email, !cible.actif, fMotif.trim())
      pousser('succes', reponse.note)
      setCible(null)
      setFMotif('')
      await charger()
    } catch (err) {
      setCible(null)
      setFautes(fautesDe(err))
    } finally {
      setEnvoi(false)
    }
  }

  const copier = async (texte: string) => {
    try {
      await navigator.clipboard.writeText(texte)
      pousser('succes', t('cpt_copie'))
    } catch {
      pousser('erreur', t('cpt_copie_echec'))
    }
  }

  return (
    <div className="animate-fade-in">
      <SectionHeader title={t('cpt_titre')} subtitle={t('cpt_sous_titre')} />
      <Banniere ton="info">{t('cpt_doctrine')}</Banniere>

      {/* ── Creation ── */}
      <Card className="mt-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1" style={{ minWidth: 240, maxWidth: 380 }}>
            <ChampLabel texte={t('cpt_email')} requis />
            <input
              className="input-base"
              type="email"
              value={fEmail}
              onChange={(e) => setFEmail(e.target.value)}
              placeholder="prenom.nom@exemple.com"
            />
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
              {t('cpt_email_note')}
            </p>
          </div>
          <button
            className="btn-primary text-xs"
            style={{ height: 34, opacity: envoi || !fEmail.includes('@') ? 0.6 : 1 }}
            disabled={envoi || !fEmail.includes('@')}
            onClick={() => void creer()}
          >
            <UserPlus size={13} />
            {envoi ? t('loading') : t('cpt_creer')}
          </button>
        </div>
        <FautesBloc fautes={fautes} />

        {creation && (
          <div className="mt-4">
            <Banniere ton={creation.emailEnvoye ? 'succes' : 'attention'}>
              <p className="font-semibold mb-1">
                {creation.compte.email} — {t('cpt_cree')}.{' '}
                {creation.emailEnvoye ? t('cpt_email_parti') : t('cpt_email_pas_parti')}
              </p>
              <p className="mb-2">{t('cpt_initial_unique')}</p>
              <span
                className="inline-flex items-center gap-2 font-mono text-sm rounded-lg px-3 py-1.5"
                style={{ background: 'rgba(0,0,0,0.08)' }}
              >
                {creation.motDePasseInitial}
                <button
                  onClick={() => void copier(creation.motDePasseInitial)}
                  title={t('cpt_copier')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 2 }}
                >
                  <Copy size={13} />
                </button>
              </span>
            </Banniere>
            <button className="btn-ghost text-xs mt-2" style={{ height: 28 }} onClick={() => setCreation(null)}>
              {t('close')}
            </button>
          </div>
        )}
      </Card>

      {/* ── La liste ── */}
      <div className="mt-4">
        {etat.phase === 'chargement' && <Skeleton height={200} />}
        {etat.phase === 'erreur' && (
          <>
            <Banniere ton="danger">{etat.message}</Banniere>
            <button className="btn-ghost text-xs mt-2" onClick={() => void charger()}>
              {t('retry')}
            </button>
          </>
        )}
        {etat.phase === 'pret' && (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('cpt_col_email')}</th>
                    <th>{t('cpt_col_etat')}</th>
                    <th>{t('cpt_col_mdp')}</th>
                    <th>{t('cpt_col_cree_par')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {etat.comptes.map((compte) => {
                    const moi = compte.email === session?.email
                    return (
                      <tr key={compte.email}>
                        <td className="font-mono">
                          {compte.email}
                          {moi && <span className="badge-primary ml-2">{t('cpt_moi')}</span>}
                        </td>
                        <td>
                          <span className={compte.actif ? 'badge-secondary' : 'badge-danger'}>
                            {compte.actif ? t('cpt_actif') : t('cpt_inactif')}
                          </span>
                        </td>
                        <td className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                          {compte.must_change_password ? t('cpt_mdp_initial') : t('cpt_mdp_durable')}
                        </td>
                        <td className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                          {compte.cree_par ?? t('cpt_bootstrap')}
                          {compte.cree_le && ` · ${new Date(compte.cree_le).toLocaleDateString()}`}
                        </td>
                        <td>
                          {!moi && (
                            <button
                              className="btn-ghost text-[11px]"
                              style={{ height: 26 }}
                              onClick={() => {
                                setCible(compte)
                                setFMotif('')
                              }}
                            >
                              {compte.actif ? <UserX size={12} /> : <UserCheck size={12} />}
                              {compte.actif ? t('cpt_desactiver') : t('cpt_reactiver')}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] px-4 py-2" style={{ color: 'var(--text-muted)' }}>
              {etat.note}
            </p>
          </Card>
        )}
        {etat.phase === 'pret' && (
          <button className="btn-ghost text-xs mt-2" style={{ height: 28 }} onClick={() => void charger()}>
            <RotateCcw size={12} />
            {t('dash_rafraichir')}
          </button>
        )}
      </div>

      <ConfirmDialog
        ouvert={cible !== null}
        titre={
          cible?.actif ? `${t('cpt_desactiver')} ${cible?.email} ?` : `${t('cpt_reactiver')} ${cible?.email} ?`
        }
        libelleConfirmer={t('confirm')}
        libelleAnnuler={t('cancel')}
        danger={cible?.actif === true}
        enCours={envoi}
        onConfirmer={() => void basculerEtat()}
        onAnnuler={() => setCible(null)}
      >
        <p className="mb-2">{cible?.actif ? t('cpt_desactiver_corps') : t('cpt_reactiver_corps')}</p>
        <ChampLabel texte={t('cpt_motif')} requis />
        <input
          className="input-base"
          value={fMotif}
          onChange={(e) => setFMotif(e.target.value)}
          maxLength={200}
        />
        {fMotif.trim().length < 3 && (
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {t('cpt_motif_note')}
          </p>
        )}
      </ConfirmDialog>
    </div>
  )
}
