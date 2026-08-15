// src/pages/RefGeographie.tsx — US-B5 (l'arbre riche) + créations US-B4/lot H.
//
// LA vitrine de la richesse : pays → région → ville (GPS) → quartier, avec
// la pédagogie anti-corruption VISIBLE (la ville porte « ↗ config-service »,
// région et quartier portent « ⌂ chez nous » avec la raison en info-bulle).
// Trois formulaires d'ajout, hiérarchie EF-02 imposée par construction :
// la ville choisit sa région dans l'arbre, le quartier choisit sa ville.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { Card, SectionHeader } from '../components/ui'
import { Banniere, Skeleton, useToast } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import {
  ajouterQuartier,
  ajouterRegion,
  ajouterVille,
  lireGeographie,
  type VueGeographie,
} from '../lib/api'
import { useMessageDe } from './runs-commun'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'pret'; vue: VueGeographie }
  | { phase: 'erreur'; message: string }

function BadgeDestination({ part }: { part: boolean }) {
  const { t } = useApp()
  return (
    <span
      className="text-[9px] font-semibold rounded-full px-1.5 py-0.5 whitespace-nowrap"
      style={
        part
          ? { background: 'var(--secondary-light)', color: 'var(--secondary-dark)' }
          : { background: 'var(--border)', color: 'var(--text-secondary)' }
      }
      title={part ? undefined : t('geo_reste_ici_bulle')}
    >
      {part ? t('geo_part_config') : t('geo_reste_ici')}
    </span>
  )
}

