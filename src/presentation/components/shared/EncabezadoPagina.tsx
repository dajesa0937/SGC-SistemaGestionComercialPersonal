import type { ReactNode } from 'react'

interface Props {
  titulo: string
  descripcion?: string
  acciones?: ReactNode
}

export function EncabezadoPagina({ titulo, descripcion, acciones }: Props) {
  return (
    // `no-imprimir`: si el usuario pulsa Ctrl+P estando en una pantalla, no
    // debe salir el encabezado de la aplicación encima del documento.
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 no-imprimir">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-texto">{titulo}</h1>
        {descripcion ? <p className="mt-1 text-sm text-suave">{descripcion}</p> : null}
      </div>
      {acciones ? <div className="flex items-center gap-2 no-imprimir">{acciones}</div> : null}
    </div>
  )
}
