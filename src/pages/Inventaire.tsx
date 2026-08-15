// src/pages/Inventaire.tsx — la reconciliation ici↔la-bas. PHASE 6.
//
// « NOS donnees la-bas, avec NOS statuts » (vision Yaniv) : chaque entite de
// la plateforme est classee — a_nous (vert, la seule qu'on touche), etranger
// (gris, JAMAIS touche), disparu_la_bas (ambre, signale jamais recree),
// marque_mais_inconnu (violet, constate). Groupes : ADOPTION A-13 (multi-
// selection, une issue PAR identifiant) et DELETE individuel d'un groupe a
// nous (la seule action reversible). Produits/companies : lecture seule —
// les services n'ont AUCUN DELETE, et l'ecran le dit.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { HeartHandshake, RotateCcw, Trash2 } from 'lucide-react'
import { Card, SectionHeader, TabBar } from '../components/ui'
import { Banniere, ConfirmDialog, Skeleton, useToast } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import {
  adopterGroupes,
  lireInventaire,
  supprimerGroupe,
  type LigneInventaire,
  type StatutInventaire,
  type VueInventaire,
} from '../lib/api'
import { useMessageDe } from './runs-commun'
import { FautesBloc, fautesDe } from './entites-commun'

type Domaine = 'groupes' | 'produits' | 'companies'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'pret'; vue: VueInventaire }
  | { phase: 'erreur'; message: string }

/** 4 statuts = 4 couleurs — la legende visuelle de TOUTE la reconciliation. */
const STYLE_STATUT: Record<StatutInventaire, { fond: string; texte: string }> = {
  a_nous: { fond: 'var(--secondary-light)', texte: 'var(--secondary-dark)' },
  etranger: { fond: 'var(--border)', texte: 'var(--text-secondary)' },
  disparu_la_bas: { fond: '#fef9c3', texte: '#92400e' },
  marque_mais_inconnu: { fond: 'var(--primary-light)', texte: 'var(--primary-dark)' },
}
const ORDRE_STATUTS: StatutInventaire[] = [
  'a_nous',
  'disparu_la_bas',
  'marque_mais_inconnu',
  'etranger',
]

