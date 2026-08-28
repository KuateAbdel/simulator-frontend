// src/pages/AttributionJournal.tsx
//
// JOURNAL (DASH §5.5) — que s'est-il passé sur trente jours glissants,
// Y COMPRIS ce qui a échoué. Deux sources fusionnées :
//   · le journal du domaine (serveur) : attributions, libérations AVEC LEUR
//     ORIGINE — « Rendu par l'appareil » et « Repris depuis
//     l'administration » sont deux informations, jamais un même mot ;
//   · les EXPIRATIONS, dérivées des baux échus non purgés (⚡ local) —
//     l'expiration est passive par conception, aucun code ne l'écrit ; le
//     bail mort porte son échéance, on la lit.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import {
  journalAttribution,
  listerBauxAttribution,
  type EvenementAttribution,
} from '../lib/api'
import { Card, EmptyState, SectionHeader } from '../components/ui'
import { Banniere, Skeleton } from '../components/ui/loader'
import { Pager } from '../components/Pager'
import { usePagination } from '../hooks/usePagination'
import { formaterNumero } from './AttributionBaux'
import { useApp } from '../context/AppContext'

interface Ligne {
  quand: string
  genre: 'attribution' | 'rendu' | 'repris' | 'expiration' | 'refus' | 'nommage'
  numero: string | null
  origine: 'appareil' | 'administration' | 'systeme' | null
  detail: string | null
  ip: string | null
  ipPays: string | null
}

export function AttributionJournal() {
  const { t, lang } = useApp()
  const [evenements, setEvenements] = useState<EvenementAttribution[] | null>(null)
  const [expirations, setExpirations] = useState<Ligne[] | null>(null)
  const [enPanne, setEnPanne] = useState(false)

  const charger = useCallback(async () => {
    try {
      const [journal, echus] = await Promise.all([
        journalAttribution(500),
        listerBauxAttribution('echus'),
      ])
      setEvenements(journal.entrees)
      const horloge = Date.parse(journal.entrees.length ? new Date().toISOString() : new Date().toISOString())
      void horloge
      setExpirations(
        echus.baux.map((bail) => ({
          quand: bail.expire_le,
          genre: 'expiration',
          numero: bail.msisdn,
          origine: 'systeme',
          detail: bail.interlocuteur,
          ip: null,
          ipPays: null,
        })),
      )
      setEnPanne(false)
    } catch {
      setEnPanne(true)
    }
  }, [])
  useEffect(() => {
    void charger()
  }, [charger])

  const lignes = useMemo<Ligne[]>(() => {
    const duJournal: Ligne[] = (evenements ?? []).map((e) => {
      let genre: Ligne['genre'] = 'attribution'
      if (e.operation === 'CREATE') genre = 'attribution'
      else if (e.operation === 'DELETE') genre = 'rendu'
      else if (e.operation === 'REVOKE') genre = 'repris'
      else if (e.operation === 'REFUS') genre = 'refus'
      else if (e.operation === 'INTERLOCUTEUR' || e.operation === 'UPDATE') genre = 'nommage'
      const profil =
        genre === 'refus' && e.details && typeof e.details === 'object'
          ? String(e.cible ?? '')
          : null
      return {
        quand: e.quand,
        genre,
        numero: genre === 'refus' ? null : e.cible || null,
        origine: e.origine ?? (genre === 'repris' ? 'administration' : 'appareil'),
        detail:
          genre === 'refus'
            ? profil
            : genre === 'repris'
              ? (e.motif ?? (e.details?.motif as string | undefined) ?? null)
              : genre === 'nommage'
                ? ((e.details?.interlocuteur as string | undefined) ?? null)
                : null,
        ip: e.ip ?? null,
        ipPays: e.ip_pays ?? null,
      }
    })
    return [...duJournal, ...(expirations ?? [])].sort(
      (a, b) => Date.parse(b.quand) - Date.parse(a.quand),
    )
  }, [evenements, expirations])

  const pagination = usePagination(lignes, 10)
  const chargement = evenements === null && !enPanne

  const formaterDate = useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
        day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
      }).format(new Date(iso)),
    [lang],
  )

  const LIBELLES: Record<Ligne['genre'], string> = {
    attribution: t('ajr_attribution'),
    rendu: t('ajr_rendu'),
    repris: t('ajr_repris'),
    expiration: t('ajr_expiration'),
    refus: t('ajr_refus'),
    nommage: t('ajr_nommage'),
  }
  const TONS: Record<Ligne['genre'], string> = {
    attribution: 'badge-secondary',
    rendu: 'badge-primary',
    repris: 'badge-warning',
    expiration: 'badge-primary',
    refus: 'badge-warning',
    nommage: 'badge-primary',
  }

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title={t('ajr_titre')}
        subtitle={t('ajr_soustitre')}
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
      <Card style={{ padding: 0 }}>
        {chargement ? (
          <div className="p-4" style={{ display: 'grid', gap: 10 }}>
            <Skeleton height={18} /><Skeleton height={18} /><Skeleton height={18} />
          </div>
        ) : lignes.length === 0 ? (
          <EmptyState label={t('ajr_vide')} />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('ajr_quand')}</th>
                    <th>{t('ajr_evenement')}</th>
                    <th>{t('ajr_numero')}</th>
                    <th>{t('ajr_origine')}</th>
                    <th>{t('ajr_connexion')}</th>
                    <th>{t('ajr_detail')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.pageItems.map((ligne, i) => (
                    <tr key={`${ligne.quand}-${ligne.numero}-${i}`}>
                      <td style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {formaterDate(ligne.quand)}
                      </td>
                      <td><span className={TONS[ligne.genre]}>{LIBELLES[ligne.genre]}</span></td>
                      <td className="font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {ligne.numero ? formaterNumero(ligne.numero) : ligne.detail ?? ''}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {ligne.origine ? t(`ajr_${ligne.origine}` as never) : ''}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {/* Le PAYS d'abord — c'est lui que la Direction lit ;
                            l'adresse en second, en chasse fixe. Une trace
                            d'avant la capture n'invente rien. */}
                        {ligne.ipPays && (
                          <span className="badge-primary" style={{ marginRight: 6 }}>
                            {ligne.ipPays}
                          </span>
                        )}
                        {ligne.ip ? (
                          <span className="font-mono" style={{ fontSize: 'var(--fs-etiquette)' }}>
                            {ligne.ip}
                          </span>
                        ) : (
                          !ligne.ipPays && (
                            <span style={{ color: 'var(--text-muted)' }}>
                              {t('attr_non_renseigne')}
                            </span>
                          )
                        )}
                      </td>
                      <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ligne.genre === 'refus' ? '' : (ligne.detail ?? '')}
                      </td>
                    </tr>
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
    </div>
  )
}
