'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, PageHeader, Toggle } from '@/components/ui-bits'
import { useLoader } from '@/components/loader-store'
import {
  COUNTRIES,
  type CountryCode,
  type Environment,
} from '@/lib/finzuu'

const PERIOD_OPTIONS = [90, 180, 365]

const VOLUME_FIELDS: { key: keyof ReturnType<typeof volumesShape>; label: string; hint?: string }[] = [
  { key: 'companies', label: 'Companies' },
  { key: 'lenders', label: 'Lenders', hint: '16 (12 locaux + 4 inst.)' },
  { key: 'kiosques', label: 'Kiosques' },
  { key: 'personnel', label: 'Personnel' },
  { key: 'clients', label: 'Clients' },
]

function volumesShape() {
  return {} as {
    companies: string
    lenders: string
    kiosques: string
    personnel: string
    clients: string
  }
}

export default function ConfigurationPage() {
  const router = useRouter()
  const { config, setConfig } = useLoader()
  const [addOpen, setAddOpen] = useState(false)

  const selected = config.countries
  const available = COUNTRIES.filter((c) => !selected.includes(c.code))

  function toggleCountry(code: CountryCode, add: boolean) {
    setConfig((prev) => ({
      ...prev,
      countries: add
        ? [...prev.countries, code]
        : prev.countries.filter((c) => c !== code),
    }))
    setAddOpen(false)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Nouvelle configuration" />

      <Card className="space-y-6">
        {/* Environnement */}
        <Field label="Environnement">
          <div className="relative">
            <select
              value={config.environment}
              onChange={(e) =>
                setConfig((p) => ({ ...p, environment: e.target.value as Environment }))
              }
              className="h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-10 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
            >
              <option value="TEST">TEST</option>
              <option value="DEMO">DEMO</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </Field>

        {/* Pays */}
        <Field label="Pays">
          <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-lg border border-input bg-background px-2.5 py-2">
            {selected.map((code) => {
              const name = COUNTRIES.find((c) => c.code === code)?.name ?? code
              return (
                <span
                  key={code}
                  className="inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-sm font-medium text-accent-foreground"
                >
                  {name}
                  <button
                    type="button"
                    aria-label={`Retirer ${name}`}
                    onClick={() => toggleCountry(code, false)}
                    className="text-accent-foreground/70 transition hover:text-accent-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              )
            })}

            {available.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAddOpen((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  <Plus className="size-3.5" /> Ajouter
                </button>
                {addOpen && (
                  <div className="absolute left-0 top-full z-10 mt-1 w-52 rounded-lg border border-border bg-popover p-1 shadow-lg">
                    {available.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => toggleCountry(c.code, true)}
                        className="block w-full rounded-md px-2.5 py-1.5 text-left text-sm text-popover-foreground transition hover:bg-accent"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Field>

        {/* Période */}
        <Field label="Période de simulation">
          <div className="relative">
            <select
              value={config.periodDays}
              onChange={(e) =>
                setConfig((p) => ({ ...p, periodDays: Number(e.target.value) }))
              }
              className="h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-10 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
            >
              {PERIOD_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d} jours
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </Field>

        {/* Volumes */}
        <div>
          <p className="mb-3 text-sm font-semibold text-foreground">Volumes à générer</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {VOLUME_FIELDS.map((f) => (
              <div
                key={f.key}
                className="rounded-xl border border-border bg-secondary/40 p-4 text-center"
              >
                <p className="text-xs font-medium text-muted-foreground">{f.label}</p>
                {f.hint ? (
                  <p className="mt-0.5 text-[0.65rem] leading-tight text-muted-foreground/70">
                    {f.hint}
                  </p>
                ) : null}
                <p className="mt-2 text-base font-bold text-primary">
                  {config.volumes[f.key]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Options avancées */}
        <div>
          <p className="mb-3 text-sm font-semibold text-foreground">Options avancées</p>
          <div className="divide-y divide-border rounded-xl border border-border">
            <OptionRow
              label="Inclure historique crédit"
              checked={config.options.historiqueCredit}
              onChange={(v) =>
                setConfig((p) => ({ ...p, options: { ...p.options, historiqueCredit: v } }))
              }
            />
            <OptionRow
              label="Inclure vie financière (180 jours)"
              checked={config.options.vieFinanciere}
              onChange={(v) =>
                setConfig((p) => ({ ...p, options: { ...p.options, vieFinanciere: v } }))
              }
            />
            <OptionRow
              label="Simulation comportementale (v1.2)"
              checked={config.options.simulationComportementale}
              onChange={(v) =>
                setConfig((p) => ({
                  ...p,
                  options: { ...p.options, simulationComportementale: v },
                }))
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" size="lg" className="h-10 px-4" onClick={() => router.push('/login')}>
            Annuler
          </Button>
          <Button size="lg" className="h-10 px-5 font-semibold" onClick={() => router.push('/runs')}>
            Suivant
          </Button>
        </div>
      </Card>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-4">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div>{children}</div>
    </div>
  )
}

function OptionRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-foreground">{label}</span>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  )
}
