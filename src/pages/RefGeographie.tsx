// src/pages/RefGeographie.tsx — US-B5 (l'arbre riche) + créations US-B4/lot H.
//
// LA vitrine de la richesse : pays → région → ville (GPS) → quartier, avec
// la pédagogie anti-corruption VISIBLE (la ville porte « ↗ config-service »,
// région et quartier portent « ⌂ chez nous » avec la raison en info-bulle).
// Trois formulaires d'ajout, hiérarchie EF-02 imposée par construction :
// la ville choisit sa région dans l'arbre, le quartier choisit sa ville.

import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, SectionHeader } from '../components/ui'
import { Banniere, Skeleton, useToast } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import {
  ajouterQuartier,
  lireFichesPays,
  lireGeographie,
  type FichePays,
  type VueGeographie,
} from '../lib/api'
import { GlobeAfrique } from '../components/GlobeAfrique'
import { useMessageDe } from './runs-commun'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'pret'; vue: VueGeographie }
  | { phase: 'erreur'; message: string }


export function RefGeographie() {
  const { t } = useApp()
  const { pousser } = useToast()
  const messageDe = useMessageDe()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [formulaire, setFormulaire] = useState<'region' | 'ville' | 'quartier' | null>(null)
  const [envoi, setEnvoi] = useState(false)
  // Champs des trois formulaires (plats — un seul est visible a la fois).
  const [fParent, setFParent] = useState('')
  const [fNom, setFNom] = useState('')
  const [fZone, setFZone] = useState('residential')

  // Le globe (C1, 22/08) : les fiches pays avec leur etat operationnel,
  // verifie EN DIRECT par le backend. Meilleur-effort — si les fiches
  // manquent, l'arbre vit sans le globe, jamais l'inverse.
  const [fiches, setFiches] = useState<FichePays[] | null>(null)

  const charger = useCallback(async () => {
    setEtat({ phase: 'chargement' })
    try {
      const [vue, reponseFiches] = await Promise.all([
        lireGeographie(),
        lireFichesPays().catch(() => null),
      ])
      setFiches(reponseFiches ? reponseFiches.pays : null)
      setEtat({ phase: 'pret', vue })
    } catch (err) {
      setEtat({ phase: 'erreur', message: messageDe(err) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void charger()
  }, [charger])


  const soumettre = async () => {
    if (envoi || !formulaire) return
    setEnvoi(true)
    try {
      {
        await ajouterQuartier({ city_id: fParent, nom: fNom.trim(), zone_type: fZone })
        pousser('succes', t('geo_ajoute'))
      }
      setFormulaire(null)
      setFNom('')
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

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title={t('geo_titre')}
        subtitle={t('geo_sous_titre')}
        action={
          <button
            className="btn-ghost text-xs"
            style={{ height: 30 }}
            onClick={() => {
              setFormulaire(formulaire === 'quartier' ? null : 'quartier')
              setFNom('')
            }}
          >
            <Plus size={12} />
            {t('geo_ajouter_quartier')}
          </button>
        }
      />


      {/* Tuiles de synthese — les vraies donnees, comme dans l'artefact */}
      {fiches && (
        <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))' }}>
          {[
            { valeur: fiches.length, libelle: t('globe_tuile_pays') },
            { valeur: fiches.filter((f) => f.sur_config_service).length, libelle: t('globe_operation'), couleur: 'var(--globe-op, #15803D)' },
            { valeur: fiches.filter((f) => !f.sur_config_service && f.completude.regions > 0).length, libelle: t('globe_geo'), couleur: 'var(--globe-geo, #B45309)' },
            { valeur: fiches.filter((f) => !f.sur_config_service && f.completude.regions === 0).length, libelle: t('globe_fiche') },
            { valeur: fiches.reduce((somme, f) => somme + f.completude.villes, 0), libelle: t('geo_villes') },
            { valeur: fiches.reduce((somme, f) => somme + f.completude.quartiers, 0), libelle: t('geo_quartiers') },
          ].map((tuile) => (
            <Card key={tuile.libelle} style={{ padding: '10px 12px 8px' }}>
              <div className="text-xl font-bold tabular-nums" style={{ color: tuile.couleur ?? 'var(--text-primary)' }}>
                {tuile.valeur}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{tuile.libelle}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Globe Afrique (C1, 22/08) — le referentiel DESSINE, etats en direct */}
      {fiches && (
        <Card className="mb-4">
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('globe_titre')}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {t('globe_sous_titre')}
            </p>
          </div>
          <GlobeAfrique fiches={fiches} geographie={vue.pays} />
        </Card>
      )}

      {/* Formulaire d'ajout (un seul a la fois, hierarchie EF-02 imposee) */}
      {formulaire && (
        <Card className="mb-4">
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
{t('geo_ajouter_quartier')}
          </p>
          <p className="text-[10px] mb-3" style={{ color: 'var(--text-muted)' }}>
            {t('geo_sans_limite')}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              disabled={envoi || fNom.trim() === '' || fParent === ''}
              onClick={() => void soumettre()}
            >
              {envoi ? t('loading') : t('save')}
            </button>
          </div>
        </Card>
      )}

      {/* DECISION 22/08 : l'ancien arbre et la recherche sont SUPPRIMES —
          le globe + la vue table sont LA structure ; le detail vit dans
          les tooltips et la table. Seul l'ajout de QUARTIER survit :
          aucune source mondiale ne fournit les quartiers (D-03). */}
    </div>
  )
}
