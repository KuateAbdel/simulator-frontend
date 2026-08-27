// src/components/CompteARebours.tsx
//
// LE COMPOSANT SIGNATURE du tableau de bord d'attribution (conception,
// diapo 6) : le temps restant d'un bail, en trois états.
//
//   au-delà de 2 jours    « 5 j 08 h »   contraste normal
//   entre 1 et 2 jours    « 1 j 06 h »   poids relevé
//   moins de 24 heures    « 04 h 12 »    pastille --warning
//
// La distinction passe par le POIDS et le CONTRASTE, jamais par le rouge :
// un bail qui expire est un cycle normal, pas un incident. --warning existe
// dans les deux thèmes (un jeton doit exister avant d'être utilisé, 24/08).
//
// L'HORLOGE : celle du SERVEUR, jamais celle du poste. Le mécanisme
// d'attribution ne reconnaît qu'une autorité de temps (contrat §3) ; un
// compte à rebours calculé sur une horloge locale dérivante mentirait —
// devant un partenaire, sur l'écran même de la présentation. Le parent
// fournit `decalageMs` = (horloge serveur au relevé) − (horloge locale à la
// réception) ; l'instant « maintenant » est toujours local + décalage.
//
// ENF-D04 : il se met à jour SEUL (30 s), sans rechargement de page.

import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'

const MINUTE = 60_000
const HEURE = 3_600_000
const JOUR = 86_400_000

export function CompteARebours({
  expireLe,
  decalageMs,
}: {
  /** L'échéance ISO rendue par le serveur (`expire_le`). */
  expireLe: string
  /** Horloge serveur − horloge locale, calculé une fois par relevé. */
  decalageMs: number
}) {
  const { t } = useApp()
  const [, setBattement] = useState(0)
  useEffect(() => {
    const minuteur = setInterval(() => setBattement((n) => n + 1), 30_000)
    return () => clearInterval(minuteur)
  }, [])

  const maintenantServeur = Date.now() + decalageMs
  const reste = Date.parse(expireLe) - maintenantServeur

  if (reste <= 0) {
    return <span className="badge-warning">{t('attr_echu')}</span>
  }

  const jours = Math.floor(reste / JOUR)
  const heures = Math.floor((reste % JOUR) / HEURE)
  const minutes = Math.floor((reste % HEURE) / MINUTE)
  const deuxChiffres = (n: number) => String(n).padStart(2, '0')

  // Moins de 24 h — « 04 h 12 » : la pastille ambrée, --warning jamais
  // --danger. Le format bascule aux minutes : à cette échelle, « 0 j » ne
  // dit plus rien.
  if (reste < JOUR) {
    return (
      <span
        className="font-mono font-bold rounded-full px-2 py-0.5 whitespace-nowrap"
        style={{
          fontSize: 'var(--fs-corps)',
          background: 'var(--warning-soft)',
          color: 'var(--warning)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {deuxChiffres(heures)} h {deuxChiffres(minutes)}
      </span>
    )
  }

  // Entre 1 et 2 jours — le poids se relève, la couleur reste celle du texte.
  const signale = reste < 2 * JOUR
  return (
    <span
      className="font-mono whitespace-nowrap"
      style={{
        fontSize: 'var(--fs-corps)',
        fontWeight: signale ? 700 : 500,
        color: signale ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {jours} j {deuxChiffres(heures)} h
    </span>
  )
}
