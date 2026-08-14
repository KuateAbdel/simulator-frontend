import Image from 'next/image'
import { cn } from '@/lib/utils'

export function FinzuuLogo({
  variant = 'dark',
  className,
}: {
  variant?: 'dark' | 'light'
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="relative inline-flex size-9 items-center justify-center overflow-hidden rounded-lg bg-white">
        <Image
          src="/finzuu-icon.jpeg"
          alt="FinZuu"
          width={36}
          height={36}
          className="size-9 object-contain"
          priority
        />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'text-lg font-extrabold tracking-tight',
            variant === 'dark' ? 'text-white' : 'text-foreground',
          )}
        >
          FinZuu
        </span>
        <span
          className={cn(
            'text-[0.68rem] font-semibold tracking-[0.22em]',
            variant === 'dark' ? 'text-primary' : 'text-primary',
          )}
        >
          LOADER
        </span>
      </span>
    </div>
  )
}
