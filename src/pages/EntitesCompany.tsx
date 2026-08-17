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
  lireCatalogueStatique,
  lireGeographie,
  type CatalogueStatique,
  type CompanyDemande,
  type DiffRelecture,
  type OwnerOverride,
  type VueGeographie,
} from '../lib/api'
import type { TranslationKey } from '../i18n'
import { useMessageDe } from './runs-commun'
import { ChampLabel, FautesBloc, FicheTable, VerdictRelecture, fautesDe } from './entites-commun'

type TypeCompany = CompanyDemande['type_company']
type Pays = CompanyDemande['pays']

type Etape =
  | { phase: 'composer' }
  | {
      phase: 'apercu'
      fiche: Record<string, unknown>
      admin: string | null
      licenceAnnonce: string | null
      note: string
    }
  | {
      phase: 'cree'
      fiche: Record<string, unknown>
      ficheRelue: Record<string, unknown> | null
      diff: DiffRelecture | null
      admins: string[]
      cascade: boolean
      licenceCreee: boolean
      licenceDetail: string
      note: string
    }

const PAYS: Pays[] = ['CM', 'CI', 'BF', 'SN']

/** Sélecteur multi-valeurs alimenté par le référentiel : une LISTE DÉROULANTE
 * pour AJOUTER, des puces pour voir/retirer. Composant module-level (jamais
 * défini dans un render → aucune perte de focus). Chaque valeur choisie est
 * une vraie entrée du catalogue, pas une chaîne libre. */
