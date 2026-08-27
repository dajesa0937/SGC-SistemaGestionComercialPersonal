import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variante = 'primario' | 'secundario' | 'fantasma'
type Tamano = 'sm' | 'md'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamano?: Tamano
  children: ReactNode
}

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-acento text-acento-contraste hover:opacity-90',
  secundario: 'bg-superficie text-texto border border-borde hover:bg-superficie-alt',
  fantasma: 'text-suave hover:bg-superficie-alt hover:text-texto',
}

const TAMANOS: Record<Tamano, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
}

export function Boton({
  variante = 'secundario',
  tamano = 'md',
  className,
  children,
  ...resto
}: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium',
        'transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50',
        VARIANTES[variante],
        TAMANOS[tamano],
        className,
      )}
      {...resto}
    >
      {children}
    </button>
  )
}
