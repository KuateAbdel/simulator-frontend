'use client'

import { useState } from 'react'
import { AlertTriangle, ChevronDown, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, PageHeader, StatusPill } from '@/components/ui-bits'
import { MOCK_RUNS, RESET_ESTIMATE } from '@/lib/finzuu'

type Mode = 'run' | 'prefix'

const nf = new Intl.NumberFormat('fr-FR')

export default function ReinitialisationPage() {
  const [mode, setMode] = useState<Mode>('run')
  const [runId, setRunId] = useState(MOCK_RUNS[0].id)
  const [prefix, setPrefix] = useState('DEMO_')
  const [confirmed, setConfirmed] = useState(false)

  const selectedRun = MOCK_RUNS.find((r) => r.id === runId)

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Réinitialiser l'environnement" />

      <Card className="space-y-6">
        {/* Tabs */}
        <div className="inline-flex rounded-lg border border-border bg-secondary/50 p-1">
          <TabButton active={mode === 'run'} onClick={() => setMode('run')}>
            Par run_id
          </TabButton>
          <TabButton active={mode === 'prefix'} onClick={() => setMode('prefix')}>
            Par préfixe
          </TabButton>
        </div>

        {/* Selector */}
        {mode === 'run' ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Sélectionner un run</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <select
                  value={runId}
                  onChange={(e) => setRunId(e.target.value)}
                  className="h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-10 font-mono text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                >
                  {MOCK_RUNS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id} — {r.environment}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              {selectedRun ? <StatusPill status={selectedRun.status} /> : null}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Préfixe à supprimer</label>
            <input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
            />
            <p className="text-xs text-muted-foreground">
              Toutes les entités dont l&apos;identifiant commence par ce préfixe seront supprimées.
            </p>
          </div>
        )}

        {/* Warning */}
        <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="text-sm text-destructive">
            <p className="font-semibold">
              Cette action supprimera uniquement les données créées par{' '}
              {mode === 'run' ? 'ce run' : 'ce préfixe'}.
            </p>
            <p className="text-destructive/80">
              Les données existantes non liées ne seront pas affectées.
            </p>
          </div>
        </div>

        {/* Aperçu de la suppression */}
        <div>
          <p className="mb-3 text-sm font-semibold text-foreground">Aperçu de la suppression</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <p className="text-xs font-medium text-muted-foreground">Entités concernées</p>
              <p className="mt-1 text-lg font-bold text-foreground">{RESET_ESTIMATE.types} types</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <p className="text-xs font-medium text-muted-foreground">Nombre total estimé</p>
              <p className="mt-1 text-lg font-bold text-foreground">
                ~ {nf.format(RESET_ESTIMATE.total)}
              </p>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="size-4 rounded border-input accent-destructive"
            />
            Je confirme vouloir réinitialiser
          </label>
          <Button
            size="lg"
            disabled={!confirmed}
            className="h-10 gap-2 bg-destructive px-5 font-semibold text-destructive-foreground hover:bg-destructive/90"
          >
            <Trash2 className="size-4" />
            Réinitialiser
          </Button>
        </div>
      </Card>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-md px-4 py-1.5 text-sm font-medium transition-colors ' +
        (active
          ? 'bg-card text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground')
      }
    >
      {children}
    </button>
  )
}