export function RefGeographie() {
  const { t } = useApp()
  const { pousser } = useToast()
  const messageDe = useMessageDe()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [filtre, setFiltre] = useState('')
  const [ouverts, setOuverts] = useState<Record<string, boolean>>({})
  const [formulaire, setFormulaire] = useState<'region' | 'ville' | 'quartier' | null>(null)
  const [envoi, setEnvoi] = useState(false)
  // Champs des trois formulaires (plats — un seul est visible a la fois).
  const [fPays, setFPays] = useState('')
  const [fParent, setFParent] = useState('')
  const [fNom, setFNom] = useState('')
  const [fCapitale, setFCapitale] = useState('')
  const [fLat, setFLat] = useState('')
  const [fLon, setFLon] = useState('')
  const [fZone, setFZone] = useState('residential')

  const charger = useCallback(async () => {
    setEtat({ phase: 'chargement' })
    try {
      setEtat({ phase: 'pret', vue: await lireGeographie() })
    } catch (err) {
      setEtat({ phase: 'erreur', message: messageDe(err) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void charger()
  }, [charger])

  const basculer = (cle: string) => setOuverts((o) => ({ ...o, [cle]: !o[cle] }))

  const arbreFiltre = useMemo(() => {
    if (etat.phase !== 'pret') return []
    const bas = filtre.trim().toLowerCase()
    if (!bas) return etat.vue.pays
    return etat.vue.pays
      .map((pays) => ({
        ...pays,
        regions: pays.regions
          .map((region) => ({
            ...region,
            villes: region.villes.filter(
              (ville) =>
                ville.nom.toLowerCase().includes(bas) ||
                ville.quartiers.some((q) => q.toLowerCase().includes(bas)) ||
                region.nom.toLowerCase().includes(bas) ||
                pays.pays.toLowerCase().includes(bas),
            ),
          }))
          .filter(
            (region) =>
              region.villes.length > 0 ||
              region.nom.toLowerCase().includes(bas) ||
              pays.pays.toLowerCase().includes(bas),
          ),
      }))
      .filter((pays) => pays.regions.length > 0 || pays.pays.toLowerCase().includes(bas))
  }, [etat, filtre])

  const soumettre = async () => {
    if (envoi || !formulaire) return
    setEnvoi(true)
    try {
      if (formulaire === 'region') {
        const reponse = await ajouterRegion({
          pays: fPays.trim().toUpperCase(),
          nom: fNom.trim(),
          capitale: fCapitale.trim() || undefined,
        })
        pousser('succes', `${t('geo_ajoute')} ${reponse.config_service.envoye ? '' : `(${t('geo_reste_ici')})`}`)
      } else if (formulaire === 'ville') {
        const reponse = await ajouterVille({
          region_id: fParent,
          nom: fNom.trim(),
          latitude: fLat.trim() === '' ? undefined : Number(fLat),
          longitude: fLon.trim() === '' ? undefined : Number(fLon),
        })
        const avertissements = reponse.avertissements ?? []
        pousser('succes', t('geo_ajoute'))
        for (const a of avertissements) pousser('erreur', a)
      } else {
        await ajouterQuartier({ city_id: fParent, nom: fNom.trim(), zone_type: fZone })
        pousser('succes', t('geo_ajoute'))
      }
      setFormulaire(null)
      setFNom('')
      setFCapitale('')
      setFLat('')
      setFLon('')
      await charger()
    } catch (err) {
      pousser('erreur', messageDe(err))
    } finally {
      setEnvoi(false)
    }
  }

  if (etat.phase === 'chargement') {
    return (
      <div className="space-y-3">
        <Skeleton height={28} width={280} />
        <Skeleton height={300} />
      </div>
    )
  }
  if (etat.phase === 'erreur') {
    return (
      <div>
        <SectionHeader title={t('geo_titre')} />
        <Banniere ton="danger">{etat.message}</Banniere>
        <button className="btn-ghost text-xs mt-3" onClick={() => void charger()}>
          {t('retry')}
        </button>
      </div>
    )
  }

  const { vue } = etat
  const toutesRegions = vue.pays.flatMap((p) => p.regions.map((r) => ({ ...r, pays: p.pays })))
  const toutesVilles = toutesRegions.flatMap((r) =>
    r.villes.map((v) => ({ ...v, region: r.nom, pays: r.pays })),
  )
  const nbVilles = toutesVilles.length
  const nbQuartiers = toutesVilles.reduce((somme, v) => somme + v.quartiers.length, 0)

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title={t('geo_titre')}
        subtitle={t('geo_sous_titre')}
        action={
          <div className="flex gap-2">
            {(['region', 'ville', 'quartier'] as const).map((type) => (
              <button
                key={type}
                className="btn-ghost text-xs"
                style={{ height: 30 }}
                onClick={() => {
                  setFormulaire(formulaire === type ? null : type)
                  setFNom('')
                }}
              >
                <Plus size={12} />
                {type === 'region'
                  ? t('geo_ajouter_region')
                  : type === 'ville'
                    ? t('geo_ajouter_ville')
                    : t('geo_ajouter_quartier')}
              </button>
            ))}
          </div>
        }
      />

      {/* Compteurs — la richesse, chiffree */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="badge-primary font-mono">
          {vue.pays.length} pays · {toutesRegions.length} {t('geo_regions')} · {nbVilles}{' '}
          {t('geo_villes')} · {nbQuartiers} {t('geo_quartiers')}
        </span>
        <span className="text-[10px] font-mono self-center" style={{ color: 'var(--text-muted)' }}>
          {vue.surcouche.resume}
        </span>
      </div>

      {/* Formulaire d'ajout (un seul a la fois, hierarchie EF-02 imposee) */}
      {formulaire && (
        <Card className="mb-4">
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {formulaire === 'region'
              ? t('geo_ajouter_region')
              : formulaire === 'ville'
                ? t('geo_ajouter_ville')
                : t('geo_ajouter_quartier')}
          </p>
          <p className="text-[10px] mb-3" style={{ color: 'var(--text-muted)' }}>
            {t('geo_sans_limite')}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {formulaire === 'region' && (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-muted)' }}>
                  {t('geo_pays_champ')}
                </label>
                <select className="input-base" value={fPays} onChange={(e) => setFPays(e.target.value)}>
                  <option value="">{t('geo_choisir')}</option>
                  {vue.pays.map((p) => (
                    <option key={p.pays} value={p.pays}>
                      {p.pays}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {formulaire === 'ville' && (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-muted)' }}>
                  {t('geo_region_parente')}
                </label>
                <select className="input-base" value={fParent} onChange={(e) => setFParent(e.target.value)}>
                  <option value="">{t('geo_choisir')}</option>
                  {toutesRegions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.pays} — {r.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {formulaire === 'quartier' && (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-muted)' }}>
                  {t('geo_ville_parente')}
                </label>
                <select className="input-base" value={fParent} onChange={(e) => setFParent(e.target.value)}>
                  <option value="">{t('geo_choisir')}</option>
                  {toutesVilles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.pays} — {v.region} — {v.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-muted)' }}>
                {t('geo_nom')}
              </label>
              <input className="input-base" value={fNom} onChange={(e) => setFNom(e.target.value)} />
            </div>
            {formulaire === 'region' && (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-muted)' }}>
                  {t('geo_capitale')}
                </label>
                <input className="input-base" value={fCapitale} onChange={(e) => setFCapitale(e.target.value)} />
              </div>
            )}
            {formulaire === 'ville' && (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-muted)' }}>
                  {t('geo_gps')}
                </label>
                <div className="flex gap-1">
                  <input className="input-base font-mono" placeholder="lat" value={fLat} onChange={(e) => setFLat(e.target.value)} />
                  <input className="input-base font-mono" placeholder="lon" value={fLon} onChange={(e) => setFLon(e.target.value)} />
                </div>
              </div>
            )}
            {formulaire === 'quartier' && (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-muted)' }}>
                  {t('geo_zone_type')}
                </label>
                <select className="input-base" value={fZone} onChange={(e) => setFZone(e.target.value)}>
                  {['residential', 'commercial', 'mixed', 'industrial'].map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button className="btn-ghost text-xs" style={{ height: 30 }} onClick={() => setFormulaire(null)}>
              {t('cancel')}
            </button>
            <button
              className="btn-primary text-xs"
              style={{ height: 30, opacity: envoi ? 0.6 : 1 }}
              disabled={
                envoi ||
                fNom.trim() === '' ||
                (formulaire === 'region' ? fPays === '' : fParent === '')
              }
              onClick={() => void soumettre()}
            >
              {envoi ? t('loading') : t('save')}
            </button>
          </div>
        </Card>
      )}

      {/* Recherche */}
      <input
        className="input-base mb-3"
        style={{ maxWidth: 420 }}
        placeholder={t('geo_recherche')}
        value={filtre}
        onChange={(e) => setFiltre(e.target.value)}
      />

      {/* L'ARBRE */}
      <Card style={{ padding: '8px 12px' }}>
        {arbreFiltre.map((pays) => (
          <div key={pays.pays} className="py-1">
            <button
              className="flex items-center gap-2 w-full text-left"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px' }}
              onClick={() => basculer(pays.pays)}
            >
              {ouverts[pays.pays] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                {pays.pays}
              </span>
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                {pays.regions.length} {t('geo_regions')}
              </span>
            </button>
            {(ouverts[pays.pays] || filtre) &&
              pays.regions.map((region) => (
                <div key={region.id} className="ml-5 border-l pl-3" style={{ borderColor: 'var(--border)' }}>
                  <button
                    className="flex items-center gap-2 w-full text-left"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px' }}
                    onClick={() => basculer(region.id)}
                  >
                    {ouverts[region.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {region.nom}
                    </span>
                    {region.capitale && (
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        ★ {region.capitale}
                      </span>
                    )}
                    <BadgeDestination part={false} />
                    <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                      {region.villes.length} {t('geo_villes')}
                    </span>
                  </button>
                  {(ouverts[region.id] || filtre) &&
                    region.villes.map((ville) => (
                      <div key={ville.id} className="ml-5 border-l pl-3" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-2 flex-wrap" style={{ padding: '3px 2px' }}>
                          <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
                            {ville.nom}
                          </span>
                          {ville.latitude !== null && (
                            <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
                              {ville.latitude?.toFixed(2)}, {ville.longitude?.toFixed(2)}
                            </span>
                          )}
                          <BadgeDestination part />
                          {ville.quartiers.length > 0 && (
                            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                              {ville.quartiers.length} {t('geo_quartiers')}
                            </span>
                          )}
                        </div>
                        {ville.quartiers.length > 0 && (
                          <div className="ml-4 flex flex-wrap gap-1 pb-1">
                            {ville.quartiers.map((quartier) => (
                              <span
                                key={quartier}
                                className="text-[10px] rounded-full px-2 py-0.5"
                                style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}
                                title={t('geo_reste_ici_bulle')}
                              >
                                {quartier}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ))}
          </div>
        ))}
      </Card>
    </div>
  )
}
