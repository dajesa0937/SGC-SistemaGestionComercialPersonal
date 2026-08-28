import type { Periodo, Pesos } from '@/domain/shared/types'
import type { VentaMensual } from '@/domain/venta/venta.entity'
import type { Presupuesto } from '@/domain/presupuesto/presupuesto.entity'
import { anioDe, crearPeriodo } from '@/domain/shared/periodo'

export interface Cumplimiento {
  readonly vendido: Pesos
  readonly meta: Pesos
  /** Fracción: `0.784` es 78,4 %. `null` cuando no hay meta definida. */
  readonly cumplimiento: number | null
  /** Lo que falta para llegar a la meta. Cero si ya se superó. */
  readonly faltante: Pesos
  readonly hayMeta: boolean
}

export function sumarVentas(ventas: readonly VentaMensual[]): Pesos {
  return ventas.reduce((total, venta) => total + venta.valor, 0)
}

function metaDe(presupuestos: readonly Presupuesto[], periodos: readonly Periodo[]): Pesos {
  const buscados = new Set(periodos)
  return presupuestos
    .filter((p) => buscados.has(p.periodo))
    .reduce((total, p) => total + p.meta, 0)
}

/**
 * Cumplimiento de un periodo.
 *
 * Sin meta definida el cumplimiento es `null`, nunca cero ni infinito: mostrar
 * "0 %" cuando en realidad nadie asignó cuota es una mentira, y el usuario
 * tomaría decisiones sobre un dato inventado.
 */
export function calcularCumplimiento(
  ventas: readonly VentaMensual[],
  presupuestos: readonly Presupuesto[],
  periodo: Periodo,
): Cumplimiento {
  const vendido = sumarVentas(ventas.filter((v) => v.periodo === periodo))
  const meta = metaDe(presupuestos, [periodo])
  return construir(vendido, meta)
}

/** Cumplimiento acumulado del año hasta el periodo indicado, ambos incluidos. */
export function calcularAcumuladoAnual(
  ventas: readonly VentaMensual[],
  presupuestos: readonly Presupuesto[],
  periodo: Periodo,
): Cumplimiento {
  const anio = anioDe(periodo)
  const desde = crearPeriodo(anio, 1)

  const vendido = sumarVentas(ventas.filter((v) => v.periodo >= desde && v.periodo <= periodo))
  const meta = presupuestos
    .filter((p) => p.periodo >= desde && p.periodo <= periodo)
    .reduce((total, p) => total + p.meta, 0)

  return construir(vendido, meta)
}

/** Meta de los doce meses del año, definida o no. */
export function metaAnual(presupuestos: readonly Presupuesto[], anio: number): Pesos {
  const desde = crearPeriodo(anio, 1)
  const hasta = crearPeriodo(anio, 12)
  return presupuestos
    .filter((p) => p.periodo >= desde && p.periodo <= hasta)
    .reduce((total, p) => total + p.meta, 0)
}

function construir(vendido: Pesos, meta: Pesos): Cumplimiento {
  const hayMeta = meta > 0
  return {
    vendido,
    meta,
    hayMeta,
    cumplimiento: hayMeta ? vendido / meta : null,
    faltante: Math.max(0, meta - vendido),
  }
}

export type SemaforoCumplimiento = 'verde' | 'ambar' | 'rojo' | 'sin_meta'

/**
 * Color del semáforo.
 *
 * Es el único uso de verde, ámbar y rojo en toda la aplicación: reservarlos
 * para el cumplimiento hace que el color signifique siempre lo mismo.
 */
export function semaforo(
  cumplimiento: number | null,
  umbrales: { umbralVerde: number; umbralAmbar: number },
): SemaforoCumplimiento {
  if (cumplimiento === null) return 'sin_meta'
  if (cumplimiento >= umbrales.umbralVerde) return 'verde'
  if (cumplimiento >= umbrales.umbralAmbar) return 'ambar'
  return 'rojo'
}
