// src/components/Pager.tsx
//
// Le pied de page du patron « ListePage » (conception FZ-UX-LOADER-2026-001).
// ‹ Precedent · numeros avec ellipse · Suivant › + « X–Y sur N » + taille de page.
// Regles de la conception : rien si une seule page ; Precedent/Suivant DESACTIVES
// aux bords (pas caches) ; accessible (nav[aria-label], aria-current), au clavier.
// Il ne redessine RIEN de la liste — il se pose sous la table/les cartes.

import { useApp } from '../context/AppContext'

function pageNumbers(cur: number, total: number): (number | 'ell')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | 'ell')[] = [1]
  const a = Math.max(2, cur - 1)
  const b = Math.min(total - 1, cur + 1)
  if (a > 2) out.push('ell')
  for (let i = a; i <= b; i++) out.push(i)
  if (b < total - 1) out.push('ell')
  out.push(total)
  return out
}

export interface PagerProps {
  page: number
  nbPages: number
  size: number
  total: number
  from: number
  to: number
  onPage: (p: number) => void
  /** Optionnel : affiche le selecteur « par page » (10/25/50). */
  onSize?: (s: number) => void
}

export function Pager({ page, nbPages, size, total, from, to, onPage, onSize }: PagerProps) {
  const { t } = useApp()
  // On garde le pied (compteur + selecteur de taille) tant qu'une pagination est
  // possible a la plus petite taille (10) : sinon, passer a 25/50 masquerait la
  // barre et piegerait l'utilisateur sans moyen de revenir a 10. Les fleches
  // n'apparaissent que s'il reste plus d'une page.
  if (total <= 10) return null

  return (
    <nav className="pager" role="navigation" aria-label="pagination">
      <span className="pager-info">
        {from}&ndash;{to} {t('pg_of')} {total}
      </span>

      {onSize && (
        <label className="pager-size">
          {t('pg_perpage')}
          <select value={size} onChange={(e) => onSize(Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>
      )}

      {nbPages > 1 && (
        <div className="pager-btns">
        <button
          className="pager-btn"
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          aria-label={t('pg_prev')}
        >
          &lsaquo; {t('pg_prev')}
        </button>

        {pageNumbers(page, nbPages).map((n, i) =>
          n === 'ell' ? (
            <span key={`ell-${i}`} className="pager-ell" aria-hidden="true">
              &hellip;
            </span>
          ) : (
            <button
              key={n}
              className={`pager-num${n === page ? ' on' : ''}`}
              aria-current={n === page ? 'page' : undefined}
              aria-label={`${t('pg_page') ?? ''} ${n}`.trim()}
              onClick={() => onPage(n)}
            >
              {n}
            </button>
          ),
        )}

        <button
          className="pager-btn"
          onClick={() => onPage(page + 1)}
          disabled={page === nbPages}
          aria-label={t('pg_next')}
        >
          {t('pg_next')} &rsaquo;
        </button>
        </div>
      )}
    </nav>
  )
}
