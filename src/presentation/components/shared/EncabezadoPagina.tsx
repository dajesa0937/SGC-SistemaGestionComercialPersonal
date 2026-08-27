import type { ReactNode } from 'react'

interface Props {
  titulo: string
  descripcion?: string
  acciones?: ReactNode
}

export function EncabezadoPagina({ titulo, descripcion, acciones }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-texto">{titulo}</h1>
        {descripcion ? <p className="mt-1 text-sm text-suave">{descripcion}</p> : null}
      </div>
      {acciones ? <div className="flex items-center gap-2 no-imprimir">{acciones}</div> : null}
    </div>
  )
}
