// src/components/Layout/NotifCloche.tsx
//
// La CLOCHE de notifications du header — canal in-app du systeme de
// notification (20/08). Le badge sonde le compteur leger (30 s) ; le panneau
// charge la liste a l'ouverture. Le texte est rendu LOCALISE ici (FR/EN) :
// le backend n'envoie que `type` + `donnees` structurees — jamais une phrase.

import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import {
  compterNonLues,
  listerNotifications,
  marquerNotifLue,
  marquerToutLu,
  type NotificationAdmin,
} from '../../lib/api'
import type { TranslationKey } from '../../i18n'

//: Cadence du compteur — plus vif que le dashboard (60 s) : c'est une cloche.
const INTERVALLE_COMPTEUR_MS = 30_000

//: type d'evenement -> gabarit localise. Un type INCONNU (backend plus recent
//: que ce build) s'affiche brut plutot que de casser la cloche.
const GABARITS: Record<string, TranslationKey> = {
  compte_cree: 'notif_compte_cree',
  role_change: 'notif_role_change',
  compte_desactive: 'notif_compte_desactive',
  compte_reactive: 'notif_compte_reactive',
}

/** Rend le texte localise d'une notification : gabarit t(type) dont chaque
 * `{cle}` est remplacee par `donnees[cle]`. Exportee pour le banc d'essai. */
export function rendreNotif(
  type: string,
  donnees: Record<string, unknown>,
  t: (key: TranslationKey) => string,
): string {
  const gabarit = GABARITS[type]
  if (!gabarit) return type
  return t(gabarit).replace(/\{(\w+)\}/g, (_, cle: string) =>
    String(donnees[cle] ?? `{${cle}}`),
  )
}

type Panneau =
  | { phase: 'chargement' }
  | { phase: 'pret'; notifications: NotificationAdmin[] }
  | { phase: 'erreur' }

