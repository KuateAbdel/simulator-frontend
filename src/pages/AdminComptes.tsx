// src/pages/AdminComptes.tsx — gestion des UTILISATEURS du Loader (RBAC).
//
// « Super-Admin » est un ROLE : chaque personne a SON compte (email reel —
// c'est la que part le code « mot de passe oublie »), son mot de passe
// change librement sans toucher les autres, son cycle premiere-connexion.
// Un compte se DESACTIVE (motif trace), jamais ne se supprime : le journal
// reste attribuable. Le mot de passe initial d'un compte cree s'affiche UNE
// SEULE fois — l'ecran le dit et propose la copie.
//
// CONCEPTION (product UX) — deux onglets, comme les consoles admin :
//   · « Comptes »  : l'operationnel (creer avec role, liste, changer role,
//                    activer/desactiver) ;
//   · « Roles & permissions » : la reference (qui peut faire quoi) — pour
//                    choisir un role en connaissance de cause.
// Ecran reserve au Super-Admin (la nav le cache aux autres ; l'API 403 sinon).

import { useCallback, useEffect, useState } from 'react'
import { Copy, RotateCcw, ShieldCheck, UserCheck, UserCog, UserPlus, UserX } from 'lucide-react'
import { Card, SectionHeader, TabBar } from '../components/ui'
import { Banniere, ConfirmDialog, Skeleton, useToast } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import { usePagination } from '../hooks/usePagination'
import { Pager } from '../components/Pager'
import {
  changerEtatCompte,
  changerRoleCompte,
  creerCompte,
  listerComptes,
  type CompteAdmin,
} from '../lib/api'
import type { RoleLoader } from '../types'
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

const ROLES: RoleLoader[] = ['viewer', 'admin', 'super_admin']
const CLE_ROLE: Record<RoleLoader, 'role_viewer' | 'role_admin' | 'role_super_admin'> = {
  viewer: 'role_viewer',
  admin: 'role_admin',
  super_admin: 'role_super_admin',
}

/** Le badge de role — la couleur encode le privilege (gris < violet < ambre). */
function BadgeRole({ role, label }: { role: RoleLoader; label: string }) {
  const teinte: Record<RoleLoader, { background: string; color: string }> = {
    viewer: { background: 'rgba(120,124,140,0.16)', color: 'var(--text-secondary)' },
    admin: { background: 'rgba(198,140,255,0.20)', color: 'var(--primary-dark)' },
    super_admin: { background: 'rgba(245,158,11,0.20)', color: '#b45309' },
  }
  return (
    <span
      className="text-[11px] font-semibold rounded-md px-2 py-0.5 whitespace-nowrap"
      style={teinte[role]}
    >
      {label}
    </span>
  )
}

