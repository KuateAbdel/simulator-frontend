// src/components/ui/loader.tsx
//
// Les briques du LOADER, dans le langage visuel JJB (conception §2) :
// HealthDot, KpiCard, Skeleton, Banniere, OrigineTag, NumberField, Toast.
// Chaque brique tient un invariant d'interface — pas de decoration gratuite.

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

// ── Skeleton — l'etat de chargement ne ressemble JAMAIS a un etat vide ──────
export function Skeleton({ height = 16, width = '100%' }: { height?: number; width?: number | string }) {
  return (
    <span
      className="block rounded-lg animate-pulse"
      style={{ height, width, background: 'var(--border)' }}
      aria-hidden
    />
  )
}

// ── HealthDot — la pastille de sante d'un service (US-E1) ───────────────────
export function HealthDot({
  nom,
  etat,
  latenceMs,
  detail,
}: {
  nom: string
  etat: 'up' | 'down' | 'inconnu'
  latenceMs?: number
  detail?: string
}) {
  const couleur =
    etat === 'up' ? 'var(--secondary)' : etat === 'down' ? '#ef4444' : '#f59e0b'
  return (
    <div
      className="flex items-center gap-2 rounded-xl border px-3 py-2"
      style={{ borderColor: 'var(--border)', background: '#fff' }}
      title={detail}
    >
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ background: couleur, boxShadow: `0 0 6px ${couleur}` }}
        role="img"
        aria-label={`${nom} : ${etat}`}
      />
      <div className="min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
          {nom}
        </p>
        <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
          {etat === 'down' ? (detail ?? 'down') : latenceMs !== undefined ? `${latenceMs} ms` : '—'}
        </p>
      </div>
    </div>
  )
}

