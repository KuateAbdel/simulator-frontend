// src/pages/runs-commun.tsx — briques partagees des trois ecrans Runs.

import { StatusBadge } from '../components/ui'
import { useApp } from '../context/AppContext'
import { ApiError, type Palier } from '../lib/api'
import type { TranslationKey } from '../i18n'

/** Cle sessionStorage du run a suivre (posee a la confirmation du REAL). */
export const CLE_RUN_SUIVI = 'finzuu-loader-run-suivi'

export function useMessageDe() {
  const { t } = useApp()
  return (err: unknown): string =>
    err instanceof ApiError && err.status === 0
      ? t('error_backend_unreachable')
      : `${t('error_named')} ${String(err instanceof ApiError ? err.detail : err)}`
}

function couleurIssue(issue: string | undefined): string {
  if (!issue) return 'var(--text-muted)'
  const bas = issue.toLowerCase()
  if (bas.includes('succ') || bas === 'ok' || bas.includes('reussi')) return 'var(--secondary-dark)'
  if (bas.includes('echec') || bas.includes('fail') || bas.includes('erreur')) return '#b91c1c'
  return 'var(--text-secondary)'
}

/** La liste des paliers d'un run — phase, issue coloree, duree, horodatage. */
export function PaliersListe({ paliers }: { paliers: Palier[] }) {
  const { t } = useApp()
  if (paliers.length === 0) {
    return (
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        —
      </p>
    )
  }
  return (
    <ol className="space-y-1.5">
      {paliers.map((palier, i) => (
        <li
          key={`${palier.phase}-${palier.horodatage}-${i}`}
          className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-lg px-3 py-1.5"
          style={{ background: 'var(--surface)' }}
        >
          <span className="text-xs font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
            {palier.phase}
          </span>
          {palier.detail?.issue !== undefined && (
            <span className="text-[10px] font-semibold" style={{ color: couleurIssue(String(palier.detail.issue)) }}>
              {t('run_issue')} : {String(palier.detail.issue)}
            </span>
          )}
          {palier.detail?.duree_s !== undefined && (
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
              {t('run_duree')} {Number(palier.detail.duree_s).toFixed(2)} s
            </span>
          )}
          <span className="text-[10px] font-mono ml-auto" style={{ color: 'var(--text-muted)' }}>
            {new Date(palier.horodatage).toLocaleTimeString()}
          </span>
        </li>
      ))}
    </ol>
  )
}

/** Fiche compacte : badge de statut + mode + id court. */
export function EnTeteRun({
  statut,
  mode,
  runId,
}: {
  statut: string
  mode?: string
  runId: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusBadge status={statut.toLowerCase()} />
      {mode && <span className="badge-primary font-mono">{mode}</span>}
      <span className="text-[10px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>
        {runId}
      </span>
    </div>
  )
}

/** Le rapport integral, ligne a ligne — TENU vert, VIOLE rouge, lisible. */
export function RapportIntegral({ rapport, vide }: { rapport: string; vide: TranslationKey }) {
  const { t } = useApp()
  if (!rapport) {
    return (
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {t(vide)}
      </p>
    )
  }
  return (
    <div
      className="rounded-xl border overflow-auto font-mono text-[11px] leading-relaxed p-4"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)', maxHeight: 480, whiteSpace: 'pre' }}
    >
      {rapport.split('\n').map((ligne, i) => {
        const tenu = /\bTENU\b/.test(ligne)
        const viole = /\bVIOL/.test(ligne) || /\bECHEC\b/i.test(ligne)
        return (
          <div
            key={i}
            style={{
              color: tenu ? 'var(--secondary-dark)' : viole ? '#b91c1c' : 'var(--text-primary)',
              fontWeight: tenu || viole ? 600 : 400,
            }}
          >
            {ligne || ' '}
          </div>
        )
      })}
    </div>
  )
}
