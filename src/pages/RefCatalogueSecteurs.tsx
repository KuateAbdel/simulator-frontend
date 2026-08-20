// src/pages/RefCatalogueSecteurs.tsx — US-B5, l'onglet « Industries & secteurs »
// du Catalogue statique. Reste DANS le catalogue (aucune entrée de sidebar).
//
// La donnée de JJB est un graphe n:n : 6 industries (le niveau large), 112
// secteurs (le niveau fin) dont 28 rattachés à ≥2 industries. On ne la
// représente donc PAS en arbre (un secteur-pont y apparaîtrait deux fois) mais
// en FACETTES : industries = filtres, secteurs = atomes. L'industrie principale
// d'un secteur est, comme côté serveur, la première par ordre alphabétique
// (déterministe, stable) — cf. referentiel_statique.industrie_du_secteur.

import { useMemo, useState, type ReactNode } from 'react'
import { LayoutGrid, Plus, Search, Share2, Sparkles, Trash2, X } from 'lucide-react'
import { Card } from '../components/ui'
import { useApp } from '../context/AppContext'
import { usePagination } from '../hooks/usePagination'
import { Pager } from '../components/Pager'
import { ajouterForme, ajouterIndustrie, ajouterSecteur, retirerForme, retirerIndustrie, retirerSecteur } from '../lib/api'
import { GrapheForce, type InfoSurvol } from './RefCatalogueGraphe'
import type { TranslationKey } from '../i18n'

/** 6 teintes catégorielles, une par industrie (repli par index si label inconnu). */
const IND_COLORS: Record<string, string> = {
  'Finance & Insurance': '#6366f1',
  Agriculture: '#19af58',
  Commerce: '#f59e0b',
  'Logistic & Transport': '#0ea5e9',
  Technology: '#a855f7',
  Energy: '#ef4444',
}
const FALLBACK = ['#6366f1', '#19af58', '#f59e0b', '#0ea5e9', '#a855f7', '#ef4444', '#ec4899', '#14b8a6']

/** Les types d'entreprise (CompanyType serveur) pour la liaison générative. */
const TYPES_ENTREPRISE = [
  { v: 'IMF', l: 'Microfinance' },
  { v: 'BANK', l: 'Banque' },
  { v: 'MERCHANT', l: 'Commerçant' },
  { v: 'FONDATION', l: 'Fondation' },
  { v: 'FUNDING_PROVIDER', l: 'Bailleur' },
]

type Props = {
  industries: string[]
  secteurs: Record<string, string[]>
  secteursSurcouche: string[]
  industriesSurcouche: string[]
  formes: string[]
  formesSurcouche: string[]
  onRefresh: () => void
}