export function AdminComptes() {
  const { t, session } = useApp()
  const { pousser } = useToast()
  const messageDe = useMessageDe()
  const [onglet, setOnglet] = useState('comptes')
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [fEmail, setFEmail] = useState('')
  const [fRole, setFRole] = useState<RoleLoader>('viewer')
  const [envoi, setEnvoi] = useState(false)
  const [fautes, setFautes] = useState<string[]>([])
  const [creation, setCreation] = useState<Creation | null>(null)
  // Desactivation : la cible + le motif, confirmes en dialogue.
  const [cible, setCible] = useState<CompteAdmin | null>(null)
  const [fMotif, setFMotif] = useState('')
  // Changement de role : la cible + le role choisi, confirmes en dialogue.
  const [cibleRole, setCibleRole] = useState<CompteAdmin | null>(null)
  const [fNouveauRole, setFNouveauRole] = useState<RoleLoader>('viewer')

  const libelleRole = useCallback((r: RoleLoader) => t(CLE_ROLE[r]), [t])

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

  const comptesListe = etat.phase === 'pret' ? etat.comptes : []
  const pgComptes = usePagination(comptesListe, 10)

  const creer = async () => {
    if (envoi || fEmail.trim() === '') return
    setEnvoi(true)
    setFautes([])
    try {
      const reponse = await creerCompte(fEmail.trim().toLowerCase(), fRole)
      setCreation({
        compte: reponse.compte,
        motDePasseInitial: reponse.mot_de_passe_initial,
        emailEnvoye: reponse.email_envoye,
        note: reponse.note,
      })
      setFEmail('')
      setFRole('viewer')
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

  const appliquerRole = async () => {
    if (!cibleRole || envoi) return
    if (fNouveauRole === cibleRole.role) {
      // Rien a changer — on ferme sans appeler l'API ni crier.
      setCibleRole(null)
      return
    }
    setEnvoi(true)
    setFautes([])
    try {
      const reponse = await changerRoleCompte(cibleRole.email, fNouveauRole)
      pousser('succes', reponse.note)
      setCibleRole(null)
      await charger()
    } catch (err) {
      setCibleRole(null)
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

  // ── La matrice de reference (onglet Roles & permissions) ──
  const matrice: { cle: 'cpt_perm_lecture' | 'cpt_perm_operer' | 'cpt_perm_comptes' | 'cpt_perm_purge'; par: Record<RoleLoader, boolean> }[] = [
    { cle: 'cpt_perm_lecture', par: { viewer: true, admin: true, super_admin: true } },
    { cle: 'cpt_perm_operer', par: { viewer: false, admin: true, super_admin: true } },
    { cle: 'cpt_perm_comptes', par: { viewer: false, admin: false, super_admin: true } },
    { cle: 'cpt_perm_purge', par: { viewer: false, admin: false, super_admin: true } },
  ]

  return (
    <div className="animate-fade-in">
      <SectionHeader title={t('cpt_titre')} subtitle={t('cpt_sous_titre')} />
      <Banniere ton="info">{t('cpt_doctrine')}</Banniere>

      <div className="mt-4">
        <TabBar
          tabs={[
            { id: 'comptes', label: t('cpt_onglet_comptes') },
            { id: 'roles', label: t('cpt_onglet_roles') },
          ]}
          active={onglet}
          onChange={setOnglet}
        />
      </div>

      {onglet === 'roles' && (
        <Card>
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
            {t('cpt_perm_intro')}
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('cpt_perm_cap')}</th>
                  {ROLES.map((r) => (
                    <th key={r} style={{ textAlign: 'center' }}>
                      <BadgeRole role={r} label={libelleRole(r)} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrice.map((ligne) => (
                  <tr key={ligne.cle}>
                    <td>{t(ligne.cle)}</td>
                    {ROLES.map((r) => (
                      <td key={r} style={{ textAlign: 'center' }}>
                        {ligne.par[r] ? (
                          <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>✓</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {onglet === 'comptes' && (
        <>
          {/* ── Creation ── */}
          <Card>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1" style={{ minWidth: 220, maxWidth: 340 }}>
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
              <div style={{ minWidth: 150 }}>
                <ChampLabel texte={t('cpt_role')} requis />
                <select
                  className="input-base"
                  value={fRole}
                  onChange={(e) => setFRole(e.target.value as RoleLoader)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {libelleRole(r)}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  {t('cpt_role_note')}
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
                    {creation.compte.email}{' '}
                    <BadgeRole role={creation.compte.role} label={libelleRole(creation.compte.role)} /> —{' '}
                    {t('cpt_cree')}.{' '}
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
                        <th>{t('cpt_col_role')}</th>
                        <th>{t('cpt_col_etat')}</th>
                        <th>{t('cpt_col_mdp')}</th>
                        <th>{t('cpt_col_derniere_connexion')}</th>
                        <th>{t('cpt_col_cree_par')}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {pgComptes.pageItems.map((compte) => {
                        const moi = compte.email === session?.email
                        return (
                          <tr key={compte.email}>
                            <td className="font-mono">
                              {compte.email}
                              {moi && <span className="badge-primary ml-2">{t('cpt_moi')}</span>}
                            </td>
                            <td>
                              <BadgeRole role={compte.role} label={libelleRole(compte.role)} />
                            </td>
                            <td>
                              <span className={compte.actif ? 'badge-secondary' : 'badge-danger'}>
                                {compte.actif ? t('cpt_actif') : t('cpt_inactif')}
                              </span>
                            </td>
                            <td className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                              {compte.must_change_password ? t('cpt_mdp_initial') : t('cpt_mdp_durable')}
                            </td>
                            <td className="text-[10px]" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                              {compte.derniere_connexion
                                ? new Date(compte.derniere_connexion).toLocaleString(undefined, {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })
                                : t('cpt_jamais_connecte')}
                            </td>
                            <td className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                              {compte.cree_par ?? t('cpt_bootstrap')}
                              {compte.cree_le && ` · ${new Date(compte.cree_le).toLocaleDateString()}`}
                            </td>
                            <td>
                              {/* Auto-protection : on ne touche NI son role NI son etat
                                  a soi-meme (pas d'auto-lock-out). */}
                              {!moi && (
                                <div className="flex gap-1">
                                  <button
                                    className="btn-ghost text-[11px]"
                                    style={{ height: 26 }}
                                    onClick={() => {
                                      setCibleRole(compte)
                                      setFNouveauRole(compte.role)
                                    }}
                                    title={t('cpt_changer_role')}
                                  >
                                    <UserCog size={12} />
                                    {t('cpt_changer_role')}
                                  </button>
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
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <Pager
                  page={pgComptes.page}
                  nbPages={pgComptes.nbPages}
                  size={pgComptes.size}
                  total={pgComptes.total}
                  from={pgComptes.from}
                  to={pgComptes.to}
                  onPage={pgComptes.setPage}
                  onSize={pgComptes.setSize}
                />
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
        </>
      )}

      {/* Dialogue — activer / desactiver */}
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

      {/* Dialogue — changer le role */}
      <ConfirmDialog
        ouvert={cibleRole !== null}
        titre={`${t('cpt_changer_role')} — ${cibleRole?.email}`}
        libelleConfirmer={t('confirm')}
        libelleAnnuler={t('cancel')}
        enCours={envoi}
        onConfirmer={() => void appliquerRole()}
        onAnnuler={() => setCibleRole(null)}
      >
        <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <ShieldCheck size={14} style={{ color: 'var(--primary)' }} />
          {t('cpt_role_dialog_corps')}
        </div>
        <ChampLabel texte={t('cpt_role')} requis />
        <select
          className="input-base"
          value={fNouveauRole}
          onChange={(e) => setFNouveauRole(e.target.value as RoleLoader)}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {libelleRole(r)}
            </option>
          ))}
        </select>
      </ConfirmDialog>
    </div>
  )
}
