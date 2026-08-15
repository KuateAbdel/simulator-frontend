// src/pages/EntitesGroupe.tsx — Lot H, le groupe a l'unite. PHASE 5.
//
// Le SEUL module reversible — et l'ecran le dit. Les permissions viennent de
// la liste VIVANTE de user-service (GET /admin/referentiels/permissions),
// jamais d'une copie en dur : un nom inconnu serait un 422 nomme avant tout
// POST. Le GET-avant-POST du backend a TROIS issues (A NOUS / homonyme
// ETRANGER / creation) — chaque 409 s'affiche tel quel, c'est la pedagogie.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RotateCcw, ShieldCheck, ShieldPlus } from 'lucide-react'
import { Card, SectionHeader } from '../components/ui'
import { Banniere, ConfirmDialog, Skeleton, useToast } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import { creerGroupe, lirePermissions, type GroupeDemande } from '../lib/api'
import { useMessageDe } from './runs-commun'
import { ChampLabel, FautesBloc, fautesDe } from './entites-commun'

type Tag = GroupeDemande['tag']

type EtatPermissions =
  | { phase: 'chargement' }
  | { phase: 'pret'; permissions: string[]; note: string }
  | { phase: 'erreur'; message: string }

type Resultat = {
  groupe: { id: string; nom: string; tag: string; permissions: number }
  note: string
}

