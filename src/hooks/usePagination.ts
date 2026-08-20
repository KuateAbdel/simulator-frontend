// src/hooks/usePagination.ts
//
// Pagination cote client — le patron « ListePage » de la conception UX
// (FZ-UX-LOADER-2026-001). On decoupe une liste DEJA chargee : zero appel
// backend nouveau, zero changement du rendu des lignes/cartes. Le hook clampe
// toujours la page dans [1, nbPages] (une liste qui retrecit ne laisse jamais
// l'ecran sur une page vide).

import { useEffect, useMemo, useState } from 'react'

export interface Pagination<T> {
  page: number
  size: number
  nbPages: number
  pageItems: T[]
  total: number
  /** 1-indexe, 0 si vide. */
  from: number
  to: number
  setPage: (p: number) => void
  setSize: (s: number) => void
}

export function usePagination<T>(
  items: readonly T[],
  initialSize = 10,
  /** Change de valeur => retour a la page 1 (ex. onglet ou filtre modifie). */
  resetKey?: unknown,
): Pagination<T> {
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(initialSize)

  const total = items.length
  const nbPages = Math.max(1, Math.ceil(total / size))

  // Un filtre / onglet qui change ramene a la premiere page ET a la taille par
  // defaut : la pagination d'un onglet ne bave jamais sur un autre.
  useEffect(() => {
    setPage(1)
    setSize(initialSize)
  }, [resetKey, initialSize])

  // Une page hors bornes (liste qui retrecit, changement de taille) se recadre.
  useEffect(() => {
    if (page > nbPages) setPage(nbPages)
  }, [page, nbPages])

  const p = Math.min(Math.max(1, page), nbPages)
  const pageItems = useMemo(
    () => items.slice((p - 1) * size, (p - 1) * size + size) as T[],
    [items, p, size],
  )

  return {
    page: p,
    size,
    nbPages,
    pageItems,
    total,
    from: total ? (p - 1) * size + 1 : 0,
    to: Math.min(p * size, total),
    setPage,
    setSize,
  }
}
