import type { Periodo, Pesos } from '@/domain/shared/types'
import type { VentaMensual } from '@/domain/venta/venta.entity'
import type { Presupuesto } from '@/domain/presupuesto/presupuesto.entity'
import { formatearPeriodoCorto, ultimosPeriodos } from '@/domain/shared/periodo'

export interface PuntoSerie {
  readonly periodo: Periodo
  readonly etiqueta: string
  readonly vendido: Pesos
  readonly meta: Pesos | null
  readonly cumplimiento: number | null
}

/**
 * Serie de los últimos meses terminando en el periodo indicado.
 *
 * Los meses sin venta aparecen con cero y no se omiten: un hueco en la gráfica
 * se lee como "no hay dato", cuando la verdad suele ser "no se vendió".
 */
export function construirSerie12Meses(
  ventas: readonly VentaMensual[],
  presupuestos: readonly Presupuesto[],
  periodo: Periodo,
  meses = 12,
): PuntoSerie[] {
  const porPeriodo = new Map<Periodo, Pesos>()
  for (const venta of ventas) {
    porPeriodo.set(venta.periodo, (porPeriodo.get(venta.periodo) ?? 0) + venta.valor)
  }

  const metas = new Map(presupuestos.map((p) => [p.periodo, p.meta]))

  return ultimosPeriodos(periodo, meses).map((p) => {
    const vendido = porPeriodo.get(p) ?? 0
    const meta = metas.get(p) ?? null
    return {
      periodo: p,
      etiqueta: formatearPeriodoCorto(p),
      vendido,
      meta,
      cumplimiento: meta && meta > 0 ? vendido / meta : null,
    }
  })
}