export function Inventaire() {
  const { t } = useApp()
  const { pousser } = useToast()
  const messageDe = useMessageDe()
  const [domaine, setDomaine] = useState<Domaine>('groupes')
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [filtre, setFiltre] = useState('')
  const [fautes, setFautes] = useState<string[]>([])
  const [envoi, setEnvoi] = useState(false)
  // Adoption A-13 : la selection parmi les ETRANGERS (groupes seulement).
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [adoptionOuverte, setAdoptionOuverte] = useState(false)
  // DELETE individuel : la cible confirmee en dialogue danger.
  const [cible, setCible] = useState<LigneInventaire | null>(null)

  const charger = useCallback(
    async (d: Domaine) => {
      setEtat({ phase: 'chargement' })
      setSelection(new Set())
      setFautes([])
      try {
        setEtat({ phase: 'pret', vue: await lireInventaire(d) })
      } catch (err) {
        setEtat({ phase: 'erreur', message: messageDe(err) })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useEffect(() => {
    void charger(domaine)
  }, [charger, domaine])

  const lignes = useMemo(() => {
    if (etat.phase !== 'pret') return []
    const bas = filtre.trim().toLowerCase()
    return ORDRE_STATUTS.flatMap((statut) => etat.vue[statut] ?? []).filter(
      (ligne) =>
        !bas ||
        ligne.nom.toLowerCase().includes(bas) ||
        (ligne.short_name ?? '').toLowerCase().includes(bas) ||
        ligne.id.toLowerCase().includes(bas),
    )
  }, [etat, filtre])

  const basculerSelection = (id: string) =>
    setSelection((avant) => {
      const apres = new Set(avant)
      if (apres.has(id)) apres.delete(id)
      else apres.add(id)
      return apres
    })

  const adopter = async () => {
    if (envoi || selection.size === 0) return
    setEnvoi(true)
    setFautes([])
    try {
      const reponse = await adopterGroupes([...selection])
      setAdoptionOuverte(false)
      pousser(
        'succes',
        `${t('inv_adoptes')} ${reponse.comptes.adoptes} · ${t('inv_deja')} ${reponse.comptes.deja_au_registre} · ${t('inv_introuvables')} ${reponse.comptes.introuvables}`,
      )
      await charger('groupes')
    } catch (err) {
      setAdoptionOuverte(false)
      setFautes(fautesDe(err))
    } finally {
      setEnvoi(false)
    }
  }

  const supprimer = async () => {
    if (!cible || envoi) return
    setEnvoi(true)
    setFautes([])
    try {
      const reponse = await supprimerGroupe(cible.id)
      setCible(null)
      pousser('succes', `${t('inv_supprime')} ${reponse.supprime} — ${t('inv_relecture')}`)
      await charger('groupes')
    } catch (err) {
      setCible(null)
      setFautes(fautesDe(err))
    } finally {
      setEnvoi(false)
    }
  }

  const comptes =
    etat.phase === 'pret'
      ? ORDRE_STATUTS.map((statut) => ({ statut, n: (etat.vue[statut] ?? []).length }))
      : []

  return (
    <div className="animate-fade-in">
      <SectionHeader title={t('inv_titre')} subtitle={t('inv_sous_titre')} />
      <TabBar
        tabs={[
          { id: 'groupes', label: t('inv_onglet_groupes') },
          { id: 'produits', label: t('inv_onglet_produits') },
          { id: 'companies', label: t('inv_onglet_companies') },
        ]}
        active={domaine}
        onChange={(id) => setDomaine(id as Domaine)}
      />

      {etat.phase === 'chargement' && (
        <div className="mt-4">
          <Skeleton height={240} />
        </div>
      )}
      {etat.phase === 'erreur' && (
        <div className="mt-4">
          <Banniere ton="danger">{etat.message}</Banniere>
          <button className="btn-ghost text-xs mt-2" onClick={() => void charger(domaine)}>
            {t('retry')}
          </button>
        </div>
      )}

      {etat.phase === 'pret' && (
        <>
          {/* Les comptes par statut — la legende chiffree */}
          <div className="flex flex-wrap gap-2 mt-4 mb-3">
            {comptes.map(({ statut, n }) => (
              <span
                key={statut}
                className="text-[10px] font-semibold rounded-full px-2.5 py-1 font-mono"
                style={{ background: STYLE_STATUT[statut].fond, color: STYLE_STATUT[statut].texte }}
              >
                {t(`inv_${statut}` as Parameters<typeof t>[0])} · {n}
              </span>
            ))}
          </div>

          {etat.vue.note && <Banniere ton="info">{etat.vue.note}</Banniere>}

          <div className="flex flex-wrap items-center gap-2 mt-3 mb-2">
            <input
              className="input-base"
              style={{ maxWidth: 320 }}
              placeholder={t('inv_recherche')}
              value={filtre}
              onChange={(e) => setFiltre(e.target.value)}
            />
            {domaine === 'groupes' && (
              <button
                className="btn-primary text-xs"
                style={{ height: 30, opacity: selection.size === 0 ? 0.6 : 1 }}
                disabled={selection.size === 0}
                onClick={() => setAdoptionOuverte(true)}
              >
                <HeartHandshake size={12} />
                {t('inv_adopter')} ({selection.size})
              </button>
            )}
            <button className="btn-ghost text-xs" style={{ height: 30 }} onClick={() => void charger(domaine)}>
              <RotateCcw size={12} />
              {t('dash_rafraichir')}
            </button>
          </div>

          <FautesBloc fautes={fautes} />

          <Card style={{ padding: 0, overflow: 'hidden' }} className="mt-2">
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {domaine === 'groupes' && <th style={{ width: 30 }} aria-label={t('inv_adopter')} />}
                    <th>{t('inv_col_nom')}</th>
                    {domaine !== 'groupes' && <th>short_name</th>}
                    <th>{t('inv_col_statut')}</th>
                    <th>{t('inv_col_id')}</th>
                    {domaine === 'groupes' && <th />}
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((ligne) => (
                    <tr key={`${ligne.statut}-${ligne.id}`}>
                      {domaine === 'groupes' && (
                        <td>
                          {ligne.statut === 'etranger' && (
                            <input
                              type="checkbox"
                              checked={selection.has(ligne.id)}
                              onChange={() => basculerSelection(ligne.id)}
                              aria-label={`${t('inv_adopter')} ${ligne.nom}`}
                            />
                          )}
                        </td>
                      )}
                      <td className="font-semibold text-xs">{ligne.nom || '—'}</td>
                      {domaine !== 'groupes' && (
                        <td className="font-mono text-[10px]">{ligne.short_name || '—'}</td>
                      )}
                      <td>
                        <span
                          className="text-[9px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap"
                          style={{
                            background: STYLE_STATUT[ligne.statut].fond,
                            color: STYLE_STATUT[ligne.statut].texte,
                          }}
                        >
                          {t(`inv_${ligne.statut}` as Parameters<typeof t>[0])}
                        </span>
                      </td>
                      <td className="font-mono text-[9px]" style={{ color: 'var(--text-muted)' }}>
                        {ligne.id}
                      </td>
                      {domaine === 'groupes' && (
                        <td>
                          {ligne.statut === 'a_nous' && (
                            <button
                              className="btn-ghost text-[11px]"
                              style={{ height: 24, color: '#b91c1c' }}
                              onClick={() => setCible(ligne)}
                            >
                              <Trash2 size={11} />
                              {t('delete')}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {lignes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                        {t('empty_no_data')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Adoption A-13 — explicite, jamais automatique */}
      <ConfirmDialog
        ouvert={adoptionOuverte}
        titre={t('inv_adopter_titre')}
        libelleConfirmer={t('confirm')}
        libelleAnnuler={t('cancel')}
        enCours={envoi}
        onConfirmer={() => void adopter()}
        onAnnuler={() => setAdoptionOuverte(false)}
      >
        {t('inv_adopter_corps')} ({selection.size})
      </ConfirmDialog>

      {/* DELETE individuel — danger, relecture prouvee */}
      <ConfirmDialog
        ouvert={cible !== null}
        titre={`${t('delete')} « ${cible?.nom} » ?`}
        libelleConfirmer={t('delete')}
        libelleAnnuler={t('cancel')}
        danger
        enCours={envoi}
        onConfirmer={() => void supprimer()}
        onAnnuler={() => setCible(null)}
      >
        {t('inv_supprimer_corps')}
      </ConfirmDialog>
    </div>
  )
}
