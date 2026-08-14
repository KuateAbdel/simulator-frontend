// src/pages/Login.tsx — US-A1 (connexion) + US-A4 v2 (reset par email).
//
// Trois modes sur le meme ecran : 'connexion', 'oubli-email' (demander le
// code Mailjet), 'oubli-code' (le consommer avec le nouveau mot de passe —
// la session s'ouvre PLEINE derriere). 4 etats par appel, erreurs NOMMEES,
// idempotence UI. La reponse 202 est VOLONTAIREMENT muette sur l'existence
// du compte — l'UI repete son message tel quel.

import React, { useState } from 'react'
import { Eye, EyeOff, LogIn, MailQuestion } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ApiError, motDePasseOublie } from '../lib/api'

type Mode = 'connexion' | 'oubli-email' | 'oubli-code'

export function Login() {
  const { t, lang, setLang, seConnecter, reinitialiserParCode, motifDeconnexion } = useApp()
  const [mode, setMode] = useState<Mode>('connexion')
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [code, setCode] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [mdpVisible, setMdpVisible] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const messageDe = (err: unknown): string =>
    err instanceof ApiError && err.status === 0
      ? t('error_backend_unreachable')
      : `${t('error_named')} ${String(err instanceof ApiError ? err.detail : err)}`

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault()
    if (enCours) return
    setEnCours(true)
    setErreur(null)
    try {
      if (mode === 'connexion') {
        await seConnecter(email, motDePasse)
      } else if (mode === 'oubli-email') {
        const reponse = await motDePasseOublie(email)
        setInfo(reponse.detail ? t('forgot_code_sent') : t('forgot_code_sent'))
        setMode('oubli-code')
      } else {
        if (nouveau !== confirmation) {
          setErreur(t('passwords_differ'))
          return
        }
        if (nouveau.length < 12) {
          setErreur(t('password_too_short'))
          return
        }
        await reinitialiserParCode(email, code.trim(), nouveau)
      }
    } catch (err) {
      setErreur(messageDe(err))
    } finally {
      setEnCours(false)
    }
  }

  const champMotDePasse = (
    id: string,
    label: string,
    valeur: string,
    poser: (v: string) => void,
    autoComplete: string,
  ) => (
    <div>
      <label
        htmlFor={id}
        className="text-[11px] font-semibold uppercase tracking-wide mb-1 block"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={mdpVisible ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          className="input-base"
          style={{ paddingRight: 38 }}
          value={valeur}
          onChange={(e) => poser(e.target.value)}
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
    </div>
  )

  const champEmail = (
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
        className="input-base"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </div>
  )

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(180deg, #1a0a2e 0%, #2d1456 100%)' }}
    >
      <div className="w-full animate-fade-in" style={{ maxWidth: 400 }}>
        {/* Marque — le VRAI logo FinZuu sur pastille blanche */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="flex items-center justify-center rounded-2xl mb-3"
            style={{
              width: 64,
              height: 64,
              background: '#fff',
              boxShadow: '0 8px 24px rgba(198,140,255,0.45)',
              padding: 8,
            }}
          >
            <img src="/logo-finzuu.png" alt="FinZuu" style={{ maxWidth: '100%', maxHeight: '100%' }} />
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
            {mode === 'connexion' ? t('login_title') : t('forgot_title')}
          </h2>
          <p className="section-subtitle" style={{ marginBottom: 16 }}>
            {mode === 'connexion' ? t('login_subtitle') : t('forgot_send_code')}
          </p>

          {motifDeconnexion === 'expiree' && mode === 'connexion' && (
            <p
              className="text-xs rounded-lg px-3 py-2 mb-3"
              style={{ background: '#fef9c3', color: '#92400e' }}
              role="status"
            >
              {t('session_expired')}
            </p>
          )}

          {info && mode === 'oubli-code' && (
            <p
              className="text-xs rounded-lg px-3 py-2 mb-3"
              style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)' }}
              role="status"
            >
              {info}
            </p>
          )}

          <form onSubmit={soumettre} className="space-y-3">
            {champEmail}

            {mode === 'connexion' && (
              <>
                {champMotDePasse('mot-de-passe', t('password'), motDePasse, setMotDePasse, 'current-password')}
                <button
                  type="button"
                  className="text-[11px]"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-dark)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onClick={() => {
                    setMode('oubli-email')
                    setErreur(null)
                  }}
                >
                  {t('forgot_password')}
                </button>
              </>
            )}

            {mode === 'oubli-code' && (
              <>
                <div>
                  <label
                    htmlFor="code"
                    className="text-[11px] font-semibold uppercase tracking-wide mb-1 block"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {t('forgot_code_label')}
                  </label>
                  <input
                    id="code"
                    inputMode="numeric"
                    pattern="[0-9]{8}"
                    required
                    className="input-base font-mono"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                {champMotDePasse('nouveau', t('new_password'), nouveau, setNouveau, 'new-password')}
                {champMotDePasse('confirmation', t('new_password_confirm'), confirmation, setConfirmation, 'new-password')}
              </>
            )}

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
              {mode === 'oubli-email' ? <MailQuestion size={15} /> : <LogIn size={15} />}
              {enCours
                ? t('loading')
                : mode === 'connexion'
                  ? t('login_action')
                  : mode === 'oubli-email'
                    ? t('forgot_send_code')
                    : t('forgot_reset_action')}
            </button>

            {mode !== 'connexion' && (
              <button
                type="button"
                className="btn-ghost w-full justify-center text-xs"
                style={{ height: 34 }}
                onClick={() => {
                  setMode('connexion')
                  setErreur(null)
                  setInfo(null)
                }}
              >
                {t('forgot_back')}
              </button>
            )}
          </form>
        </div>

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
