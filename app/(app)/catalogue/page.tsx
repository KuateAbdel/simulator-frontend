'use client'

import { Card, PageHeader } from '@/components/ui-bits'

const CREDIT_PRODUCTS = [
  { code: 'NANO', name: 'Nano', desc: 'Micro-crédit court terme', montant: '5 000 – 50 000 XOF', duree: '7 – 30 j' },
  { code: 'MACRO', name: 'Macro', desc: 'Crédit PME / commerçant', montant: '100 000 – 2 000 000 XOF', duree: '3 – 24 mois' },
  { code: 'BNPL', name: 'BNPL', desc: 'Paiement fractionné', montant: '10 000 – 300 000 XOF', duree: '1 – 4 échéances' },
  { code: 'READYTOGO', name: 'ReadyToGo', desc: 'Crédit équipement', montant: '50 000 – 1 000 000 XOF', duree: '6 – 18 mois' },
]

const COLLECT_PRODUCTS = [
  { code: 'CASH', name: 'Collecte Cash', desc: 'Collecte journalière de fonds' },
  { code: 'CASH_DAT', name: 'Cash DAT', desc: 'Dépôt à terme' },
  { code: 'PRODUCT', name: 'Collecte Produit', desc: 'Collecte contre paiement (plastique, etc.)' },
]

export default function CataloguePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Catalogue produits"
        description="Produits de crédit et de collecte utilisés pour la génération de données."
      />

      <Card>
        <p className="mb-4 text-sm font-semibold text-foreground">Produits Crédit</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {CREDIT_PRODUCTS.map((p) => (
            <div key={p.code} className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">{p.name}</span>
                <span className="rounded-md bg-accent px-2 py-0.5 font-mono text-xs font-medium text-accent-foreground">
                  {p.code}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Montant</dt>
                  <dd className="font-medium text-foreground">{p.montant}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Durée</dt>
                  <dd className="font-medium text-foreground">{p.duree}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="mb-4 text-sm font-semibold text-foreground">Produits Collecte</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {COLLECT_PRODUCTS.map((p) => (
            <div key={p.code} className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">{p.name}</span>
                <span className="rounded-md bg-accent px-2 py-0.5 font-mono text-xs font-medium text-accent-foreground">
                  {p.code}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
