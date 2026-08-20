// src/pages/RefCatalogue.tsx — US-B5, le Catalogue statique de JJB.
//
// Toute la matière dont chaque entité est composée (SD-1), avec les comptes
// EXACTS (6/112/27/576/21/4/195/20) que les tests du chargeur vérifient. La
// page reflète la conception d'ensemble : une bande de repères, puis cinq
// vues — Vue d'ensemble, Industries & secteurs (graphe n:n), Produits (l'offre
// LENDING/COLLECT), Professions (groupes × profils de revenu) et Dirigeants.
// Rien de nouveau dans la sidebar : tout vit dans le Catalogue.

import { useCallback, useEffect, useState } from 'react'
import { Download, Package, Plus, Trash2 } from 'lucide-react'
import { Card, SectionHeader, TabBar } from '../components/ui'
import { Modale } from '../components/ui/Modale'
import { Banniere, Skeleton } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import { usePagination } from '../hooks/usePagination'
import { Pager } from '../components/Pager'
import {
  ajouterDirigeant,
  ajouterProfession,
  lireCatalogueStatique,
  lireProduitsCatalogue,
  retirerDirigeant,
  retirerProfession,
  type CatalogueStatique,
  type ProduitsCatalogue,
} from '../lib/api'
import type { TranslationKey } from '../i18n'
import { useMessageDe } from './runs-commun'
import { IndustriesSecteurs } from './RefCatalogueSecteurs'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'pret'; catalogue: CatalogueStatique }
  | { phase: 'erreur'; message: string }

