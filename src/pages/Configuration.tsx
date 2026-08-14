// src/pages/Configuration.tsx — US-B1 / US-B2 / US-B3. PHASE 2.
//
// US-B1 : la vue RESOLUE — chaque valeur avec son origine (tag visible).
// US-B2 : volumes et surcharges par pays, bornes du backend doublees en UI,
//         la reponse du PUT est la vue RELUE depuis la base (jamais un echo).
// US-B3 : pays activables en chips — et l'ecran DIT que config-service n'est
//         jamais appele (A-08).
// Verrou EF-55 : un 409 du backend s'affiche en banniere nommee.
// Quotas EF-22/EF-23 : montres VERROUILLES, avec l'exigence citee.

import { useCallback, useEffect, useState } from 'react'
import { Lock, Save } from 'lucide-react'
import { Card, SectionHeader } from '../components/ui'
import {
  Banniere,
  NumberField,
  OrigineTag,
  Skeleton,
  useToast,
} from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import {
  ApiError,
  changerEtatPays,
  lireConfiguration,
  modifierConfiguration,
  type ConfigurationDemande,
  type Fourchette,
  type SurchargePaysDemande,
  type VueConfiguration,
} from '../lib/api'

type Etat =
  | { statut: 'chargement' }
  | { statut: 'pret'; vue: VueConfiguration }
  | { statut: 'erreur'; message: string }

/** Brouillon d'edition par pays — '' = champ non touche (rien n'est envoye). */
type BrouillonPays = {
  clients: number | ''
  companies: [number | '', number | '']
  kiosques: [number | '', number | '']
  staff: [number | '', number | '']
  branches: number | ''
  agences: number | ''
  agents: number | ''
}

const BROUILLON_VIDE: BrouillonPays = {
  clients: '',
  companies: ['', ''],
  kiosques: ['', ''],
  staff: ['', ''],
  branches: '',
  agences: '',
  agents: '',
}

function fourchettePropre(paire: [number | '', number | '']): Fourchette | undefined {
  const [min, max] = paire
  if (min === '' && max === '') return undefined
  // Une fourchette a moitie remplie est invalide — le bouton la bloque avant.
  return [Number(min), Number(max)]
}

function fourchetteInvalide(paire: [number | '', number | '']): boolean {
  const [min, max] = paire
  if (min === '' && max === '') return false
  if (min === '' || max === '') return true
  return min < 1 || max < min || max > 10_000
}

