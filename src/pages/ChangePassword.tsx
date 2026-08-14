// src/pages/ChangePassword.tsx — US-A2, le mot de passe force.
//
// Tant que must_change_password est vrai, le backend n'ouvre QUE
// /admin/auth/password (portee password_only) — cet ecran est donc un
// passage oblige, pas une option. Les invariants du backend sont doubles
// cote UI (12 caracteres min, nouveau ≠ ancien) mais SON erreur fait foi.

import React, { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ApiError } from '../lib/api'

const LONGUEUR_MDP_MIN = 12 // miroir de admin_auth.LONGUEUR_MDP_MIN

export function ChangePassword() {
  const { t, changerMotDePasse, seDeconnecter, session } = useApp()
  const [ancien, setAncien] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault()
    if (enCours) return
    setErreur(null)
    if (nouveau !== confirmation) {
      setErreur(t('passwords_differ'))
      return
    }
    if (nouveau.length < LONGUEUR_MDP_MIN) {
      setErreur(t('password_too_short'))
      return
    }
    setEnCours(true)
    try {
      await changerMotDePasse(ancien, nouveau)
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        setErreur(t('error_backend_unreachable'))
      } else if (err instanceof ApiError) {
        setErreur(`${t('error_named')} ${String(err.detail ?? err.message)}`)
      } else {
        setErreur(String(err))
      }
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(180deg, #1a0a2e 0%, #2d1456 100%)' }}
    >
      <div className="w-full animate-fade-in" style={{ maxWidth: 400 }}>
        <div className="card p-6" style={{ borderRadius: 16 }}>
          <div
            className="flex items-center justify-center rounded-2xl mb-4 mx-auto"
            style={{ width: 48, height: 48, background: 'var(--primary-light)' }}
          >
            <KeyRound size={22} style={{ color: 'var(--primary-dark)' }} />
          </div>
          <h2 className="section-title text-center" style={{ fontSize: '1.05rem' }}>
            {t('change_password_title')}
          </h2>
          <p className="section-subtitle text-center" style={{ marginBottom: 16 }}>
            {t('change_password_subtitle')}
          </p>
          {session && (
            <p
              className="text-center font-mono text-xs mb-4"
              style={{ color: 'var(--text-muted)' }}
            >
              {session.email}
            </p>
          )}

          <form onSubmit={soumettre} className="space-y-3">
            {[
              {
                id: 'ancien',
                label: t('old_password'),
                valeur: ancien,
                poser: setAncien,
                autoComplete: 'current-password',
              },
              {
                id: 'nouveau',
                label: t('new_password'),
                valeur: nouveau,
                poser: setNouveau,
                autoComplete: 'new-password',
              },
              {
                id: 'confirmation',
                label: t('new_password_confirm'),
                valeur: confirmation,
                poser: setConfirmation,
                autoComplete: 'new-password',
              },
            ].map((champ) => (
              <div key={champ.id}>
                <label
                  htmlFor={champ.id}
                  className="text-[11px] font-semibold uppercase tracking-wide mb-1 block"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {champ.label}
                </label>
                <input
                  id={champ.id}
                  type="password"
                  required
                  autoComplete={champ.autoComplete}
                  className="input-base"
                  value={champ.valeur}
                  onChange={(e) => champ.poser(e.target.value)}
                />
              </div>
            ))}

            {erreur && (
              <p
                className="text-xs rounded-lg px-3 py-2"
                style={{ background: '#fee2e2', color: '#b91c1c' }}
                role="alert"
              >
                {erreur}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary w-full justify-center"
              style={{ height: 40, opacity: enCours ? 0.7 : 1 }}
              disabled={enCours}
            >
              {enCours ? t('loading') : t('change_password_action')}
            </button>
            <button
              type="button"
              className="btn-ghost w-full justify-center text-xs"
              style={{ height: 34 }}
              onClick={() => seDeconnecter()}
            >
              {t('logout')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
