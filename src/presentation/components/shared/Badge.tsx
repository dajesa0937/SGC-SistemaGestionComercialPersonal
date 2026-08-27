import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tono = 'neutro' | 'acento' | 'alerta'

const TONOS: Record<Tono, string> = {
  neutro: 'bg-superficie-alt text-suave',
  acento: 'bg-acento-suave text-acento-fuerte',
  alerta: 'bg-alerta-suave text-alerta',
}

export function Badge({
  tono = 'neutro',
  children,
  className,
}: {
  tono?: Tono
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
        TONOS[tono],
        className,
      )}
    >
      {children}
    </span>
  )
}
