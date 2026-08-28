// src/pages/AttributionBaux.tsx
//
// BAUX ACTIFS — l'écran de travail du tableau de bord d'attribution
// (FZ-SPEC-DASHATTRIB-2026-001 §5.2). Qui détient quoi, sur quel appareil,
// combien de temps reste-t-il.
//
// LES RÈGLES QUI STRUCTURENT CET ÉCRAN :
//   · ENF-D01 — la liste s'affiche d'UN SEUL appel Loader, jointure
//     territoriale comprise ; aucun appel par ligne, jamais.
//   · Tri par échéance croissante : ce qui expire en premier apparaît en
//     premier (§5.2) — c'est la colonne Reste qui commande l'attention.
//   · Le compte à rebours se cale sur l'HORLOGE DU SERVEUR (releve_le) —
//     jamais sur le poste (contrat §3).
//   · Vocabulaire diapo 7 : « Numéro attribué » jamais MSISDN,
//     « Non renseigné » jamais un tiret, « Reprendre » distinct du
//     « rendu par l'appareil ».
//   · peutEcrire consommé : un lecteur ne voit AUCUNE action d'écriture
//     active — plus strict que le reste du Loader, assumé (arbitrage
//     27/08). La reprise est en outre réservée au super_admin, comme l'API.
//   · AFF-05 : aucun code technique à l'écran — les erreurs parlent français.
//   · AFF-09 : le fuseau d'affichage est déclaré sous le titre.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Download, Pencil, RefreshCw, Search, Undo2 } from 'lucide-react'
import {
  listerBauxAttribution,
  nommerInterlocuteur,
  reprendreBail,
  reprendreBaux,
  type BailAttribution,
  type RecensementBaux,
} from '../lib/api'
import { Card, EmptyState, SectionHeader } from '../components/ui'
import { Banniere, ConfirmDialog, Skeleton, useToast } from '../components/ui/loader'
import { CompteARebours } from '../components/CompteARebours'
import { DossierClient } from '../components/DossierClient'
import { ReglageDuree } from '../components/ReglageDuree'
import { Pager } from '../components/Pager'
import { usePagination } from '../hooks/usePagination'
import { normaliser } from '../components/FiltreListe'
import { useApp } from '../context/AppContext'

const JOUR = 86_400_000

/** « 237 698 508 963 » — le numéro se LIT, il ne se déchiffre pas.
 *  Groupes de trois depuis la gauche ; un chiffre qui resterait SEUL en
 *  queue (numéros à 13 chiffres, côte d'Ivoire) rejoint le groupe
 *  précédent : « …043 4 » se lirait comme une faute, « …0434 » se lit. */
export function formaterNumero(msisdn: string): string {
  const groupes = msisdn.match(/.{1,3}/g) ?? [msisdn]
  const dernier = groupes[groupes.length - 1]
  if (groupes.length > 1 && dernier.length === 1) {
    groupes.splice(groupes.length - 2, 2, groupes[groupes.length - 2] + dernier)
  }
  return groupes.join(' ')
}

type EtatFiltre = 'actifs' | 'echus' | 'tous'
type EcheanceFiltre = 'toutes' | '24h' | '48h'

