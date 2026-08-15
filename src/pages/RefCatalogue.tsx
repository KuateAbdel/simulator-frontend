// src/pages/RefCatalogue.tsx — US-B5, le catalogue statique de JJB. PHASE 4.
//
// Lecture seule : la matière dont chaque entité est composée (SD-1), avec
// les comptes EXACTS (6/112/27/576/21/4/195/20) que les tests du chargeur
// vérifient — l'écran les affiche pour que la recette puisse comparer.

import { useCallback, useEffect, useState } from 'react'
import {
  Briefcase,
  Building,
  Coins,
  Factory,
  Globe,
  Landmark,
  UserCog,
  Users,
} from 'lucide-react'
import { Card, SectionHeader, TabBar } from '../components/ui'
import { Banniere, KpiCard, Skeleton } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import { lireCatalogueStatique, type CatalogueStatique } from '../lib/api'
import { useMessageDe } from './runs-commun'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'pret'; catalogue: CatalogueStatique }
  | { phase: 'erreur'; message: string }

export function RefCatalogue() {
  const { t } = useApp()
  const messageDe = useMessageDe()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [onglet, setOnglet] = useState('vue')

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

  return (
    <div className="animate-fade-in">
      <SectionHeader title={t('cat_titre')} subtitle={t('cat_sous_titre')} />

      <TabBar
        tabs={[
          { id: 'vue', label: t('cat_onglet_vue') },
          { id: 'secteurs', label: t('cat_onglet_secteurs') },
          { id: 'groupes', label: t('cat_onglet_groupes') },
          { id: 'profils', label: t('cat_onglet_profils') },
          { id: 'dirigeants', label: t('cat_onglet_dirigeants') },
        ]}
        active={onglet}
        onChange={setOnglet}
      />

      {onglet === 'vue' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 stagger">
          <KpiCard libelle={t('cat_industries')} valeur={comptes.industries} icone={<Factory size={16} />} />
          <KpiCard libelle={t('cat_secteurs')} valeur={comptes.secteurs} icone={<Briefcase size={16} />} couleur="var(--primary-dark)" />
          <KpiCard libelle={t('cat_formes')} valeur={comptes.formes_juridiques} icone={<Landmark size={16} />} couleur="var(--secondary)" />
          <KpiCard libelle={t('cat_professions')} valeur={comptes.professions} icone={<UserCog size={16} />} couleur="#f59e0b" />
          <KpiCard libelle={t('cat_groupes')} valeur={comptes.groupes} icone={<Users size={16} />} couleur="var(--secondary-dark)" />
          <KpiCard libelle={t('cat_profils')} valeur={comptes.profils_revenu} icone={<Coins size={16} />} couleur="#6b5b8e" />
          <KpiCard libelle={t('cat_pays_naissance')} valeur={comptes.pays} icone={<Globe size={16} />} couleur="#0ea5e9" />
          <KpiCard libelle={t('cat_dirigeants')} valeur={comptes.fonctions_dirigeant} icone={<Building size={16} />} couleur="#ef4444" />
        </div>
      )}

      {onglet === 'secteurs' && (
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(catalogue.secteurs).map(([secteur, industries]) => (
            <Card key={secteur}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {secteur}{' '}
                <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  ({industries.length})
                </span>
              </p>
              <div className="flex flex-wrap gap-1">
                {industries.map((industrie) => (
                  <span
                    key={industrie}
                    className="text-[10px] rounded-full px-2 py-0.5"
                    style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}
                  >
                    {industrie}
                  </span>
                ))}
              </div>
            </Card>
          ))}
          <Card>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('cat_formes')}{' '}
              <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                ({catalogue.formes_juridiques.length})
              </span>
            </p>
            <div className="flex flex-wrap gap-1">
              {catalogue.formes_juridiques.map((forme) => (
                <span
                  key={forme}
                  className="text-[10px] rounded-full px-2 py-0.5"
                  style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)' }}
                >
                  {forme}
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}

      {onglet === 'groupes' && (
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
                {Object.entries(catalogue.groupes).map(([nom, groupe]) => {
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
                                style={{
                                  background: 'var(--secondary-light)',
                                  color: 'var(--secondary-dark)',
                                }}
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
        </Card>
      )}

      {onglet === 'profils' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('cat_profils')}</th>
                  <th>μ</th>
                  <th>σ</th>
                  <th>{t('cat_definition')}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(catalogue.profils_revenu).map(([nom, profil]) => (
                  <tr key={nom}>
                    <td className="font-semibold">{nom}</td>
                    <td className="font-mono">{profil.mu}</td>
                    <td className="font-mono">{profil.sigma}</td>
                    <td className="text-[11px]">{profil.definition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {onglet === 'dirigeants' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>FR</th>
                  <th>EN</th>
                  <th>—</th>
                </tr>
              </thead>
              <tbody>
                {catalogue.fonctions_dirigeant.map((fonction) => (
                  <tr key={fonction.rang}>
                    <td className="font-mono">{fonction.rang}</td>
                    <td>{fonction.francais}</td>
                    <td>{fonction.anglais}</td>
                    <td className="font-mono">{fonction.abreviation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
