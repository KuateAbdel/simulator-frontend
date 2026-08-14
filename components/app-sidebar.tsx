'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LogIn,
  Play,
  SlidersHorizontal,
  BookOpen,
  ScrollText,
  Settings,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react'
import { FinzuuLogo } from '@/components/finzuu-logo'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  // segments considérés actifs pour ce lien
  match?: string[]
}

const NAV: NavItem[] = [
  { label: 'Connexion', href: '/login', icon: LogIn },
  {
    label: 'Runs',
    href: '/runs',
    icon: Play,
    match: ['/runs', '/execution', '/resultats'],
  },
  { label: 'Configuration', href: '/configuration', icon: SlidersHorizontal },
  { label: 'Catalogue', href: '/catalogue', icon: BookOpen },
  { label: 'Logs', href: '/logs', icon: ScrollText },
  { label: 'Paramètres', href: '/parametres', icon: Settings },
  { label: 'Aide', href: '/aide', icon: HelpCircle },
]

export function AppSidebar() {
  const pathname = usePathname()

  function isActive(item: NavItem) {
    const segments = item.match ?? [item.href]
    return segments.some((s) => pathname === s || pathname.startsWith(s + '/'))
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-6">
        <FinzuuLogo variant="dark" />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = isActive(item)
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-5 py-4 text-xs text-sidebar-foreground/60">v1.2.0</div>
    </aside>
  )
}