// ── KpiCard — la carte-chiffre generique (conception §2) ────────────────────
export function KpiCard({
  libelle,
  valeur,
  icone,
  couleur = 'var(--primary)',
  note,
}: {
  libelle: string
  valeur: React.ReactNode
  icone: React.ReactNode
  couleur?: string
  note?: string
}) {
  return (
    <div className="card p-4" style={{ borderTop: `3px solid ${couleur}` }}>
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${couleur}18`, color: couleur }}
      >
        {icone}
      </div>
      <p className="font-mono font-bold text-xl leading-none" style={{ color: 'var(--text-primary)' }}>
        {valeur}
      </p>
      <p className="text-xs font-medium mt-1.5" style={{ color: 'var(--text-muted)' }}>
        {libelle}
      </p>
      {note && (
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {note}
        </p>
      )}
    </div>
  )
}

// ── Banniere — alerte pleine largeur (ambre = attention, rouge = danger) ────
export function Banniere({
  ton,
  children,
}: {
  ton: 'attention' | 'danger' | 'info' | 'succes'
  children: React.ReactNode
}) {
  const styles = {
    attention: { background: '#fef9c3', color: '#92400e' },
    danger: { background: '#fee2e2', color: '#b91c1c' },
    info: { background: 'var(--primary-light)', color: 'var(--primary-dark)' },
    succes: { background: 'var(--secondary-light)', color: 'var(--secondary-dark)' },
  }[ton]
  return (
    <div
      className="flex items-start gap-2 rounded-xl px-4 py-3 text-xs animate-fade-in"
      style={styles}
      role={ton === 'danger' ? 'alert' : 'status'}
    >
      <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

// ── OrigineTag — la provenance d'une valeur de configuration (US-B1) ────────
// L'origine FAIT PARTIE de la donnee : defaut CDC / surcharge / parametre.
export function OrigineTag({ origine }: { origine: string }) {
  const estCdc = origine.toLowerCase().includes('cdc') || origine.includes('EF-')
  return (
    <span
      className="inline-block text-[9px] font-semibold rounded-full px-1.5 py-0.5 whitespace-nowrap"
      style={
        estCdc
          ? { background: 'var(--border)', color: 'var(--text-secondary)' }
          : { background: 'var(--secondary-light)', color: 'var(--secondary-dark)' }
      }
      title={origine}
    >
      {origine}
    </span>
  )
}

// ── NumberField — champ numerique borne, erreur inline ──────────────────────
export function NumberField({
  id,
  label,
  valeur,
  onChange,
  min,
  max,
  disabled,
  erreur,
}: {
  id: string
  label: React.ReactNode
  valeur: number | ''
  onChange: (v: number | '') => void
  min?: number
  max?: number
  disabled?: boolean
  erreur?: string | null
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-[10px] font-semibold uppercase tracking-wide mb-1 block"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </label>
      <input
        id={id}
        type="number"
        className="input-base font-mono"
        value={valeur}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => {
          const brut = e.target.value
          onChange(brut === '' ? '' : Number(brut))
        }}
        style={erreur ? { borderColor: '#ef4444' } : undefined}
      />
      {erreur && (
        <p className="text-[10px] mt-1" style={{ color: '#b91c1c' }} role="alert">
          {erreur}
        </p>
      )}
    </div>
  )
}

// ── Stepper — le rite en etapes (D-01 : preparer → lire → confirmer) ────────
export function Stepper({
  etapes,
  courante,
}: {
  etapes: string[]
  courante: number // index 0-based de l'etape active
}) {
  return (
    <ol className="flex flex-wrap items-center gap-2 mb-5" aria-label="progression du rite">
      {etapes.map((etape, i) => {
        const faite = i < courante
        const active = i === courante
        return (
          <li key={etape} className="flex items-center gap-2">
            <span
              className="flex items-center justify-center rounded-full font-mono text-xs font-bold"
              style={{
                width: 26,
                height: 26,
                background: faite ? 'var(--secondary)' : active ? 'var(--primary)' : 'var(--border)',
                color: faite || active ? '#fff' : 'var(--text-muted)',
              }}
              aria-current={active ? 'step' : undefined}
            >
              {faite ? '✓' : i + 1}
            </span>
            <span
              className="text-xs font-semibold"
              style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}
            >
              {etape}
            </span>
            {i < etapes.length - 1 && (
              <span className="w-6 border-t" style={{ borderColor: 'var(--border)' }} aria-hidden />
            )}
          </li>
        )
      })}
    </ol>
  )
}

// ── ConfirmDialog — l'action sensible se confirme, jamais en un clic ────────
export function ConfirmDialog({
  ouvert,
  titre,
  children,
  libelleConfirmer,
  libelleAnnuler,
  danger = false,
  enCours = false,
  onConfirmer,
  onAnnuler,
}: {
  ouvert: boolean
  titre: string
  children: React.ReactNode
  libelleConfirmer: string
  libelleAnnuler: string
  danger?: boolean
  enCours?: boolean
  onConfirmer: () => void
  onAnnuler: () => void
}) {
  if (!ouvert) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(26,10,46,0.55)', backdropFilter: 'blur(3px)' }}
      onClick={onAnnuler}
      role="dialog"
      aria-modal="true"
      aria-label={titre}
    >
      <div
        className="card p-5 animate-fade-in w-full"
        style={{ maxWidth: 430, borderRadius: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display font-bold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
          {titre}
        </h3>
        <div className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
          {children}
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn-ghost text-xs" style={{ height: 32 }} onClick={onAnnuler} disabled={enCours}>
            {libelleAnnuler}
          </button>
          <button
            className="text-xs font-semibold rounded-lg px-4"
            style={{
              height: 32,
              border: 'none',
              cursor: enCours ? 'default' : 'pointer',
              background: danger ? '#b91c1c' : 'var(--primary)',
              color: '#fff',
              opacity: enCours ? 0.6 : 1,
            }}
            onClick={onConfirmer}
            disabled={enCours}
          >
            {libelleConfirmer}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Toast — retour succes/erreur en portail, auto-dismiss ───────────────────
type ToastMessage = { id: number; ton: 'succes' | 'erreur'; texte: string }

const ToastContext = createContext<{ pousser: (ton: 'succes' | 'erreur', texte: string) => void }>({
  pousser: () => undefined,
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const pousser = useCallback((ton: 'succes' | 'erreur', texte: string) => {
    const id = Date.now() + Math.random()
    setToasts((liste) => [...liste, { id, ton, texte }])
    // L'erreur reste plus longtemps : elle doit pouvoir etre LUE.
    setTimeout(() => setToasts((liste) => liste.filter((t) => t.id !== id)), ton === 'erreur' ? 9000 : 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ pousser }}>
      {children}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2"
        style={{ maxWidth: 380 }}
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-start gap-2 rounded-xl px-4 py-3 text-xs animate-fade-in"
            style={{
              background: toast.ton === 'succes' ? '#1a0a2e' : '#b91c1c',
              color: '#fff',
              boxShadow: 'var(--shadow-md)',
            }}
            role={toast.ton === 'erreur' ? 'alert' : 'status'}
          >
            {toast.ton === 'succes' ? (
              <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--secondary)' }} />
            ) : (
              <XCircle size={14} className="flex-shrink-0 mt-0.5" />
            )}
            <span>{toast.texte}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
