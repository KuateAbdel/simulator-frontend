// src/pages/AttributionPopulation.tsx
//
// POPULATION (DASH §5.4) — une seule question opérationnelle : quel profil
// ne pourra pas être servi. Groupée PAR PAYS, la dimension selon laquelle la
// campagne se déplace. La grille est DÉRIVÉE des données — seize
// combinaisons aujourd'hui parce que quatre pays sont peuplés, jamais un
// « 16 » écrit quelque part.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Users } from 'lucide-react'
import { populationAttribution, type PopulationAttribution } from '../lib/api'
import { Card, EmptyState, SectionHeader } from '../components/ui'
import { Banniere, KpiCard, Skeleton } from '../components/ui/loader'
import { useApp } from '../context/AppContext'

export function AttributionPopulation() {
  const { t } = useApp()
  const [corps, setCorps] = useState<PopulationAttribution | null>(null)
  const [chargement, setChargement] = useState(true)
  const [enPanne, setEnPanne] = useState(false)

  const charger = useCallback(async () => {
    setChargement(true)
    try {
      setCorps(await populationAttribution())
      setEnPanne(false)
    } catch {
      setEnPanne(true)
    } finally {
      setChargement(false)
    }
  }, [])
  useEffect(() => {
    void charger()
  }, [charger])

  const parPays = useMemo(() => {
    const groupes = new Map<string, PopulationAttribution['combinaisons']>()
    for (const combinaison of corps?.combinaisons ?? []) {
      const liste = groupes.get(combinaison.pays) ?? []
      liste.push(combinaison)
      groupes.set(combinaison.pays, liste)
    }
    return [...groupes.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [corps])

  const libelleProfil = (genre: string, categorie: string) =>
    `${genre === 'FEMALE' ? t('apo_femme') : t('apo_homme')} · ${
      categorie === 'CORPORATE' ? t('apo_corporate') : t('apo_individuel')
    }`

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title={t('apo_titre')}
        subtitle={t('apo_soustitre')}
        action={
          <button className="btn-ghost" onClick={() => void charger()}>
            <RefreshCw size={14} /> {t('attr_rafraichir')}
          </button>
        }
      />
      {enPanne && (
        <div className="mb-3">
          <Banniere ton="attention">{t('attr_erreur_chargement')}</Banniere>
        </div>
      )}

      {chargement && !corps ? (
        <div style={{ display: 'grid', gap: 10 }}>
          <Skeleton height={80} />
          <Skeleton height={160} />
        </div>
      ) : corps && corps.total_clients === 0 ? (
        <EmptyState label={t('apo_vide')} />
      ) : corps ? (
        <>
          <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <KpiCard libelle={t('apo_libres')} valeur={corps.total_libres} icone={<Users size={16} />} couleur="var(--secondary)" />
            <KpiCard libelle={t('apo_attribues')} valeur={corps.total_attribues} icone={<Users size={16} />} />
            <KpiCard libelle={t('apo_total')} valeur={corps.total_clients} icone={<Users size={16} />} couleur="var(--text-muted)" />
            {/* L'indicateur qui doit ALERTER (§5.1) — distinct des autres :
                --warning, jamais --danger (cycle normal, pas incident). */}
            <KpiCard
              libelle={t('apo_epuisees')}
              valeur={corps.combinaisons_epuisees}
              icone={<Users size={16} />}
              couleur={corps.combinaisons_epuisees > 0 ? 'var(--warning)' : 'var(--secondary)'}
            />
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {parPays.map(([pays, combinaisons]) => (
              <Card key={pays} style={{ padding: 16 }}>
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="font-display" style={{ fontSize: 'var(--fs-champ)', fontWeight: 700 }}>
                    {combinaisons[0]?.pays_libelle ?? pays}
                  </h3>
                  <span className="font-mono" style={{ fontSize: 'var(--fs-note)', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                    {combinaisons.reduce((somme, c) => somme + c.libres, 0)} / {combinaisons.reduce((somme, c) => somme + c.total, 0)}
                  </span>
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {combinaisons.map((c) => {
                    const epuisee = c.libres === 0
                    const part = c.total > 0 ? (c.attribues / c.total) * 100 : 0
                    return (
                      <div
                        key={`${c.genre}-${c.categorie}`}
                        style={
                          epuisee
                            ? { background: 'var(--warning-soft)', borderRadius: 8, padding: '8px 10px' }
                            : { padding: '0 10px' }
                        }
                      >
                        <div className="flex items-center justify-between" style={{ fontSize: 'var(--fs-corps)' }}>
                          <span style={{ color: epuisee ? 'var(--warning)' : 'var(--text-primary)', fontWeight: epuisee ? 700 : 500 }}>
                            {libelleProfil(c.genre, c.categorie)}
                          </span>
                          <span className="font-mono" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: epuisee ? 'var(--warning)' : 'var(--text-primary)' }}>
                            {c.libres}
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}> / {c.total}</span>
                          </span>
                        </div>
                        {!epuisee && (
                          <div className="progress-bar mt-1">
                            <div className="progress-fill" style={{ width: `${part}%` }} />
                          </div>
                        )}
                        {epuisee && (
                          <p style={{ fontSize: 'var(--fs-etiquette)', color: 'var(--warning)', marginTop: 2 }}>
                            {t('apo_epuisee_ligne')}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
