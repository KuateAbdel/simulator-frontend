// src/components/ui/index.tsx
import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

// ── Stat Card ──────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string
  nbClients: number
  faceValue: number
  changePct: number
  icon: React.ReactNode
  color?: string
  clientLabel?: string
  onClick?: () => void
}

export function StatCard({ title, nbClients, faceValue, changePct, icon, color = 'var(--primary)', clientLabel = 'clients', onClick }: StatCardProps) {
  const positive = changePct >= 0
  return (
    <div
      className="card p-4 cursor-pointer select-none"
      style={{ borderTop: `3px solid ${color}` }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: color + '18', color }}
        >
          {icon}
        </div>
        <span className={`flex items-center gap-0.5 text-xs font-semibold ${positive ? 'stat-up' : 'stat-down'}`}>
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(changePct).toFixed(1)}%
        </span>
      </div>
      <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>{title}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="font-display font-bold text-xl leading-none" style={{ color: 'var(--text-primary)' }}>
            {faceValue >= 1000000
              ? `$${(faceValue / 1000000).toFixed(1)}M`
              : faceValue >= 1000
              ? `$${(faceValue / 1000).toFixed(0)}K`
              : `$${faceValue}`}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {nbClients.toLocaleString()} {clientLabel}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Section Header ──────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ── Status Badge ────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; className: string }> = {
  active:   { label: 'Actif',      className: 'badge-secondary' },
  inactive: { label: 'Inactif',    className: 'badge-danger' },
  pending:  { label: 'En attente', className: 'badge-warning' },
  approved: { label: 'Approuvé',   className: 'badge-secondary' },
  rejected: { label: 'Rejeté',     className: 'badge-danger' },
  closed:   { label: 'Clôturé',    className: 'badge-primary' },
  overdue:  { label: 'En retard',  className: 'badge-danger' },
  default:  { label: 'Défaut',     className: 'badge-danger' },
  completed:{ label: 'Complété',   className: 'badge-secondary' },
  failed:   { label: 'Échoué',     className: 'badge-danger' },
  low:      { label: 'Basse',      className: 'badge-secondary' },
  medium:   { label: 'Moyenne',    className: 'badge-warning' },
  high:     { label: 'Haute',      className: 'badge-danger' },
}

export function StatusBadge({ status }: { status: string }) {
  const def = STATUS_MAP[status] ?? { label: status, className: 'badge-primary' }
  return <span className={def.className}>{def.label}</span>
}

// ── Segment Badge ───────────────────────────────────────────────────────────
const SEG_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#a78bfa', '#19af58']

export function SegmentBadge({ segment }: { segment: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-bold rounded-full px-2 py-0.5"
      style={{ background: SEG_COLORS[segment] + '20', color: SEG_COLORS[segment] }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: SEG_COLORS[segment] }} />
      S{segment}
    </span>
  )
}

// ── Score Bar ───────────────────────────────────────────────────────────────
export function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'var(--secondary)' : score >= 60 ? 'var(--primary)' : score >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="progress-bar flex-1" style={{ minWidth: 48 }}>
        <div className="progress-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-mono font-semibold flex-shrink-0" style={{ color }}>{score}</span>
    </div>
  )
}

// ── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`card p-4 ${className}`} style={style}>
      {children}
    </div>
  )
}

// ── Custom Tooltip ──────────────────────────────────────────────────────────
export function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <p className="font-semibold text-xs mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-xs" style={{ color: p.color }}>
          {p.name}: {p.value >= 1000 ? `$${(p.value / 1000).toFixed(0)}K` : p.value}
        </p>
      ))}
    </div>
  )
}

// ── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--primary-light)' }}>
        <span style={{ fontSize: 20 }}>📊</span>
      </div>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  )
}

// ── Tab Bar ─────────────────────────────────────────────────────────────────
export function TabBar({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: 'var(--border)', width: 'fit-content' }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="text-xs font-semibold px-4 py-1.5 rounded-lg transition-all"
          style={{
            background: active === tab.id ? '#fff' : 'transparent',
            color: active === tab.id ? 'var(--primary-dark)' : 'var(--text-muted)',
            boxShadow: active === tab.id ? 'var(--shadow)' : 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
