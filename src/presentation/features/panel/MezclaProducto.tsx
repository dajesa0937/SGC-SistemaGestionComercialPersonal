import type { ParticipacionMezcla } from '@/domain/venta/movimiento.entity'
import { Tarjeta } from '@/presentation/components/shared/Tarjeta'
import { formatearNumero, formatearPesos, formatearPorcentaje } from '@/lib/formato'

interface Props {
  mezcla: readonly ParticipacionMezcla[]
  titulo: string
  descripcion?: string
}

/**
 * Mezcla de producto (decision D-01).
 *
 * Barras horizontales y no un pastel: comparar longitudes desde una misma linea
 * base es preciso, comparar angulos no lo es, y con cinco categorias el pastel
 * ademas obliga a una leyenda para saber cual es cual.
 *
 * Cada barra lleva su nombre y su cifra al lado, asi que la identidad nunca
 * depende del color. El color es uno solo: aqui el color no distingue nada, la
 * posicion y la etiqueta ya lo hacen.
 */
export function MezclaProducto({ mezcla, titulo, descripcion }: Props) {
  if (mezcla.length === 0) return null

  const mayor = mezcla[0]?.valor ?? 0

  return (
    <Tarjeta>
      <div className="border-b border-borde-suave px-5 py-3">
        <h2 className="text-sm font-medium text-texto">{titulo}</h2>
        {descripcion ? <p className="mt-0.5 text-xs text-suave">{descripcion}</p> : null}
      </div>

      <ul className="flex flex-col gap-3 px-5 py-4">
        {mezcla.map((parte) => (
          <li key={parte.nombre}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="truncate text-sm text-texto">{parte.nombre}</span>
              <span className="shrink-0 text-sm text-suave">
                <span className="cifra font-medium text-texto">
                  {formatearPorcentaje(parte.participacion)}
                </span>
                <span className="cifra ml-2 text-xs text-tenue">
                  {formatearPesos(parte.valor)}
                </span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-superficie-alt">
              <div
                className="h-full rounded-full bg-acento"
                style={{ width: `${mayor === 0 ? 0 : (parte.valor / mayor) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-tenue">
              {formatearNumero(parte.unidades)} unidades · {formatearNumero(parte.lineas)}{' '}
              {parte.lineas === 1 ? 'línea' : 'líneas'}
            </p>
          </li>
        ))}
      </ul>
    </Tarjeta>
  )
}
