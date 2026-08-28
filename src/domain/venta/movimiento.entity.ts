import type { FechaISO, Id, InstanteISO, Periodo, Pesos } from '../shared/types'

/**
 * Linea de venta individual: una fila de factura.
 *
 * Es el grano fino que el archivo de ventas real trae — fecha, producto,
 * cantidad y valor — y es lo unico que permite calcular la mezcla de producto
 * (decision D-01), el indicador por el que evaluan al usuario.
 *
 * Convive con `VentaMensual`, que NO se guarda dos veces: cuando hay
 * movimientos de un cliente en un periodo, su total mensual se **deriva** de
 * ellos. Ver `agregarMovimientos`.
 */
export interface MovimientoVenta {
  readonly id: Id
  readonly clienteId: Id
  /** Fecha del documento, `YYYY-MM-DD`. */
  readonly fecha: FechaISO
  /** `YYYY-MM` derivado de la fecha. Se guarda porque es el indice de consulta. */
  readonly periodo: Periodo
  categoria?: string
  producto?: string
  cantidad?: number
  valorUnitario?: Pesos
  valor: Pesos
  importacionId?: Id
  actualizadoEn: InstanteISO
}

export type NuevoMovimiento = Omit<MovimientoVenta, 'id' | 'actualizadoEn'>

/** Total por cliente y periodo derivado de los movimientos. */
export interface TotalDerivado {
  readonly clienteId: Id
  readonly periodo: Periodo
  readonly valor: Pesos
  readonly unidades: number
}

/**
 * Agrega movimientos a totales por cliente y periodo.
 *
 * Esta funcion es la que evita la doble verdad: el total mensual nunca se
 * escribe a mano cuando hay movimientos detras, se calcula aqui.
 */
export function agregarMovimientos(
  movimientos: readonly NuevoMovimiento[],
): readonly TotalDerivado[] {
  const acumulado = new Map<string, { clienteId: Id; periodo: Periodo; valor: Pesos; unidades: number }>()

  for (const movimiento of movimientos) {
    const clave = `${movimiento.clienteId}|${movimiento.periodo}`
    const actual = acumulado.get(clave)
    if (actual) {
      actual.valor += movimiento.valor
      actual.unidades += movimiento.cantidad ?? 0
    } else {
      acumulado.set(clave, {
        clienteId: movimiento.clienteId,
        periodo: movimiento.periodo,
        valor: movimiento.valor,
        unidades: movimiento.cantidad ?? 0,
      })
    }
  }

  return [...acumulado.values()]
}

/** Participacion de una categoria o producto en la facturacion. */
export interface ParticipacionMezcla {
  readonly nombre: string
  readonly valor: Pesos
  readonly unidades: number
  readonly lineas: number
  /** Fraccion del total. `0.32` significa 32 %. */
  readonly participacion: number
}

/**
 * Mezcla de producto: cuanto pesa cada categoria (o producto) en la venta.
 *
 * Es el indicador D-01. Estuvo bloqueado mientras el unico dato disponible era
 * el total por cliente y mes; con movimientos, se calcula.
 *
 * Los movimientos sin categoria se agrupan bajo `sinCategoria` en vez de
 * descartarse: un archivo al que le falte la columna no debe hacer que la suma
 * de la mezcla deje de coincidir con la venta total.
 */
export function calcularMezcla(
  movimientos: readonly MovimientoVenta[],
  dimension: 'categoria' | 'producto' = 'categoria',
  sinCategoria = 'Sin clasificar',
): readonly ParticipacionMezcla[] {
  const acumulado = new Map<string, { valor: Pesos; unidades: number; lineas: number }>()
  let total = 0

  for (const movimiento of movimientos) {
    const nombre = (movimiento[dimension] ?? '').trim() || sinCategoria
    const actual = acumulado.get(nombre) ?? { valor: 0, unidades: 0, lineas: 0 }
    actual.valor += movimiento.valor
    actual.unidades += movimiento.cantidad ?? 0
    actual.lineas += 1
    acumulado.set(nombre, actual)
    total += movimiento.valor
  }

  return [...acumulado.entries()]
    .map(([nombre, d]) => ({
      nombre,
      valor: d.valor,
      unidades: d.unidades,
      lineas: d.lineas,
      participacion: total === 0 ? 0 : d.valor / total,
    }))
    .sort((a, b) => b.valor - a.valor || a.nombre.localeCompare(b.nombre, 'es-CO'))
}
