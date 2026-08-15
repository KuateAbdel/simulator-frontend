// src/pages/EntitesCompany.tsx — US-D1, la Company a l'unite. PHASE 5.
//
// 3-4 champs saisis, ~40 composes par le Loader — et l'apercu MONTRE les ~40 :
// c'est le produit de l'ecran. La ville se CHOISIT dans le referentiel (fusion
// classeur + surcouche) : EF-02 tenu par construction, le 422 pedagogique du
// backend reste l'autorite. La confirmation execute la sequence S3-03 REELLE
// (Company -> cascade owner verifiee -> Admin User) et rend la fiche RELUE du
// serveur, jamais l'echo du POST.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Building2, Eye, RotateCcw } from 'lucide-react'
import { Card, SectionHeader } from '../components/ui'
import { Banniere, ConfirmDialog, Skeleton, Stepper, useToast } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import {
  apercuCompany,
  creerCompany,
  lireGeographie,
  type CompanyDemande,
  type VueGeographie,
} from '../lib/api'
import { useMessageDe } from './runs-commun'
import { ChampLabel, FautesBloc, FicheTable, fautesDe } from './entites-commun'

type TypeCompany = CompanyDemande['type_company']
type Pays = CompanyDemande['pays']

type Etape =
  | { phase: 'composer' }
  | {
      phase: 'apercu'
      fiche: Record<string, unknown>
      admin: string | null
      note: string
    }
  | {
      phase: 'cree'
      fiche: Record<string, unknown>
      admins: string[]
      cascade: boolean
      note: string
    }

const PAYS: Pays[] = ['CM', 'CI', 'BF', 'SN']

