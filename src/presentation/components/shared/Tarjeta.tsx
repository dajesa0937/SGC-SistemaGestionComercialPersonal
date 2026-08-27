import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Tarjeta({ className, children, ...resto }: Props) {
  return (
    <div
      className={cn('rounded-panel border border-borde bg-superficie no-cortar', className)}
      {...resto}
    >
      {children}
    </div>
  )
}
