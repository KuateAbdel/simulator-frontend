// src/pages/entites-commun.tsx — briques partagees des trois ecrans Entites.
//
// Le backend refuse en NOMMANT (detail: string | string[]) — l'UI restitue
// chaque faute telle quelle, jamais un « erreur 422 ». La fiche composee /
// relue s'affiche en cle-valeur lisible, pas en JSON brut.

import { ApiError } from '../lib/api'
import { useApp } from '../context/AppContext'

/** Les fautes d'une ApiError — un 422 du Lot D porte une LISTE de regles. */
export function fautesDe(err: unknown): string[] {
  if (err instanceof ApiError) {
    if (Array.isArray(err.detail)) return err.detail.map(String)
    if (err.detail !== null && err.detail !== undefined) return [String(err.detail)]
  }
  return [String(err)]
}

/** Bloc d'erreurs nommees — une ligne par regle violee, role=alert. */
export function FautesBloc({ fautes }: { fautes: string[] }) {
  const { t } = useApp()
  if (fautes.length === 0) return null
  return (
    <div
      className="text-xs rounded-lg px-3 py-2 mt-3 space-y-1"
      style={{ background: '#fee2e2', color: '#b91c1c' }}
      role="alert"
    >
      <p className="font-semibold">{t('error_named')}</p>
      {fautes.map((faute, i) => (
        <p key={i} className="flex gap-1.5">
          <span aria-hidden>—</span>
          <span>{faute}</span>
        </p>
      ))}
    </div>
  )
}

function ValeurLisible({ valeur }: { valeur: unknown }) {
  if (valeur === null || valeur === undefined || valeur === '')
    return <span style={{ color: 'var(--text-muted)' }}>—</span>
  if (typeof valeur === 'boolean')
    return (
      <span className={valeur ? 'badge-secondary' : 'badge-danger'}>{String(valeur)}</span>
    )
  if (typeof valeur === 'object')
    return (
      <span className="font-mono text-[10px] break-all">{JSON.stringify(valeur)}</span>
    )
  return <span className="font-mono">{String(valeur)}</span>
}

/** Aplatit un niveau d'objets imbriques (`owner.email`, `adresse.city`) —
 * une fiche se LIT, elle ne se déchiffre pas en JSON. */
function aplatir(fiche: Record<string, unknown>): [string, unknown][] {
  return Object.entries(fiche).flatMap(([cle, valeur]) =>
    valeur !== null && typeof valeur === 'object' && !Array.isArray(valeur)
      ? Object.entries(valeur as Record<string, unknown>).map(
          ([sous, v]): [string, unknown] => [`${cle}.${sous}`, v],
        )
      : [[cle, valeur] as [string, unknown]],
  )
}

/** La fiche en cle-valeur — l'apercu de l'entite COMPLETE que le Loader a
 * composee (US-D1 : 3 champs saisis, ~40 rendus visibles, c'est le produit). */
export function FicheTable({ fiche, titre }: { fiche: Record<string, unknown>; titre?: string }) {
  const entrees = aplatir(fiche)
  return (
    <div>
      {titre && (
        <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
          {titre}
        </p>
      )}
      <div
        className="rounded-xl border overflow-auto"
        style={{ borderColor: 'var(--border)', maxHeight: 420 }}
      >
        <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
          <tbody>
            {entrees.map(([cle, valeur], i) => (
              <tr key={cle} style={{ background: i % 2 ? 'var(--surface)' : 'transparent' }}>
                <td className="px-3 py-1.5 font-semibold whitespace-nowrap align-top" style={{ color: 'var(--text-secondary)', width: '38%' }}>
                  {cle}
                </td>
                <td className="px-3 py-1.5 align-top" style={{ color: 'var(--text-primary)' }}>
                  <ValeurLisible valeur={valeur} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Libelle de champ de formulaire — le style commun des ecrans phase 4/5. */
export function ChampLabel({ texte, requis }: { texte: string; requis?: boolean }) {
  return (
    <label
      className="text-[10px] font-semibold uppercase tracking-wide mb-1 block"
      style={{ color: 'var(--text-muted)' }}
    >
      {texte}
      {requis && (
        <span aria-hidden style={{ color: 'var(--primary-dark)' }}>
          {' '}
          *
        </span>
      )}
    </label>
  )
}

/** Erreur d'invariant DOUBLE en direct sous un champ — l'autorite reste le 422. */
export function ErreurInline({ texte }: { texte: string | null }) {
  if (!texte) return null
  return (
    <p className="text-[10px] mt-1" style={{ color: '#b91c1c' }} role="alert">
      {texte}
    </p>
  )
}
