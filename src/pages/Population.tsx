// src/pages/Population.tsx — US-E3 (mesures) + P-01 (index inverse). PHASE 6.
//
// MESURE ET CIBLE cote a cote — jamais un chiffre seul : l'ecart est LA
// donnee (vert = cible tenue, ambre = ecart). Les mesures viennent du run
// (rangees par le moteur, identiques a ce que la recette a juge — jamais
// recalculees ici). L'histogramme des soldes marque la frontiere 150 000 :
// le seuil EF-68 au-dela duquel un client est eligible au credit.

import { useCallback, useEffect, useState } from 'react'
import { Baby, Briefcase, Coins, Target } from 'lucide-react'
import { Card, SectionHeader } from '../components/ui'
import { Banniere, Skeleton } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import {
  ApiError,
  lireIndexInverse,
  lirePopulation,
  type MesureCible,
  type VueIndexInverse,
  type VuePopulation,
} from '../lib/api'
import { useMessageDe } from './runs-commun'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'pret'; vue: VuePopulation; index: VueIndexInverse | null }
  | { phase: 'vide'; message: string }
  | { phase: 'erreur'; message: string }

/** L'ORDRE des tranches est METIER (croissant), jamais celui du JSON. */
const ORDRE_TRANCHES = [
  'moins de 50 000',
  '50 000 a 100 000',
  '100 000 a 150 000',
  '150 000 a 300 000',
  '300 000 et plus',
]
//: L'index de la premiere tranche AU-DELA de la frontiere EF-68 (150 000).
const INDEX_FRONTIERE = 3

/** Barre mesure/cible — l'ecart se VOIT : vert tenu, ambre a expliquer. */
function BarreMesureCible({ libelle, valeur }: { libelle: string; valeur: MesureCible }) {
  const tenu = valeur.mesure === valeur.cible
  const pct = valeur.cible > 0 ? Math.min(100, (valeur.mesure / valeur.cible) * 100) : 0
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
          {libelle}
        </span>
        <span
          className="text-[10px] font-mono"
          style={{ color: tenu ? 'var(--secondary-dark)' : '#92400e' }}
          title={tenu ? 'cible tenue' : 'écart mesuré'}
        >
          {valeur.mesure} / {valeur.cible}
        </span>
      </div>
      <div className="progress-bar mt-0.5" style={{ height: 5 }}>
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: tenu ? 'var(--secondary)' : '#f59e0b' }}
        />
      </div>
    </div>
  )
}