export function Configuration() {
  const { t } = useApp()
  const { pousser } = useToast()
  const [etat, setEtat] = useState<Etat>({ statut: 'chargement' })
  const [brouillonGlobal, setBrouillonGlobal] = useState<number | ''>('')
  const [brouillons, setBrouillons] = useState<Record<string, BrouillonPays>>({})
  const [enEnvoi, setEnEnvoi] = useState(false)
  const [verrouEf55, setVerrouEf55] = useState<string | null>(null)
  const [motifs, setMotifs] = useState<Record<string, string>>({})

  const messageDe = useCallback(
    (err: unknown): string =>
      err instanceof ApiError && err.status === 0
        ? t('error_backend_unreachable')
        : `${t('error_named')} ${String(err instanceof ApiError ? err.detail : err)}`,
    [t],
  )

  const poserVue = useCallback((vue: VueConfiguration) => {
    setEtat({ statut: 'pret', vue })
    setBrouillonGlobal('')
    setBrouillons({})
  }, [])

  const charger = useCallback(async () => {
    setEtat({ statut: 'chargement' })
    try {
      poserVue(await lireConfiguration())
    } catch (err) {
      setEtat({ statut: 'erreur', message: messageDe(err) })
    }
  }, [poserVue, messageDe])

  useEffect(() => {
    void charger()
  }, [charger])

  if (etat.statut === 'chargement') {
    return (
      <div className="space-y-3">
        <Skeleton height={28} width={280} />
        <Skeleton height={120} />
        <Skeleton height={220} />
      </div>
    )
  }
  if (etat.statut === 'erreur') {
    return (
      <div>
        <SectionHeader title={t('cfg_title')} />
        <Banniere ton="danger">{etat.message}</Banniere>
        <button className="btn-ghost text-xs mt-3" onClick={() => void charger()}>
          {t('retry')}
        </button>
      </div>
    )
  }

  const { vue } = etat
  const codes = Object.keys(vue.pays).sort()

  const brouillonDe = (code: string): BrouillonPays => brouillons[code] ?? BROUILLON_VIDE
  const poserBrouillon = (code: string, patch: Partial<BrouillonPays>) =>
    setBrouillons((b) => ({ ...b, [code]: { ...brouillonDe(code), ...patch } }))

  const uneFourchetteInvalide = codes.some((code) => {
    const b = brouillonDe(code)
    return (
      fourchetteInvalide(b.companies) || fourchetteInvalide(b.kiosques) || fourchetteInvalide(b.staff)
    )
  })

  const brouillonTouche =
    brouillonGlobal !== '' ||
    codes.some((code) => {
      const b = brouillonDe(code)
      return (
        b.clients !== '' ||
        b.branches !== '' ||
        b.agences !== '' ||
        b.agents !== '' ||
        b.companies.some((x) => x !== '') ||
        b.kiosques.some((x) => x !== '') ||
        b.staff.some((x) => x !== '')
      )
    })

  const enregistrer = async () => {
    if (enEnvoi || uneFourchetteInvalide || !brouillonTouche) return
    setEnEnvoi(true)
    setVerrouEf55(null)
    const demande: ConfigurationDemande = {}
    if (brouillonGlobal !== '') demande.nb_clients = Number(brouillonGlobal)
    const pays: Record<string, SurchargePaysDemande> = {}
    for (const code of codes) {
      const b = brouillonDe(code)
      const surcharge: SurchargePaysDemande = {}
      if (b.clients !== '') surcharge.clients = Number(b.clients)
      const companies = fourchettePropre(b.companies)
      if (companies) surcharge.companies = companies
      const kiosques = fourchettePropre(b.kiosques)
      if (kiosques) surcharge.kiosques = kiosques
      const staff = fourchettePropre(b.staff)
      if (staff) surcharge.staff = staff
      if (b.branches !== '') surcharge.branches = Number(b.branches)
      if (b.agences !== '') surcharge.agences = Number(b.agences)
      if (b.agents !== '') surcharge.agents = Number(b.agents)
      if (Object.keys(surcharge).length > 0) pays[code] = surcharge
    }
    if (Object.keys(pays).length > 0) demande.pays = pays
    try {
      poserVue(await modifierConfiguration(demande))
      pousser('succes', t('cfg_enregistre'))
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setVerrouEf55(String(err.detail))
      } else {
        pousser('erreur', messageDe(err))
      }
    } finally {
      setEnEnvoi(false)
    }
  }

  const basculerPays = async (code: string) => {
    const fiche = vue.pays[code]
    const motif = motifs[code] ?? ''
    if (fiche.actif && motif.trim() === '') {
      pousser('erreur', t('cfg_desactiver_motif'))
      return
    }
    try {
      poserVue(await changerEtatPays(code, !fiche.actif, fiche.actif ? motif : ''))
      setMotifs((m) => ({ ...m, [code]: '' }))
      pousser('succes', t('cfg_enregistre'))
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setVerrouEf55(String(err.detail))
      else pousser('erreur', messageDe(err))
    }
  }

  return (
    <div className="animate-fade-in">
      <SectionHeader title={t('cfg_title')} subtitle={t('cfg_subtitle')} />

      {verrouEf55 && (
        <div className="mb-4">
          <Banniere ton="attention">
            <strong>{t('cfg_verrou_ef55')}</strong>
            <br />
            {verrouEf55}
          </Banniere>
        </div>
      )}

      {/* ── Total global + conformite ───────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4 mb-5">
        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('cfg_nb_clients')}
            </p>
            <OrigineTag origine={vue.nb_clients.origine} />
          </div>
          <NumberField
            id="nb-clients"
            label={
              <span className="font-mono" style={{ textTransform: 'none' }}>
                {vue.nb_clients.valeur}
              </span>
            }
            valeur={brouillonGlobal}
            onChange={setBrouillonGlobal}
            min={1}
            max={100_000}
          />
          <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
            {t('cfg_repartition')} :{' '}
            <span className="font-mono">
              {Object.entries(vue.repartition_clients)
                .map(([code, n]) => `${code} ${n}`)
                .join(' · ')}
            </span>
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('cfg_quotas_titre')}
            </p>
            <Lock size={12} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="space-y-1.5">
            {Object.entries(vue.quotas_contractuels).map(([nom, quota]) => (
              <div key={nom} className="flex items-center justify-between gap-2">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {nom} = <span className="font-mono">{String(quota.valeur)}</span>
                </span>
                <OrigineTag origine={quota.origine} />
              </div>
            ))}
          </div>
          <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
            {t('cfg_quotas_note')}
          </p>
        </Card>
      </div>

      {/* ── Pays : chips d'activation (US-B3) + surcharges (US-B2) ──────── */}
      <SectionHeader title={t('cfg_pays_actifs')} subtitle={t('cfg_pays_note')} />
      <div className="space-y-3 mb-5">
        {codes.map((code) => {
          const fiche = vue.pays[code]
          const b = brouillonDe(code)
          return (
            <Card key={code}>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span
                  className="font-mono font-bold text-sm px-2.5 py-1 rounded-lg"
                  style={
                    fiche.actif
                      ? { background: 'var(--secondary-light)', color: 'var(--secondary-dark)' }
                      : { background: 'var(--border)', color: 'var(--text-muted)' }
                  }
                >
                  {code}
                </span>
                {!fiche.actif && (
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {t('cfg_inactif_motif')} : {fiche.motif_inactivite || '—'}
                  </span>
                )}
                <div className="flex-1" />
                {fiche.actif && (
                  <input
                    className="input-base text-xs"
                    style={{ width: 220, height: 30 }}
                    placeholder={t('cfg_desactiver_motif')}
                    value={motifs[code] ?? ''}
                    onChange={(e) => setMotifs((m) => ({ ...m, [code]: e.target.value }))}
                  />
                )}
                <button
                  className="btn-ghost text-xs"
                  style={{ height: 30 }}
                  onClick={() => void basculerPays(code)}
                >
                  {fiche.actif ? t('cfg_desactiver') : t('cfg_activer')}
                </button>
              </div>

              {/* Quantites resolues avec origine + champs de surcharge */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {(
                  [
                    ['clients', t('cfg_clients_cible'), 0, 100_000],
                    ['branches', t('cfg_branches'), 1, 1_000],
                    ['agences', t('cfg_agences'), 1, 1_000],
                    ['agents', t('cfg_agents'), 1, 10_000],
                  ] as const
                ).map(([champ, libelle, min, max]) => {
                  const resolu = fiche.quantites[champ]
                  return (
                    <div key={champ}>
                      <NumberField
                        id={`${code}-${champ}`}
                        label={libelle}
                        valeur={b[champ]}
                        onChange={(v) => poserBrouillon(code, { [champ]: v } as Partial<BrouillonPays>)}
                        min={min}
                        max={max}
                        disabled={!fiche.actif}
                      />
                      <p className="flex items-center gap-1 mt-1 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                        {String(resolu?.valeur ?? '—')} <OrigineTag origine={resolu?.origine ?? ''} />
                      </p>
                    </div>
                  )
                })}

                {(
                  [
                    ['companies', t('cfg_companies')],
                    ['kiosques', t('cfg_kiosques')],
                    ['staff', t('cfg_staff')],
                  ] as const
                ).map(([champ, libelle]) => (
                  <div key={champ}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                      {libelle}
                    </p>
                    <div className="flex items-center gap-1">
                      <input
                        aria-label={`${code} ${champ} ${t('cfg_min')}`}
                        type="number"
                        className="input-base font-mono"
                        style={{ height: 34 }}
                        placeholder={t('cfg_min')}
                        disabled={!fiche.actif}
                        value={b[champ][0]}
                        onChange={(e) =>
                          poserBrouillon(code, {
                            [champ]: [e.target.value === '' ? '' : Number(e.target.value), b[champ][1]],
                          } as Partial<BrouillonPays>)
                        }
                      />
                      <span style={{ color: 'var(--text-muted)' }}>–</span>
                      <input
                        aria-label={`${code} ${champ} ${t('cfg_max')}`}
                        type="number"
                        className="input-base font-mono"
                        style={{ height: 34 }}
                        placeholder={t('cfg_max')}
                        disabled={!fiche.actif}
                        value={b[champ][1]}
                        onChange={(e) =>
                          poserBrouillon(code, {
                            [champ]: [b[champ][0], e.target.value === '' ? '' : Number(e.target.value)],
                          } as Partial<BrouillonPays>)
                        }
                      />
                    </div>
                    {fourchetteInvalide(b[champ]) && (
                      <p className="text-[10px] mt-1" style={{ color: '#b91c1c' }} role="alert">
                        {t('cfg_fourchette_invalide')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>

      {/* ── Conformite CDC + enregistrer ────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <span className={vue.conforme_au_cdc ? 'badge-secondary' : 'badge-warning'}>
          {t('cfg_conforme')} : {vue.conforme_au_cdc ? '✓' : '✗'}
        </span>
        {vue.ecarts_au_cdc.length > 0 && (
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {t('cfg_ecarts')} : {vue.ecarts_au_cdc.join(' · ')}
          </span>
        )}
        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
          {t('cfg_version')} {vue.version} · {t('cfg_modifie_par')} {vue.modifie_par ?? '—'}{' '}
          {vue.modifie_le ? `· ${vue.modifie_le}` : ''}
        </span>
        <div className="flex-1" />
        <button
          className="btn-primary text-xs"
          style={{ height: 34, opacity: enEnvoi || !brouillonTouche || uneFourchetteInvalide ? 0.6 : 1 }}
          disabled={enEnvoi || !brouillonTouche || uneFourchetteInvalide}
          onClick={() => void enregistrer()}
        >
          <Save size={13} />
          {enEnvoi ? t('loading') : t('cfg_enregistrer')}
        </button>
      </div>
    </div>
  )
}
