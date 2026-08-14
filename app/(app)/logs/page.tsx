'use client'

import { Card, PageHeader } from '@/components/ui-bits'

type Level = 'INFO' | 'OK' | 'WARN' | 'ERROR'

const LOGS: { time: string; level: Level; msg: string }[] = [
  { time: '00:00:01', level: 'INFO', msg: 'Démarrage du run RUN-2026-07-22-001 (env=TEST, préfixe=DEMO_)' },
  { time: '00:00:04', level: 'OK', msg: 'Référentiels chargés : 4 pays, 51 régions, 50 villes, 82 quartiers' },
  { time: '00:00:18', level: 'OK', msg: 'Companies créées : 15/15' },
  { time: '00:00:42', level: 'INFO', msg: 'Lenders : 12 locaux + 4 institutionnels en cours' },
  { time: '00:01:12', level: 'WARN', msg: 'Faker fintech4esg : latence élevée sur le lot clients (retry 1/3)' },
  { time: '00:02:05', level: 'OK', msg: 'Branches & Agences créées : 45 / 88' },
  { time: '00:03:33', level: 'INFO', msg: 'Simulation comportementale (v1.2) : profils de remboursement attribués' },
  { time: '00:05:20', level: 'OK', msg: 'Clients & Comptes : 2018 / 2018 injectés' },
  { time: '00:06:48', level: 'INFO', msg: 'Historique crédit en cours de génération…' },
]

const LEVEL_CLS: Record<Level, string> = {
  INFO: 'text-primary',
  OK: 'text-brand-green',
  WARN: 'text-amber-500',
  ERROR: 'text-destructive',
}

export default function LogsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Logs d'exécution"
        description="Journal détaillé du dernier run — RUN-2026-07-22-001."
      />
      <Card className="p-0">
        <div className="max-h-[70vh] overflow-auto rounded-2xl bg-sidebar p-4 font-mono text-xs leading-relaxed">
          {LOGS.map((l, i) => (
            <div key={i} className="flex gap-3 py-1">
              <span className="shrink-0 text-sidebar-foreground/50">{l.time}</span>
              <span className={'w-14 shrink-0 font-semibold ' + LEVEL_CLS[l.level]}>
                {l.level}
              </span>
              <span className="text-sidebar-foreground">{l.msg}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
