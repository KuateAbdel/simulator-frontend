// src/components/ui/Modale.tsx — un popup professionnel, réutilisable.
//
// Comportement attendu d'un modal senior : overlay CENTRÉ en position `fixed`
// (ne décale jamais la mise en page), fond assombri (scrim), fermeture sur
// Échap ET clic du fond, VERROUILLAGE du scroll de la page tant qu'il est
// ouvert, responsive (max-width + marges). Le contenu (les champs) est passé
// en `children`.

import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

export function Modale({
  titre,
  eyebrow,
  onClose,
  children,
}: {
  titre: string
  eyebrow?: string
  onClose: () => void
  children: ReactNode
}) {
  // Échap ferme, et le scroll de la page est gelé tant que le modal est ouvert.
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', surTouche)
    const overflowInitial = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', surTouche)
      document.body.style.overflow = overflowInitial
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,8,30,.5)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={titre}
    >
      <div
        className="w-full max-w-md rounded-2xl p-5 max-h-[90vh] overflow-auto"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            {eyebrow && (
              <p className="font-mono text-[10px] tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                {eyebrow}
              </p>
            )}
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {titre}
            </h3>
          </div>
          <button onClick={onClose} className="btn-ghost p-1 rounded-md shrink-0" aria-label="Fermer">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
