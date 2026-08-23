// src/components/FiltreListe.tsx
//
// La RECHERCHE RAPIDE + l'index alphabétique (A-D, E-H…), demandés par
// l'administration le 23/08 pour Géographie, Pays & Devises et Telcos.
//
// UN SEUL composant pour les trois écrans, et c'est le point : trois
// recherches écrites séparément se mettent à répondre différemment à la même
// saisie — l'une ignore les accents, l'autre non, une troisième cherche au
// début du mot seulement. L'utilisateur ne sait plus ce qu'il obtient.
//
// COMMENT IL SE COMBINE AVEC LA PAGINATION
// Il ne la remplace pas. L'administration a demandé « pagination A-D, E-H » ;
// la maison a déjà un `Pager` numéroté utilisé partout. Les deux répondent à
// des questions différentes — « saute aux M » contre « combien de pages » —
// et se composent : l'index filtre, la recherche filtre, le Pager pagine le
// résultat. Un second système de pagination aurait créé deux paradigmes qui
// se contredisent d'un écran à l'autre.
//
// DÉTAIL QUI COMPTE : une tranche VIDE est désactivée, pas cliquable. Cliquer
// « Q-T » pour tomber sur une table vide fait croire à une panne.

import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useApp } from '../context/AppContext'

/** Les tranches, dans l'ordre demandé par l'administration. */
const TRANCHES: [string, string][] = [
  ['A', 'D'],
  ['E', 'H'],
  ['I', 'L'],
  ['M', 'P'],
  ['Q', 'T'],
  ['U', 'Z'],
]

/** Casse pliée ET accents retirés : « Côte d'Ivoire » se trouve en tapant
 *  « cote ». Sans ça, la recherche échoue exactement sur les noms qui en
 *  ont besoin — et notre référentiel est africain francophone. */
export function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export interface Filtre<T> {
  terme: string
  setTerme: (v: string) => void
  tranche: number | null
  setTranche: (i: number | null) => void
  /** Les éléments retenus — recherche ET tranche appliquées. */
  resultat: T[]
  /** Change à chaque modification du filtre : à passer à `usePagination`
   *  comme `resetKey`, sinon on reste sur une page 7 qui n'existe plus. */
  cle: string
  actif: boolean
  total: number
}

/**
 * @param items      la liste complète, déjà chargée
 * @param champs     ce sur quoi on cherche (nom du pays, ville, telco…)
 * @param initiale   ce qui décide de la tranche alphabétique (souvent le nom)
 */
export function useFiltreListe<T>(
  items: readonly T[],
  champs: (item: T) => (string | null | undefined)[],
  initiale: (item: T) => string,
): Filtre<T> {
  const [terme, setTerme] = useState('')
  const [tranche, setTranche] = useState<number | null>(null)

  const resultat = useMemo(() => {
    const q = normaliser(terme)
    return items.filter((item) => {
      if (tranche !== null) {
        const [a, b] = TRANCHES[tranche]
        const lettre = normaliser(initiale(item)).charAt(0).toUpperCase()
        if (lettre < a || lettre > b) return false
      }
      if (!q) return true
      return champs(item).some((valeur) => valeur && normaliser(String(valeur)).includes(q))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, terme, tranche])

  return {
    terme,
    setTerme,
    tranche,
    setTranche,
    resultat,
    cle: `${terme}|${tranche}`,
    actif: terme.trim() !== '' || tranche !== null,
    total: items.length,
  }
}

export function BarreFiltre<T>({
  filtre,
  items,
  initiale,
  placeholder,
}: {
  filtre: Filtre<T>
  /** La liste COMPLÈTE — sert à désactiver les tranches vides. */
  items: readonly T[]
  initiale: (item: T) => string
  placeholder: string
}) {
  const { t } = useApp()

  // Une tranche sans contenu est désactivée : cliquer pour obtenir une table
  // vide fait croire à une panne de l'écran.
  const peuplees = useMemo(() => {
    const lettres = new Set(
      items.map((i) => normaliser(initiale(i)).charAt(0).toUpperCase()).filter(Boolean),
    )
    return TRANCHES.map(([a, b]) => [...lettres].some((l) => l >= a && l <= b))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <div className="relative" style={{ flex: '1 1 15rem', minWidth: '12rem' }}>
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type="search"
          value={filtre.terme}
          onChange={(e) => filtre.setTerme(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="input text-xs w-full"
          style={{ paddingLeft: '1.9rem' }}
        />
      </div>

      <div className="flex flex-wrap gap-1" role="group" aria-label={t('flt_tranches')}>
        <button
          type="button"
          className={filtre.tranche === null ? 'btn-primary text-[11px] px-2 py-1' : 'btn-ghost text-[11px] px-2 py-1'}
          aria-pressed={filtre.tranche === null}
          onClick={() => filtre.setTranche(null)}
        >
          {t('flt_toutes')}
        </button>
        {TRANCHES.map(([a, b], i) => (
          <button
            key={a}
            type="button"
            disabled={!peuplees[i]}
            aria-pressed={filtre.tranche === i}
            className={filtre.tranche === i ? 'btn-primary text-[11px] px-2 py-1' : 'btn-ghost text-[11px] px-2 py-1'}
            style={!peuplees[i] ? { opacity: 0.35, cursor: 'default' } : undefined}
            onClick={() => filtre.setTranche(filtre.tranche === i ? null : i)}
          >
            {a}-{b}
          </button>
        ))}
      </div>

      {filtre.actif && (
        <span className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
          {filtre.resultat.length} / {filtre.total}
          <button
            type="button"
            className="btn-ghost px-1 py-0.5"
            onClick={() => {
              filtre.setTerme('')
              filtre.setTranche(null)
            }}
            aria-label={t('flt_effacer')}
            title={t('flt_effacer')}
          >
            <X size={12} />
          </button>
        </span>
      )}
    </div>
  )
}