function MultiPicker({
  label,
  options,
  valeurs,
  onChange,
  placeholder,
}: {
  label: string
  options: string[]
  valeurs: string[]
  onChange: (v: string[]) => void
  placeholder: string
}) {
  const disponibles = options.filter((o) => !valeurs.includes(o))
  return (
    <div>
      <ChampLabel texte={label} requis />
      <select
        className="input-base"
        value=""
        onChange={(e) => {
          if (e.target.value) onChange([...valeurs, e.target.value])
        }}
      >
        <option value="">{placeholder}</option>
        {disponibles.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {valeurs.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {valeurs.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5"
              style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)' }}
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(valeurs.filter((x) => x !== v))}
                aria-label={`retirer ${v}`}
                style={{ lineHeight: 1, fontWeight: 700 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Lit un champ chaîne de l'owner composé (pour l'afficher en placeholder). */
function champCompose(compose: Record<string, unknown>, cle: string): string {
  const v = compose[cle]
  return typeof v === 'string' ? v : ''
}

/** ÉDITEUR DU DIRIGEANT (US-D1 editable) — chaque champ affiche la valeur
 * COMPOSÉE en placeholder ; taper la SURCHARGE, laisser vide la GARDE. Composant
 * module-level (jamais redéfini au render → aucune perte de focus). `onBlur`
 * recompose l'aperçu : la modification AGIT, et un invariant violé revient en
 * message lisible (422). Les invariants sont tenus au serveur — ici, seulement
 * des indices (type email, MAJUSCULES id_number, dates). */
function OwnerEditor({
  compose,
  valeurs,
  onChange,
  onBlur,
  t,
}: {
  compose: Record<string, unknown>
  valeurs: OwnerOverride
  onChange: (o: OwnerOverride) => void
  onBlur: () => void
  t: (cle: TranslationKey) => string
}) {
  const maj = (cle: keyof OwnerOverride, v: string) => onChange({ ...valeurs, [cle]: v })
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
      <div>
        <ChampLabel texte={t('cmp_owner_prenom')} />
        <input
          className="input-base"
          value={valeurs.first_name ?? ''}
          placeholder={champCompose(compose, 'first_name')}
          maxLength={60}
          onChange={(e) => maj('first_name', e.target.value)}
          onBlur={onBlur}
        />
      </div>
      <div>
        <ChampLabel texte={t('cmp_owner_nom')} />
        <input
          className="input-base"
          value={valeurs.last_name ?? ''}
          placeholder={champCompose(compose, 'last_name')}
          maxLength={60}
          onChange={(e) => maj('last_name', e.target.value)}
          onBlur={onBlur}
        />
      </div>
      <div>
        <ChampLabel texte={t('cmp_owner_email')} />
        <input
          className="input-base"
          type="email"
          value={valeurs.email ?? ''}
          placeholder={champCompose(compose, 'email')}
          onChange={(e) => maj('email', e.target.value)}
          onBlur={onBlur}
        />
      </div>
      <div>
        <ChampLabel texte={t('cmp_owner_phone')} />
        <input
          className="input-base"
          value={valeurs.phone ?? ''}
          placeholder={champCompose(compose, 'phone')}
          maxLength={20}
          onChange={(e) => maj('phone', e.target.value)}
          onBlur={onBlur}
        />
      </div>
      <div>
        <ChampLabel texte={t('cmp_owner_genre')} />
        <select
          className="input-base"
          value={valeurs.gender ?? ''}
          onChange={(e) => {
            onChange({ ...valeurs, gender: (e.target.value || undefined) as OwnerOverride['gender'] })
          }}
          onBlur={onBlur}
        >
          <option value="">{champCompose(compose, 'gender') || '—'}</option>
          <option value="MALE">MALE</option>
          <option value="FEMALE">FEMALE</option>
        </select>
      </div>
      <div>
        <ChampLabel texte={t('cmp_owner_naissance')} />
        <input
          className="input-base"
          type="date"
          value={valeurs.date_of_birth ?? ''}
          onChange={(e) => maj('date_of_birth', e.target.value)}
          onBlur={onBlur}
        />
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {champCompose(compose, 'date_of_birth')}
        </p>
      </div>
      <div>
        <ChampLabel texte={t('cmp_owner_id')} />
        <input
          className="input-base font-mono"
          value={valeurs.id_number ?? ''}
          placeholder={champCompose(compose, 'id_number')}
          maxLength={20}
          style={{ textTransform: 'uppercase' }}
          onChange={(e) => maj('id_number', e.target.value.toUpperCase())}
          onBlur={onBlur}
        />
      </div>
      <div>
        <ChampLabel texte={t('cmp_owner_id_expire')} />
        <input
          className="input-base"
          type="date"
          value={valeurs.id_expire_on ?? ''}
          onChange={(e) => maj('id_expire_on', e.target.value)}
          onBlur={onBlur}
        />
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {champCompose(compose, 'id_expire_on')}
        </p>
      </div>
    </div>
  )
}

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
  // « Regenerer une variante » : meme demande+variante = meme fiche (CR-03) ;
  // variante suivante = AUTRE tirage coherent — on n'edite pas le genere.
  const [fVariante, setFVariante] = useState(0)
  // US-D1 EDITABLE (17/08) — industries/secteurs CHOISIS dans le referentiel
  // reel (catalogue-statique), pas derives en silence du type. Vides =
  // derivation par type ; l'apercu les pre-remplit pour que l'operateur voie
  // le choix par defaut et l'ajuste. « Recomposer » renvoie SON choix.
  const [catalogue, setCatalogue] = useState<CatalogueStatique | null>(null)
  const [fIndustries, setFIndustries] = useState<string[]>([])
  const [fSectors, setFSectors] = useState<string[]>([])
  // US-D1 EDITABLE — le DIRIGEANT. On n'écrase QUE ce que l'opérateur tape :
  // un champ vide garde la valeur composée (placeholder). Ainsi la régénération
  // de variante (🎲) reste intacte, et l'invariant est tenu au serveur.
  const [fOwner, setFOwner] = useState<OwnerOverride>({})

  useEffect(() => {
    void lireCatalogueStatique()
      .then(setCatalogue)
      .catch(() => setCatalogue(null))
  }, [])

  const optIndustries = useMemo(() => {
    if (!catalogue) return []
    return [...new Set([...catalogue.industries, ...(catalogue.industries_surcouche ?? [])])].sort()
  }, [catalogue])
  // `catalogue.secteurs` est indexe PAR SECTEUR -> liste de ses industries
  // (et non l'inverse). Un secteur est donc PROPOSE si au moins une de ses
  // industries figure dans celles choisies (cascade industries -> secteurs).
  // Sans industrie choisie : tous les secteurs. La surcouche est deja fusionnee
  // dans `secteurs` cote backend, inutile de la rajouter.
  const optSectors = useMemo(() => {
    if (!catalogue) return []
    const noms = Object.keys(catalogue.secteurs)
    if (fIndustries.length === 0) return [...noms].sort()
    return noms
      .filter((sec) => (catalogue.secteurs[sec] ?? []).some((ind) => fIndustries.includes(ind)))
      .sort()
  }, [catalogue, fIndustries])

  // Quand les industries changent, on retire les secteurs devenus incoherents
  // (leur industrie n'est plus cochee) — la selection reste toujours valide.
  useEffect(() => {
    setFSectors((cur) => {
      const filtres = cur.filter((s) => optSectors.includes(s))
      return filtres.length === cur.length ? cur : filtres
    })
  }, [optSectors])

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

  // N'envoie QUE les champs owner réellement saisis (vide = garder le composé).
  // id_number normalisé en MAJUSCULES côté client aussi (FRA-228) — le serveur
  // reste l'autorité, mais on ne lui envoie pas de bruit.
  const ownerNettoye = (): OwnerOverride | undefined => {
    const o: OwnerOverride = {}
    if (fOwner.first_name?.trim()) o.first_name = fOwner.first_name.trim()
    if (fOwner.last_name?.trim()) o.last_name = fOwner.last_name.trim()
    if (fOwner.email?.trim()) o.email = fOwner.email.trim()
    if (fOwner.gender) o.gender = fOwner.gender
    if (fOwner.date_of_birth) o.date_of_birth = fOwner.date_of_birth
    if (fOwner.id_number?.trim()) o.id_number = fOwner.id_number.trim().toUpperCase()
    if (fOwner.id_expire_on) o.id_expire_on = fOwner.id_expire_on
    if (fOwner.phone?.trim()) o.phone = fOwner.phone.trim()
    return Object.keys(o).length ? o : undefined
  }

  const demande = (variante = fVariante): CompanyDemande => {
    const owner = ownerNettoye()
    return {
      type_company: fType,
      pays: fPays,
      ville: fVille,
      ...(fNom.trim() !== '' ? { nom: fNom.trim() } : {}),
      ...(variante > 0 ? { variante } : {}),
      // Le choix de l'operateur PRIME ; vide = derivation par type (run intact).
      ...(fIndustries.length > 0 ? { industries: fIndustries } : {}),
      ...(fSectors.length > 0 ? { sectors: fSectors } : {}),
      ...(owner ? { owner } : {}),
    }
  }

  const formulaireValide = fVille !== '' && (fNom.trim() === '' || fNom.trim().length >= 3)

  const voirApercu = async (variante = fVariante) => {
    if (envoi || !formulaireValide) return
    setEnvoi(true)
    setFautes([])
    try {
      const reponse = await apercuCompany(demande(variante))
      // Pre-remplissage : l'operateur VOIT le choix derive (industries/secteurs
      // que le Loader a composes) et peut l'ajuster. On ne re-seed pas s'il a
      // deja choisi — son choix persiste d'une recomposition a l'autre.
      const fi = Array.isArray(reponse.fiche.industries) ? (reponse.fiche.industries as string[]) : []
      const fs = Array.isArray(reponse.fiche.sectors) ? (reponse.fiche.sectors as string[]) : []
      setFIndustries((cur) => (cur.length ? cur : fi))
      setFSectors((cur) => (cur.length ? cur : fs))
      setEtape({
        phase: 'apercu',
        fiche: reponse.fiche,
        admin: reponse.admin_annonce,
        licenceAnnonce: reponse.licence_annonce ?? null,
        note: reponse.note,
      })
    } catch (err) {
      setFautes(fautesDe(err))
    } finally {
      setEnvoi(false)
    }
  }

  // APERÇU DYNAMIQUE (17/08) — le choix des industries/secteurs doit AFFECTER
  // vraiment la fiche composée, pas rester figé. Dès qu'on est en aperçu et que
  // les listes divergent de ce que la fiche montre, on RECOMPOSE (débounce) :
  // le Loader recompose name/sector/… de façon cohérente. Pas de boucle — après
  // recomposition la fiche == le choix, l'effet ne se redéclenche plus.
  useEffect(() => {
    if (etape.phase !== 'apercu' || envoi) return
    const ficheInd = Array.isArray(etape.fiche.industries) ? (etape.fiche.industries as string[]) : []
    const ficheSec = Array.isArray(etape.fiche.sectors) ? (etape.fiche.sectors as string[]) : []
    const memeInd = ficheInd.length === fIndustries.length && fIndustries.every((x) => ficheInd.includes(x))
    const memeSec = ficheSec.length === fSectors.length && fSectors.every((x) => ficheSec.includes(x))
    if (memeInd && memeSec) return
    const minuteur = setTimeout(() => void voirApercu(), 450)
    return () => clearTimeout(minuteur)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fIndustries, fSectors, etape, envoi])

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
        ficheRelue: reponse.fiche_relue,
        diff: reponse.diff_relecture,
        admins: reponse.admins_crees,
        cascade: reponse.cascade_owner_verifiee,
        licenceCreee: reponse.licence_creee,
        licenceDetail: reponse.licence_detail,
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
    setFIndustries([])
    setFSectors([])
    setFOwner({})
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

          {/* US-D1 EDITABLE — industries/secteurs DÈS LE PREMIER ÉCRAN : on
              choisit une industrie et les secteurs cascadent aussitôt (liste
              déroulante du référentiel réel). Vides = dérivation par type au
              backend (run intact). Même état qu'en aperçu → choix persistant. */}
          {catalogue && (
            <div
              className="rounded-xl border p-3 mt-3 grid sm:grid-cols-2 gap-3"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <MultiPicker
                label={t('cmp_industries')}
                options={optIndustries}
                valeurs={fIndustries}
                onChange={setFIndustries}
                placeholder={t('geo_choisir')}
              />
              <MultiPicker
                label={t('cmp_sectors')}
                options={optSectors}
                valeurs={fSectors}
                onChange={setFSectors}
                placeholder={t('geo_choisir')}
              />
              <p className="sm:col-span-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {t('cmp_indsec_note')}
              </p>
            </div>
          )}

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
          {/* MODIFIER EN PLACE (16/08, demande Yaniv) : les 4 champs SAISIS
              restent editables ici — « Recomposer » rejoue l'apercu. Les
              ~40 champs COMPOSES, eux, ne s'editent pas : c'est le Loader
              qui compose (fidelite au run), et l'ecran le dit. */}
          <div
            className="rounded-xl border p-3 mb-3 grid sm:grid-cols-2 lg:grid-cols-5 gap-2 items-end"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <div>
              <ChampLabel texte={t('cmp_type')} />
              <select className="input-base" value={fType} onChange={(e) => setFType(e.target.value as TypeCompany)}>
                {types.map((choix) => (
                  <option key={choix.type} value={choix.type}>
                    {choix.titre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <ChampLabel texte={t('geo_pays_champ')} />
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
              <ChampLabel texte={t('cmp_ville')} />
              <select className="input-base" value={fVille} onChange={(e) => setFVille(e.target.value)}>
                <option value="">{t('geo_choisir')}</option>
                {villesDuPays.map((v) => (
                  <option key={`${v.region}-${v.ville}`} value={v.ville}>
                    {v.ville}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <ChampLabel texte={t('cmp_nom')} />
              <input className="input-base" value={fNom} onChange={(e) => setFNom(e.target.value)} maxLength={80} />
            </div>
            <button
              className="btn-ghost text-xs"
              style={{ height: 34, opacity: envoi || !formulaireValide ? 0.6 : 1 }}
              disabled={envoi || !formulaireValide}
              onClick={() => void voirApercu()}
            >
              <RotateCcw size={12} />
              {envoi ? t('loading') : t('cmp_recomposer')}
            </button>
            <button
              className="btn-ghost text-xs"
              style={{ height: 34, opacity: envoi ? 0.6 : 1 }}
              disabled={envoi}
              title={t('cmp_variante_bulle')}
              onClick={() => {
                const suivante = (fVariante + 1) % 100
                setFVariante(suivante)
                void voirApercu(suivante)
              }}
            >
              🎲 {t('cmp_variante')}
              {fVariante > 0 && <span className="font-mono ml-1">#{fVariante}</span>}
            </button>
          </div>
          {/* US-D1 EDITABLE : industries/secteurs en LISTES DÉROULANTES du
              référentiel réel — plus de dérivation figée cachée. Pré-remplis
              par la composition, ajustables ; « Recomposer » applique le choix. */}
          {catalogue && (
            <div
              className="rounded-xl border p-3 mb-3 grid sm:grid-cols-2 gap-3"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <MultiPicker
                label={t('cmp_industries')}
                options={optIndustries}
                valeurs={fIndustries}
                onChange={setFIndustries}
                placeholder={t('geo_choisir')}
              />
              <MultiPicker
                label={t('cmp_sectors')}
                options={optSectors}
                valeurs={fSectors}
                onChange={setFSectors}
                placeholder={t('geo_choisir')}
              />
              <p className="sm:col-span-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {t('cmp_indsec_note')}
              </p>
            </div>
          )}
          {/* US-D1 EDITABLE — le DIRIGEANT modifiable SOUS invariants. Placeholder
              = valeur composée ; taper surcharge, vide garde. Sortir d'un champ
              recompose l'aperçu : la modif AGIT, un invariant violé revient lisible. */}
          {typeof etape.fiche.owner === 'object' && etape.fiche.owner !== null && (
            <div
              className="rounded-xl border p-3 mb-3"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <p className="text-[11px] font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('cmp_owner_titre')}
              </p>
              <OwnerEditor
                compose={etape.fiche.owner as Record<string, unknown>}
                valeurs={fOwner}
                onChange={setFOwner}
                onBlur={() => void voirApercu()}
                t={t}
              />
              <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
                {t('cmp_owner_note')}
              </p>
            </div>
          )}
          <p className="text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>
            {t('cmp_composes_note')}
          </p>
          {etape.admin && (
            <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold">{t('cmp_admin_annonce')}</span>{' '}
              <span className="font-mono">{etape.admin}</span>
            </p>
          )}
          {etape.licenceAnnonce && (
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold">{t('cmp_licence_annonce')}</span>{' '}
              <span className="font-mono">{etape.licenceAnnonce}</span>
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
            <span
              className={etape.licenceCreee ? 'badge-secondary' : 'badge-danger'}
              title={`UC-07 — ${etape.licenceDetail}`}
            >
              {etape.licenceCreee ? `${t('cmp_licence_ok')} ${etape.licenceDetail}` : `${t('cmp_licence_ko')} ${etape.licenceDetail}`}
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
            <FicheTable fiche={etape.ficheRelue ?? etape.fiche} titre={t('cmp_fiche_serveur')} />
            <VerdictRelecture diff={etape.diff} />
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
