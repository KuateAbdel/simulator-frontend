// src/pages/EntitesProduit.tsx — US-D2, le produit COLLECT a l'unite. PHASE 5.
//
// TROIS interfaces, une par policy_type — le formulaire CHANGE, il ne grise
// pas : duree_mois n'existe qu'en CASH_DAT (un depot a terme SANS terme n'est
// pas un depot a terme), measure n'existe qu'en PRODUCT (le mil se pese, le
// lait se mesure — un choix METIER, jamais un defaut). Le rite D-01 en deux
// temps : l'apercu montre le payload EXACT qui partirait (aucune ecriture),
// la confirmation re-valide puis pousse et RELIT la fiche du serveur.

import { useMemo, useState } from 'react'
import { Coins, Eye, PackagePlus, RotateCcw } from 'lucide-react'
import { Card, SectionHeader } from '../components/ui'
import { Banniere, ConfirmDialog, Stepper, useToast } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import {
  TAUX_USURE_MAX_ANNUEL_PCT,
  apercuProduit,
  creerProduit,
  type DiffRelecture,
  type ProduitDemande,
} from '../lib/api'
import {
  ChampLabel,
  DiffTable,
  ErreurInline,
  FautesBloc,
  FicheTable,
  VerdictRelecture,
  fautesDe,
} from './entites-commun'

type PolicyType = ProduitDemande['policy_type']

type Etape =
  | { phase: 'composer' }
  | { phase: 'apercu'; payload: Record<string, unknown>; marqueur: string; note: string }
  | {
      phase: 'cree'
      productId: string
      marqueur: string
      fiche: Record<string, unknown> | null
      /** Le payload ENVOYE — la moitie « chez nous » du diff de relecture. */
      payload: Record<string, unknown>
      /** Le verdict du BACKEND — l'autorite, l'UI ne fait que doubler. */
      diff: DiffRelecture | null
      note: string
    }

