// src/pages/entites-commun.tsx — briques partagees des trois ecrans Entites.
//
// Le backend refuse en NOMMANT (detail: string | string[]) — l'UI restitue
// chaque faute telle quelle, jamais un « erreur 422 ». La fiche composee /
// relue s'affiche en cle-valeur lisible, pas en JSON brut.

import { ApiError, type DiffRelecture } from '../lib/api'
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

/** L'INSTRUMENT DE MESURE (reco 16/08) : envoye ↔ relu, champ par champ.
 * Chaque creation devient un test d'integration de la plateforme — ce
 * qu'elle PERD (FRA-199 currency) ou ECRASE (D-CLI-4 type) se VOIT. */
export function DiffTable({
  envoye,
  relu,
  titre,
}: {
  envoye: Record<string, unknown>
  relu: Record<string, unknown>
  titre: string
}) {
  const { t } = useApp()
  const normaliser = (valeur: unknown) =>
    valeur === null || valeur === undefined ? '' : JSON.stringify(valeur)
  const cles = [...new Set([...Object.keys(envoye), ...Object.keys(relu)])]
  const lignes = cles.map((cle) => {
    const dansEnvoye = cle in envoye
    const dansRelu = cle in relu
    const identique = dansEnvoye && dansRelu && normaliser(envoye[cle]) === normaliser(relu[cle])
    const verdict = identique
      ? { texte: t('diff_identique'), fond: 'var(--secondary-light)', couleur: 'var(--secondary-dark)' }
      : !dansRelu
        ? { texte: t('diff_perdu'), fond: '#fee2e2', couleur: '#b91c1c' }
        : !dansEnvoye
          ? { texte: t('diff_ajoute'), fond: 'var(--border)', couleur: 'var(--text-secondary)' }
          : { texte: t('diff_ecrase'), fond: '#fef9c3', couleur: '#92400e' }
    return { cle, verdict, dansEnvoye, dansRelu }
  })
  const anomalies = lignes.filter((l) => l.verdict.texte !== t('diff_identique') && l.verdict.texte !== t('diff_ajoute'))
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {titre}
        </p>
        <span
          className="text-[9px] font-semibold rounded-full px-2 py-0.5"
          style={
            anomalies.length === 0
              ? { background: 'var(--secondary-light)', color: 'var(--secondary-dark)' }
              : { background: '#fef9c3', color: '#92400e' }
          }
        >
          {anomalies.length === 0 ? t('diff_fidele') : `${anomalies.length} ${t('diff_anomalies')}`}
        </span>
      </div>
      <div className="rounded-xl border overflow-auto" style={{ borderColor: 'var(--border)', maxHeight: 300 }}>
        <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
          <tbody>
            {lignes.map(({ cle, verdict, dansEnvoye, dansRelu }, i) => (
              <tr key={cle} style={{ background: i % 2 ? 'var(--surface)' : 'transparent' }}>
                <td className="px-3 py-1 font-semibold whitespace-nowrap" style={{ color: 'var(--text-secondary)', width: '28%' }}>
                  {cle}
                </td>
                <td className="px-3 py-1 font-mono text-[10px] break-all" style={{ color: 'var(--text-primary)' }}>
                  {dansEnvoye ? normaliser(envoye[cle]) : '—'}
                </td>
                <td className="px-3 py-1 font-mono text-[10px] break-all" style={{ color: 'var(--text-primary)' }}>
                  {dansRelu ? normaliser(relu[cle]) : '—'}
                </td>
                <td className="px-3 py-1">
                  <span
                    className="text-[9px] font-semibold rounded-full px-1.5 py-0.5 whitespace-nowrap"
                    style={{ background: verdict.fond, color: verdict.couleur }}
                  >
                    {verdict.texte}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Le VERDICT DU BACKEND (16/08) — l'AUTORITE du diff payload<->relecture.
 * La DiffTable ci-dessus est le double calcule par l'UI ; ici c'est le
 * serveur qui a confronte le payload REELLEMENT envoye a la fiche relue.
 * Fidele = badge vert discret ; sinon chaque ecart est nomme. */
export function VerdictRelecture({ diff }: { diff: DiffRelecture | null | undefined }) {
  const { t } = useApp()
  if (!diff) return null
  const ecarts = [
    ...Object.entries(diff.divergences).map(
      ([champ, v]) =>
        `${champ} : ${JSON.stringify(v.envoye)} → ${JSON.stringify(v.relu)}`,
    ),
    ...diff.absents_de_la_relecture.map((champ) => `${champ} — ${t('diff_perdu')}`),
  ]
  return (
    <div
      className="text-[10px] rounded-lg px-3 py-2 mt-2 space-y-1"
      style={
        diff.fidele
          ? { background: 'var(--secondary-light)', color: 'var(--secondary-dark)' }
          : { background: '#fef9c3', color: '#92400e' }
      }
      role="status"
    >
      <p>
        <span className="font-semibold">{t('diff_verdict_serveur')}</span>{' '}
        {diff.verdict}{' '}
        <span className="font-mono">({diff.champs_compares} {t('diff_champs')})</span>
      </p>
      {ecarts.map((ecart) => (
        <p key={ecart} className="flex gap-1.5 font-mono">
          <span aria-hidden>—</span>
          <span className="break-all">{ecart}</span>
        </p>
      ))}
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