export function EntitesGroupe() {
  const { t } = useApp()
  const { pousser } = useToast()
  const messageDe = useMessageDe()
  const [permissions, setPermissions] = useState<EtatPermissions>({ phase: 'chargement' })
  const [envoi, setEnvoi] = useState(false)
  const [confirmerOuvert, setConfirmerOuvert] = useState(false)
  const [fautes, setFautes] = useState<string[]>([])
  const [resultat, setResultat] = useState<Resultat | null>(null)

  const [fNom, setFNom] = useState('')
  const [fDescription, setFDescription] = useState('')
  const [fTag, setFTag] = useState<Tag>('STAFF')
  const [fCompanyId, setFCompanyId] = useState('')
  const [fRecherche, setFRecherche] = useState('')
  const [fFamille, setFFamille] = useState<string | null>(null)
  const [fCocheesSeules, setFCocheesSeules] = useState(false)
  const [choisies, setChoisies] = useState<Set<string>>(new Set())

  const charger = useCallback(async () => {
    setPermissions({ phase: 'chargement' })
    try {
      const reponse = await lirePermissions()
      setPermissions({ phase: 'pret', permissions: reponse.permissions, note: reponse.note })
    } catch (err) {
      setPermissions({ phase: 'erreur', message: messageDe(err) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void charger()
  }, [charger])

  // Les FAMILLES se derivent de la liste vivante (premier segment du nom :
  // ACCOUNT, CLIENT, COMPANY…) — jamais codees en dur : si user-service
  // ajoute un domaine demain, le chip apparait tout seul.
  const familles = useMemo(() => {
    if (permissions.phase !== 'pret') return []
    const comptes = new Map<string, number>()
    for (const p of permissions.permissions) {
      const famille = p.split('_')[0]
      comptes.set(famille, (comptes.get(famille) ?? 0) + 1)
    }
    return [...comptes.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [permissions])

  // Recherche (texte libre) et filtres (famille, cochees) se COMPOSENT.
  const visibles = useMemo(() => {
    if (permissions.phase !== 'pret') return []
    const bas = fRecherche.trim().toLowerCase()
    return permissions.permissions.filter(
      (p) =>
        (!bas || p.toLowerCase().includes(bas)) &&
        (fFamille === null || p.split('_')[0] === fFamille) &&
        (!fCocheesSeules || choisies.has(p)),
    )
  }, [permissions, fRecherche, fFamille, fCocheesSeules, choisies])

  const cocherVisibles = () =>
    setChoisies((avant) => new Set([...avant, ...visibles]))
  const decocherVisibles = () =>
    setChoisies((avant) => {
      const apres = new Set(avant)
      for (const p of visibles) apres.delete(p)
      return apres
    })

  const basculer = (permission: string) =>
    setChoisies((avant) => {
      const apres = new Set(avant)
      if (apres.has(permission)) apres.delete(permission)
      else apres.add(permission)
      return apres
    })

  const formulaireValide = fNom.trim().length >= 2 && fDescription.trim().length >= 3

  const tags: { tag: Tag; detail: string }[] = [
    { tag: 'STAFF', detail: t('grp_tag_staff') },
    { tag: 'COMPANY', detail: t('grp_tag_company') },
    { tag: 'CUSTOMER', detail: t('grp_tag_customer') },
  ]

  const confirmer = async () => {
    if (envoi) return
    setEnvoi(true)
    setFautes([])
    try {
      const reponse = await creerGroupe({
        nom: fNom.trim(),
        description: fDescription.trim(),
        tag: fTag,
        permissions: [...choisies],
        company_id: fCompanyId.trim(),
      })
      setConfirmerOuvert(false)
      setResultat({ groupe: reponse.groupe, note: reponse.note })
      pousser('succes', `${t('grp_cree')} — ${reponse.groupe.nom}`)
    } catch (err) {
      setConfirmerOuvert(false)
      setFautes(fautesDe(err))
    } finally {
      setEnvoi(false)
    }
  }

  const recommencer = () => {
    setResultat(null)
    setFautes([])
    setFNom('')
    setFDescription('')
    setFCompanyId('')
    setChoisies(new Set())
  }

  return (
    <div className="animate-fade-in">
      <SectionHeader title={t('grp_titre')} subtitle={t('grp_sous_titre')} />
      <Banniere ton="info">{t('grp_doctrine')}</Banniere>

      {resultat === null ? (
        <Card className="mt-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <ChampLabel texte={t('grp_nom')} requis />
              <input
                className="input-base"
                value={fNom}
                onChange={(e) => setFNom(e.target.value)}
                maxLength={60}
              />
            </div>
            <div className="sm:col-span-2">
              <ChampLabel texte={t('grp_description')} requis />
              <input
                className="input-base"
                value={fDescription}
                onChange={(e) => setFDescription(e.target.value)}
                maxLength={200}
                placeholder={t('grp_description_note')}
              />
            </div>
            <div>
              <ChampLabel texte={t('grp_tag')} requis />
              <select className="input-base" value={fTag} onChange={(e) => setFTag(e.target.value as Tag)}>
                {tags.map((choix) => (
                  <option key={choix.tag} value={choix.tag}>
                    {choix.tag} — {choix.detail}
                  </option>
                ))}
              </select>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                {t('grp_tag_note')}
              </p>
            </div>
            <div>
              <ChampLabel texte={t('grp_company_id')} />
              <input
                className="input-base font-mono"
                value={fCompanyId}
                onChange={(e) => setFCompanyId(e.target.value)}
                maxLength={60}
              />
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                {t('grp_company_note')}
              </p>
            </div>
          </div>

          {/* La liste VIVANTE — jamais une copie en dur */}
          <div className="mt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
              <ChampLabel texte={t('grp_permissions')} />
              {permissions.phase === 'pret' && (
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  {choisies.size} / {permissions.permissions.length} · {permissions.note}
                </span>
              )}
            </div>
            {permissions.phase === 'chargement' && <Skeleton height={140} />}
            {permissions.phase === 'erreur' && (
              <>
                <Banniere ton="danger">{permissions.message}</Banniere>
                <button className="btn-ghost text-xs mt-2" onClick={() => void charger()}>
                  {t('retry')}
                </button>
              </>
            )}
            {permissions.phase === 'pret' && (
              <>
                {/* FILTRES structurels : les familles derivees de la liste */}
                <div className="flex flex-wrap gap-1 mb-2" role="group" aria-label={t('grp_familles')}>
                  <button
                    type="button"
                    className="text-[10px] font-semibold rounded-full px-2 py-1"
                    style={{
                      border: 'none',
                      cursor: 'pointer',
                      background: fFamille === null ? 'var(--primary)' : 'var(--border)',
                      color: fFamille === null ? '#fff' : 'var(--text-secondary)',
                    }}
                    onClick={() => setFFamille(null)}
                  >
                    {t('grp_toutes_familles')}
                  </button>
                  {familles.map(([famille, compte]) => (
                    <button
                      key={famille}
                      type="button"
                      className="text-[10px] font-semibold rounded-full px-2 py-1 font-mono"
                      style={{
                        border: 'none',
                        cursor: 'pointer',
                        background: fFamille === famille ? 'var(--primary)' : 'var(--border)',
                        color: fFamille === famille ? '#fff' : 'var(--text-secondary)',
                      }}
                      onClick={() => setFFamille(fFamille === famille ? null : famille)}
                    >
                      {famille} · {compte}
                    </button>
                  ))}
                </div>
                {/* RECHERCHE texte libre + bascule + actions groupees */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <input
                    className="input-base"
                    style={{ maxWidth: 280 }}
                    placeholder={t('grp_rechercher')}
                    value={fRecherche}
                    onChange={(e) => setFRecherche(e.target.value)}
                  />
                  <label className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={fCocheesSeules}
                      onChange={(e) => setFCocheesSeules(e.target.checked)}
                    />
                    {t('grp_cochees_seules')}
                  </label>
                  <button type="button" className="btn-ghost text-[11px]" style={{ height: 26 }} onClick={cocherVisibles}>
                    {t('grp_cocher_visibles')} ({visibles.length})
                  </button>
                  <button type="button" className="btn-ghost text-[11px]" style={{ height: 26 }} onClick={decocherVisibles}>
                    {t('grp_decocher_visibles')}
                  </button>
                </div>
                <div
                  className="rounded-xl border overflow-auto p-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-1"
                  style={{ borderColor: 'var(--border)', maxHeight: 260 }}
                >
                  {visibles.map((permission) => (
                    <label
                      key={permission}
                      className="flex items-center gap-2 text-[11px] font-mono rounded-lg px-2 py-1"
                      style={{
                        background: choisies.has(permission) ? 'var(--primary-light)' : 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={choisies.has(permission)}
                        onChange={() => basculer(permission)}
                      />
                      <span className="truncate" title={permission}>
                        {permission}
                      </span>
                    </label>
                  ))}
                  {visibles.length === 0 && (
                    <p className="text-xs p-2" style={{ color: 'var(--text-muted)' }}>
                      {t('empty_no_data')}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <FautesBloc fautes={fautes} />

          <div className="flex justify-end mt-4">
            <button
              className="btn-primary text-xs"
              style={{ height: 32, opacity: envoi || !formulaireValide ? 0.6 : 1 }}
              disabled={envoi || !formulaireValide}
              onClick={() => setConfirmerOuvert(true)}
            >
              <ShieldPlus size={12} />
              {t('grp_creer')}
            </button>
          </div>
        </Card>
      ) : (
        <Card className="mt-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <ShieldCheck size={14} style={{ color: 'var(--secondary-dark)' }} />
            <span className="badge-secondary">{t('grp_a_nous')}</span>
            <span className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
              {resultat.groupe.nom}
            </span>
            <span className="badge-primary font-mono">{resultat.groupe.tag}</span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
              id = {resultat.groupe.id} · {resultat.groupe.permissions} {t('grp_permissions_compte')}
            </span>
          </div>
          <Banniere ton="succes">{resultat.note}</Banniere>
          <div className="flex justify-end mt-4">
            <button className="btn-primary text-xs" style={{ height: 32 }} onClick={recommencer}>
              <RotateCcw size={12} />
              {t('grp_creer_autre')}
            </button>
          </div>
        </Card>
      )}

      <ConfirmDialog
        ouvert={confirmerOuvert}
        titre={t('grp_confirmer_titre')}
        libelleConfirmer={t('confirm')}
        libelleAnnuler={t('cancel')}
        enCours={envoi}
        onConfirmer={() => void confirmer()}
        onAnnuler={() => setConfirmerOuvert(false)}
      >
        {t('grp_confirmer_corps')}
      </ConfirmDialog>
    </div>
  )
}
