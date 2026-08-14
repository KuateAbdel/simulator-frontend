// src/pages/Login.tsx — US-A1, la porte du cockpit.
//
// 4 etats tenus : repos / envoi (bouton bloque = idempotence UI) / erreur
// NOMMEE du backend (401 volontairement muet sur sa cause) / succes.

import React, { useState } from 'react'
import { Building2, Eye, EyeOff, LogIn } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ApiError } from '../lib/api'

export function Login() {
  const { t, lang, setLang, seConnecter, motifDeconnexion } = useApp()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [mdpVisible, setMdpVisible] = useState(false)
  const [aideMdpOuverte, setAideMdpOuverte] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault()
    if (enCours) return
    setEnCours(true)
    setErreur(null)
    try {
      await seConnecter(email, motDePasse)
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
        {/* Marque */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="flex items-center justify-center rounded-2xl mb-3"
            style={{
              width: 56,
              height: 56,
              background: 'var(--primary)',
              boxShadow: '0 8px 24px rgba(198,140,255,0.5)',
            }}
          >
            <Building2 size={28} color="#fff" />
          </div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight">
            {t('app_name')}
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {t('app_tagline')}
          </p>
        </div>

        <div className="card p-6" style={{ borderRadius: 16 }}>
          <h2 className="section-title" style={{ fontSize: '1.05rem' }}>
            {t('login_title')}
          </h2>
          <p className="section-subtitle" style={{ marginBottom: 16 }}>
            {t('login_subtitle')}
          </p>

          {motifDeconnexion === 'expiree' && (
            <p
              className="text-xs rounded-lg px-3 py-2 mb-3"
              style={{ background: '#fef9c3', color: '#92400e' }}
              role="status"
            >
              {t('session_expired')}
            </p>
          )}

          <form onSubmit={soumettre} className="space-y-3">
            <div>
              <label
                htmlFor="email"
                className="text-[11px] font-semibold uppercase tracking-wide mb-1 block"
                style={{ color: 'var(--text-muted)' }}
              >
                {t('email')}
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                autoFocus
                className="input-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="mot-de-passe"
                className="text-[11px] font-semibold uppercase tracking-wide mb-1 block"
                style={{ color: 'var(--text-muted)' }}
              >
                {t('password')}
              </label>
              <div className="relative">
                <input
                  id="mot-de-passe"
                  type={mdpVisible ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="input-base"
                  style={{ paddingRight: 38 }}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setMdpVisible(!mdpVisible)}
                  aria-label={mdpVisible ? t('hide_password') : t('show_password')}
                  title={mdpVisible ? t('hide_password') : t('show_password')}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                  }}
                >
                  {mdpVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* US-A4 — pas de reset par email en v1, et on le DIT (pas de
                  lien mort ni de theatre de securite) */}
              <button
                type="button"
                className="text-[11px] mt-1.5"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-dark)',
                  cursor: 'pointer',
                  padding: 0,
                }}
                onClick={() => setAideMdpOuverte(!aideMdpOuverte)}
              >
                {t('forgot_password')}
              </button>
              {aideMdpOuverte && (
                <p
                  className="text-[11px] rounded-lg px-3 py-2 mt-1.5 animate-fade-in"
                  style={{ background: 'var(--primary-light)', color: 'var(--text-secondary)' }}
                >
                  {t('forgot_password_info')}
                </p>
              )}
            </div>

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
              <LogIn size={15} />
              {enCours ? t('login_in_progress') : t('login_action')}
            </button>
          </form>
        </div>

        {/* Langue — accessible AVANT connexion (bilingue natif) */}
        <div className="flex justify-center mt-4">
          <button
            className="text-xs font-medium rounded-lg px-3 py-1.5"
            style={{
              color: 'rgba(255,255,255,0.7)',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer',
            }}
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          >
            {lang === 'fr' ? 'English' : 'Français'}
          </button>
        </div>
      </div>
    </div>
  )
}
