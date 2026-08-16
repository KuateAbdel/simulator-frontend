// src/pages/RefPaysMonnaies.tsx — US-B6 : créer monnaie puis pays sur
// config-service, avec NOS invariants (GET-avant-POST, relecture, journal).
//
// Le CountrySelect ISO (demande explicite de Yaniv) pré-remplit
// name_fr / name_en / dial_code — tout reste éditable. Les 409/422
// PÉDAGOGIQUES du backend s'affichent tels quels, et la réponse 201 montre
// la « matière pour générer » : déclarer ≠ générer (EF-05).

import { useState } from 'react'
import { Coins, Globe2 } from 'lucide-react'
import { Card, SectionHeader } from '../components/ui'
import { Banniere, useToast } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import {
  creerDevise,
  creerPays,
  desactiverDeviseConfig,
  lireDevisesConfig,
  type DeviseConfig,
  type MatiereRequise,
} from '../lib/api'
import { fautesDe } from './entites-commun'
import { useCallback, useEffect } from 'react'
import { PAYS_AFRIQUE } from '../data/pays-iso'
import { useMessageDe } from './runs-commun'

export function RefPaysMonnaies() {
  const { t, lang } = useApp()
  const { pousser } = useToast()
  const messageDe = useMessageDe()

  // ── Monnaie ──
  const [dIso, setDIso] = useState('')
  const [dNomFr, setDNomFr] = useState('')
  const [dNomEn, setDNomEn] = useState('')
  const [dDecimales, setDDecimales] = useState(false)
  const [dEnvoi, setDEnvoi] = useState(false)
  const [dErreur, setDErreur] = useState<string | null>(null)

  // ── Pays ──
  const [pIso, setPIso] = useState('')
  const [pNomFr, setPNomFr] = useState('')
  const [pNomEn, setPNomEn] = useState('')
  const [pIndicatif, setPIndicatif] = useState('')
  const [pRegion, setPRegion] = useState('')
  const [pDevise, setPDevise] = useState('')
  const [pVilles, setPVilles] = useState<string[]>([])
  const [pVilleSaisie, setPVilleSaisie] = useState('')
  const [pEnvoi, setPEnvoi] = useState(false)
  const [pErreur, setPErreur] = useState<string | null>(null)
  const [matiere, setMatiere] = useState<MatiereRequise[] | null>(null)

  // ── LA-BAS : les devises de config-service, avec leurs PORTEURS ──
  const [devisesConfig, setDevisesConfig] = useState<DeviseConfig[] | null>(null)
  const [devisesNote, setDevisesNote] = useState('')
  const [refus, setRefus] = useState<Record<string, string>>({})

  const chargerDevises = useCallback(async () => {
    try {
      const reponse = await lireDevisesConfig()
      setDevisesConfig(reponse.devises)
      setDevisesNote(reponse.note)
    } catch {
      setDevisesConfig(null)
    }
  }, [])

  useEffect(() => {
    void chargerDevises()
  }, [chargerDevises])

  const constaterRefus = async (devise: DeviseConfig) => {
    try {
      await desactiverDeviseConfig(devise.id, 'constat depuis le Loader')
      setRefus((avant) => ({ ...avant, [devise.id]: 'ACCEPTÉE ?! — mesure du 09/08 périmée, à ré-auditer' }))
    } catch (err) {
      setRefus((avant) => ({ ...avant, [devise.id]: fautesDe(err).join(' ') }))
    }
  }

  const choisirPaysIso = (iso: string) => {
    setPIso(iso)
    const fiche = PAYS_AFRIQUE.find((p) => p.iso === iso)
    if (fiche) {
      setPNomFr(fiche.nameFr)
      setPNomEn(fiche.nameEn)
      setPIndicatif(fiche.dial)
      // La monnaie d'un pays est une donnee CONNUE (ISO 4217) — elle se
      // pre-remplit comme le reste, et reste editable (demande Yaniv 15/08).
      setPDevise(fiche.devise)
    }
  }

  /** Pre-remplir le formulaire MONNAIE depuis la monnaie connue d'un pays. */
  const choisirDeviseDePays = (iso: string) => {
    const fiche = PAYS_AFRIQUE.find((p) => p.iso === iso)
    if (fiche) {
      setDIso(fiche.devise)
      setDNomFr(fiche.deviseFr)
      setDNomEn(fiche.deviseEn)
      setDDecimales(fiche.deviseDecimales)
    }
  }

  const deviseConnue = PAYS_AFRIQUE.find((p) => p.iso === pIso)

  const soumettreDevise = async (e: React.FormEvent) => {
    e.preventDefault()
    if (dEnvoi) return
    setDEnvoi(true)
    setDErreur(null)
    try {
      await creerDevise({
        iso_name: dIso.trim().toUpperCase(),
        name_fr: dNomFr.trim(),
        name_en: dNomEn.trim(),
        accepts_decimal: dDecimales,
      })
      pousser('succes', t('pm_cree'))
      setDIso('')
      setDNomFr('')
      setDNomEn('')
    } catch (err) {
      setDErreur(messageDe(err))
    } finally {
      setDEnvoi(false)
    }
  }

  const soumettrePays = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pEnvoi) return
    setPEnvoi(true)
    setPErreur(null)
    setMatiere(null)
    try {
      const reponse = await creerPays({
        iso_name: pIso.trim().toUpperCase(),
        name_fr: pNomFr.trim(),
        name_en: pNomEn.trim(),
        dial_code: pIndicatif.trim(),
        region: pRegion.trim(),
        devise_iso: pDevise.trim().toUpperCase(),
        cities: pVilles,
      })
      pousser('succes', t('pm_cree'))
      setMatiere(reponse.matiere_pour_generer)
    } catch (err) {
      setPErreur(messageDe(err))
    } finally {
      setPEnvoi(false)
    }
  }

  const label = (texte: string) => (
    <label
      className="text-[10px] font-semibold uppercase tracking-wide mb-1 block"
      style={{ color: 'var(--text-muted)' }}
    >
      {texte}
    </label>
  )

  return (
    <div className="animate-fade-in">
      <SectionHeader title={t('pm_titre')} subtitle={t('pm_sous_titre')} />

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        {/* ── Monnaie d'abord ── */}
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <Coins size={15} style={{ color: 'var(--primary-dark)' }} />
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('pm_devise_titre')}
            </p>
          </div>
          <p className="text-[10px] mb-3" style={{ color: 'var(--text-muted)' }}>
            {t('pm_devise_note')}
          </p>
          <form onSubmit={soumettreDevise} className="space-y-3">
            <div>
              {label(t('pm_devise_prefill'))}
              <select className="input-base" defaultValue="" onChange={(e) => choisirDeviseDePays(e.target.value)}>
                <option value="">{t('geo_choisir')}</option>
                {PAYS_AFRIQUE.map((p) => (
                  <option key={p.iso} value={p.iso}>
                    {p.iso} — {lang === 'fr' ? p.nameFr : p.nameEn} ({p.devise})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                {label(t('pm_devise_iso'))}
                <input
                  className="input-base font-mono"
                  value={dIso}
                  onChange={(e) => setDIso(e.target.value.toUpperCase())}
                  maxLength={3}
                  required
                  pattern="[A-Za-z]{3}"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={dDecimales}
                    onChange={(e) => setDDecimales(e.target.checked)}
                  />
                  {t('pm_decimales')}
                </label>
              </div>
              <div>
                {label(t('pm_nom_fr'))}
                <input className="input-base" value={dNomFr} onChange={(e) => setDNomFr(e.target.value)} required />
              </div>
              <div>
                {label(t('pm_nom_en'))}
                <input className="input-base" value={dNomEn} onChange={(e) => setDNomEn(e.target.value)} required />
              </div>
            </div>
            {dErreur && (
              <p className="text-xs rounded-lg px-3 py-2" style={{ background: '#fee2e2', color: '#b91c1c' }} role="alert">
                {dErreur}
              </p>
            )}
            <button className="btn-primary text-xs" style={{ height: 32, opacity: dEnvoi ? 0.6 : 1 }} disabled={dEnvoi}>
              {dEnvoi ? t('loading') : t('pm_devise_creer')}
            </button>
          </form>
        </Card>

        {/* ── Pays ── */}
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <Globe2 size={15} style={{ color: 'var(--primary-dark)' }} />
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('pm_pays_titre')}
            </p>
          </div>
          <p className="text-[10px] mb-3" style={{ color: 'var(--text-muted)' }}>
            {t('pm_declare_note')}
          </p>
          <form onSubmit={soumettrePays} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                {label(t('pm_pays_select'))}
                <select className="input-base" value={pIso} onChange={(e) => choisirPaysIso(e.target.value)} required>
                  <option value="">{t('geo_choisir')}</option>
                  {PAYS_AFRIQUE.map((p) => (
                    <option key={p.iso} value={p.iso}>
                      {p.iso} — {lang === 'fr' ? p.nameFr : p.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                {label(t('pm_indicatif'))}
                <input
                  className="input-base font-mono"
                  value={pIndicatif}
                  onChange={(e) => setPIndicatif(e.target.value)}
                  required
                  pattern="\d{1,5}"
                />
              </div>
              <div>
                {label(t('pm_nom_fr'))}
                <input className="input-base" value={pNomFr} onChange={(e) => setPNomFr(e.target.value)} required />
              </div>
              <div>
                {label(t('pm_nom_en'))}
                <input className="input-base" value={pNomEn} onChange={(e) => setPNomEn(e.target.value)} required />
              </div>
              <div>
                {label(t('pm_region_continentale'))}
                <input
                  className="input-base"
                  value={pRegion}
                  onChange={(e) => setPRegion(e.target.value)}
                  placeholder="West Africa"
                  required
                />
              </div>
              <div>
                {label(t('pm_devise_du_pays'))}
                <input
                  className="input-base font-mono"
                  value={pDevise}
                  onChange={(e) => setPDevise(e.target.value.toUpperCase())}
                  maxLength={3}
                  placeholder="XOF"
                  required
                  pattern="[A-Za-z]{3}"
                />
                {deviseConnue && pDevise === deviseConnue.devise && (
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    {lang === 'fr' ? deviseConnue.deviseFr : deviseConnue.deviseEn} —{' '}
                    {t('pm_devise_connue')}
                  </p>
                )}
              </div>
            </div>

            <div>
              {label(t('pm_villes_label'))}
              <div className="flex gap-2">
                <input
                  className="input-base"
                  value={pVilleSaisie}
                  onChange={(e) => setPVilleSaisie(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const nom = pVilleSaisie.trim()
                      if (nom && !pVilles.includes(nom)) setPVilles([...pVilles, nom])
                      setPVilleSaisie('')
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn-ghost text-xs flex-shrink-0"
                  style={{ height: 38 }}
                  onClick={() => {
                    const nom = pVilleSaisie.trim()
                    if (nom && !pVilles.includes(nom)) setPVilles([...pVilles, nom])
                    setPVilleSaisie('')
                  }}
                >
                  {t('pm_ville_ajouter')}
                </button>
              </div>
              {pVilles.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {pVilles.map((ville) => (
                    <button
                      key={ville}
                      type="button"
                      className="text-[10px] rounded-full px-2 py-0.5"
                      style={{
                        background: 'var(--primary-light)',
                        color: 'var(--primary-dark)',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      title={t('delete')}
                      onClick={() => setPVilles(pVilles.filter((v) => v !== ville))}
                    >
                      {ville} ✕
                    </button>
                  ))}
                </div>
              )}
            </div>

            {pErreur && (
              <p className="text-xs rounded-lg px-3 py-2" style={{ background: '#fee2e2', color: '#b91c1c' }} role="alert">
                {pErreur}
              </p>
            )}
            <button
              className="btn-primary text-xs"
              style={{ height: 32, opacity: pEnvoi || pVilles.length === 0 ? 0.6 : 1 }}
              disabled={pEnvoi || pVilles.length === 0}
            >
              {pEnvoi ? t('loading') : t('pm_pays_creer')}
            </button>
          </form>

          {devisesConfig && (
            <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                {t('pm_devises_labas')}
              </p>
              <p className="text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>
                {devisesNote}
              </p>
              <div className="space-y-1.5">
                {devisesConfig.map((devise) => (
                  <div key={devise.id}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                        {devise.iso}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                        {devise.nom}
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                        {t('tel_porteurs')} : {devise.porteurs.join(' · ') || '—'}
                      </span>
                      <button
                        className="btn-ghost text-[10px] ml-auto"
                        style={{ height: 22 }}
                        onClick={() => void constaterRefus(devise)}
                      >
                        {t('pm_devise_tester')}
                      </button>
                    </div>
                    {refus[devise.id] && (
                      <p className="text-[10px] mt-0.5" style={{ color: '#92400e' }} role="status">
                        {refus[devise.id]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {matiere && (
            <div className="mt-4">
              <Banniere ton="info">
                <strong>{t('pm_matiere_titre')}</strong>
                <ul className="mt-1 space-y-0.5">
                  {matiere.map((m) => (
                    <li key={m.matiere}>
                      <span className="font-semibold">{m.matiere}</span> — {m.pourquoi}
                    </li>
                  ))}
                </ul>
              </Banniere>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
