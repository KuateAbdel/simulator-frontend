// src/components/DossierClient.tsx
//
// LE DOSSIER CLIENT — le cœur de la conception (DASH §5.3, diapo 5).
// Panneau latéral ouvert depuis une liste ; la liste reste visible et garde
// sa position (PanneauLateral s'en charge). Sept blocs, chargés EN UN appel
// Loader qui fait lui-même les quatre appels plateforme — et chaque bloc
// porte sa donnée OU sa raison d'absence (AFF-06) : une panne d'un service
// n'emporte jamais ce que les autres ont répondu.
//
// SQUELETTE PAR BLOC, jamais d'écran d'attente global : l'en-tête (⚡ local)
// s'affiche pendant que la plateforme répond.
//
// Le relevé ne se charge PAS avec le dossier — il compte une ligne
// aujourd'hui, des dizaines avec le module de vie. Il se déplie sur demande.

import { useCallback, useEffect, useState } from 'react'
import { Pager } from './Pager'
import { usePagination } from '../hooks/usePagination'
import {
  dossierClient,
  releveClient,
  type DossierClient as Dossier,
  type LigneReleve,
} from '../lib/api'
import { PanneauLateral } from './ui/PanneauLateral'
import { Banniere, Skeleton } from './ui/loader'
import { CompteARebours } from './CompteARebours'
import { formaterNumero } from '../pages/AttributionBaux'
import { useApp } from '../context/AppContext'