export function EntitesCompany() {
  const { t } = useApp()
  const { pousser } = useToast()
  const messageDe = useMessageDe()
  const [geo, setGeo] = useState<VueGeographie | null>(null)
  const [geoErreur, setGeoErreur] = useState<string | null>(null)
  const [etape, setEtape] = useState<Etape>({ phase: 'composer' })
  const [envoi, setEnvoi] = useState(false)
  const [confirmerOuvert, setConfirmerOuvert] = useState(false)
  const [fautes, setFautes] = useState<string[]>([])

  const [fType, setFType] = useState<TypeCompany>('IMF')
  const [fPays, setFPays] = useState<Pays>('CM')
  const [fVille, setFVille] = useState('')
  const [fNom, setFNom] = useState('')

  const chargerGeo = useCallback(async () => {
    setGeoErreur(null)
    try {
      setGeo(await lireGeographie())
    } catch (err) {
      setGeoErreur(messageDe(err))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void chargerGeo()
  }, [chargerGeo])

  // EF-02 par construction : la ville se choisit DANS le referentiel du pays.
  const villesDuPays = useMemo(() => {
    if (!geo) return []
    return geo.pays
      .filter((p) => p.pays === fPays)
      .flatMap((p) => p.regions.flatMap((r) => r.villes.map((v) => ({ ville: v.nom, region: r.nom }))))
      .sort((a, b) => a.ville.localeCompare(b.ville))
  }, [geo, fPays])

  const types: { type: TypeCompany; titre: string; detail: string }[] = [
    { type: 'IMF', titre: t('cmp_imf_titre'), detail: t('cmp_imf_detail') },
    { type: 'BANK', titre: t('cmp_bank_titre'), detail: t('cmp_bank_detail') },
    { type: 'MERCHANT', titre: t('cmp_merchant_titre'), detail: t('cmp_merchant_detail') },
    { type: 'FONDATION', titre: t('cmp_fondation_titre'), detail: t('cmp_fondation_detail') },
  ]

  const demande = (): CompanyDemande => ({
    type_company: fType,
    pays: fPays,
    ville: fVille,
    ...(fNom.trim() !== '' ? { nom: fNom.trim() } : {}),
  })

  const formulaireValide = fVille !== '' && (fNom.trim() === '' || fNom.trim().length >= 3)

  const voirApercu = async () => {
    if (envoi || !formulaireValide) return
    setEnvoi(true)
    setFautes([])
    try {
      const reponse = await apercuCompany(demande())
      setEtape({ phase: 'apercu', fiche: reponse.fiche, admin: reponse.admin_annonce, note: reponse.note })
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
      const reponse = await creerCompany(demande())
      setConfirmerOuvert(false)
      setEtape({
        phase: 'cree',
        fiche: reponse.fiche,
        admins: reponse.admins_crees,
        cascade: reponse.cascade_owner_verifiee,
        note: reponse.note,
      })
      pousser('succes', t('cmp_creee'))
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
    setFVille('')
    setFNom('')
  }

  const indexEtape = etape.phase === 'composer' ? 0 : etape.phase === 'apercu' ? 1 : 2

  return (
    <div className="animate-fade-in">
      <SectionHeader title={t('cmp_titre')} subtitle={t('cmp_sous_titre')} />
      <Stepper
        etapes={[t('cmp_etape_composer'), t('cmp_etape_apercu'), t('cmp_etape_creee')]}
        courante={indexEtape}
      />
      <Banniere ton="info">{t('cmp_doctrine')}</Banniere>

      {etape.phase === 'composer' && (
        <Card className="mt-4">
          <ChampLabel texte={t('cmp_type')} requis />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4" role="radiogroup" aria-label={t('cmp_type')}>
            {types.map((choix) => (
              <button
                key={choix.type}
                type="button"
                role="radio"
                aria-checked={fType === choix.type}
                className="text-left rounded-xl border p-3"
                style={{
                  borderColor: fType === choix.type ? 'var(--primary)' : 'var(--border)',
                  background: fType === choix.type ? 'var(--primary-light)' : 'transparent',
                  cursor: 'pointer',
                }}
                onClick={() => setFType(choix.type)}
              >
                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  {choix.titre}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  {choix.detail}
                </p>
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <ChampLabel texte={t('geo_pays_champ')} requis />
              <select
                className="input-base"
                value={fPays}
                onChange={(e) => {
                  setFPays(e.target.value as Pays)
                  setFVille('')
                }}
              >
                {PAYS.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <ChampLabel texte={t('cmp_ville')} requis />
              {geo === null && geoErreur === null ? (
                <Skeleton height={34} />
              ) : geoErreur !== null ? (
                <>
                  <Banniere ton="danger">{geoErreur}</Banniere>
                  <button className="btn-ghost text-xs mt-1" onClick={() => void chargerGeo()}>
                    {t('retry')}
                  </button>
                </>
              ) : (
                <>
                  <select className="input-base" value={fVille} onChange={(e) => setFVille(e.target.value)}>
                    <option value="">{t('geo_choisir')}</option>
                    {villesDuPays.map((v) => (
                      <option key={`${v.region}-${v.ville}`} value={v.ville}>
                        {v.ville} — {v.region}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    {t('cmp_ville_note')}
                  </p>
                </>
              )}
            </div>
            <div>
              <ChampLabel texte={t('cmp_nom')} />
              <input
                className="input-base"
                value={fNom}
                onChange={(e) => setFNom(e.target.value)}
                maxLength={80}
                placeholder={t('cmp_nom_placeholder')}
              />
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                {t('cmp_nom_note')}
              </p>
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
        </Card>
      )}

      {etape.phase === 'apercu' && (
        <Card className="mt-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Building2 size={14} style={{ color: 'var(--primary-dark)' }} />
            <span className="badge-primary">{fType}</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {etape.note}
            </span>
          </div>
          {etape.admin && (
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold">{t('cmp_admin_annonce')}</span>{' '}
              <span className="font-mono">{etape.admin}</span>
            </p>
          )}
          <FicheTable fiche={etape.fiche} titre={t('cmp_fiche_composee')} />
          <FautesBloc fautes={fautes} />
          <div className="flex justify-end gap-2 mt-4">
            <button className="btn-ghost text-xs" style={{ height: 32 }} onClick={() => setEtape({ phase: 'composer' })}>
              {t('back')}
            </button>
            <button className="btn-primary text-xs" style={{ height: 32 }} onClick={() => setConfirmerOuvert(true)}>
              <Building2 size={12} />
              {t('cmp_creer')}
            </button>
          </div>
        </Card>
      )}

      {etape.phase === 'cree' && (
        <Card className="mt-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="badge-secondary">{t('cmp_creee')}</span>
            <span
              className={etape.cascade ? 'badge-secondary' : 'badge-danger'}
              title="D-CMP-2"
            >
              {etape.cascade ? t('cmp_cascade_ok') : t('cmp_cascade_ko')}
            </span>
          </div>
          <Banniere ton="succes">{etape.note}</Banniere>
          {etape.admins.length > 0 && (
            <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold">{t('cmp_admins_crees')}</span>{' '}
              {etape.admins.map((email) => (
                <span key={email} className="font-mono badge-primary mr-1">
                  {email}
                </span>
              ))}
            </p>
          )}
          <div className="mt-3">
            <FicheTable fiche={etape.fiche} titre={t('cmp_fiche_serveur')} />
          </div>
          <div className="flex justify-end mt-4">
            <button className="btn-primary text-xs" style={{ height: 32 }} onClick={recommencer}>
              <RotateCcw size={12} />
              {t('cmp_creer_autre')}
            </button>
          </div>
        </Card>
      )}

      <ConfirmDialog
        ouvert={confirmerOuvert}
        titre={t('cmp_confirmer_titre')}
        libelleConfirmer={t('confirm')}
        libelleAnnuler={t('cancel')}
        danger
        enCours={envoi}
        onConfirmer={() => void confirmer()}
        onAnnuler={() => setConfirmerOuvert(false)}
      >
        {t('cmp_confirmer_corps')}
      </ConfirmDialog>
    </div>
  )
}