export function AttributionBaux() {
  const { t, lang, peutEcrire, session } = useApp()
  const { pousser } = useToast()
  const estSuperAdmin = session?.role === 'super_admin'

  const [recensement, setRecensement] = useState<RecensementBaux | null>(null)
  const [chargement, setChargement] = useState(true)
  const [enPanne, setEnPanne] = useState(false)
  /** Horloge serveur − horloge locale, figé à CHAQUE relevé. */
  const [decalageMs, setDecalageMs] = useState(0)

  const [etat, setEtat] = useState<EtatFiltre>('actifs')
  const [recherche, setRecherche] = useState('')
  const [pays, setPays] = useState('')
  const [echeance, setEcheance] = useState<EcheanceFiltre>('toutes')
  const [selection, setSelection] = useState<Set<string>>(new Set())

  const [dossierOuvert, setDossierOuvert] = useState<string | null>(null)
  const [aReprendre, setAReprendre] = useState<string[] | null>(null)
  const [motif, setMotif] = useState('')
  const [repriseEnCours, setRepriseEnCours] = useState(false)

  const charger = useCallback(
    async (silencieux = false) => {
      if (!silencieux) setChargement(true)
      try {
        const corps = await listerBauxAttribution(etat)
        setRecensement(corps)
        setDecalageMs(Date.parse(corps.releve_le) - Date.now())
        setEnPanne(false)
      } catch {
        // AFF-05 : l'échec se dit en clair, jamais en code. Les données déjà
        // affichées RESTENT — vue de masse d'abord, même plateforme muette.
        setEnPanne(true)
      } finally {
        setChargement(false)
      }
    },
    [etat],
  )

  useEffect(() => {
    void charger()
    // Le rafraîchissement de fond (60 s) est SILENCIEUX : pas de squelette
    // qui clignote devant un partenaire. Le compte à rebours, lui, bat tout
    // seul (ENF-D04).
    const minuteur = setInterval(() => void charger(true), 60_000)
    return () => clearInterval(minuteur)
  }, [charger])

  // La sélection ne survit pas à un changement de périmètre : cocher dans
  // « actifs » puis reprendre dans « tous » serait un piège.
  useEffect(() => setSelection(new Set()), [etat])

  const paysDisponibles = useMemo(
    () =>
      [...new Set((recensement?.baux ?? []).map((b) => b.profil?.pays).filter(Boolean))].sort(),
    [recensement],
  )

  /** La recherche UNIQUE (§7) : confrontée aux trois champs à la fois, et le
   *  résultat DIT lequel a répondu — l'opérateur n'a pas à choisir sa
   *  catégorie avant de savoir ce qu'il cherche. */
  const correspond = useCallback(
    (bail: BailAttribution): string | null => {
      const brut = normaliser(recherche.trim())
      if (!brut) return ''
      if (bail.interlocuteur && normaliser(bail.interlocuteur).includes(brut))
        return t('attr_corresp_interlocuteur')
      if (bail.msisdn.includes(brut.replace(/\s/g, ''))) return t('attr_corresp_numero')
      if (bail.appareil && normaliser(bail.appareil).includes(brut))
        return t('attr_corresp_appareil')
      return null
    },
    [recherche, t],
  )

  const lignes = useMemo(() => {
    const maintenantServeur = Date.now() + decalageMs
    return (recensement?.baux ?? [])
      .map((bail) => ({ bail, marque: correspond(bail) }))
      .filter(({ bail, marque }) => {
        if (marque === null) return false
        if (pays && bail.profil?.pays !== pays) return false
        if (echeance !== 'toutes') {
          if (bail.etat === 'echu') return false
          const reste = Date.parse(bail.expire_le) - maintenantServeur
          if (echeance === '24h' && reste >= JOUR) return false
          if (echeance === '48h' && reste >= 2 * JOUR) return false
        }
        return true
      })
      // §5.2 — l'échéance croissante commande : ce qui expire en premier en
      // premier. Les échus (état « tous ») passent en fin, plus récent d'abord.
      .sort((a, b) => {
        if (a.bail.etat !== b.bail.etat) return a.bail.etat === 'actif' ? -1 : 1
        if (a.bail.etat === 'echu')
          return Date.parse(b.bail.expire_le) - Date.parse(a.bail.expire_le)
        return Date.parse(a.bail.expire_le) - Date.parse(b.bail.expire_le)
      })
  }, [recensement, correspond, pays, echeance, decalageMs])

  const pagination = usePagination(lignes, 10, `${etat}|${recherche}|${pays}|${echeance}`)

  const fuseau = useMemo(() => {
    const minutes = -new Date().getTimezoneOffset()
    const signe = minutes >= 0 ? '+' : '−'
    const h = Math.floor(Math.abs(minutes) / 60)
    const m = Math.abs(minutes) % 60
    return `UTC${signe}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`
  }, [])

  const formaterDate = useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso)),
    [lang],
  )

  const basculerSelection = (msisdn: string) => {
    setSelection((avant) => {
      const suivant = new Set(avant)
      if (suivant.has(msisdn)) suivant.delete(msisdn)
      else suivant.add(msisdn)
      return suivant
    })
  }

  const confirmerReprise = async () => {
    if (!aReprendre || motif.trim().length < 3) return
    setRepriseEnCours(true)
    try {
      if (aReprendre.length === 1) {
        await reprendreBail(aReprendre[0], motif.trim())
        pousser('succes', t('attr_reprise_faite'))
      } else {
        const corps = await reprendreBaux(aReprendre, motif.trim())
        pousser(
          corps.sans_bail ? 'erreur' : 'succes',
          t('attr_reprise_lot_faite')
            .replace('{ok}', String(corps.revoques))
            .replace('{ko}', String(corps.sans_bail)),
        )
      }
      setAReprendre(null)
      setMotif('')
      setSelection(new Set())
      setDossierOuvert((ouvert) => (ouvert && aReprendre.includes(ouvert) ? null : ouvert))
      await charger(true)
    } catch {
      pousser('erreur', t('attr_erreur_chargement'))
    } finally {
      setRepriseEnCours(false)
    }
  }

  const exporterCsv = () => {
    // Les colonnes VISIBLES, telles quelles — l'export dit ce que l'écran
    // dit. BOM pour qu'Excel lise l'UTF-8 sans se faire prier.
    const entetes = [
      t('attr_col_interlocuteur'), t('attr_col_numero'), t('attr_col_profil'),
      t('attr_col_appareil'), t('attr_col_territoire'), t('attr_col_attribue'),
      'expire_le', 'etat',
    ]
    const cellule = (v: string | null | undefined) =>
      `"${String(v ?? '').replace(/"/g, '""')}"`
    const corps = lignes.map(({ bail }) =>
      [
        cellule(bail.interlocuteur),
        cellule(bail.msisdn),
        cellule(
          bail.profil ? `${bail.profil.pays}/${bail.profil.genre}/${bail.profil.categorie}` : '',
        ),
        cellule(bail.appareil),
        cellule(
          bail.territoire
            ? [bail.territoire.ville, bail.territoire.rattache_au_kiosque]
                .filter(Boolean)
                .join(' · ')
            : '',
        ),
        cellule(bail.attribue_le),
        cellule(bail.expire_le),
        cellule(bail.etat),
      ].join(';'),
    )
    const blob = new Blob(['﻿' + [entetes.map(cellule).join(';'), ...corps].join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attribution-baux-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="animate-fade-in">
      <SectionHeader title={t('attr_baux_titre')} subtitle={t('attr_baux_soustitre')} />
      {/* AFF-09 — le fuseau est DÉCLARÉ, pas supposé. */}
      <p style={{ fontSize: 'var(--fs-note)', color: 'var(--text-secondary)', marginTop: -12, marginBottom: 14 }}>
        {t('attr_fuseau').replace('{tz}', fuseau)}
      </p>

      {enPanne && <div className="mb-3"><Banniere ton="attention">{t('attr_erreur_chargement')}</Banniere></div>}

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative flex-1" style={{ minWidth: 220 }}>
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              className="input-base"
              style={{ paddingLeft: 32 }}
              placeholder={t('attr_recherche')}
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              aria-label={t('attr_recherche')}
            />
          </label>
          <select
            className="input-base"
            style={{ width: 'auto' }}
            value={pays}
            onChange={(e) => setPays(e.target.value)}
            aria-label={t('attr_filtre_pays')}
          >
            <option value="">{t('attr_filtre_tous_pays')}</option>
            {paysDisponibles.map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
          <select
            className="input-base"
            style={{ width: 'auto' }}
            value={echeance}
            onChange={(e) => setEcheance(e.target.value as EcheanceFiltre)}
            aria-label={t('attr_filtre_echeance')}
          >
            <option value="toutes">{t('attr_echeance_toutes')}</option>
            <option value="24h">{t('attr_echeance_24h')}</option>
            <option value="48h">{t('attr_echeance_48h')}</option>
          </select>
          <select
            className="input-base"
            style={{ width: 'auto' }}
            value={etat}
            onChange={(e) => setEtat(e.target.value as EtatFiltre)}
            aria-label={t('attr_filtre_etat')}
          >
            <option value="actifs">{t('attr_etat_actifs')}</option>
            <option value="echus">{t('attr_etat_echus')}</option>
            <option value="tous">{t('attr_etat_tous')}</option>
          </select>
          <button className="btn-ghost" onClick={() => void charger()} aria-label={t('attr_rafraichir')}>
            <RefreshCw size={14} /> {t('attr_rafraichir')}
          </button>
          <button className="btn-ghost" onClick={exporterCsv} disabled={lignes.length === 0}>
            <Download size={14} /> {t('attr_exporter')}
          </button>
          <ReglageDuree
            paysDisponibles={paysDisponibles as string[]}
            estSuperAdmin={estSuperAdmin}
            surEnregistre={() => void charger(true)}
          />
          <button
            className="btn-danger-contour"
            disabled={!estSuperAdmin || selection.size === 0}
            title={estSuperAdmin ? undefined : t('attr_reprise_super_admin')}
            onClick={() => setAReprendre([...selection])}
          >
            <Undo2 size={14} /> {t('attr_reprendre_selection')}
            {selection.size > 0 ? ` (${selection.size})` : ''}
          </button>
        </div>
      </Card>

      <Card className="overflow-hidden" style={{ padding: 0 }}>
        {chargement && !recensement ? (
          <div className="p-4" style={{ display: 'grid', gap: 10 }}>
            <Skeleton height={18} /><Skeleton height={18} /><Skeleton height={18} />
          </div>
        ) : lignes.length === 0 ? (
          <EmptyState label={etat === 'echus' ? t('attr_vide_echus') : t('attr_vide_titre')} />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 28 }} aria-label="sélection" />
                    <th>{t('attr_col_interlocuteur')}</th>
                    <th>{t('attr_col_numero')}</th>
                    <th>{t('attr_col_profil')}</th>
                    <th>{t('attr_col_appareil')}</th>
                    <th>{t('attr_col_territoire')}</th>
                    <th>{t('attr_col_attribue')}</th>
                    <th>{t('attr_col_reste')}</th>
                    <th aria-label="actions" />
                  </tr>
                </thead>
                <tbody>
                  {pagination.pageItems.map(({ bail, marque }) => (
                    <LigneBail
                      key={bail.attribution_id}
                      bail={bail}
                      marque={marque || null}
                      decalageMs={decalageMs}
                      coche={selection.has(bail.msisdn)}
                      surCocher={() => basculerSelection(bail.msisdn)}
                      surReprendre={() => setAReprendre([bail.msisdn])}
                      surOuvrir={() => setDossierOuvert(bail.msisdn)}
                      formaterDate={formaterDate}
                      peutEcrire={peutEcrire}
                      estSuperAdmin={estSuperAdmin}
                      surNomme={() => void charger(true)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <Pager
              page={pagination.page} nbPages={pagination.nbPages} size={pagination.size}
              total={pagination.total} from={pagination.from} to={pagination.to}
              onPage={pagination.setPage} onSize={pagination.setSize}
            />
          </>
        )}
      </Card>

      <DossierClient
        msisdn={dossierOuvert}
        onClose={() => setDossierOuvert(null)}
        onReprendre={(numero) => setAReprendre([numero])}
        estSuperAdmin={estSuperAdmin}
      />

      <ConfirmDialog
        ouvert={aReprendre !== null}
        titre={
          aReprendre && aReprendre.length > 1
            ? t('attr_reprise_titre_lot').replace('{n}', String(aReprendre.length))
            : t('attr_reprise_titre')
        }
        libelleConfirmer={
          aReprendre && aReprendre.length > 1
            ? t('attr_reprise_confirmer_lot')
            : t('attr_reprise_confirmer')
        }
        libelleAnnuler={t('annuler')}
        danger
        enCours={repriseEnCours}
        onConfirmer={() => void confirmerReprise()}
        onAnnuler={() => { setAReprendre(null); setMotif('') }}
      >
        <p style={{ fontSize: 'var(--fs-corps)', marginBottom: 10 }}>{t('attr_reprise_rappel')}</p>
        {aReprendre && aReprendre.length === 1 && (
          <p className="font-mono" style={{ fontSize: 'var(--fs-champ)', marginBottom: 10 }}>
            {formaterNumero(aReprendre[0])}
          </p>
        )}
        <label style={{ display: 'block' }}>
          <span style={{ fontSize: 'var(--fs-note)', color: 'var(--text-secondary)' }}>
            {t('attr_reprise_motif')}
          </span>
          <input
            className="input-base"
            style={{ marginTop: 4 }}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            maxLength={280}
          />
        </label>
      </ConfirmDialog>
    </div>
  )
}

function LigneBail({
  bail, marque, decalageMs, coche, surCocher, surReprendre, surOuvrir, formaterDate,
  peutEcrire, estSuperAdmin, surNomme,
}: {
  bail: BailAttribution
  marque: string | null
  decalageMs: number
  coche: boolean
  surCocher: () => void
  surReprendre: () => void
  surOuvrir: () => void
  formaterDate: (iso: string) => string
  peutEcrire: boolean
  estSuperAdmin: boolean
  surNomme: () => void
}) {
  const { t } = useApp()
  const { pousser } = useToast()
  const [edition, setEdition] = useState(false)
  const [brouillon, setBrouillon] = useState(bail.interlocuteur ?? '')
  const refChamp = useRef<HTMLInputElement>(null)
  useEffect(() => { if (edition) refChamp.current?.focus() }, [edition])

  const enregistrer = async () => {
    setEdition(false)
    const propre = brouillon.trim()
    if (propre === (bail.interlocuteur ?? '')) return
    try {
      await nommerInterlocuteur(bail.msisdn, propre)
      pousser('succes', propre ? t('attr_interlocuteur_enregistre') : t('attr_interlocuteur_efface'))
      surNomme()
    } catch {
      setBrouillon(bail.interlocuteur ?? '')
      pousser('erreur', t('attr_erreur_chargement'))
    }
  }

  const territoire = bail.territoire
  return (
    <tr>
      <td>
        <input
          type="checkbox"
          checked={coche}
          onChange={surCocher}
          disabled={!estSuperAdmin || bail.etat === 'echu'}
          aria-label={`${t('attr_reprendre')} ${formaterNumero(bail.msisdn)}`}
        />
      </td>
      <td>
        {edition ? (
          <input
            ref={refChamp}
            className="input-base"
            style={{ minWidth: 140, padding: '4px 8px' }}
            value={brouillon}
            maxLength={80}
            onChange={(e) => setBrouillon(e.target.value)}
            onBlur={() => void enregistrer()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void enregistrer()
              if (e.key === 'Escape') { setBrouillon(bail.interlocuteur ?? ''); setEdition(false) }
            }}
          />
        ) : (
          <button
            className="text-left"
            style={{
              background: 'none', border: 'none', cursor: peutEcrire ? 'pointer' : 'default',
              font: 'inherit', color: bail.interlocuteur ? 'var(--text-primary)' : 'var(--text-muted)',
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: 0,
            }}
            onClick={() => peutEcrire && setEdition(true)}
            disabled={!peutEcrire}
            aria-label={t('attr_col_interlocuteur')}
          >
            {bail.interlocuteur ?? t('attr_non_renseigne')}
            {peutEcrire && <Pencil size={11} style={{ color: 'var(--text-muted)' }} />}
          </button>
        )}
        {marque && (
          <span className="badge-primary" style={{ marginLeft: 6 }}>{marque}</span>
        )}
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        <button
          className="font-mono"
          style={{
            fontVariantNumeric: 'tabular-nums', background: 'none', border: 'none',
            padding: 0, cursor: 'pointer', font: 'inherit', color: 'var(--primary-dark)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
          onClick={surOuvrir}
          aria-label={`${t('dos_ouvrir')} ${formaterNumero(bail.msisdn)}`}
          title={t('dos_ouvrir')}
        >
          {formaterNumero(bail.msisdn)}
        </button>
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        {bail.profil
          ? `${bail.profil.pays} · ${bail.profil.genre === 'FEMALE' ? '♀' : '♂'} · ${bail.profil.categorie === 'CORPORATE' ? 'CORP' : 'INDIV'}`
          : t('attr_non_renseigne')}
      </td>
      <td>{bail.appareil ?? <span style={{ color: 'var(--text-muted)' }}>{t('attr_non_renseigne')}</span>}</td>
      <td style={{ whiteSpace: 'nowrap' }}>
        {territoire?.ville ?? territoire?.pays ?? (
          <span style={{ color: 'var(--text-muted)' }}>{t('attr_non_renseigne')}</span>
        )}
        {territoire?.rattache_au_kiosque && (
          <span style={{ display: 'block', fontSize: 'var(--fs-etiquette)', color: 'var(--text-secondary)' }}>
            {territoire.rattache_au_kiosque}
          </span>
        )}
      </td>
      <td style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
        {formaterDate(bail.attribue_le)}
        {bail.sous_ancien_reglage && (
          <span className="badge-primary" style={{ marginLeft: 6 }} title={t('attr_sous_ancien_reglage')}>
            {bail.accorde_pour_jours} j
          </span>
        )}
      </td>
      <td><CompteARebours expireLe={bail.expire_le} decalageMs={decalageMs} /></td>
      <td style={{ textAlign: 'right' }}>
        <button
          className="btn-danger-contour"
          style={{ padding: '4px 10px', fontSize: 'var(--fs-note)' }}
          disabled={!estSuperAdmin || bail.etat === 'echu'}
          title={estSuperAdmin ? undefined : t('attr_reprise_super_admin')}
          onClick={surReprendre}
        >
          {t('attr_reprendre')}
        </button>
      </td>
    </tr>
  )
}
