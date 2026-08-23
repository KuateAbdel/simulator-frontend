// src/pages/AdminVersions.tsx — l'onglet VERSIONS (V-01).
//
// CE QU'IL REPOND, ET QU'AUCUN AUTRE ECRAN NE REPOND
// Le tableau de bord dit si un service est VIVANT — vert, rouge, en direct.
// Celui-ci dit ce qu'il PORTE, et surtout SI CA A CHANGE : nos neuf clients
// backend sont ecrits contre des contrats MESURES. Le jour ou un service
// change, nos appels parlent a un contrat qui n'existe plus.
//
// CE QU'ON NE MONTRE PAS, ET C'EST UNE DECISION (Yaniv, 23/08)
// Pas d'etat « injoignable » : le vivant/mort est deja dit par le tableau de
// bord, en vert et rouge et en DIRECT. Le repeter ici serait une duplication.
// Et une version ne disparait pas parce qu'un service redemarre — on garde la
// derniere connue, seule sa DATE vieillit.
// Pas de TTL, pas d'age du cache en secondes, pas de code HTTP, pas de
// latence : de la plomberie. Une phrase suffit — « releve il y a 12 min ».
//
// LE TRI EST UNE INFORMATION : ce qui demande une action remonte. Jamais
// l'ordre alphabetique, il noie le changement au milieu du stable.
//
// Aucune logique metier ici : la gravite et la phrase viennent du backend.

import { useCallback, useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Card } from '../components/ui'
import { Banniere, Skeleton } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import { listerVersions, releverVersions, type ReponseVersions, type GraviteVersion } from '../lib/api'
import { useMessageDe } from './runs-commun'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'pret'; donnees: ReponseVersions }
  | { phase: 'erreur'; message: string }

/** Le marqueur de gauche — la forme porte l'information autant que la couleur
 *  (un daltonien lit la forme ; une capture noir et blanc aussi). */
const MARQUEUR: Record<GraviteVersion, { signe: string; classe: string; ton: string }> = {
  changement: { signe: '▲', classe: 'badge-danger', ton: 'var(--danger)' },
  anomalie: { signe: '■', classe: 'badge-warning', ton: 'var(--warning)' },
  stable: { signe: '●', classe: 'badge-success', ton: 'var(--success)' },
  jamais_lu: { signe: '○', classe: 'badge-primary', ton: 'var(--text-muted)' },
}

/** « il y a 12 min » — la fraicheur en une phrase, jamais en secondes brutes. */
function ilYA(secondes: number | null): string {
  if (secondes === null) return '—'
  if (secondes < 90) return "a l'instant"
  const minutes = Math.round(secondes / 60)
  if (minutes < 60) return `il y a ${minutes} min`
  const heures = Math.round(minutes / 60)
  if (heures < 24) return `il y a ${heures} h`
  return `il y a ${Math.round(heures / 24)} j`
}

export function VersionsOnglet() {
  const { t } = useApp()
  const messageDe = useMessageDe()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [releve, setReleve] = useState(false)

  const charger = useCallback(async () => {
    setEtat({ phase: 'chargement' })
    try {
      setEtat({ phase: 'pret', donnees: await listerVersions() })
    } catch (err) {
      setEtat({ phase: 'erreur', message: messageDe(err) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void charger()
  }, [charger])

  const relever = useCallback(async () => {
    setReleve(true)
    try {
      setEtat({ phase: 'pret', donnees: await releverVersions() })
    } catch (err) {
      setEtat({ phase: 'erreur', message: messageDe(err) })
    } finally {
      setReleve(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const donnees = etat.phase === 'pret' ? etat.donnees : null

  return (
    <>
      <Banniere ton="info">{t('ver_doctrine')}</Banniere>

      <div className="mt-4">
        {etat.phase === 'chargement' && <Skeleton height={240} />}

        {etat.phase === 'erreur' && (
          <>
            <Banniere ton="danger">{etat.message}</Banniere>
            <button className="btn-ghost text-xs mt-2" onClick={() => void charger()}>
              {t('retry')}
            </button>
          </>
        )}

        {donnees && (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div
              className="flex items-center justify-between gap-3 px-4 py-3"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {t('ver_releve')} {ilYA(donnees.releve_il_y_a_secondes)}
                {donnees.a_surveiller > 0 && (
                  <>
                    {' · '}
                    <strong style={{ color: 'var(--warning)' }}>
                      {donnees.a_surveiller} {t('ver_a_surveiller')}
                    </strong>
                  </>
                )}
              </span>
              <button
                className="btn-ghost text-xs whitespace-nowrap"
                onClick={() => void relever()}
                disabled={releve}
              >
                <RotateCcw size={13} className="inline mr-1" />
                {releve ? t('ver_releve_en_cours') : t('ver_relever')}
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '1.6rem' }} aria-label="gravité" />
                    <th>{t('ver_col_service')}</th>
                    <th>{t('ver_col_version')}</th>
                    <th style={{ textAlign: 'right' }}>{t('ver_col_chemins')}</th>
                    <th>{t('ver_col_commentaire')}</th>
                  </tr>
                </thead>
                <tbody>
                  {donnees.services.map((s) => {
                    const m = MARQUEUR[s.gravite]
                    return (
                      <tr key={s.service}>
                        <td
                          className="text-center"
                          style={{ color: m.ton }}
                          title={s.gravite}
                          aria-label={s.gravite}
                        >
                          {m.signe}
                        </td>
                        <td className="font-mono text-[11px] whitespace-nowrap">{s.service}</td>
                        <td className="whitespace-nowrap">
                          <span className={m.classe}>{s.version ?? '—'}</span>
                        </td>
                        <td
                          className="text-[11px] whitespace-nowrap"
                          style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                        >
                          {s.chemins === null ? '—' : `${s.chemins} · ${s.operations ?? '—'}`}
                        </td>
                        <td className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                          {s.commentaire}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </>
  )
}
