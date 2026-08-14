'use client'

import Link from 'next/link'
import { UserCog } from 'lucide-react'

export function AppTopbar() {
  return (
    <header className="flex h-14 items-center justify-end gap-2 border-b border-border bg-card px-6">
      <button
        type="button"
        aria-label="Compte utilisateur"
        className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:text-foreground"
      >
        <UserCog className="size-4" />
      </button>
      <Link
        href="/parametres"
        aria-label="Profil"
        className="inline-flex size-8 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground"
      >
        KY
      </Link>
    </header>
  )
}
