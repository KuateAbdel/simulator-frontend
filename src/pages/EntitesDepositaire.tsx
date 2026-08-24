// src/pages/EntitesDepositaire.tsx — US-D3, le depositaire a l'unite (16/08).
//
// NOTRE conception : un depositaire n'existe jamais « en l'air » — il naît
// d'un QUARTIER (CR-02 : un quartier = UN kiosque) et d'une company A NOUS.
// L'ecran ne demande QUE ces deux choix ; le Loader compose le nom
// (Kiosque <Quartier>, sans prefixe depuis le 20/08), DERIVE la devise du pays, et VERIFIE la
// coherence company<->quartier (pas de kiosque a Douala pour une company de
// Dakar — le 422 INCOHERENCE du backend s'affiche nomme).

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, RotateCcw, Store } from 'lucide-react'
import { Card, SectionHeader } from '../components/ui'
import { Banniere, ConfirmDialog, Skeleton, Stepper, useToast } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import {
  apercuDepositaire,
  creerDepositaire,
  lireGeographie,
  lireInventaire,
  type CompositionDepositaire,
  type LigneInventaire,
  type DiffRelecture,
  type VueGeographie,
} from '../lib/api'
import { useMessageDe } from './runs-commun'
import { ChampLabel, DiffTable, FautesBloc, FicheTable, VerdictRelecture, fautesDe } from './entites-commun'

type Etape =
  | { phase: 'composer' }
  | { phase: 'apercu'; composition: CompositionDepositaire; note: string }
  | {
      phase: 'cree'
      depositaryId: string
      fiche: Record<string, unknown> | null
      diff: DiffRelecture | null
      composition: CompositionDepositaire
      note: string
    }

type Matiere = {
  geo: VueGeographie
  companies: LigneInventaire[]
}

