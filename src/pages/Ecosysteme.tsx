// src/pages/Ecosysteme.tsx — US-E2, l'arbre organisationnel. PHASE 6.
//
// LA structure que la plateforme elle-meme ne sait pas montrer, parce que
// org_hierarchy est A NOUS : Branche (pays/region) → Agence (ville) →
// Kiosque (agents, clients). Meme pattern pliable que la Geographie — un
// cockpit coherent se lit d'un ecran a l'autre. Etat vide HONNETE : pas de
// run, pas d'arbre — et le geste pour en avoir un est dit.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Network, Store } from 'lucide-react'
import { Card, SectionHeader } from '../components/ui'
import { Banniere, Skeleton } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import { ApiError, lireEcosysteme, type VueEcosysteme } from '../lib/api'
import { useMessageDe } from './runs-commun'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'pret'; vue: VueEcosysteme }
  | { phase: 'vide'; message: string }
  | { phase: 'erreur'; message: string }

export function Ecosysteme() {
  const { t, setCurrentPage } = useApp()
  const messageDe = useMessageDe()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [ouverts, setOuverts] = useState<Record<string, boolean>>({})
  const [filtre, setFiltre] = useState('')

  const charger = useCallback(async () => {
    setEtat({ phase: 'chargement' })
    try {
      const vue = await lireEcosysteme()
      if (vue.run_id === null || vue.branches.length === 0) {
        setEtat({ phase: 'vide', message: vue.note ?? t('eco_vide') })
      } else {
        setEtat({ phase: 'pret', vue })
      }
    } catch (err) {
      // 404 « aucun noeud pour le run » = un DRY sans arbre — vide honnete.
      if (err instanceof ApiError && err.status === 404) {
        setEtat({ phase: 'vide', message: String(err.detail) })
      } else {
        setEtat({ phase: 'erreur', message: messageDe(err) })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t])

  useEffect(() => {
    void charger()
  }, [charger])

  const basculer = (cle: string) => setOuverts((o) => ({ ...o, [cle]: !o[cle] }))

  const branchesFiltrees = useMemo(() => {
    if (etat.phase !== 'pret') return []
    const bas = filtre.trim().toLowerCase()
    if (!bas) return etat.vue.branches
    return etat.vue.branches
      .map((branche) => ({
        ...branche,
        agences: branche.agences
          .map((agence) => ({
            ...agence,
            kiosques: agence.kiosques.filter(
              (kiosque) =>
                kiosque.nom.toLowerCase().includes(bas) ||
                agence.nom.toLowerCase().includes(bas) ||
                branche.nom.toLowerCase().includes(bas) ||
                branche.pays.toLowerCase().includes(bas),
            ),
          }))
          .filter(
            (agence) =>
              agence.kiosques.length > 0 ||
              agence.nom.toLowerCase().includes(bas) ||
              branche.nom.toLowerCase().includes(bas),
          ),
      }))
      .filter(
        (branche) =>
          branche.agences.length > 0 ||
          branche.nom.toLowerCase().includes(bas) ||
          branche.pays.toLowerCase().includes(bas),
      )
  }, [etat, filtre])

  if (etat.phase === 'chargement') {
    return (
      <div className="space-y-3">
        <Skeleton height={28} width={280} />
        <Skeleton height={300} />
      </div>
    )
  }
  if (etat.phase === 'erreur' || etat.phase === 'vide') {
    return (
      <div>
        <SectionHeader title={t('eco_titre')} subtitle={t('eco_sous_titre')} />
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

  const { vue } = etat
  return (
    <div className="animate-fade-in">
      <SectionHeader title={t('eco_titre')} subtitle={t('eco_sous_titre')} />

      {/* Les comptes du run — la taille de l'arbre, chiffree */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(vue.comptes ?? {}).map(([niveau, compte]) => (
          <span key={niveau} className="badge-primary font-mono">
            {compte} {niveau}
          </span>
        ))}
        <span className="text-[10px] font-mono self-center" style={{ color: 'var(--text-muted)' }}>
          run {vue.run_id}
        </span>
      </div>

      <input
        className="input-base mb-3"
        style={{ maxWidth: 420 }}
        placeholder={t('eco_recherche')}
        value={filtre}
        onChange={(e) => setFiltre(e.target.value)}
      />

      <Card style={{ padding: '8px 12px' }}>
        {branchesFiltrees.map((branche) => (
          <div key={branche.id} className="py-1">
            <button
              className="flex items-center gap-2 w-full text-left flex-wrap"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px' }}
              onClick={() => basculer(branche.id)}
            >
              {ouverts[branche.id] || filtre ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <Network size={13} style={{ color: 'var(--primary-dark)' }} />
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {branche.nom}
              </span>
              <span className="badge-primary font-mono">{branche.pays}</span>
              {branche.region && (
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {branche.region}
                </span>
              )}
              <span className="text-[10px] font-mono ml-auto" style={{ color: 'var(--text-muted)' }}>
                {branche.agences.length} {t('eco_agences')}
              </span>
            </button>
            {(ouverts[branche.id] || filtre) &&
              branche.agences.map((agence) => (
                <div key={agence.id} className="ml-5 border-l pl-3" style={{ borderColor: 'var(--border)' }}>
                  <button
                    className="flex items-center gap-2 w-full text-left flex-wrap"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px' }}
                    onClick={() => basculer(agence.id)}
                  >
                    {ouverts[agence.id] || filtre ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {agence.nom}
                    </span>
                    {agence.ville && (
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {agence.ville}
                      </span>
                    )}
                    <span className="text-[10px] font-mono ml-auto" style={{ color: 'var(--text-muted)' }}>
                      {agence.kiosques.length} {t('eco_kiosques')}
                    </span>
                  </button>
                  {(ouverts[agence.id] || filtre) &&
                    agence.kiosques.map((kiosque) => (
                      <div
                        key={kiosque.id}
                        className="ml-5 border-l pl-3 flex items-center gap-2 flex-wrap"
                        style={{ borderColor: 'var(--border)', padding: '3px 2px' }}
                      >
                        <Store size={11} style={{ color: 'var(--secondary-dark)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
                          {kiosque.nom}
                        </span>
                        {kiosque.quartier && (
                          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                            {kiosque.quartier}
                          </span>
                        )}
                        <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                          {kiosque.nb_agents} {t('eco_agents')} · {kiosque.nb_clients} {t('eco_clients')}
                        </span>
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