export function IndustriesSecteurs({
  industries,
  secteurs,
  secteursSurcouche,
  industriesSurcouche,
  formes,
  formesSurcouche,
  onRefresh,
}: Props) {
  const { t } = useApp()
  const [activeInd, setActiveInd] = useState<string>('') // '' = toutes
  const [q, setQ] = useState('')
  const [vue, setVue] = useState<'grille' | 'structure'>('grille')
  const [selection, setSelection] = useState<string | null>(null)
  const [modale, setModale] = useState(false)
  const ajouts = useMemo(() => new Set(secteursSurcouche), [secteursSurcouche])
  const supprimer = async (nom: string) => {
    try {
      await retirerSecteur(nom)
    } finally {
      onRefresh()
    }
  }
  const indAjouts = useMemo(() => new Set(industriesSurcouche), [industriesSurcouche])
  const [erreurRail, setErreurRail] = useState<string | null>(null)
  const retirerInd = async (nom: string) => {
    setErreurRail(null)
    try {
      await retirerIndustrie(nom)
      onRefresh()
    } catch (e) {
      setErreurRail(e instanceof Error ? e.message : String(e))
    }
  }
  const formesAjouts = useMemo(() => new Set(formesSurcouche), [formesSurcouche])
  const [nouvelleForme, setNouvelleForme] = useState('')
  const ajouterUneForme = async () => {
    const l = nouvelleForme.trim()
    if (!l) return
    try {
      await ajouterForme(l)
      setNouvelleForme('')
    } finally {
      onRefresh()
    }
  }

  const couleur = useMemo(() => {
    const m: Record<string, string> = {}
    industries.forEach((label, i) => (m[label] = IND_COLORS[label] ?? FALLBACK[i % FALLBACK.length]))
    return (label: string) => m[label] ?? '#94a3b8'
  }, [industries])

  const entrees = useMemo(() => Object.entries(secteurs), [secteurs])

  const membres = useMemo(() => {
    const m: Record<string, number> = {}
    industries.forEach((i) => (m[i] = 0))
    entrees.forEach(([, list]) => list.forEach((ind) => ind in m && (m[ind] += 1)))
    return m
  }, [industries, entrees])
  const maxMembres = Math.max(1, ...Object.values(membres))
  const total = entrees.length
  const ponts = entrees.filter(([, l]) => l.length > 1).length

  const principaleDe = (list: string[]) => [...list].sort()[0]

  const liste = useMemo(() => {
    const req = q.trim().toLowerCase()
    let out = entrees
    if (req) out = out.filter(([nom]) => nom.toLowerCase().includes(req))
    else if (activeInd) out = out.filter(([, l]) => l.includes(activeInd))
    return out.slice().sort((a, b) => {
      const am = a[1].length > 1,
        bm = b[1].length > 1
      if (am !== bm) return am ? 1 : -1
      return a[0].localeCompare(b[0])
    })
  }, [entrees, q, activeInd])

  const pgSecteurs = usePagination(liste, 25, `${activeInd}|${q}`)

  const scope = q.trim()
    ? `« ${q.trim()} » — ${liste.length} ${t('cat_secteurs').toLowerCase()}`
    : activeInd
      ? `${activeInd} — ${liste.length} ${t('cat_secteurs').toLowerCase()}`
      : `${t('cat_sec_toutes')} — ${total} ${t('cat_secteurs').toLowerCase()}`

  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-4 animate-fade-in">
      {/* ---------- Volet gauche : facettes industries ---------- */}
      <aside className="space-y-1">
        <Card style={{ padding: 10 }}>
          <p
            className="font-mono text-[10px] tracking-wider uppercase px-2 pb-2 pt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('cat_industries')}
          </p>
          <Facette
            actif={activeInd === ''}
            nom={t('cat_sec_toutes')}
            compte={total}
            ratio={1}
            couleur="var(--primary)"
            multicolore
            onClick={() => {
              setActiveInd('')
              setQ('')
            }}
          />
          {industries.map((ind) => (
            <Facette
              key={ind}
              actif={activeInd === ind}
              nom={ind}
              compte={membres[ind] ?? 0}
              ratio={(membres[ind] ?? 0) / maxMembres}
              couleur={couleur(ind)}
              removable={indAjouts.has(ind)}
              onRemove={() => void retirerInd(ind)}
              onClick={() => {
                setActiveInd(ind)
                setQ('')
              }}
            />
          ))}
          {erreurRail && (
            <p
              className="text-[11px] leading-snug mt-1 rounded-lg p-2"
              style={{ background: 'color-mix(in srgb, #ef4444 12%, var(--surface))', color: '#b42318' }}
            >
              {erreurRail}
            </p>
          )}
          <p
            className="text-[11px] leading-snug px-2 pt-3 mt-2"
            style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}
          >
            {t('cat_sec_regle')}
          </p>
        </Card>
      </aside>

      {/* ---------- Volet principal ---------- */}
      <div className="min-w-0 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('cat_sec_rechercher')}
              className="input-base w-full pl-9 text-xs"
              type="search"
            />
          </div>
          <div className="inline-flex rounded-lg p-0.5 gap-0.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <BoutonVue actif={vue === 'grille'} onClick={() => setVue('grille')} icone={<LayoutGrid size={13} />} label={t('cat_sec_grille')} />
            <BoutonVue actif={vue === 'structure'} onClick={() => setVue('structure')} icone={<Share2 size={13} />} label={t('cat_sec_structure')} />
          </div>
          <button className="btn-primary text-xs flex items-center gap-1.5" onClick={() => setModale(true)}>
            <Plus size={14} />
            {t('cat_sec_ajouter')}
          </button>
        </div>

        {modale && (
          <ModaleAjoutSecteur
            industries={industries}
            couleur={couleur}
            onClose={() => setModale(false)}
            onDone={() => {
              setModale(false)
              onRefresh()
            }}
            t={t}
          />
        )}

        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {scope}
        </p>

        {/* Fiche de détail d'un secteur sélectionné */}
        {selection && secteurs[selection] && (
          <FicheSecteur
            nom={selection}
            inds={secteurs[selection]}
            principale={principaleDe(secteurs[selection])}
            industriesOrdre={industries}
            couleur={couleur}
            onClose={() => setSelection(null)}
            t={t}
          />
        )}

        {vue === 'grille' ? (
          liste.length === 0 ? (
            <Card>
              <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>
                {t('cat_sec_aucun')}
              </p>
            </Card>
          ) : (
            <>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {pgSecteurs.pageItems.map(([nom, inds]) => {
                const principale = principaleDe(inds)
                const multi = inds.length > 1
                const actif = selection === nom
                return (
                  <button
                    key={nom}
                    onClick={() => setSelection(actif ? null : nom)}
                    className="text-left rounded-xl p-3 relative transition-all hover:-translate-y-0.5"
                    style={{
                      background: 'var(--bg)',
                      border: `1px solid ${actif ? couleur(principale) : 'var(--border)'}`,
                      boxShadow: actif ? `0 0 0 1px ${couleur(principale)}` : 'none',
                    }}
                  >
                    <span
                      className="absolute left-0 top-3 bottom-3 w-[3px] rounded"
                      style={{ background: couleur(principale) }}
                    />
                    {multi && (
                      <span
                        className="absolute top-2.5 right-2.5 font-mono text-[9px] font-bold rounded px-1.5 py-0.5"
                        style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)' }}
                      >
                        {t('cat_sec_pont').toUpperCase()} ×{inds.length}
                      </span>
                    )}
                    <p className="text-[13px] font-semibold pl-2 mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                      {nom}
                      {ajouts.has(nom) && (
                        <span
                          className="inline-flex items-center gap-1 font-mono text-[9px] font-bold rounded px-1.5 py-0.5"
                          style={{ background: 'var(--secondary-light)', color: 'var(--secondary-dark)' }}
                          title={t('cat_sec_ajout_bulle')}
                        >
                          <Sparkles size={9} />
                          {t('cat_sec_ajout').toUpperCase()}
                        </span>
                      )}
                      {ajouts.has(nom) && (
                        <span
                          role="button"
                          tabIndex={0}
                          title={t('cat_sec_retirer')}
                          onClick={(e) => {
                            e.stopPropagation()
                            void supprimer(nom)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation()
                              void supprimer(nom)
                            }
                          }}
                          className="inline-flex items-center cursor-pointer ml-auto p-0.5 rounded"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Trash2 size={12} />
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-1 pl-2">
                      {[...inds].sort().map((ind) => (
                        <Puce key={ind} nom={ind} couleur={couleur(ind)} principale={ind === principale} />
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
            <Pager
              page={pgSecteurs.page}
              nbPages={pgSecteurs.nbPages}
              size={pgSecteurs.size}
              total={pgSecteurs.total}
              from={pgSecteurs.from}
              to={pgSecteurs.to}
              onPage={pgSecteurs.setPage}
              onSize={pgSecteurs.setSize}
            />
            </>
          )
        ) : (
          <VueStructure
            industries={industries}
            secteurs={secteurs}
            membres={membres}
            couleur={couleur}
            ponts={ponts}
            t={t}
          />
        )}

        {/* Formes juridiques — avec ajout/retrait via la surcouche */}
        <Card>
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('cat_formes')}{' '}
              <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                ({formes.length})
              </span>
            </p>
            <div className="flex items-center gap-1.5">
              <input
                className="input-base text-xs"
                style={{ height: 28, width: 130 }}
                placeholder={t('cat_forme_nom')}
                value={nouvelleForme}
                maxLength={40}
                onChange={(e) => setNouvelleForme(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void ajouterUneForme()
                }}
              />
              <button
                className="btn-primary text-xs flex items-center gap-1"
                style={{ height: 28 }}
                disabled={!nouvelleForme.trim()}
                onClick={() => void ajouterUneForme()}
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {formes.map((forme) => {
              const ajout = formesAjouts.has(forme)
              return (
                <span
                  key={forme}
                  className="inline-flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5"
                  style={{
                    background: ajout ? 'var(--secondary-light)' : 'var(--primary-light)',
                    color: ajout ? 'var(--secondary-dark)' : 'var(--primary-dark)',
                  }}
                >
                  {forme}
                  {ajout && (
                    <X
                      size={10}
                      style={{ cursor: 'pointer' }}
                      onClick={() => void retirerForme(forme).finally(onRefresh)}
                    />
                  )}
                </span>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ---------------- sous-composants ---------------- */

function Facette({
  actif,
  nom,
  compte,
  ratio,
  couleur,
  multicolore = false,
  removable = false,
  onRemove,
  onClick,
}: {
  actif: boolean
  nom: string
  compte: number
  ratio: number
  couleur: string
  multicolore?: boolean
  removable?: boolean
  onRemove?: () => void
  onClick: () => void
}) {
  const { t } = useApp()
  return (
    <button
      onClick={onClick}
      aria-pressed={actif}
      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-0.5 transition-colors"
      style={{
        background: actif ? 'var(--surface)' : 'transparent',
        border: `1px solid ${actif ? 'var(--border)' : 'transparent'}`,
      }}
    >
      <span
        className="w-2.5 h-2.5 rounded-sm shrink-0"
        style={{
          background: multicolore
            ? 'conic-gradient(#6366f1,#19af58,#f59e0b,#0ea5e9,#a855f7,#ef4444,#6366f1)'
            : couleur,
        }}
      />
      <span className="flex-1 min-w-0">
        <span
          className="flex items-center gap-1.5 text-[12.5px] font-semibold truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {nom}
          {removable && <Sparkles size={10} style={{ color: 'var(--secondary-dark)' }} />}
        </span>
        <span className="block h-[3px] rounded mt-1 overflow-hidden" style={{ background: 'var(--border)' }}>
          <span className="block h-full rounded" style={{ width: `${Math.round(ratio * 100)}%`, background: couleur }} />
        </span>
      </span>
      <span className="font-mono text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
        {compte}
      </span>
      {removable && (
        <span
          role="button"
          tabIndex={0}
          title={t('cat_ind_retirer')}
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation()
              onRemove?.()
            }
          }}
          className="p-0.5 rounded cursor-pointer shrink-0"
          style={{ color: 'var(--text-muted)' }}
        >
          <Trash2 size={12} />
        </span>
      )}
    </button>
  )
}

function BoutonVue({ actif, onClick, icone, label }: { actif: boolean; onClick: () => void; icone: ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={actif}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-semibold transition-colors"
      style={{
        background: actif ? 'var(--bg)' : 'transparent',
        color: actif ? 'var(--text-primary)' : 'var(--text-muted)',
        boxShadow: actif ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
      }}
    >
      {icone}
      {label}
    </button>
  )
}

function Puce({ nom, couleur, principale }: { nom: string; couleur: string; principale: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold rounded-full px-2 py-0.5"
      style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: couleur }} />
      {nom}
      {principale && <span style={{ color: 'var(--text-muted)' }}>·</span>}
    </span>
  )
}

function FicheSecteur({
  nom,
  inds,
  principale,
  industriesOrdre,
  couleur,
  onClose,
  t,
}: {
  nom: string
  inds: string[]
  principale: string
  industriesOrdre: string[]
  couleur: (l: string) => string
  onClose: () => void
  t: (k: TranslationKey) => string
}) {
  const multi = inds.length > 1
  return (
    <Card style={{ borderColor: couleur(principale) }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
            {multi ? `${t('cat_sec_pont')} · ${inds.length} ${t('cat_industries').toLowerCase()}` : t('cat_secteurs')}
          </p>
          <h3 className="text-lg font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
            {nom}
          </h3>
        </div>
        <button onClick={onClose} className="btn-ghost p-1 rounded-md" aria-label="Fermer">
          <X size={15} />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {[...inds].sort().map((ind) => (
          <span
            key={ind}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-lg px-2.5 py-1"
            style={{ border: `1px solid ${couleur(ind)}55`, color: 'var(--text-primary)' }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: couleur(ind) }} />
            {ind}
            {ind === principale && (
              <span
                className="font-mono text-[9px] font-bold rounded px-1.5 py-0.5"
                style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)' }}
              >
                {t('cat_sec_principale').toUpperCase()}
              </span>
            )}
          </span>
        ))}
      </div>
      <p
        className="text-[11.5px] leading-relaxed mt-3 rounded-lg p-3"
        style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}
      >
        {multi
          ? `${t('cat_sec_regle_titre')} ${principale}.`
          : `${t('cat_sec_mono')} ${principale}.`}
      </p>
      <p className="font-mono text-[10.5px] mt-2" style={{ color: 'var(--text-muted)' }}>
        industry_ids ≈ [ {[...inds].sort().map((i) => industriesOrdre.indexOf(i) + 1).sort((a, b) => a - b).join(', ')} ]
      </p>
    </Card>
  )
}

function VueStructure({
  industries,
  secteurs,
  membres,
  couleur,
  ponts,
  t,
}: {
  industries: string[]
  secteurs: Record<string, string[]>
  membres: Record<string, number>
  couleur: (l: string) => string
  ponts: number
  t: (k: TranslationKey) => string
}) {
  const [info, setInfo] = useState<InfoSurvol>(null)
  return (
    <Card>
      <div className="mb-2 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('cat_sec_struct_titre')}
          </h3>
          <p className="text-[12px] leading-snug mt-0.5" style={{ color: 'var(--text-muted)', maxWidth: '62ch' }}>
            {t('cat_sec_struct_lede')}
          </p>
        </div>
        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
          {industries.map((ind) => (
            <span key={ind} className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: couleur(ind) }} />
              {ind}
            </span>
          ))}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <GrapheForce industries={industries} secteurs={secteurs} couleur={couleur} membres={membres} onHover={setInfo} />
      </div>
      <div className="mt-2 pt-3 min-h-[48px] text-[12.5px]" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
        {info === null ? (
          <span style={{ color: 'var(--text-muted)' }}>
            {ponts} {t('cat_sec_ponts').toLowerCase()} — {t('cat_sec_glisser')}
          </span>
        ) : info.kind === 'hub' ? (
          <span>
            <b style={{ color: 'var(--text-primary)' }}>{info.label}</b> — {info.n} {t('cat_secteurs').toLowerCase()}
          </span>
        ) : (
          <div>
            <b style={{ color: 'var(--text-primary)' }}>{info.label}</b>
            {info.inds.length > 1 ? ` · ${t('cat_sec_pont')}` : ''}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {[...info.inds].sort().map((ind) => (
                <span
                  key={ind}
                  className="inline-flex items-center gap-1 text-[10.5px] rounded-full px-2 py-0.5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: couleur(ind) }} />
                  {ind}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function ModaleAjoutSecteur({
  industries,
  couleur,
  onClose,
  onDone,
  t,
}: {
  industries: string[]
  couleur: (l: string) => string
  onClose: () => void
  onDone: () => void
  t: (k: TranslationKey) => string
}) {
  const [mode, setMode] = useState<'secteur' | 'industrie'>('secteur')
  const [label, setLabel] = useState('')
  const [sel, setSel] = useState<string[]>([])
  const [selTypes, setSelTypes] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const toggle = (ind: string) =>
    setSel((s) => (s.includes(ind) ? s.filter((x) => x !== ind) : [...s, ind]))
  const toggleType = (t: string) =>
    setSelTypes((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))
  const valide = label.trim().length >= 2 && (mode === 'industrie' || sel.length >= 1)
  const soumettre = async () => {
    setErr(null)
    setBusy(true)
    try {
      if (mode === 'industrie') await ajouterIndustrie({ label: label.trim() })
      else await ajouterSecteur({ label: label.trim(), industries: sel, types: selTypes })
      onDone()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(20,10,40,.45)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-5"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 30px 70px -20px rgba(0,0,0,.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
              {t('cat_titre')}
            </p>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {mode === 'industrie' ? t('cat_ind_ajouter') : t('cat_sec_ajouter')}
            </h3>
          </div>
          <button onClick={onClose} className="btn-ghost p-1 rounded-md" aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        <div className="inline-flex rounded-lg p-0.5 gap-0.5 mt-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {(['secteur', 'industrie'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className="px-3 py-1.5 rounded-md text-[12px] font-semibold"
              style={{
                background: mode === m ? 'var(--bg)' : 'transparent',
                color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: mode === m ? '0 1px 2px rgba(0,0,0,.08)' : 'none',
              }}
            >
              {m === 'secteur' ? t('cat_secteurs') : t('cat_industries')}
            </button>
          ))}
        </div>

        <label className="block mt-4 text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
          {mode === 'industrie' ? t('cat_ind_nom_label') : t('cat_sec_nom_label')}
        </label>
        <input
          className="input-base w-full mt-1 text-sm"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="AgriTech"
          maxLength={60}
          autoFocus
        />

        {mode === 'secteur' ? (
          <>
            <p className="mt-4 text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {t('cat_sec_rattacher_label')}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {industries.map((ind) => {
                const on = sel.includes(ind)
                return (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => toggle(ind)}
                    aria-pressed={on}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold text-left"
                    style={{
                      border: `1px solid ${on ? couleur(ind) : 'var(--border)'}`,
                      background: on ? `${couleur(ind)}14` : 'transparent',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: couleur(ind), opacity: on ? 1 : 0.35 }} />
                    {ind}
                  </button>
                )
              })}
            </div>

            <p className="mt-4 text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {t('cat_sec_types_label')}
            </p>
            <p className="text-[10.5px] leading-snug mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {t('cat_sec_types_note')}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TYPES_ENTREPRISE.map((te) => {
                const on = selTypes.includes(te.v)
                return (
                  <button
                    key={te.v}
                    type="button"
                    onClick={() => toggleType(te.v)}
                    aria-pressed={on}
                    className="text-[11.5px] font-semibold rounded-lg px-3 py-1.5"
                    style={{
                      border: `1px solid ${on ? 'var(--secondary)' : 'var(--border)'}`,
                      background: on ? 'var(--secondary-light)' : 'transparent',
                      color: on ? 'var(--secondary-dark)' : 'var(--text-primary)',
                    }}
                  >
                    {te.l}
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <p className="mt-3 text-[11.5px] leading-relaxed rounded-lg p-2.5" style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}>
            {t('cat_ind_note')}
          </p>
        )}

        {err && (
          <p
            className="mt-3 text-[12px] rounded-lg p-2.5"
            style={{ background: 'color-mix(in srgb, #ef4444 12%, var(--bg))', color: '#b42318', border: '1px solid color-mix(in srgb, #ef4444 30%, var(--bg))' }}
          >
            {err}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost text-xs" onClick={onClose}>
            {t('cat_sec_annuler')}
          </button>
          <button
            className="btn-primary text-xs"
            disabled={!valide || busy}
            style={{ opacity: !valide || busy ? 0.5 : 1 }}
            onClick={() => void soumettre()}
          >
            {busy ? t('cat_sec_ajout_encours') : mode === 'industrie' ? t('cat_ind_ajouter') : t('cat_sec_ajouter')}
          </button>
        </div>
      </div>
    </div>
  )
}