export function EntitesDepositaire() {
  const { t, setCurrentPage } = useApp()
  const { pousser } = useToast()
  const messageDe = useMessageDe()
  const [matiere, setMatiere] = useState<Matiere | null>(null)
  const [matiereErreur, setMatiereErreur] = useState<string | null>(null)
  const [etape, setEtape] = useState<Etape>({ phase: 'composer' })
  const [envoi, setEnvoi] = useState(false)
  const [confirmerOuvert, setConfirmerOuvert] = useState(false)
  const [fautes, setFautes] = useState<string[]>([])

  // La cascade : chaque niveau REINITIALISE ses enfants. Sans cela, choisir
  // le Cameroun puis le Senegal laisserait « Yaounde » selectionne — un etat
  // incoherent que le backend refuserait en 422 apres coup.
  const [fPays, setFPaysBrut] = useState('')
  const [fRegion, setFRegionBrut] = useState('')
  const [fVille, setFVilleBrut] = useState('')
  const [fQuartier, setFQuartier] = useState('')
  const [fCompany, setFCompany] = useState('')

  const setFPays = (v: string) => {
    setFPaysBrut(v)
    setFRegionBrut('')
    setFVilleBrut('')
    setFQuartier('')
    setFCompany('') // la company depend du pays : elle repart aussi
  }
  const setFRegion = (v: string) => {
    setFRegionBrut(v)
    setFVilleBrut('')
    setFQuartier('')
  }
  const setFVille = (v: string) => {
    setFVilleBrut(v)
    setFQuartier('')
  }

  const charger = useCallback(async () => {
    setMatiereErreur(null)
    try {
      const [geo, inventaire] = await Promise.all([
        lireGeographie(),
        lireInventaire('companies'),
      ])
      setMatiere({ geo, companies: inventaire.a_nous })
    } catch (err) {
      setMatiereErreur(messageDe(err))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void charger()
  }, [charger])

  // ================= LA CASCADE (V-05, 24/08) =================
  //
  // AVANT : UNE liste plate de plusieurs centaines de quartiers, libellee
  // « Cameroun — Yaounde — Bastos (residential) ». On y cherchait a l'oeil.
  //
  // MAINTENANT : pays -> region -> ville -> quartier, chaque niveau ne
  // proposant que ce qui appartient au precedent. Deux regles la rendent
  // COHERENTE, et sans elles une cascade ment autant qu'une liste plate :
  //
  //   1. ON N'OFFRE JAMAIS UNE IMPASSE. Une region dont aucune ville ne porte
  //      de quartier n'apparait pas : la choisir menerait a une liste vide,
  //      et l'utilisateur croirait a une panne.
  //   2. CHANGER UN PARENT REINITIALISE SES ENFANTS. Sans cela, choisir le
  //      Cameroun puis le Senegal laisserait « Yaounde » selectionne — un
  //      etat incoherent que le backend refuserait en 422 apres coup.
  //
  // La DEVISE n'est PAS dans la cascade : elle est DERIVEE du pays du
  // quartier (`D-DEP-6`). Le serveur accepte n'importe quelle chaine comme
  // `currency` (`FRA-201`, « ZZZ_INVENTE » passe) ; la laisser saisir ferait
  // entrer une devise inventee dans un service sans DELETE.
  const paysDisponibles = useMemo(() => {
    if (!matiere) return []
    return matiere.geo.pays
      .map((pays) => ({
        code: pays.pays,
        regions: pays.regions.filter((r) =>
          r.villes.some((v) => (v.quartiers_detail ?? []).length > 0),
        ),
      }))
      .filter((p) => p.regions.length > 0)
  }, [matiere])

  const regionsDuPays = useMemo(
    () => paysDisponibles.find((p) => p.code === fPays)?.regions ?? [],
    [paysDisponibles, fPays],
  )

  const villesDeLaRegion = useMemo(
    () =>
      (regionsDuPays.find((r) => r.id === fRegion)?.villes ?? []).filter(
        (v) => (v.quartiers_detail ?? []).length > 0,
      ),
    [regionsDuPays, fRegion],
  )

  const quartiersDeLaVille = useMemo(
    () => villesDeLaRegion.find((v) => v.id === fVille)?.quartiers_detail ?? [],
    [villesDeLaRegion, fVille],
  )

  // LES COMPANIES DU PAYS CHOISI, et elles seules (demande Yaniv, 24/08).
  // Le backend refuse deja « un kiosque a Douala pour une company de Dakar »
  // (422 INCOHERENCE) — mais l'ecran le proposait quand meme, et faisait donc
  // travailler l'utilisateur pour rien. Le pays vient de `lenders_registry`
  // (EF-12), jamais d'une deduction sur le nom. Une company SANS pays connu
  // reste offerte : la cacher ferait disparaitre une company reelle sur la
  // foi d'une information qu'on n'a pas.
  const companiesDuPays = useMemo(() => {
    if (!matiere) return []
    return matiere.companies.filter((c) => {
      // ACTIVES SEULEMENT (demande Yaniv, 24/08). `actif === false` est un
      // fait mesure : la company est desactivee la-bas, lui rattacher un
      // kiosque n'a pas de sens. `actif === null/undefined` veut dire que la
      // fiche plateforme ne porte PAS l'information — on ne cache pas une
      // company reelle sur la foi d'une donnee qu'on n'a pas.
      if (c.actif === false) return false
      // DU PAYS CHOISI. Une company sans pays connu (absente de
      // `lenders_registry`) reste offerte, meme raison.
      if (fPays && c.pays && c.pays !== fPays) return false
      return true
    })
  }, [matiere, fPays])

  const demande = () => ({ quartier_id: fQuartier, company_id: fCompany })
  const formulaireValide = fQuartier !== '' && fCompany !== ''

  const voirApercu = async () => {
    if (envoi || !formulaireValide) return
    setEnvoi(true)
    setFautes([])
    try {
      const reponse = await apercuDepositaire(demande())
      setEtape({ phase: 'apercu', composition: reponse.composition, note: reponse.note })
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
      const reponse = await creerDepositaire(demande())
      setConfirmerOuvert(false)
      setEtape({
        phase: 'cree',
        depositaryId: reponse.depositary_id,
        fiche: reponse.fiche_relue,
        diff: reponse.diff_relecture,
        composition: reponse.composition,
        note: reponse.note,
      })
      pousser('succes', `${t('dep_cree')} — ${reponse.marqueur}`)
    } catch (err) {
      setConfirmerOuvert(false)
      setFautes(fautesDe(err))
    } finally {
      setEnvoi(false)
    }
  }

  const indexEtape = etape.phase === 'composer' ? 0 : etape.phase === 'apercu' ? 1 : 2

  return (
    <div className="animate-fade-in">
      <SectionHeader title={t('dep_titre')} subtitle={t('dep_sous_titre')} />
      <Stepper
        etapes={[t('dep_etape_composer'), t('cmp_etape_apercu'), t('prod_etape_cree')]}
        courante={indexEtape}
      />
      <Banniere ton="info">{t('dep_doctrine')}</Banniere>

      {matiereErreur && (
        <div className="mt-3">
          <Banniere ton="danger">{matiereErreur}</Banniere>
          <button className="btn-ghost text-xs mt-2" onClick={() => void charger()}>
            {t('retry')}
          </button>
        </div>
      )}

      {etape.phase === 'composer' && (
        <Card className="mt-4">
          {matiere === null && matiereErreur === null ? (
            <Skeleton height={120} />
          ) : matiere !== null ? (
            <>
              {/* LA CASCADE — chaque liste ne montre que ce qui appartient
                  au niveau du dessus, et un niveau non encore choisi reste
                  DESACTIVE plutot que vide : un select vide se lit comme une
                  panne, un select desactive se lit comme « pas encore ton
                  tour ». */}
              <div className="grid sm:grid-cols-4 gap-3 mb-3">
                <div>
                  <ChampLabel texte={t('dep_pays')} requis />
                  <select className="input-base" value={fPays} onChange={(e) => setFPays(e.target.value)}>
                    <option value="">{t('geo_choisir')}</option>
                    {paysDisponibles.map((pays) => (
                      <option key={pays.code} value={pays.code}>
                        {pays.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <ChampLabel texte={t('dep_region')} requis />
                  <select
                    className="input-base"
                    value={fRegion}
                    disabled={!fPays}
                    onChange={(e) => setFRegion(e.target.value)}
                  >
                    <option value="">{fPays ? t('geo_choisir') : t('dep_choisir_pays_dabord')}</option>
                    {regionsDuPays.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <ChampLabel texte={t('dep_ville')} requis />
                  <select
                    className="input-base"
                    value={fVille}
                    disabled={!fRegion}
                    onChange={(e) => setFVille(e.target.value)}
                  >
                    <option value="">{fRegion ? t('geo_choisir') : t('dep_choisir_region_dabord')}</option>
                    {villesDeLaRegion.map((ville) => (
                      <option key={ville.id} value={ville.id}>
                        {ville.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <ChampLabel texte={t('dep_quartier')} requis />
                  <select
                    className="input-base"
                    value={fQuartier}
                    disabled={!fVille}
                    onChange={(e) => setFQuartier(e.target.value)}
                  >
                    <option value="">{fVille ? t('geo_choisir') : t('dep_choisir_ville_dabord')}</option>
                    {quartiersDeLaVille.map((quartier) => (
                      <option key={quartier.id} value={quartier.id}>
                        {quartier.nom} ({quartier.zone_type})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    {t('dep_quartier_note')}
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <ChampLabel texte={t('dep_company')} requis />
                  {matiere.companies.length === 0 ? (
                    <Banniere ton="attention">
                      {t('dep_aucune_company')}{' '}
                      <button
                        className="underline font-semibold"
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                        onClick={() => setCurrentPage('entites-company')}
                      >
                        {t('dep_aller_company')}
                      </button>
                    </Banniere>
                  ) : (
                    <>
                      <select className="input-base" value={fCompany} onChange={(e) => setFCompany(e.target.value)}>
                        <option value="">{t('geo_choisir')}</option>
                        {companiesDuPays.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.nom}
                            {company.pays ? ` (${company.pays})` : ''}
                            {company.actif === null || company.actif === undefined
                              ? ` — ${t('dep_etat_inconnu')}`
                              : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                        {t('dep_company_note')}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <FautesBloc fautes={fautes} />
              <div className="flex justify-end mt-4">
                <button
                  className="btn-primary text-xs"
                  style={{ height: 32, opacity: envoi || !formulaireValide ? 0.6 : 1 }}
                  disabled={envoi || !formulaireValide}
                  onClick={() => void voirApercu()}
                >
                  <Eye size={12} />
                  {envoi ? t('loading') : t('cmp_voir_apercu')}
                </button>
              </div>
            </>
          ) : null}
        </Card>
      )}

      {etape.phase === 'apercu' && (
        <Card className="mt-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Store size={14} style={{ color: 'var(--primary-dark)' }} />
            <span className="badge-primary font-mono">{etape.composition.marqueur}</span>
            <span className="badge-secondary font-mono">{etape.composition.devise}</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {etape.note}
            </span>
          </div>
          <FicheTable
            fiche={etape.composition as unknown as Record<string, unknown>}
            titre={t('dep_composition_titre')}
          />
          <FautesBloc fautes={fautes} />
          <div className="flex justify-end gap-2 mt-4">
            <button className="btn-ghost text-xs" style={{ height: 32 }} onClick={() => setEtape({ phase: 'composer' })}>
              {t('back')}
            </button>
            <button className="btn-primary text-xs" style={{ height: 32 }} onClick={() => setConfirmerOuvert(true)}>
              <Store size={12} />
              {t('dep_creer')}
            </button>
          </div>
        </Card>
      )}

      {etape.phase === 'cree' && (
        <Card className="mt-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="badge-secondary">{t('inv_a_nous')}</span>
            <span className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
              {etape.composition.marqueur}
            </span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
              depositary_id = {etape.depositaryId}
            </span>
          </div>
          <Banniere ton="succes">{etape.note}</Banniere>
          {etape.fiche && (
            <div className="mt-3">
              <DiffTable
                envoye={{
                  name: etape.composition.marqueur,
                  currency: etape.composition.devise,
                  company_id: fCompany,
                }}
                relu={etape.fiche}
                titre={t('diff_titre')}
              />
              <VerdictRelecture diff={etape.diff} />
            </div>
          )}
          <div className="flex justify-end mt-4">
            <button
              className="btn-primary text-xs"
              style={{ height: 32 }}
              onClick={() => {
                setEtape({ phase: 'composer' })
                setFQuartier('')
                setFautes([])
              }}
            >
              <RotateCcw size={12} />
              {t('dep_creer_autre')}
            </button>
          </div>
        </Card>
      )}

      <ConfirmDialog
        ouvert={confirmerOuvert}
        titre={t('dep_confirmer_titre')}
        libelleConfirmer={t('confirm')}
        libelleAnnuler={t('cancel')}
        enCours={envoi}
        onConfirmer={() => void confirmer()}
        onAnnuler={() => setConfirmerOuvert(false)}
      >
        {t('dep_confirmer_corps')}
      </ConfirmDialog>
    </div>
  )
}
