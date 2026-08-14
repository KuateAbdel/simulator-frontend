'use client'

import { useRouter } from 'next/navigation'
import {
  Banknote,
  Download,
  Globe2,
  HandCoins,
  Landmark,
  RotateCcw,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, StatusPill } from '@/components/ui-bits'
import { useLoader } from '@/components/loader-store'
import { ENTITY_RESULTS, RESULT_SUMMARY } from '@/lib/finzuu'

const STATS = [
  { label: 'Pays', value: RESULT_SUMMARY.pays, icon: Globe2 },
  { label: 'Clients', value: RESULT_SUMMARY.clients, icon: Users },
  { label: 'Comptes', value: RESULT_SUMMARY.comptes, icon: Landmark },
  { label: 'Prêts', value: RESULT_SUMMARY.prets, icon: HandCoins },
  { label: 'Épargne', value: RESULT_SUMMARY.epargne, icon: Banknote },
]

const nf = new Intl.NumberFormat('fr-FR')

export default function ResultatsPage() {
  const router = useRouter()
  const { currentRun } = useLoader()
  const runId = currentRun?.id ?? 'RUN-2026-07-22-001'

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-foreground">Run terminé</h1>
            <span className="rounded-md bg-secondary px-2.5 py-1 font-mono text-xs font-medium text-secondary-foreground">
              {runId}
            </span>
            <StatusPill status="termine" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="lg"
              className="h-10 gap-2 px-4"
              onClick={() => router.push('/reinitialisation')}
            >
              <RotateCcw className="size-4" />
              Réinitialiser
            </Button>
            <Button variant="outline" size="lg" className="h-10 gap-2 px-4">
              <Download className="size-4" />
              Télécharger le rapport
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {STATS.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-secondary/40 p-4 text-center"
              >
                <span className="mx-auto mb-2 inline-flex size-9 items-center justify-center rounded-lg bg-accent text-primary">
                  <Icon className="size-5" />
                </span>
                <p className="text-xl font-bold text-foreground">{nf.format(s.value)}</p>
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Détail par entité */}
      <Card>
        <p className="mb-4 text-sm font-semibold text-foreground">Détail par entité</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 pr-4 font-semibold">Entité</th>
                <th className="pb-3 pr-4 text-right font-semibold">Créé</th>
                <th className="pb-3 pr-4 text-right font-semibold">Réussi</th>
                <th className="pb-3 text-right font-semibold">Échecs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ENTITY_RESULTS.map((row) => (
                <tr key={row.entity}>
                  <td className="py-3 pr-4 font-medium text-foreground">{row.entity}</td>
                  <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                    {nf.format(row.cree)}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-brand-green">
                    {nf.format(row.reussi)}
                  </td>
                  <td className="py-3 text-right tabular-nums text-muted-foreground">
                    {row.echecs}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
