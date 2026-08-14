'use client'

import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function Card({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-6', className)}>
      {children}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
        checked ? 'bg-brand-green' : 'bg-input',
      )}
    >
      <span
        className={cn(
          'inline-block size-5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export function StatusPill({ status }: { status: 'termine' | 'en_cours' | 'echoue' | 'en_attente' }) {
  const map = {
    termine: { label: 'Terminé', cls: 'bg-brand-green-muted text-brand-green' },
    en_cours: { label: 'En cours', cls: 'bg-accent text-accent-foreground' },
    echoue: { label: 'Échoué', cls: 'bg-destructive/10 text-destructive' },
    en_attente: { label: 'En attente', cls: 'bg-muted text-muted-foreground' },
  } as const
  const { label, cls } = map[status]
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', cls)}>
      {label}
    </span>
  )
}
