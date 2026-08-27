import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const BASE =
  'h-9 w-full rounded-md border border-borde bg-superficie px-2.5 text-sm text-texto ' +
  'placeholder:text-tenue transition-colors duration-150 disabled:opacity-50'

interface EnvoltorioProps {
  etiqueta: string
  htmlFor: string
  error?: string
  ayuda?: string
  requerido?: boolean
  children: ReactNode
}

export function Campo({ etiqueta, htmlFor, error, ayuda, requerido, children }: EnvoltorioProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-texto">
        {etiqueta}
        {requerido ? (
          <span className="ml-0.5 text-alerta" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-peligro" role="alert">
          {error}
        </p>
      ) : ayuda ? (
        <p className="text-xs text-tenue">{ayuda}</p>
      ) : null}
    </div>
  )
}

export const Entrada = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Entrada({ className, ...resto }, ref) {
    return <input ref={ref} className={cn(BASE, className)} {...resto} />
  },
)

export const Seleccion = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Seleccion({ className, children, ...resto }, ref) {
    return (
      <select ref={ref} className={cn(BASE, 'cursor-pointer', className)} {...resto}>
        {children}
      </select>
    )
  },
)
