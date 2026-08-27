import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { Pagina } from '@/lib/paginacion'

export interface ColumnaTabla<T> {
  readonly clave: string
  readonly encabezado: string
  readonly ordenable?: boolean
  readonly alineacion?: 'izquierda' | 'derecha'
  /** Oculta la columna al imprimir (acciones, controles). */
  readonly noImprimir?: boolean
  readonly render: (item: T) => ReactNode
  readonly ancho?: string
}

interface Props<T> {
  readonly columnas: readonly ColumnaTabla<T>[]
  readonly pagina: Pagina<T>
  readonly claveDe: (item: T) => string
  readonly onFila?: (item: T) => void
  readonly orden?: string
  readonly direccion?: 'asc' | 'desc'
  readonly onOrdenar?: (clave: string) => void
  readonly onCambiarPagina?: (pagina: number) => void
  readonly etiquetaItems?: string
}

/**
 * Tabla de datos con orden y paginacion.
 *
 * Sin virtualizacion a proposito: el territorio tiene menos de cien clientes y
 * virtualizar filas complicaria la impresion sin resolver ningun problema real.
 */
export function TablaDatos<T>({
  columnas,
  pagina,
  claveDe,
  onFila,
  orden,
  direccion,
  onOrdenar,
  onCambiarPagina,
  etiquetaItems = 'registros',
}: Props<T>) {
  return (
    <div className="overflow-hidden rounded-panel border border-borde bg-superficie">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-borde">
              {columnas.map((columna) => {
                const activa = orden === columna.clave
                const puedeOrdenar = Boolean(columna.ordenable && onOrdenar)
                const Flecha = direccion === 'desc' ? ArrowDown : ArrowUp

                return (
                  <th
                    key={columna.clave}
                    scope="col"
                    style={columna.ancho ? { width: columna.ancho } : undefined}
                    className={cn(
                      'px-3 py-2.5 text-xs font-medium tracking-wide text-tenue uppercase',
                      columna.alineacion === 'derecha' ? 'text-right' : 'text-left',
                      columna.noImprimir && 'no-imprimir',
                    )}
                  >
                    {puedeOrdenar ? (
                      <button
                        type="button"
                        onClick={() => onOrdenar?.(columna.clave)}
                        aria-sort={activa ? (direccion === 'desc' ? 'descending' : 'ascending') : 'none'}
                        className={cn(
                          // `uppercase` se repite aqui a proposito: el reset de
                          // Tailwind fuerza `text-transform: none` en los
                          // <button>, y sin esto los encabezados ordenables se
                          // verian en minuscula y los demas en mayuscula.
                          'inline-flex items-center gap-1 uppercase transition-colors duration-150 hover:text-texto',
                          activa && 'text-acento',
                        )}
                      >
                        {columna.encabezado}
                        {activa ? <Flecha className="size-3" aria-hidden="true" /> : null}
                      </button>
                    ) : (
                      columna.encabezado
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {pagina.items.map((item) => (
              <tr
                key={claveDe(item)}
                onClick={onFila ? () => onFila(item) : undefined}
                className={cn(
                  'border-b border-borde-suave last:border-b-0',
                  onFila && 'cursor-pointer transition-colors duration-150 hover:bg-superficie-alt',
                )}
              >
                {columnas.map((columna) => (
                  <td
                    key={columna.clave}
                    className={cn(
                      'px-3 py-2.5 text-texto',
                      columna.alineacion === 'derecha' && 'text-right cifra',
                      columna.noImprimir && 'no-imprimir',
                    )}
                  >
                    {columna.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-borde px-3 py-2">
        <p className="cifra text-xs text-tenue">
          {pagina.totalItems === 0
            ? `Sin ${etiquetaItems}`
            : `${pagina.desde}–${pagina.hasta} de ${pagina.totalItems} ${etiquetaItems}`}
        </p>

        {pagina.totalPaginas > 1 && onCambiarPagina ? (
          <div className="flex items-center gap-1 no-imprimir">
            <button
              type="button"
              aria-label="Página anterior"
              disabled={pagina.pagina <= 1}
              onClick={() => onCambiarPagina(pagina.pagina - 1)}
              className="flex size-7 items-center justify-center rounded text-tenue transition-colors duration-150 hover:bg-superficie-alt hover:text-texto disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <span className="cifra px-1 text-xs text-suave">
              {pagina.pagina} / {pagina.totalPaginas}
            </span>
            <button
              type="button"
              aria-label="Página siguiente"
              disabled={pagina.pagina >= pagina.totalPaginas}
              onClick={() => onCambiarPagina(pagina.pagina + 1)}
              className="flex size-7 items-center justify-center rounded text-tenue transition-colors duration-150 hover:bg-superficie-alt hover:text-texto disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
