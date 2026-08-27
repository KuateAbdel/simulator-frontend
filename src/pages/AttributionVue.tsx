// src/pages/AttributionVue.tsx
//
// VUE D'ENSEMBLE (DASH §5.1) — l'écran d'entrée : « est-ce que ça tient »,
// en un regard, sans interprétation et sans action. Quatre indicateurs, un
// histogramme des attributions sur sept jours (dérivé des baux — un bail
// mort reste lisible 30 jours, l'historique court est GRATUIT), et les
// cinq derniers événements du journal du domaine.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Clock, Smartphone, Users } from 'lucide-react'
import {
  journalAttribution,
  listerBauxAttribution,
  populationAttribution,
  type EvenementAttribution,
  type RecensementBaux,
} from '../lib/api'
import { Card, EmptyState, SectionHeader } from '../components/ui'
import { Banniere, KpiCard, Skeleton } from '../components/ui/loader'
import { formaterNumero } from './AttributionBaux'
import { useApp } from '../context/AppContext'

const JOUR = 86_400_000

export function AttributionVue() {
  const { t, lang } = useApp()
  const [baux, setBaux] = useState<RecensementBaux | null>(null)
  const [disponibles, setDisponibles] = useState<number | null>(null)
  const [epuisees, setEpuisees] = useState<number | null>(null)
  const [evenements, setEvenements] = useState<EvenementAttribution[] | null>(null)
  const [enPanne, setEnPanne] = useState(false)

  const charger = useCallback(async () => {
    try {
      const [tous, population, journal] = await Promise.all([
        listerBauxAttribution('tous'),
        populationAttribution(),
        journalAttribution(5),
      ])
      setBaux(tous)
      setDisponibles(population.total_libres)
      setEpuisees(population.combinaisons_epuisees)
      setEvenements(journal.entrees)
      setEnPanne(false)
    } catch {
      setEnPanne(true)
    }
  }, [])
  useEffect(() => {
    void charger()
    const minuteur = setInterval(() => void charger(), 60_000)
    return () => clearInterval(minuteur)
  }, [charger])

  const decalageMs = baux ? Date.parse(baux.releve_le) - Date.now() : 0
  const maintenantServeur = Date.now() + decalageMs

  const actifs = useMemo(
    () => (baux?.baux ?? []).filter((bail) => bail.etat === 'actif'),
    [baux],
  )
  const expirant24h = useMemo(
    () =>
      actifs.filter((bail) => {
        const reste = Date.parse(bail.expire_le) - maintenantServeur
        return reste > 0 && reste < JOUR
      }).length,
    [actifs, maintenantServeur],
  )

  /** L'histogramme : les attributions par jour, 7 jours — dérivé des baux
   *  (actifs ET échus ≤ 30 j) : l'attribution d'il y a 6 jours existe
   *  encore, même si son bail est mort. ⚡ local, zéro appel de plus. */
  const histogramme = useMemo(() => {
    const jours: { libelle: string; n: number }[] = []
    for (let i = 6; i >= 0; i -= 1) {
      const debut = new Date(maintenantServeur - i * JOUR)
      debut.setHours(0, 0, 0, 0)
      const fin = debut.getTime() + JOUR
      const n = (baux?.baux ?? []).filter((bail) => {
        const quand = Date.parse(bail.attribue_le)
        return quand >= debut.getTime() && quand < fin
      }).length
      jours.push({
        libelle: new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
          weekday: 'short',
        }).format(debut),
        n,
      })
    }
    return jours
  }, [baux, maintenantServeur, lang])
  const maxJour = Math.max(1, ...histogramme.map((j) => j.n))

  const LIBELLES: Record<string, string> = {
    CREATE: t('ajr_attribution'),
    DELETE: t('ajr_rendu'),
    REVOKE: t('ajr_repris'),
    REFUS: t('ajr_refus'),
    INTERLOCUTEUR: t('ajr_nommage'),
    UPDATE: t('ajr_nommage'),
  }
  const formaterDate = useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
      }).format(new Date(iso)),
    [lang],
  )
  const chargement = baux === null && !enPanne

  return (
    <div className="animate-fade-in">
      <SectionHeader title={t('vue_titre')} subtitle={t('vue_soustitre')} />
      {enPanne && (
        <div className="mb-3">
          <Banniere ton="attention">{t('attr_erreur_chargement')}</Banniere>
        </div>
      )}

      {chargement ? (
        <div style={{ display: 'grid', gap: 10 }}>
          <Skeleton height={80} /><Skeleton height={180} />
        </div>
      ) : (
        <>
          <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
            <KpiCard libelle={t('vue_baux_actifs')} valeur={actifs.length} icone={<Smartphone size={16} />} />
            <KpiCard
              libelle={t('vue_expirant')}
              valeur={expirant24h}
              icone={<Clock size={16} />}
              couleur={expirant24h > 0 ? 'var(--warning)' : 'var(--primary)'}
            />
            <KpiCard libelle={t('vue_disponibles')} valeur={disponibles ?? '—'} icone={<Users size={16} />} couleur="var(--secondary)" />
            {/* §5.1 — CELUI qui doit alerter, distinct des trois autres. */}
            <KpiCard
              libelle={t('vue_epuisees')}
              valeur={epuisees ?? '—'}
              icone={<AlertTriangle size={16} />}
              couleur={epuisees && epuisees > 0 ? 'var(--warning)' : 'var(--secondary)'}
            />
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            <Card style={{ padding: 16 }}>
              <h3 className="font-display mb-3" style={{ fontSize: 'var(--fs-champ)', fontWeight: 600 }}>
                {t('vue_activite')}
              </h3>
              {histogramme.every((j) => j.n === 0) ? (
                <EmptyState label={t('vue_aucune_activite')} />
              ) : (
                <div className="flex items-end gap-2" style={{ height: 120 }}>
                  {histogramme.map((jour, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1" style={{ minWidth: 0 }}>
                      <span className="font-mono" style={{ fontSize: 'var(--fs-etiquette)', fontVariantNumeric: 'tabular-nums', color: jour.n ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {jour.n || ''}
                      </span>
                      <div
                        style={{
                          width: '100%', maxWidth: 36, borderRadius: '6px 6px 2px 2px',
                          height: Math.max(3, (jour.n / maxJour) * 80),
                          background: jour.n ? 'linear-gradient(180deg, var(--primary), var(--primary-dark))' : 'var(--border)',
                        }}
                        aria-label={`${jour.libelle} : ${jour.n}`}
                      />
                      <span style={{ fontSize: 'var(--fs-etiquette)', color: 'var(--text-secondary)' }}>{jour.libelle}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card style={{ padding: 16 }}>
              <h3 className="font-display mb-3" style={{ fontSize: 'var(--fs-champ)', fontWeight: 600 }}>
                {t('vue_derniers')}
              </h3>
              {evenements && evenements.length > 0 ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  {evenements.map((e, i) => (
                    <div key={i} className="flex items-center justify-between gap-3" style={{ fontSize: 'var(--fs-corps)' }}>
                      <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                        <span className={e.operation === 'CREATE' ? 'badge-secondary' : 'badge-primary'}>
                          {LIBELLES[e.operation] ?? e.operation}
                        </span>
                        <span className="font-mono truncate" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {e.cible && /^\d+$/.test(e.cible) ? formaterNumero(e.cible) : e.cible}
                        </span>
                      </div>
                      <span style={{ fontSize: 'var(--fs-note)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formaterDate(e.quand)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState label={t('ajr_vide')} />
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