export function EntitesProduit() {
  const { t } = useApp()
  const { pousser } = useToast()
  const [etape, setEtape] = useState<Etape>({ phase: 'composer' })
  const [envoi, setEnvoi] = useState(false)
  const [confirmerOuvert, setConfirmerOuvert] = useState(false)
  const [fautes, setFautes] = useState<string[]>([])

  const [fNom, setFNom] = useState('')
  const [fCode, setFCode] = useState('')
  const [fPolicy, setFPolicy] = useState<PolicyType>('CASH')
  const [fCategorie, setFCategorie] = useState<ProduitDemande['categorie']>('INDIVIDUAL')
  const [fMin, setFMin] = useState('')
  const [fMax, setFMax] = useState('')
  const [fTaux, setFTaux] = useState('0')
  const [fDuree, setFDuree] = useState('')
  const [fMeasure, setFMeasure] = useState<'KILOGRAM' | 'LITER' | ''>('')
  const [fMeasurePrice, setFMeasurePrice] = useState('')

  // ── Les invariants du backend, DOUBLES a la frappe (l'autorite = le 422) ──
  const codeEtat = useMemo(() => {
    if (fCode === '') return null
    return /^[A-Z0-9_]{2,24}$/.test(fCode) ? null : t('prod_code_invalide')
  }, [fCode, t])

  const bornesEtat = useMemo(() => {
    if (fMin === '' || fMax === '') return null
    const minimum = Number(fMin)
    const maximum = Number(fMax)
    if (Number.isNaN(minimum) || Number.isNaN(maximum)) return null
    return minimum > 0 && minimum < maximum ? null : t('prod_bornes_invalides')
  }, [fMin, fMax, t])

  const tauxEtat = useMemo(() => {
    const taux = Number(fTaux)
    if (fTaux === '' || Number.isNaN(taux)) return null
    return taux >= 0 && taux <= TAUX_USURE_MAX_ANNUEL_PCT ? null : t('prod_taux_invalide')
  }, [fTaux, t])

  const formulaireValide =
    fNom.trim().length >= 3 &&
    codeEtat === null &&
    fCode !== '' &&
    fMin !== '' &&
    fMax !== '' &&
    bornesEtat === null &&
    tauxEtat === null &&
    (fPolicy !== 'CASH_DAT' || (fDuree !== '' && Number(fDuree) >= 1 && Number(fDuree) <= 120)) &&
    (fPolicy !== 'PRODUCT' || fMeasure !== '')

  const demande = (): ProduitDemande => ({
    nom: fNom.trim(),
    code: fCode.trim(),
    policy_type: fPolicy,
    categorie: fCategorie,
    montant_min: Number(fMin),
    montant_max: Number(fMax),
    taux: Number(fTaux || 0),
    ...(fPolicy === 'CASH_DAT' ? { duree_mois: Number(fDuree) } : {}),
    ...(fPolicy === 'PRODUCT' && fMeasure !== '' ? { measure: fMeasure } : {}),
    ...(fPolicy === 'PRODUCT' && fMeasurePrice !== ''
      ? { measure_price: Number(fMeasurePrice) }
      : {}),
  })

  const voirApercu = async () => {
    if (envoi || !formulaireValide) return
    setEnvoi(true)
    setFautes([])
    try {
      const reponse = await apercuProduit(demande())
      setEtape({
        phase: 'apercu',
        payload: reponse.payload,
        marqueur: reponse.marqueur,
        note: reponse.note,
      })
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
    const payloadEnvoye = etape.phase === 'apercu' ? etape.payload : {}
    try {
      const reponse = await creerProduit(demande())
      setConfirmerOuvert(false)
      setEtape({
        phase: 'cree',
        productId: reponse.product_id,
        marqueur: reponse.marqueur,
        fiche: reponse.fiche_relue,
        payload: payloadEnvoye,
        diff: reponse.diff_relecture,
        note: reponse.note,
      })
      pousser('succes', `${t('prod_cree')} — ${reponse.marqueur}`)
    } catch (err) {
      setConfirmerOuvert(false)
      setFautes(fautesDe(err))
    } finally {
      setEnvoi(false)
    }
  }

  const recommencer = () => {
    setEtape({ phase: 'composer' })
    setFautes([])
    setFNom('')
    setFCode('')
    setFMin('')
    setFMax('')
    setFTaux('0')
    setFDuree('')
    setFMeasure('')
    setFMeasurePrice('')
  }

  const indexEtape = etape.phase === 'composer' ? 0 : etape.phase === 'apercu' ? 1 : 2

  const policies: { type: PolicyType; titre: string; detail: string }[] = [
    { type: 'CASH', titre: t('prod_cash_titre'), detail: t('prod_cash_detail') },
    { type: 'CASH_DAT', titre: t('prod_dat_titre'), detail: t('prod_dat_detail') },
    { type: 'PRODUCT', titre: t('prod_product_titre'), detail: t('prod_product_detail') },
  ]

  return (
    <div className="animate-fade-in">
      <SectionHeader title={t('prod_titre')} subtitle={t('prod_sous_titre')} />
      <Stepper
        etapes={[t('prod_etape_composer'), t('prod_etape_apercu'), t('prod_etape_cree')]}
        courante={indexEtape}
      />
      <Banniere ton="info">{t('prod_doctrine')}</Banniere>

      {etape.phase === 'composer' && (
        <Card className="mt-4">
          {/* Les TROIS interfaces — le choix change le formulaire */}
          <ChampLabel texte={t('prod_policy_type')} requis />
          <div className="grid sm:grid-cols-3 gap-2 mb-4" role="radiogroup" aria-label={t('prod_policy_type')}>
            {policies.map((p) => (
              <button
                key={p.type}
                type="button"
                role="radio"
                aria-checked={fPolicy === p.type}
                className="text-left rounded-xl border p-3"
                style={{
                  borderColor: fPolicy === p.type ? 'var(--primary)' : 'var(--border)',
                  background: fPolicy === p.type ? 'var(--primary-light)' : 'transparent',
                  cursor: 'pointer',
                }}
                onClick={() => setFPolicy(p.type)}
              >
                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  {p.titre}
                </p>
                <p className="text-[10px] font-mono mb-1" style={{ color: 'var(--primary-dark)' }}>
                  {p.type}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  {p.detail}
                </p>
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <ChampLabel texte={t('prod_nom')} requis />
              <input
                className="input-base"
                value={fNom}
                onChange={(e) => setFNom(e.target.value)}
                placeholder="Tontine Digitale Quartier"
                maxLength={80}
              />
            </div>
            <div>
              <ChampLabel texte={t('prod_code')} requis />
              <input
                className="input-base font-mono"
                value={fCode}
                onChange={(e) => setFCode(e.target.value.toUpperCase())}
                placeholder="TONTINE_Q"
                maxLength={24}
              />
              <ErreurInline texte={codeEtat} />
              {fCode && codeEtat === null && (
                <p className="text-[10px] mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
                  {t('prod_marqueur_annonce')} DEMO_{fCode}
                </p>
              )}
            </div>
            <div>
              <ChampLabel texte={t('prod_categorie')} requis />
              <select
                className="input-base"
                value={fCategorie}
                onChange={(e) => setFCategorie(e.target.value as ProduitDemande['categorie'])}
              >
                <option value="INDIVIDUAL">{t('prod_cat_individual')}</option>
                <option value="CORPORATE">{t('prod_cat_corporate')}</option>
              </select>
            </div>
            <div>
              <ChampLabel texte={t('prod_montant_min')} requis />
              <input
                className="input-base font-mono"
                type="number"
                min={1}
                value={fMin}
                onChange={(e) => setFMin(e.target.value)}
              />
            </div>
            <div>
              <ChampLabel texte={t('prod_montant_max')} requis />
              <input
                className="input-base font-mono"
                type="number"
                min={1}
                value={fMax}
                onChange={(e) => setFMax(e.target.value)}
              />
              <ErreurInline texte={bornesEtat} />
            </div>
            <div>
              <ChampLabel texte={t('prod_taux')} />
              <input
                className="input-base font-mono"
                type="number"
                min={0}
                max={TAUX_USURE_MAX_ANNUEL_PCT}
                step="0.1"
                value={fTaux}
                onChange={(e) => setFTaux(e.target.value)}
              />
              <ErreurInline texte={tauxEtat} />
            </div>
            {fPolicy === 'CASH_DAT' && (
              <div>
                <ChampLabel texte={t('prod_duree')} requis />
                <input
                  className="input-base font-mono"
                  type="number"
                  min={1}
                  max={120}
                  value={fDuree}
                  onChange={(e) => setFDuree(e.target.value)}
                />
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  {t('prod_duree_note')}
                </p>
              </div>
            )}
            {fPolicy === 'PRODUCT' && (
              <>
                <div>
                  <ChampLabel texte={t('prod_measure')} requis />
                  <select
                    className="input-base"
                    value={fMeasure}
                    onChange={(e) => setFMeasure(e.target.value as 'KILOGRAM' | 'LITER' | '')}
                  >
                    <option value="">{t('geo_choisir')}</option>
                    <option value="KILOGRAM">{t('prod_measure_kg')}</option>
                    <option value="LITER">{t('prod_measure_l')}</option>
                  </select>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    {t('prod_measure_note')}
                  </p>
                </div>
                <div>
                  <ChampLabel texte={t('prod_measure_price')} />
                  <input
                    className="input-base font-mono"
                    type="number"
                    min={0}
                    step="0.01"
                    value={fMeasurePrice}
                    onChange={(e) => setFMeasurePrice(e.target.value)}
                  />
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
              onClick={() => void voirApercu()}
            >
              <Eye size={12} />
              {envoi ? t('loading') : t('prod_voir_apercu')}
            </button>
          </div>
        </Card>
      )}

      {etape.phase === 'apercu' && (
        <Card className="mt-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Coins size={14} style={{ color: 'var(--primary-dark)' }} />
            <span className="badge-primary font-mono">{etape.marqueur}</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {etape.note}
            </span>
          </div>
          <FicheTable fiche={etape.payload} titre={t('prod_payload_titre')} />
          <FautesBloc fautes={fautes} />
          <div className="flex justify-end gap-2 mt-4">
            <button className="btn-ghost text-xs" style={{ height: 32 }} onClick={() => setEtape({ phase: 'composer' })}>
              {t('back')}
            </button>
            <button
              className="btn-primary text-xs"
              style={{ height: 32 }}
              onClick={() => setConfirmerOuvert(true)}
            >
              <PackagePlus size={12} />
              {t('prod_creer')}
            </button>
          </div>
        </Card>
      )}

      {etape.phase === 'cree' && (
        <Card className="mt-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="badge-secondary font-mono">{etape.marqueur}</span>
            <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              product_id = {etape.productId}
            </span>
          </div>
          <Banniere ton="succes">{etape.note}</Banniere>
          {etape.fiche ? (
            <div className="mt-3">
              {Object.keys(etape.payload).length > 0 ? (
                <DiffTable
                  envoye={etape.payload}
                  relu={etape.fiche}
                  titre={t('diff_titre')}
                />
              ) : (
                <FicheTable fiche={etape.fiche} titre={t('prod_fiche_relue')} />
              )}
              <VerdictRelecture diff={etape.diff} />
            </div>
          ) : (
            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              {t('prod_fiche_absente')}
            </p>
          )}
          <div className="flex justify-end mt-4">
            <button className="btn-primary text-xs" style={{ height: 32 }} onClick={recommencer}>
              <RotateCcw size={12} />
              {t('prod_creer_autre')}
            </button>
          </div>
        </Card>
      )}

      <ConfirmDialog
        ouvert={confirmerOuvert}
        titre={t('prod_confirmer_titre')}
        libelleConfirmer={t('confirm')}
        libelleAnnuler={t('cancel')}
        enCours={envoi}
        onConfirmer={() => void confirmer()}
        onAnnuler={() => setConfirmerOuvert(false)}
      >
        {t('prod_confirmer_corps')}
      </ConfirmDialog>
    </div>
  )
}
