'use client'

import { Card, PageHeader } from '@/components/ui-bits'

const STEPS = [
  { n: 1, title: 'Connexion', desc: "L'utilisateur se connecte à Loader avec ses identifiants." },
  { n: 2, title: 'Configuration', desc: "Choisir l'environnement, le pays, les volumes et les options de génération." },
  { n: 3, title: 'Lancement', desc: 'Valider la configuration et lancer la génération des données.' },
  { n: 4, title: 'Exécution', desc: 'Suivre l\u2019avancement en temps réel des modules de génération.' },
  { n: 5, title: 'Résultats', desc: 'Consulter le résumé, les statistiques et les entités créées.' },
  { n: 6, title: 'Réinitialisation', desc: 'Nettoyer l\u2019environnement par run_id ou par préfixe DEMO_.' },
]

const PRINCIPLES = [
  { title: 'Sécurisé', desc: "Aucune donnée réelle n'est modifiée." },
  { title: 'Isolé', desc: 'Préfixe DEMO_ obligatoire. Environnements TEST/DEMO uniquement.' },
  { title: 'Respectueux', desc: "Ne supprime que ce qu'il a créé. Aucune écriture directe en base." },
  { title: 'Reproductible', desc: 'Même configuration = même résultat.' },
]

export default function AidePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Aide"
        description="Flow utilisateur et principes du Loader FinZuu."
      />

      <Card>
        <p className="mb-4 text-sm font-semibold text-foreground">Flow utilisateur</p>
        <ol className="space-y-3">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-3">
              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {s.n}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{s.title}</p>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <p className="mb-4 text-sm font-semibold text-foreground">Principes</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="rounded-xl border border-border p-4">
              <p className="text-sm font-semibold text-brand-green">{p.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
