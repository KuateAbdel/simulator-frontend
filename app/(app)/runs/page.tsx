'use client'

import { useRouter } from 'next/navigation'
import { Play, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, PageHeader } from '@/components/ui-bits'
import { useLoader } from '@/components/loader-store'
import { countryNames } from '@/lib/finzuu'

export default function LancementPage() {
  const router = useRouter()
  const { config, startRun } = useLoader()

  const optionLabels = [
    config.options.historiqueCredit && 'Historique crédit',
    config.options.vieFinanciere && 'Vie financière',
    config.options.simulationComportementale && 'Simulation comportementale',
  ].filter(Boolean) as string[]

  const rows: { label: string; value: string }[] = [
    { label: 'Environnement', value: config.environment },
    { label: 'Pays', value: countryNames(config.countries) },
    { label: 'Période', value: `${config.periodDays} jours` },
    {
      label: 'Volumes',
      value: `~ ${config.volumes.clients} clients, ${config.volumes.companies} companies, ${config.volumes.lenders} lenders, etc.`,
    },
    { label: 'Options', value: optionLabels.join(', ') || 'Aucune' },
  ]

  function handleLaunch() {
    startRun()
    router.push('/execution')
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Récapitulatif du run" />

      <Card className="space-y-6">
        <dl className="divide-y divide-border">
          {rows.map((r) => (
            <div
              key={r.label}
              className="grid gap-1 py-3.5 sm:grid-cols-[200px_1fr] sm:gap-4"
            >
              <dt className="text-sm font-medium text-muted-foreground">{r.label}</dt>
              <dd className="text-sm font-medium text-foreground">{r.value}</dd>
            </div>
          ))}
        </dl>

        <div className="rounded-xl border border-brand-green/30 bg-brand-green-muted/60 px-5 py-4 text-center">
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-brand-green">
            <ShieldCheck className="size-4" />
            Le run sera créé avec le préfixe automatiquement ajouté :{' '}
            <span className="font-mono">DEMO_</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Aucune donnée réelle ne sera affectée.
          </p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Button
            variant="outline"
            size="lg"
            className="h-10 px-4"
            onClick={() => router.push('/configuration')}
          >
            Retour
          </Button>
          <Button size="lg" className="h-10 gap-2 px-5 font-semibold" onClick={handleLaunch}>
            <Play className="size-4" />
            Lancer la génération
          </Button>
        </div>
      </Card>
    </div>
  )
}
