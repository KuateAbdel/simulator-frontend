'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollText, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, StatusPill } from '@/components/ui-bits'
import { useLoader } from '@/components/loader-store'
import { GEN_MODULES, type ModuleStatus } from '@/lib/finzuu'

function statusFromProgress(p: number): ModuleStatus {
  if (p >= 100) return 'termine'
  if (p > 0) return 'en_cours'
  return 'en_attente'
}

function fmt(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export default function ExecutionPage() {
  const router = useRouter()
  const { currentRun } = useLoader()
  const [progresses, setProgresses] = useState<number[]>(() =>
    GEN_MODULES.map((m) => m.progress),
  )
  const [elapsed, setElapsed] = useState(408) // 00:06:48
  const [done, setDone] = useState(false)
  const stoppedRef = useRef(false)

  useEffect(() => {
    if (done || stoppedRef.current) return
    const id = setInterval(() => {
      setElapsed((e) => e + 3)
      setProgresses((prev) => {
        const next = [...prev]
        const idx = next.findIndex((p) => p < 100)
        if (idx === -1) {
          setDone(true)
          return prev
        }
        next[idx] = Math.min(100, next[idx] + 12)
        return next
      })
    }, 700)
    return () => clearInterval(id)
  }, [done])

  const global = Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length)
  const remaining = done ? 0 : Math.max(0, Math.round((elapsed * (100 - global)) / Math.max(global, 1)))

  const runId = currentRun?.id ?? 'RUN-2026-07-22-001'

  return (
    <div className="mx-auto max-w-4xl">
      <Card className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-foreground">
              {done ? 'Run terminé' : 'Run en cours'}
            </h1>
            <span className="rounded-md bg-secondary px-2.5 py-1 font-mono text-xs font-medium text-secondary-foreground">
              {runId}
            </span>
          </div>
          <StatusPill status={done ? 'termine' : 'en_cours'} />
        </div>

        {/* Progression globale */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Progression globale</span>
            <span className="text-sm font-bold text-foreground">{global}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${global}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <span>Temps écoulé : {fmt(elapsed)}</span>
            <span>Estimation restante : {fmt(remaining)}</span>
          </div>
        </div>

        {/* Modules */}
        <div>
          <p className="mb-3 text-sm font-semibold text-foreground">Modules de génération</p>
          <div className="space-y-3">
            {GEN_MODULES.map((mod, i) => {
              const p = progresses[i]
              const status = statusFromProgress(p)
              return (
                <div
                  key={mod.label}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[minmax(0,220px)_1fr_44px_88px]"
                >
                  <span className="truncate text-sm text-foreground">{mod.label}</span>
                  <div className="col-span-2 h-2 w-full overflow-hidden rounded-full bg-muted sm:col-span-1">
                    <div
                      className={
                        'h-full rounded-full transition-all duration-500 ' +
                        (status === 'termine' ? 'bg-brand-green' : 'bg-primary')
                      }
                      style={{ width: `${p}%` }}
                    />
                  </div>
                  <span className="text-right text-xs font-medium tabular-nums text-muted-foreground">
                    {p}%
                  </span>
                  <span
                    className={
                      'text-right text-xs font-semibold sm:text-left ' +
                      (status === 'termine'
                        ? 'text-brand-green'
                        : status === 'en_cours'
                          ? 'text-primary'
                          : 'text-muted-foreground')
                    }
                  >
                    {status === 'termine'
                      ? 'Terminé'
                      : status === 'en_cours'
                        ? 'En cours'
                        : 'En attente'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {done ? (
            <>
              <Button
                variant="outline"
                size="lg"
                className="h-10 gap-2 px-4"
                onClick={() => router.push('/logs')}
              >
                <ScrollText className="size-4" />
                Voir les logs
              </Button>
              <Button
                size="lg"
                className="h-10 px-5 font-semibold"
                onClick={() => router.push('/resultats')}
              >
                Voir les résultats
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="destructive"
                size="lg"
                className="h-10 gap-2 px-4"
                onClick={() => {
                  stoppedRef.current = true
                  setDone(true)
                }}
              >
                <Square className="size-3.5" />
                Arrêter le run
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-10 gap-2 px-4"
                onClick={() => router.push('/logs')}
              >
                <ScrollText className="size-4" />
                Voir les logs
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
