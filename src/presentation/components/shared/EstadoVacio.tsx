import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  icono: LucideIcon
  titulo: string
  descripcion: string
  /** Todo estado vacio ofrece una accion: nunca se deja al usuario en un callejon sin salida. */
  accion?: ReactNode
}

export function EstadoVacio({ icono: Icono, titulo, descripcion, accion }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-panel border border-dashed border-borde bg-superficie px-6 py-16 text-center">
      <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-acento-suave">
        <Icono className="size-5 text-acento" aria-hidden="true" />
      </div>
      <h2 className="text-base font-medium text-texto">{titulo}</h2>
      <p className="mt-1 max-w-sm text-sm text-suave">{descripcion}</p>
      {accion ? <div className="mt-5">{accion}</div> : null}
    </div>
  )
}
