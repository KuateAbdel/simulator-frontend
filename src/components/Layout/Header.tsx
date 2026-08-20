// src/components/Layout/Header.tsx
//
// Le header du Loader : titre de page + user story realisee (tracabilite
// visible), bascule FR/EN, compte a rebours REEL de session (4 h), sortie.
// Les gadgets fintech de la base JJB (QR, filtres, alertes mock) sont partis.

import { useState } from 'react'
import { Clock, Eye, Globe, KeyRound, LogOut, Menu, Moon, Sun } from 'lucide-react'
import { ConfirmDialog, useToast } from '../ui/loader'
import { useApp } from '../../context/AppContext'
import { ApiError } from '../../lib/api'
import { navItemDe } from './nav'
import { NotifCloche } from './NotifCloche'

function formaterCompteARebours(secondes: number): string {
  const h = Math.floor(secondes / 3600)
  const m = Math.floor((secondes % 3600) / 60)
  const s = secondes % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

/** Changer MON mot de passe — libre-service, a tout moment, sans toucher
 * les autres comptes (RBAC 15/08). Reutilise le contrat US-A2 : le jeton
 * rendu remplace la session, personne d'autre n'est concerne. */
function ChangerMonMotDePasse() {
  const { t, changerMotDePasse } = useApp()
  const { pousser } = useToast()
  const [ouvert, setOuvert] = useState(false)
  const [ancien, setAncien] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [confirme, setConfirme] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const fermer = () => {
    setOuvert(false)
    setAncien('')
    setNouveau('')
    setConfirme('')
    setErreur(null)
  }

  const soumettre = async () => {
    if (nouveau !== confirme) {
      setErreur(t('passwords_differ'))
      return
    }
    if (nouveau.length < 12) {
      setErreur(t('password_too_short'))
      return
    }
    setEnCours(true)
    setErreur(null)
    try {
      await changerMotDePasse(ancien, nouveau)
      pousser('succes', t('mdp_change'))
      fermer()
    } catch (err) {
      setErreur(
        err instanceof ApiError ? `${t('error_named')} ${String(err.detail)}` : String(err),
      )
    } finally {
      setEnCours(false)
    }
  }

  const champ = (
    libelle: string,
    valeur: string,
    poser: (v: string) => void,
  ) => (
    <div className="mb-2">
      <label className="text-[10px] font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-muted)' }}>
        {libelle}
      </label>
      <input
        className="input-base"
        type="password"
        value={valeur}
        onChange={(e) => poser(e.target.value)}
        autoComplete="new-password"
      />
    </div>
  )

  return (
    <>
      <button
        className="btn-ghost text-xs px-2"
        style={{ height: 32 }}
        onClick={() => setOuvert(true)}
        title={t('mdp_changer_titre')}
      >
        <KeyRound size={13} />
        <span className="hidden md:inline">{t('mdp_changer')}</span>
      </button>
      <ConfirmDialog
        ouvert={ouvert}
        titre={t('mdp_changer_titre')}
        libelleConfirmer={t('change_password_action')}
        libelleAnnuler={t('cancel')}
        enCours={enCours}
        onConfirmer={() => void soumettre()}
        onAnnuler={fermer}
      >
        <p className="mb-3">{t('mdp_changer_note')}</p>
        {champ(t('old_password'), ancien, setAncien)}
        {champ(t('new_password'), nouveau, setNouveau)}
        {champ(t('new_password_confirm'), confirme, setConfirme)}
        {erreur && (
          <p className="text-xs mt-1" style={{ color: '#b91c1c' }} role="alert">
            {erreur}
          </p>
        )}
      </ConfirmDialog>
    </>
  )
}

export function Header() {
  const { t, lang, setLang, theme, toggleTheme, currentPage, sessionSecondsLeft, seDeconnecter, estMobile, setSidebarOpen, peutEcrire, session } =
    useApp()
  const item = navItemDe(currentPage)

  // Sous 15 minutes, le minuteur passe en ambre : la peremption se VOIT venir.
  const bientotPerimee = sessionSecondsLeft > 0 && sessionSecondsLeft < 15 * 60

  return (
    <header
      className="flex items-center justify-between px-5 py-3 border-b"
      style={{
        background: 'var(--bg)',
        borderColor: 'var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 8px rgba(198,140,255,0.07)',
        minHeight: 56,
      }}
    >
      {/* Gauche — hamburger (mobile) + titre + user story de l'ecran */}
      <div className="flex items-center gap-3 min-w-0">
        {estMobile && (
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="menu"
            className="flex-shrink-0 flex items-center justify-center rounded-lg"
            style={{
              width: 36,
              height: 36,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            <Menu size={17} />
          </button>
        )}
        <h1
          className="font-display font-bold text-base truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {t(item.labelKey)}
        </h1>
        <span className="badge-primary hidden sm:inline-block flex-shrink-0 font-mono">
          {item.stories}
        </span>
      </div>

      {/* Droite */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* RBAC — signal GLOBAL de lecture seule (viewer). Les ecrans cachent
            leurs actions ; ceci le dit d'un coup d'oeil, partout. */}
        {session && !peutEcrire && (
          <span
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold rounded-md px-2 py-1"
            style={{ background: 'rgba(120,124,140,0.16)', color: 'var(--text-secondary)' }}
            title={t('lecture_seule_note')}
          >
            <Eye size={12} />
            {t('lecture_seule')}
          </span>
        )}
        {/* Compte a rebours de session — la verite du jeton, pas un chrono decoratif */}
        <span
          className="session-timer hidden sm:flex items-center gap-1.5"
          title={t('session_expires_in')}
          style={
            bientotPerimee
              ? { background: '#fef9c3', color: '#92400e' }
              : undefined
          }
        >
          <Clock size={11} />
          {formaterCompteARebours(sessionSecondsLeft)}
        </span>

        {/* Cloche de notifications — badge non-lues + panneau in-app */}
        <NotifCloche />

        {/* Bascule thème clair/sombre — couleurs FinZuu */}
        <button
          className="flex items-center justify-center rounded-lg border transition-all"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
            background: 'transparent',
            cursor: 'pointer',
            height: 32,
            width: 32,
          }}
          onClick={toggleTheme}
          title={theme === 'dark' ? t('theme_clair') : t('theme_sombre')}
          aria-label={theme === 'dark' ? t('theme_clair') : t('theme_sombre')}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Bascule FR/EN */}
        <button
          className="flex items-center gap-1 text-xs font-medium rounded-lg px-2 py-1 border transition-all"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
            background: 'transparent',
            cursor: 'pointer',
            height: 32,
          }}
          onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          title={t('language')}
        >
          <Globe size={13} />
          {lang.toUpperCase()}
        </button>

        {/* Mon mot de passe — libre-service, n'importe quand */}
        <ChangerMonMotDePasse />

        {/* Deconnexion */}
        <button
          className="btn-ghost text-xs px-3"
          style={{ height: 32 }}
          onClick={() => seDeconnecter()}
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">{t('logout')}</span>
        </button>
      </div>
    </header>
  )
}