export function NotifCloche() {
  const { t, lang, session } = useApp()
  const [nonLues, setNonLues] = useState(0)
  const [ouvert, setOuvert] = useState(false)
  const [panneau, setPanneau] = useState<Panneau>({ phase: 'chargement' })
  const racine = useRef<HTMLDivElement>(null)

  // Le compteur — sonde reguliere, silencieuse en cas de panne (le badge
  // garde sa derniere valeur, le prochain cycle reessaie).
  useEffect(() => {
    if (!session) return
    let vivant = true
    const sonder = async () => {
      try {
        const r = await compterNonLues()
        if (vivant) setNonLues(r.non_lues)
      } catch {
        /* panne passagere — on garde le dernier compteur connu */
      }
    }
    void sonder()
    const timer = setInterval(() => void sonder(), INTERVALLE_COMPTEUR_MS)
    return () => {
      vivant = false
      clearInterval(timer)
    }
  }, [session])

  const chargerListe = useCallback(async () => {
    setPanneau({ phase: 'chargement' })
    try {
      const r = await listerNotifications()
      setPanneau({ phase: 'pret', notifications: r.notifications })
      setNonLues(r.non_lues)
    } catch {
      setPanneau({ phase: 'erreur' })
    }
  }, [])

  const basculer = () => {
    const prochain = !ouvert
    setOuvert(prochain)
    if (prochain) void chargerListe()
  }

  // Fermeture au clic exterieur et a Echap — un panneau, pas une page.
  useEffect(() => {
    if (!ouvert) return
    const surClic = (e: MouseEvent) => {
      if (racine.current && !racine.current.contains(e.target as Node)) setOuvert(false)
    }
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOuvert(false)
    }
    document.addEventListener('mousedown', surClic)
    document.addEventListener('keydown', surTouche)
    return () => {
      document.removeEventListener('mousedown', surClic)
      document.removeEventListener('keydown', surTouche)
    }
  }, [ouvert])

  const lireUne = async (notif: NotificationAdmin) => {
    if (notif.lu) return
    try {
      await marquerNotifLue(notif.id)
      setPanneau((p) =>
        p.phase === 'pret'
          ? {
              phase: 'pret',
              notifications: p.notifications.map((n) =>
                n.id === notif.id ? { ...n, lu: true } : n,
              ),
            }
          : p,
      )
      setNonLues((n) => Math.max(0, n - 1))
    } catch {
      /* le badge se recalera au prochain cycle */
    }
  }

  const toutLire = async () => {
    try {
      await marquerToutLu()
      setPanneau((p) =>
        p.phase === 'pret'
          ? { phase: 'pret', notifications: p.notifications.map((n) => ({ ...n, lu: true })) }
          : p,
      )
      setNonLues(0)
    } catch {
      /* idem — silencieux, reessayable */
    }
  }

  const quand = (iso: string) =>
    new Date(iso).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      dateStyle: 'short',
      timeStyle: 'short',
    })

  return (
    <div ref={racine} style={{ position: 'relative' }}>
      <button
        className="flex items-center justify-center rounded-lg border transition-all"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text-secondary)',
          background: 'transparent',
          cursor: 'pointer',
          height: 32,
          width: 32,
          position: 'relative',
        }}
        onClick={basculer}
        title={t('notif_titre')}
        aria-label={t('notif_aria')}
        aria-expanded={ouvert}
      >
        <Bell size={14} />
        {nonLues > 0 && (
          <span
            aria-hidden
            className="font-semibold"
            style={{
              position: 'absolute',
              top: -5,
              right: -5,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 8,
              background: 'var(--primary)',
              color: '#fff',
              fontSize: 10,
              lineHeight: '16px',
              textAlign: 'center',
            }}
          >
            {nonLues > 9 ? '9+' : nonLues}
          </span>
        )}
      </button>

      {ouvert && (
        <div
          role="dialog"
          aria-label={t('notif_titre')}
          className="rounded-xl border shadow-lg"
          style={{
            position: 'absolute',
            right: 0,
            top: 40,
            width: 'min(340px, calc(100vw - 32px))',
            maxHeight: 420,
            overflowY: 'auto',
            background: 'var(--bg)',
            borderColor: 'var(--border)',
            zIndex: 50,
          }}
        >
          <div
            className="flex items-center justify-between px-3 py-2 border-b"
            style={{ borderColor: 'var(--border)', position: 'sticky', top: 0, background: 'var(--bg)' }}
          >
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('notif_titre')}
            </span>
            {panneau.phase === 'pret' && panneau.notifications.some((n) => !n.lu) && (
              <button
                className="btn-ghost text-[11px] px-2"
                style={{ height: 24 }}
                onClick={() => void toutLire()}
              >
                <CheckCheck size={12} />
                {t('notif_tout_lu')}
              </button>
            )}
          </div>

          {panneau.phase === 'chargement' && (
            <p className="text-xs px-3 py-4" style={{ color: 'var(--text-muted)' }}>
              {t('loading')}
            </p>
          )}
          {panneau.phase === 'erreur' && (
            <p className="text-xs px-3 py-4" role="alert" style={{ color: '#b91c1c' }}>
              {t('notif_erreur')}
            </p>
          )}
          {panneau.phase === 'pret' && panneau.notifications.length === 0 && (
            <p className="text-xs px-3 py-4" style={{ color: 'var(--text-muted)' }}>
              {t('notif_vide')}
            </p>
          )}
          {panneau.phase === 'pret' &&
            panneau.notifications.map((notif) => (
              <div
                key={notif.id}
                className="flex items-start gap-2 px-3 py-2 border-b"
                style={{
                  borderColor: 'var(--border)',
                  background: notif.lu ? 'transparent' : 'rgba(198,140,255,0.08)',
                }}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs"
                    style={{
                      color: notif.lu ? 'var(--text-secondary)' : 'var(--text-primary)',
                      fontWeight: notif.lu ? 400 : 600,
                      overflowWrap: 'break-word',
                    }}
                  >
                    {rendreNotif(notif.type, notif.donnees, t)}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {quand(notif.quand)}
                  </p>
                </div>
                {!notif.lu && (
                  <button
                    className="flex-shrink-0"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--primary)',
                      padding: 2,
                    }}
                    onClick={() => void lireUne(notif)}
                    title={t('notif_marquer_lu')}
                    aria-label={t('notif_marquer_lu')}
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