export function DossierClient({
  msisdn,
  onClose,
  onReprendre,
  estSuperAdmin,
}: {
  msisdn: string | null
  onClose: () => void
  /** Délégué à l'écran : la confirmation (motif, journal) y vit déjà. */
  onReprendre: (msisdn: string) => void
  estSuperAdmin: boolean
}) {
  const { t, lang } = useApp()
  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [enPanne, setEnPanne] = useState(false)
  const [releve, setReleve] = useState<LigneReleve[] | null>(null)
  const [releveEnCours, setReleveEnCours] = useState(false)
  const [releveRaison, setReleveRaison] = useState<string | null>(null)

  useEffect(() => {
    setDossier(null)
    setReleve(null)
    setReleveRaison(null)
    setEnPanne(false)
    if (!msisdn) return
    let vivant = true
    dossierClient(msisdn)
      .then((d) => vivant && setDossier(d))
      .catch(() => vivant && setEnPanne(true))
    return () => {
      vivant = false
    }
  }, [msisdn])

  const chargerReleve = useCallback(async () => {
    if (!msisdn) return
    setReleveEnCours(true)
    try {
      const corps = await releveClient(msisdn)
      if (corps.operations.present) setReleve(corps.operations.lignes)
      else setReleveRaison(corps.operations.raison)
    } catch {
      setReleveRaison(t('attr_erreur_chargement'))
    } finally {
      setReleveEnCours(false)
    }
  }, [msisdn, t])

  //: §5.3 — le relevé « se déplie sur demande, et se pagine » : une ligne
  //: aujourd'hui, des dizaines avec le module de vie.
  const pgReleve = usePagination(releve ?? [], 10, msisdn)

  const formaterDate = useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      }).format(new Date(iso)),
    [lang],
  )
  const montant = useCallback(
    (n: number, devise?: string) =>
      `${new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
        maximumFractionDigits: 2,
      }).format(n)}${devise ? ` ${devise}` : ''}`,
    [lang],
  )

  /** Une date ISO (avec ou sans heure) rendue LISIBLE — jamais un
   *  horodatage brut devant un partenaire. Illisible ? On rend tel quel
   *  plutôt que d'inventer. */
  const dateCourte = useCallback(
    (brut: unknown): string | null => {
      if (typeof brut !== 'string' || !brut.trim()) return null
      const instant = Date.parse(brut)
      if (Number.isNaN(instant)) return brut
      return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      }).format(new Date(instant))
    },
    [lang],
  )

  if (!msisdn) return null
  const decalageMs = dossier ? Date.parse(dossier.entete.releve_le) - Date.now() : 0
  const identite = dossier?.identite.present ? (dossier.identite as Record<string, unknown>) : null
  const ch = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null)

  return (
    <PanneauLateral
      ouvert
      eyebrow={t('dos_eyebrow')}
      titre={formaterNumero(msisdn)}
      labelFermer={t('dos_fermer')}
      onClose={onClose}
      pied={
        dossier?.entete.etat === 'actif' ? (
          <button
            className="btn-danger"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={!estSuperAdmin}
            title={estSuperAdmin ? undefined : t('attr_reprise_super_admin')}
            onClick={() => onReprendre(msisdn)}
          >
            {t('dos_reprendre_pied')}
          </button>
        ) : undefined
      }
    >
      <div style={{ display: 'grid', gap: 16 }}>
        {enPanne && <Banniere ton="attention">{t('attr_erreur_chargement')}</Banniere>}

        {/* ── En-tête — ⚡ local, immédiat ─────────────────────────────── */}
        {dossier ? (
          <div className="card" style={{ padding: 14 }}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p style={{ fontSize: 'var(--fs-champ)', fontWeight: 600 }}>
                  {dossier.entete.interlocuteur ?? (
                    <span style={{ color: 'var(--text-muted)' }}>{t('attr_non_renseigne')}</span>
                  )}
                </p>
                <p style={{ fontSize: 'var(--fs-note)', color: 'var(--text-secondary)' }}>
                  {dossier.entete.profil
                    ? `${dossier.entete.profil.pays} · ${dossier.entete.profil.genre} · ${dossier.entete.profil.categorie}`
                    : ''}
                  {dossier.entete.appareil ? ` · ${dossier.entete.appareil}` : ''}
                </p>
              </div>
              <CompteARebours expireLe={dossier.entete.expire_le} decalageMs={decalageMs} />
            </div>
            <div className="flex gap-4 mt-2" style={{ fontSize: 'var(--fs-note)' }}>
              {dossier.entete.langue && (
                <span>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('dos_langue')} </span>
                  {dossier.entete.langue.toUpperCase()}
                </span>
              )}
              {dossier.entete.segment && (
                <span>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('dos_segment')} </span>
                  {dossier.entete.segment}
                </span>
              )}
            </div>
          </div>
        ) : (
          <Skeleton height={72} />
        )}

        {/* ── Identité ────────────────────────────────────────────────── */}
        <Bloc titre={t('dos_identite')} bloc={dossier?.identite} chargement={!dossier}>
          {identite && (
            <dl style={{ display: 'grid', gap: 6, fontSize: 'var(--fs-corps)' }}>
              <Ligne l={t('dos_nom')} v={[ch(identite.first_name), ch(identite.last_name)].filter(Boolean).join(' ')} />
              <Ligne
                l={t('dos_naissance')}
                v={
                  dateCourte(identite.date_of_birth) &&
                  `${dateCourte(identite.date_of_birth)}${ch(identite.place_of_birth) ? ` — ${identite.place_of_birth}` : ''}`
                }
              />
              <Ligne l={t('dos_situation')} v={ch(identite.marital_status)} />
              <Ligne l={t('dos_profession')} v={ch(identite.occupation)} />
              <Ligne l={t('dos_nationalite')} v={ch(identite.nationality)} />
              <Ligne
                l={t('dos_piece')}
                v={
                  ch(identite.id_number) &&
                  `${identite.id_number}${dateCourte(identite.id_expire_on) ? ` · ${t('dos_piece_expire')} ${dateCourte(identite.id_expire_on)}` : ''}`
                }
              />
              <Ligne l={t('dos_email')} v={ch(identite.email)} />
            </dl>
          )}
        </Bloc>

        {/* ── Territoire — AFF-04 : rattachée, jamais « active chez » ──── */}
        <Bloc
          titre={t('dos_territoire')}
          bloc={dossier ? { present: dossier.territoire.present } : undefined}
          chargement={!dossier}
        >
          {dossier?.territoire && (
            <div style={{ display: 'grid', gap: 6, fontSize: 'var(--fs-corps)' }}>
              {dossier.territoire.rattachement?.rattache_au_kiosque && (
                <Ligne
                  l={t('dos_rattachement')}
                  v={[
                    dossier.territoire.rattachement.rattache_au_kiosque,
                    dossier.territoire.rattachement.quartier,
                  ].filter(Boolean).join(' — ')}
                />
              )}
              <Ligne
                l={t('dos_adresse')}
                v={[
                  ch(dossier.territoire.adresse?.address_line_1),
                  ch(dossier.territoire.adresse?.city) ?? dossier.territoire.rattachement?.ville,
                  ch(dossier.territoire.adresse?.region) ?? dossier.territoire.rattachement?.region,
                  ch(dossier.territoire.adresse?.country) ?? dossier.territoire.rattachement?.pays,
                ].filter(Boolean).join(', ')}
              />
            </div>
          )}
        </Bloc>

        {/* ── Compte — AFF-01 : le solde RELU, jamais une somme ────────── */}
        <Bloc titre={t('dos_compte')} bloc={dossier?.compte} chargement={!dossier}>
          {dossier?.compte.present && (
            <div style={{ display: 'grid', gap: 6 }}>
              <p style={{ fontSize: 'var(--fs-etiquette)', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-secondary)' }}>
                {t('dos_solde')}
              </p>
              <p className="font-mono" style={{ fontSize: 'var(--fs-kpi)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {montant(dossier.compte.balance, dossier.compte.currency)}
              </p>
              <dl style={{ display: 'grid', gap: 6, fontSize: 'var(--fs-corps)' }}>
                {dossier.compte.balance_avail !== undefined &&
                  dossier.compte.balance_avail !== dossier.compte.balance && (
                    <Ligne l={t('dos_solde_dispo')} v={montant(dossier.compte.balance_avail, dossier.compte.currency)} />
                  )}
                <Ligne l={t('dos_statut_compte')} v={dossier.compte.status} />
                <Ligne l={t('dos_numero_compte')} v={dossier.compte.account_number ?? null} mono />
                <Ligne l={t('dos_momo')} v={dossier.compte.direct_momo === undefined ? null : dossier.compte.direct_momo ? t('dos_oui') : t('dos_non')} />
              </dl>
            </div>
          )}
        </Bloc>

        {/* ── Relevé — replié, à la demande (§5.3) ─────────────────────── */}
        <section>
          <TitreBloc titre={t('dos_releve')} />
          {releve === null && releveRaison === null && (
            <button
              className="btn-ghost"
              style={{ fontSize: 'var(--fs-note)' }}
              disabled={releveEnCours || !dossier?.releve.disponible}
              onClick={() => void chargerReleve()}
            >
              {t('dos_charger_releve')}
            </button>
          )}
          {releveEnCours && <Skeleton height={40} />}
          {releveRaison && <Absent raison={releveRaison} />}
          {releve && releve.length === 0 && <Absent raison={t('dos_releve_vide')} />}
          {releve && releve.length > 0 && (
            <div style={{ display: 'grid', gap: 8 }}>
              {pgReleve.pageItems.map((op, i) => (
                <div key={op.reference ?? i} className="card" style={{ padding: 10 }}>
                  <div className="flex items-center justify-between gap-2">
                    <span style={{ fontSize: 'var(--fs-corps)', fontWeight: 500 }}>
                      {op.label ?? op.type ?? '—'}
                    </span>
                    <span className="font-mono" style={{ fontSize: 'var(--fs-corps)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {op.sens === 'DEBIT' ? '−' : '+'}
                      {montant(op.amount ?? 0)}
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--fs-etiquette)', color: 'var(--text-secondary)' }}>
                    {[
                      op.created_at ? formaterDate(op.created_at) : null,
                      op.status,
                      op.fees ? `${t('dos_frais')} ${montant(op.fees)}` : null,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
              ))}
              <Pager
                page={pgReleve.page} nbPages={pgReleve.nbPages} size={pgReleve.size}
                total={pgReleve.total} from={pgReleve.from} to={pgReleve.to}
                onPage={pgReleve.setPage} onSize={pgReleve.setSize}
              />
            </div>
          )}
        </section>

        {/* ── Produits — AFF-08 : lus de la fiche serveur ──────────────── */}
        <Bloc titre={t('dos_produits')} bloc={dossier?.produits} chargement={!dossier}>
          {dossier?.produits.present && (
            <div style={{ display: 'grid', gap: 6 }}>
              {dossier.produits.souscrits.map((produit, i) => (
                <div key={i} className="flex items-center gap-2" style={{ fontSize: 'var(--fs-corps)' }}>
                  <span>{produit.name ?? '—'}</span>
                  {produit.type && <span className="badge-primary">{produit.type}</span>}
                </div>
              ))}
            </div>
          )}
        </Bloc>

        {/* ── Épargne — §3.3 : l'absence s'explique ────────────────────── */}
        <Bloc titre={t('dos_epargne')} bloc={dossier?.epargne} chargement={!dossier}>
          {dossier?.epargne.present &&
            (dossier.epargne.collectes.length === 0 ? (
              <Absent raison={dossier.epargne.note ?? ''} />
            ) : (
              <p style={{ fontSize: 'var(--fs-corps)' }}>{dossier.epargne.collectes.length}</p>
            ))}
        </Bloc>
      </div>
    </PanneauLateral>
  )
}

function TitreBloc({ titre }: { titre: string }) {
  return (
    <h3
      className="font-display"
      style={{ fontSize: 'var(--fs-champ)', fontWeight: 600, marginBottom: 8 }}
    >
      {titre}
    </h3>
  )
}

/** Un bloc du dossier : squelette pendant le chargement, raison si absent,
 *  contenu sinon — jamais une section vide muette (AFF-06). */
function Bloc({
  titre,
  bloc,
  chargement,
  children,
}: {
  titre: string
  bloc: { present: boolean; raison?: string } | undefined
  chargement: boolean
  children: React.ReactNode
}) {
  return (
    <section>
      <TitreBloc titre={titre} />
      {chargement ? (
        <Skeleton height={40} />
      ) : bloc && !bloc.present ? (
        <Absent raison={bloc.raison ?? ''} />
      ) : (
        children
      )}
    </section>
  )
}

function Absent({ raison }: { raison: string }) {
  return (
    <p
      style={{
        fontSize: 'var(--fs-corps)',
        color: 'var(--text-secondary)',
        background: 'var(--surface)',
        border: '1px dashed var(--border)',
        borderRadius: 8,
        padding: '8px 12px',
      }}
    >
      {raison}
    </p>
  )
}

function Ligne({ l, v, mono }: { l: string; v: string | null | undefined; mono?: boolean }) {
  const { t } = useApp()
  return (
    <div className="flex justify-between gap-3">
      <dt style={{ color: 'var(--text-secondary)' }}>{l}</dt>
      <dd className={mono ? 'font-mono' : undefined} style={{ textAlign: 'right' }}>
        {v || <span style={{ color: 'var(--text-muted)' }}>{t('attr_non_renseigne')}</span>}
      </dd>
    </div>
  )
}
