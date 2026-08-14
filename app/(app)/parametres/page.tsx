'use client'

import { useState } from 'react'
import { Card, PageHeader, Toggle } from '@/components/ui-bits'

export default function ParametresPage() {
  const [apiUrl, setApiUrl] = useState('https://loader.fintech4esg.com')
  const [fakerUrl, setFakerUrl] = useState('https://api.fintech4esg.com/faker')
  const [safeMode, setSafeMode] = useState(true)
  const [autoPrefix, setAutoPrefix] = useState(true)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Paramètres"
        description="Configuration de connexion aux services. Backend non actif — valeurs mock."
      />

      <Card className="space-y-5">
        <p className="text-sm font-semibold text-foreground">Connexions</p>
        <UrlField label="URL du Loader" value={apiUrl} onChange={setApiUrl} />
        <UrlField label="API Faker fintech4esg" value={fakerUrl} onChange={setFakerUrl} />
      </Card>

      <Card className="space-y-1 divide-y divide-border">
        <p className="pb-3 text-sm font-semibold text-foreground">Sécurité des générations</p>
        <Row
          label="Mode sécurisé (TEST / DEMO uniquement)"
          checked={safeMode}
          onChange={setSafeMode}
        />
        <Row
          label="Préfixe DEMO_ automatique"
          checked={autoPrefix}
          onChange={setAutoPrefix}
        />
      </Card>
    </div>
  )
}

function UrlField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
      />
    </div>
  )
}

function Row({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-foreground">{label}</span>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  )
}
