// src/components/ui/PanneauLateral.tsx
//
// Le PANNEAU LATÉRAL — conception attribution (27/08), composant neuf n° 2.
// Le dossier client s'ouvre depuis une liste SANS la faire disparaître : la
// liste garde sa position, le panneau vient par-dessus. 420 px au-delà de
// 1024, 380 px avec fond estompé entre 768 et 1023, plein écran en dessous —
// les largeurs vivent dans index.css (.panneau-lateral), pas ici.
//
// Fermeture : Échap, croix, ou clic hors panneau. Le focus est CAPTURÉ à
// l'ouverture (posé sur la croix — l'action sûre, comme ConfirmDialog pose
// le sien sur Annuler) puis RENDU à l'élément qui l'avait. Tab reste dans le
// panneau tant qu'il est ouvert.
//
// Même leçon que Modale (bug du 17/08) : `onClose` est une fonction fléchée
// recréée à chaque render du parent — la mettre en dépendance d'effet
// relancerait l'effet à chaque frappe (dé-gel/re-gel du scroll, saccade).
// Une ref garde la dernière valeur ; l'effet ne tourne qu'à l'ouverture.

import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export function PanneauLateral({
  ouvert,
  titre,
  eyebrow,
  labelFermer,
  onClose,
  children,
  pied,
}: {
  ouvert: boolean
  titre: string
  /** Sur-titre discret (ex. « Numéro attribué »). */
  eyebrow?: string
  /** Libellé d'accessibilité de la croix — i18n à la charge de l'appelant. */
  labelFermer: string
  onClose: () => void
  children: ReactNode
  /** Zone d'action fixe en pied (ex. « Libérer le bail »). */
  pied?: ReactNode
}) {
  const refFermer = useRef<HTMLButtonElement>(null)
  const refPanneau = useRef<HTMLDivElement>(null)
  const refOnClose = useRef(onClose)
  refOnClose.current = onClose

  useEffect(() => {
    if (!ouvert) return
    // Le focus se CAPTURE... et se REND : on note qui l'avait.
    const avant = document.activeElement as HTMLElement | null
    refFermer.current?.focus()

    const surClavier = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        refOnClose.current()
        return
      }
      // Tab reste DANS le panneau — un lecteur d'écran ne doit pas se
      // retrouver à naviguer la liste que le panneau recouvre.
      if (e.key === 'Tab' && refPanneau.current) {
        const focusables = refPanneau.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return
        const premier = focusables[0]
        const dernier = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === premier) {
          e.preventDefault()
          dernier.focus()
        } else if (!e.shiftKey && document.activeElement === dernier) {
          e.preventDefault()
          premier.focus()
        }
      }
    }
    document.addEventListener('keydown', surClavier)
    // La LISTE derrière garde sa position : on gèle le scroll du document,
    // le panneau a le sien (.panneau-corps).
    const deborde = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', surClavier)
      document.body.style.overflow = deborde
      avant?.focus()
    }
  }, [ouvert])

  if (!ouvert) return null

  return (
    <>
      {/* Le voile capte le CLIC HORS PANNEAU — transparent en large (la
          liste reste lisible), estompé sous 1024 (index.css). */}
      <div className="panneau-voile" onClick={() => refOnClose.current()} aria-hidden />
      <div
        ref={refPanneau}
        className="panneau-lateral"
        role="dialog"
        aria-modal="true"
        aria-label={titre}
      >
        <div className="panneau-tete">
          <div className="flex-1 min-w-0">
            {eyebrow && (
              <p
                className="font-semibold uppercase tracking-wide"
                style={{ fontSize: 'var(--fs-etiquette)', color: 'var(--text-muted)' }}
              >
                {eyebrow}
              </p>
            )}
            <h2
              className="font-display font-bold truncate"
              style={{ fontSize: 'var(--fs-titre)', color: 'var(--text-primary)' }}
            >
              {titre}
            </h2>
          </div>
          <button
            ref={refFermer}
            onClick={() => refOnClose.current()}
            aria-label={labelFermer}
            className="btn-ghost"
            style={{ padding: '6px 8px' }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="panneau-corps">{children}</div>
        {pied && <div className="panneau-pied">{pied}</div>}
      </div>
    </>
  )
}