export function RefCatalogue() {
  const { t } = useApp()
  const messageDe = useMessageDe()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [onglet, setOnglet] = useState('secteurs')
  const [produits, setProduits] = useState<ProduitsCatalogue | null>(null)
  const [produitsErr, setProduitsErr] = useState<string | null>(null)
  const [modale, setModale] = useState<null | 'dirigeant' | 'profession'>(null)

  const charger = useCallback(async () => {
    setEtat({ phase: 'chargement' })
    try {
      setEtat({ phase: 'pret', catalogue: await lireCatalogueStatique() })
    } catch (err) {
      setEtat({ phase: 'erreur', message: messageDe(err) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void charger()
  }, [charger])

  // Produits chargés à la demande, quand l'onglet s'ouvre (offre séparée du référentiel).
  useEffect(() => {
    if (onglet !== 'produits' || produits || etat.phase !== 'pret') return
    lireProduitsCatalogue()
      .then(setProduits)
      .catch((err) => setProduitsErr(messageDe(err)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onglet, produits, etat.phase])

  const groupesListe = etat.phase === 'pret' ? Object.entries(etat.catalogue.groupes) : []
  const dirigeantsListe = etat.phase === 'pret' ? etat.catalogue.fonctions_dirigeant : []
  const pgGroupes = usePagination(groupesListe, 10, onglet)
  const pgDirigeants = usePagination(dirigeantsListe, 10, onglet)

  if (etat.phase === 'chargement') {
    return (
      <div className="space-y-3">
        <Skeleton height={28} width={240} />
        <Skeleton height={280} />
      </div>
    )
  }
  if (etat.phase === 'erreur') {
    return (
      <div>
        <SectionHeader title={t('cat_titre')} />
        <Banniere ton="danger">{etat.message}</Banniere>
        <button className="btn-ghost text-xs mt-3" onClick={() => void charger()}>
          {t('retry')}
        </button>
      </div>
    )
  }

  const { catalogue } = etat
  const comptes = catalogue.comptes
  const ponts = Object.values(catalogue.secteurs).filter((l) => l.length > 1).length
  const nbSurcouche = catalogue.secteurs_surcouche?.length ?? 0
  const nbIndSurcouche = catalogue.industries_surcouche?.length ?? 0
  const dirigeantsSurcouche = new Set(catalogue.dirigeants_surcouche ?? [])
  const professionsSurcouche = new Set(catalogue.professions_surcouche ?? [])
  const rafraichir = () => void charger()

  const exporter = () => {
    const contenu = JSON.stringify(
      { exporte_le: new Date().toISOString(), ...catalogue, produits },
      null,
      2,
    )
    const url = URL.createObjectURL(new Blob([contenu], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'catalogue-finzuu.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title={t('cat_titre')}
        subtitle={t('cat_sous_titre')}
        action={
          <button className="btn-ghost text-xs flex items-center gap-1.5" onClick={exporter}>
            <Download size={14} />
            {t('cat_exporter')}
          </button>
        }
      />

      {/* Bande de repères — résumé toujours visible, comme un dashboard. */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 mb-4 stagger">
        <Repere n={comptes.industries + nbIndSurcouche} l={t('cat_industries')} c="#6366f1" />
        <Repere n={comptes.secteurs + nbSurcouche} l={t('cat_secteurs')} c="var(--primary-dark)" />
        <Repere n={ponts} l={t('cat_kpi_ponts')} c="#0ea5e9" />
        <Repere n={comptes.groupes} l={t('cat_groupes')} c="var(--secondary-dark)" />
        <Repere n={comptes.professions + professionsSurcouche.size} l={t('cat_professions')} c="#f59e0b" />
        <Repere n={comptes.profils_revenu} l={t('cat_profils')} c="#6b5b8e" />
        <Repere n={comptes.formes_juridiques + (catalogue.formes_surcouche?.length ?? 0)} l={t('cat_formes')} c="var(--secondary)" />
        <Repere n={comptes.fonctions_dirigeant + dirigeantsSurcouche.size} l={t('cat_dirigeants')} c="#ef4444" />
        <Repere n={comptes.pays} l={t('cat_pays_naissance')} c="#0ea5e9" />
      </div>

      <TabBar
        tabs={[
          { id: 'secteurs', label: t('cat_onglet_secteurs') },
          { id: 'produits', label: t('cat_onglet_produits') },
          { id: 'professions', label: t('cat_onglet_professions') },
          { id: 'dirigeants', label: t('cat_onglet_dirigeants') },
        ]}
        active={onglet}
        onChange={setOnglet}
      />

      {onglet === 'secteurs' && (
        <IndustriesSecteurs
          industries={catalogue.industries}
          secteurs={catalogue.secteurs}
          secteursSurcouche={catalogue.secteurs_surcouche ?? []}
          industriesSurcouche={catalogue.industries_surcouche ?? []}
          formes={catalogue.formes_juridiques}
          formesSurcouche={catalogue.formes_surcouche ?? []}
          onRefresh={() => void charger()}
        />
      )}

      {onglet === 'produits' && (
        <ProduitsVue produits={produits} erreur={produitsErr} t={t} />
      )}

      {onglet === 'professions' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <p className="text-xs" style={{ color: 'var(--text-secondary)', maxWidth: '70ch' }}>
              {t('cat_prof_sous_titre')}
            </p>
            <button className="btn-primary text-xs flex items-center gap-1.5 shrink-0" onClick={() => setModale('profession')}>
              <Plus size={14} />
              {t('cat_prof_ajouter')}
            </button>
          </div>
          {professionsSurcouche.size > 0 && (
            <Card>
              <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                {t('cat_prof_ajouts')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[...professionsSurcouche].map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1.5 text-[11px] rounded-full px-2.5 py-1"
                    style={{ background: 'var(--secondary-light)', color: 'var(--secondary-dark)' }}
                  >
                    {p}
                    <Trash2
                      size={11}
                      style={{ cursor: 'pointer' }}
                      onClick={() => void retirerProfession(p).finally(rafraichir)}
                    />
                  </span>
                ))}
              </div>
            </Card>
          )}
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {Object.entries(catalogue.profils_revenu).map(([nom, p]) => (
              <Card key={nom}>
                <span className="badge-primary font-mono">{nom}</span>
                <p className="text-[11.5px] mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {p.definition}
                </p>
                <p className="font-mono text-[10.5px] mt-2" style={{ color: 'var(--text-muted)' }}>
                  µ={p.mu} · σ={p.sigma} · LogNormal
                </p>
              </Card>
            ))}
          </div>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('cat_groupes')}</th>
                    <th>{t('cat_profil_defaut')}</th>
                    <th>{t('cat_professions')}</th>
                    <th>{t('cat_variants')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pgGroupes.pageItems.map(([nom, groupe]) => {
                    const exceptions = Object.entries(groupe.variants)
                    return (
                      <tr key={nom}>
                        <td className="font-semibold">{nom}</td>
                        <td>
                          <span className="badge-primary">{groupe.profil_defaut}</span>
                        </td>
                        <td className="font-mono">{groupe.professions.length}</td>
                        <td>
                          {exceptions.length === 0 ? (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1" style={{ maxWidth: 420 }}>
                              {exceptions.map(([profession, profil]) => (
                                <span
                                  key={profession}
                                  className="text-[9px] rounded-full px-1.5 py-0.5 whitespace-nowrap"
                                  style={{ background: 'var(--secondary-light)', color: 'var(--secondary-dark)' }}
                                  title={`${profession} → ${profil} (${t('cat_variant_bulle')})`}
                                >
                                  {profession} → {profil}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pager
              page={pgGroupes.page}
              nbPages={pgGroupes.nbPages}
              size={pgGroupes.size}
              total={pgGroupes.total}
              from={pgGroupes.from}
              to={pgGroupes.to}
              onPage={pgGroupes.setPage}
              onSize={pgGroupes.setSize}
            />
          </Card>
        </div>
      )}

      {onglet === 'dirigeants' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex justify-end">
            <button className="btn-primary text-xs flex items-center gap-1.5" onClick={() => setModale('dirigeant')}>
              <Plus size={14} />
              {t('cat_dir_ajouter')}
            </button>
          </div>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>FR</th>
                    <th>EN</th>
                    <th>—</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pgDirigeants.pageItems.map((fonction) => (
                    <tr key={fonction.rang}>
                      <td className="font-mono">{fonction.rang}</td>
                      <td>{fonction.francais}</td>
                      <td>{fonction.anglais}</td>
                      <td className="font-mono">{fonction.abreviation}</td>
                      <td>
                        {dirigeantsSurcouche.has(fonction.rang) && (
                          <Trash2
                            size={13}
                            style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
                            aria-label={t('cat_dir_retirer')}
                            onClick={() => void retirerDirigeant(fonction.rang).finally(rafraichir)}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager
              page={pgDirigeants.page}
              nbPages={pgDirigeants.nbPages}
              size={pgDirigeants.size}
              total={pgDirigeants.total}
              from={pgDirigeants.from}
              to={pgDirigeants.to}
              onPage={pgDirigeants.setPage}
              onSize={pgDirigeants.setSize}
            />
          </Card>
        </div>
      )}

      {modale === 'dirigeant' && (
        <ModaleDirigeant
          onClose={() => setModale(null)}
          onDone={() => {
            setModale(null)
            rafraichir()
          }}
          t={t}
          messageDe={messageDe}
        />
      )}
      {modale === 'profession' && (
        <ModaleProfession
          groupes={Object.keys(catalogue.groupes)}
          onClose={() => setModale(null)}
          onDone={() => {
            setModale(null)
            rafraichir()
          }}
          t={t}
          messageDe={messageDe}
        />
      )}
    </div>
  )
}

/* ---------------- Modals d'ajout ---------------- */

function ModaleDirigeant({
  onClose,
  onDone,
  t,
  messageDe,
}: {
  onClose: () => void
  onDone: () => void
  t: (k: TranslationKey) => string
  messageDe: (e: unknown) => string
}) {
  const [rang, setRang] = useState('')
  const [fr, setFr] = useState('')
  const [en, setEn] = useState('')
  const [abr, setAbr] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const valide = Number(rang) >= 1 && fr.trim().length >= 2 && en.trim().length >= 2
  const soumettre = async () => {
    setErr(null)
    setBusy(true)
    try {
      await ajouterDirigeant({ rang: Number(rang), francais: fr.trim(), anglais: en.trim(), abreviation: abr.trim() })
      onDone()
    } catch (e) {
      setErr(messageDe(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modale titre={t('cat_dir_ajouter')} eyebrow={t('cat_dirigeants')} onClose={onClose}>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="text-[11px] font-semibold col-span-2 sm:col-span-1" style={{ color: 'var(--text-secondary)' }}>
          {t('cat_dir_rang')}
          <input className="input-base w-full mt-1 text-sm" type="number" min={1} value={rang} onChange={(e) => setRang(e.target.value)} autoFocus />
        </label>
        <label className="text-[11px] font-semibold col-span-2 sm:col-span-1" style={{ color: 'var(--text-secondary)' }}>
          {t('cat_dir_abr')}
          <input className="input-base w-full mt-1 text-sm" value={abr} onChange={(e) => setAbr(e.target.value)} maxLength={20} />
        </label>
        <label className="text-[11px] font-semibold col-span-2" style={{ color: 'var(--text-secondary)' }}>
          {t('cat_dir_fr')}
          <input className="input-base w-full mt-1 text-sm" value={fr} onChange={(e) => setFr(e.target.value)} maxLength={60} />
        </label>
        <label className="text-[11px] font-semibold col-span-2" style={{ color: 'var(--text-secondary)' }}>
          {t('cat_dir_en')}
          <input className="input-base w-full mt-1 text-sm" value={en} onChange={(e) => setEn(e.target.value)} maxLength={60} />
        </label>
      </div>
      {err && <p className="mt-3 text-[12px] rounded-lg p-2.5" style={{ background: 'color-mix(in srgb, #ef4444 12%, var(--bg))', color: '#b42318' }}>{err}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-ghost text-xs" onClick={onClose}>{t('cat_sec_annuler')}</button>
        <button className="btn-primary text-xs" disabled={!valide || busy} style={{ opacity: !valide || busy ? 0.5 : 1 }} onClick={() => void soumettre()}>
          {busy ? t('cat_sec_ajout_encours') : t('cat_dir_ajouter')}
        </button>
      </div>
    </Modale>
  )
}

function ModaleProfession({
  groupes,
  onClose,
  onDone,
  t,
  messageDe,
}: {
  groupes: string[]
  onClose: () => void
  onDone: () => void
  t: (k: TranslationKey) => string
  messageDe: (e: unknown) => string
}) {
  const [groupe, setGroupe] = useState(groupes[0] ?? '')
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const valide = groupe.length > 0 && label.trim().length >= 2
  const soumettre = async () => {
    setErr(null)
    setBusy(true)
    try {
      await ajouterProfession({ groupe, label: label.trim() })
      onDone()
    } catch (e) {
      setErr(messageDe(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modale titre={t('cat_prof_ajouter')} eyebrow={t('cat_professions')} onClose={onClose}>
      <label htmlFor="prof-groupe" className="block mt-4 text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
        {t('cat_prof_groupe')}
      </label>
      <select id="prof-groupe" className="input-base w-full mt-1 text-sm" value={groupe} onChange={(e) => setGroupe(e.target.value)}>
        {groupes.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
      <label htmlFor="prof-nom" className="block mt-4 text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
        {t('cat_prof_nom')}
      </label>
      <input id="prof-nom" className="input-base w-full mt-1 text-sm" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={80} autoFocus />
      {err && <p className="mt-3 text-[12px] rounded-lg p-2.5" style={{ background: 'color-mix(in srgb, #ef4444 12%, var(--bg))', color: '#b42318' }}>{err}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-ghost text-xs" onClick={onClose}>{t('cat_sec_annuler')}</button>
        <button className="btn-primary text-xs" disabled={!valide || busy} style={{ opacity: !valide || busy ? 0.5 : 1 }} onClick={() => void soumettre()}>
          {busy ? t('cat_sec_ajout_encours') : t('cat_prof_ajouter')}
        </button>
      </div>
    </Modale>
  )
}

/* ---------------- Repère KPI compact ---------------- */

function Repere({ n, l, c }: { n: number; l: string; c: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}>
      <div className="font-mono text-lg font-bold leading-none" style={{ color: c }}>
        {n}
      </div>
      <div className="text-[10px] mt-1 leading-tight" style={{ color: 'var(--text-muted)' }}>
        {l}
      </div>
    </div>
  )
}

/* ---------------- Onglet Produits ---------------- */

function ProduitsVue({
  produits,
  erreur,
  t,
}: {
  produits: ProduitsCatalogue | null
  erreur: string | null
  t: (k: 'cat_prod_sous_titre' | 'cat_prod_lending' | 'cat_prod_collect' | 'cat_montant' | 'cat_categorie') => string
}) {
  if (erreur) return <Banniere ton="danger">{erreur}</Banniere>
  if (!produits)
    return (
      <div className="space-y-3">
        <Skeleton height={20} width={320} />
        <Skeleton height={220} />
      </div>
    )
  return (
    <div className="space-y-4 animate-fade-in">
      <p className="text-xs" style={{ color: 'var(--text-secondary)', maxWidth: '72ch' }}>
        {t('cat_prod_sous_titre')}
      </p>
      <BlocProduits
        titre={t('cat_prod_lending')}
        teinte="#a855f7"
        items={produits.lending}
        montant
        t={t}
      />
      <BlocProduits titre={t('cat_prod_collect')} teinte="#0ea5e9" items={produits.collect} t={t} />
    </div>
  )
}

function BlocProduits({
  titre,
  teinte,
  items,
  montant = false,
  t,
}: {
  titre: string
  teinte: string
  items: ProduitsCatalogue['lending']
  montant?: boolean
  t: (k: 'cat_montant' | 'cat_categorie') => string
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Package size={15} style={{ color: teinte }} />
        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {titre}
        </h3>
        <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
          ({items.length})
        </span>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map((p) => (
          <Card key={`${p.nom}-${p.categorie}`}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {p.nom}
              </p>
              <span
                className="font-mono text-[9px] font-bold rounded px-1.5 py-0.5"
                style={{ background: `${teinte}1e`, color: teinte }}
              >
                {p.type}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              <span
                className="rounded-full px-2 py-0.5"
                style={{ border: '1px solid var(--border)' }}
              >
                {p.categorie}
              </span>
              {p.code && <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{p.code}</span>}
              {p.policy_type && <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{p.policy_type}</span>}
            </div>
            {montant && p.montant_min != null && (
              <p className="font-mono text-[10.5px] mt-2" style={{ color: 'var(--text-muted)' }}>
                {t('cat_montant')} {p.montant_min.toLocaleString()} → {p.montant_max?.toLocaleString()}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