export function Population() {
  const { t, setCurrentPage } = useApp()
  const messageDe = useMessageDe()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })

  const charger = useCallback(async () => {
    setEtat({ phase: 'chargement' })
    try {
      const vue = await lirePopulation()
      // L'index inverse est un COMPLEMENT : son echec n'eteint pas l'ecran.
      let index: VueIndexInverse | null = null
      try {
        index = await lireIndexInverse()
      } catch {
        index = null
      }
      setEtat({ phase: 'pret', vue, index })
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setEtat({ phase: 'vide', message: String(err.detail) })
      } else {
        setEtat({ phase: 'erreur', message: messageDe(err) })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void charger()
  }, [charger])

  if (etat.phase === 'chargement') {
    return (
      <div className="space-y-3">
        <Skeleton height={28} width={280} />
        <Skeleton height={300} />
      </div>
    )
  }
  if (etat.phase === 'vide' || etat.phase === 'erreur') {
    return (
      <div>
        <SectionHeader title={t('pop_titre')} subtitle={t('pop_sous_titre')} />
        <Banniere ton={etat.phase === 'erreur' ? 'danger' : 'info'}>
          {etat.message}
          {etat.phase === 'vide' && (
            <>
              {' — '}
              <button
                className="underline font-semibold"
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                onClick={() => setCurrentPage('runs-preparer')}
              >
                {t('eco_aller_preparer')}
              </button>
            </>
          )}
        </Banniere>
        {etat.phase === 'erreur' && (
          <button className="btn-ghost text-xs mt-3" onClick={() => void charger()}>
            {t('retry')}
          </button>
        )}
      </div>
    )
  }

  const { vue, index } = etat

  // `P-06` — UN PERIMETRE SANS POPULATION EST UN ETAT, PAS UNE ERREUR.
  // La route rendait 404 et l'ecran affichait une erreur technique la ou la
  // verite est simple : le Loader n'a encore peuple personne. Elle rend
  // desormais 200 avec son motif, et c'est ce motif qu'on montre.
  if (vue.quotas_par_pays.length === 0) {
    return (
      <div className="animate-fade-in">
        <SectionHeader title={t('pop_titre')} subtitle={t('pop_sous_titre')} />
        <Card>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {vue.note ?? t('empty_no_data')}
          </p>
        </Card>
      </div>
    )
  }

  const tranches = vue.soldes?.tranches ?? {}
  const totalSoldes = Object.values(tranches).reduce((s, n) => s + n, 0)
  const maxTranche = Math.max(...Object.values(tranches), 1)
  const topOccupations = Object.entries(vue.occupations?.top ?? {})
  const maxOccupation = Math.max(...topOccupations.map(([, n]) => n), 1)
  const naissances = vue.naissances ?? { au_pays: 0, a_l_etranger: 0 }
  const totalNaissances = naissances.au_pays + naissances.a_l_etranger

  return (
    <div className="animate-fade-in">
      <SectionHeader title={t('pop_titre')} subtitle={t('pop_sous_titre')} />
      {/* `P-06` — l'ecran DIT ce qu'il couvre : tous les runs, ou un seul. */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(vue.modes ?? []).map((m) => (
          <span key={m} className="badge-primary font-mono">
            {m}
          </span>
        ))}
        <span className="text-[10px] font-mono self-center" style={{ color: 'var(--text-muted)' }}>
          {vue.libelle ?? (vue.run_id ? `run ${vue.run_id.slice(0, 8)}` : '')}
          {vue.runs_mesures && vue.runs_mesures.length > 1
            ? ` — ${vue.runs_mesures.length} runs cumulés`
            : ''}
        </span>
      </div>

      {/* ── Quotas par pays : MESURE / CIBLE ── */}
      <div className="flex items-center gap-2 mb-2">
        <Target size={14} style={{ color: 'var(--primary-dark)' }} />
        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t('pop_quotas_titre')}
        </p>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {t('pop_quotas_note')}
        </span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {vue.quotas_par_pays.map((quotas) => (
          <Card key={quotas.pays}>
            <p className="font-mono font-bold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
              {quotas.pays}
            </p>
            <div className="space-y-2">
              <BarreMesureCible libelle={t('pop_clients')} valeur={quotas.clients} />
              <BarreMesureCible libelle={t('pop_corporate')} valeur={quotas.corporate} />
              <BarreMesureCible libelle={t('pop_femmes')} valeur={quotas.femmes} />
              <BarreMesureCible libelle={t('pop_jeunes')} valeur={quotas.jeunes} />
              <BarreMesureCible libelle={t('pop_agricoles')} valeur={quotas.agricoles} />
            </div>
            <p className="text-[9px] font-semibold uppercase tracking-wide mt-3 mb-1" style={{ color: 'var(--text-muted)' }}>
              {t('pop_profils')}
            </p>
            <div className="space-y-1.5">
              {Object.entries(quotas.profils).map(([profil, valeur]) => (
                <BarreMesureCible key={profil} libelle={profil} valeur={valeur} />
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* ── Soldes : histogramme + frontiere EF-68 ── */}
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <Coins size={14} style={{ color: 'var(--primary-dark)' }} />
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('pop_soldes_titre')}
            </p>
          </div>
          <p className="text-[10px] mb-3" style={{ color: 'var(--text-muted)' }}>
            {t('pop_soldes_note')}
          </p>
          <div className="space-y-1.5">
            {ORDRE_TRANCHES.map((tranche, i) => {
              const compte = tranches[tranche] ?? 0
              const eligible = i >= INDEX_FRONTIERE
              return (
                <div key={tranche}>
                  {i === INDEX_FRONTIERE && (
                    <div className="flex items-center gap-2 my-2" aria-hidden>
                      <div className="flex-1 border-t border-dashed" style={{ borderColor: 'var(--secondary-dark)' }} />
                      <span className="text-[9px] font-semibold whitespace-nowrap" style={{ color: 'var(--secondary-dark)' }}>
                        {t('pop_frontiere')}
                      </span>
                      <div className="flex-1 border-t border-dashed" style={{ borderColor: 'var(--secondary-dark)' }} />
                    </div>
                  )}
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                      {tranche}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: 'var(--text-primary)' }}>
                      {compte} · {totalSoldes ? Math.round((compte / totalSoldes) * 100) : 0}%
                    </span>
                  </div>
                  <div className="progress-bar mt-0.5" style={{ height: 8 }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(compte / maxTranche) * 100}%`,
                        background: eligible ? 'var(--secondary)' : 'var(--primary)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] font-mono mt-3" style={{ color: 'var(--text-muted)' }}>
            {t('pop_total_dote')} : {(vue.soldes?.total_dote ?? 0).toLocaleString('fr-FR')}
          </p>
        </Card>

        {/* ── Occupations + naissances ── */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase size={14} style={{ color: 'var(--primary-dark)' }} />
              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t('pop_occupations_titre')}
              </p>
              <span className="badge-secondary font-mono">
                {(vue.occupations?.distinctes ?? 0)} / {(vue.occupations?.total ?? 0)}
              </span>
            </div>
            <p className="text-[10px] mb-3" style={{ color: 'var(--text-muted)' }}>
              {t('pop_occupations_note')}
            </p>
            <div className="space-y-1" style={{ maxHeight: 260, overflowY: 'auto' }}>
              {topOccupations.map(([metier, compte]) => (
                <div key={metier} className="flex items-center gap-2">
                  <span className="text-[10px] truncate" style={{ color: 'var(--text-secondary)', width: '55%' }} title={metier}>
                    {metier}
                  </span>
                  <div className="progress-bar flex-1" style={{ height: 5 }}>
                    <div className="progress-fill" style={{ width: `${(compte / maxOccupation) * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)', width: 24, textAlign: 'right' }}>
                    {compte}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Baby size={14} style={{ color: 'var(--primary-dark)' }} />
              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t('pop_naissances_titre')}
              </p>
            </div>
            <div className="progress-bar" style={{ height: 10 }}>
              <div
                className="progress-fill"
                style={{ width: `${totalNaissances ? (naissances.au_pays / totalNaissances) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
              <span>
                {t('pop_au_pays')} : {naissances.au_pays}
              </span>
              <span>
                {t('pop_etranger')} : {naissances.a_l_etranger}
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Index inverse (P-01) ── */}
      {index && (
        <div className="grid lg:grid-cols-2 gap-4 mt-4">
          <Card>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('pop_index_produits')}
            </p>
            {index.clients_par_produit.length === 0 ? (
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {index.note}
              </p>
            ) : (
              <div className="space-y-1">
                {index.clients_par_produit.map((ligne) => (
                  <div key={ligne.product_id} className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-mono truncate" style={{ color: 'var(--text-secondary)' }}>
                      {ligne.marqueur}
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text-primary)' }}>
                      {ligne.clients}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('pop_index_kiosques')}
            </p>
            {index.clients_par_kiosque.length === 0 ? (
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {t('empty_no_data')}
              </p>
            ) : (
              <div className="space-y-1" style={{ maxHeight: 220, overflowY: 'auto' }}>
                {index.clients_par_kiosque.map((ligne) => (
                  <div key={ligne.kiosque_id} className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                      {ligne.nom}
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text-primary)' }}>
                      {ligne.clients}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
