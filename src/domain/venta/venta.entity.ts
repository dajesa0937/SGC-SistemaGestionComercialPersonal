import type { Id, InstanteISO, Periodo, Pesos } from '../shared/types'

/**
 * Origen del registro de venta.
 *
 * `movimientos` significa que el valor NO se escribio: se derivo de las lineas
 * de factura. Distinguirlo importa porque un total derivado no se debe editar a
 * mano — se corrige corrigiendo sus movimientos.
 */
export type OrigenVenta = 'importacion' | 'manual' | 'movimientos'

/**
 * Venta agregada de un cliente en un periodo.
 *
 * Es el grano que consumen todos los indicadores. Durante el diseno se penso
 * que era tambien el unico grano disponible, porque el archivo que describia el
 * usuario llegaba agregado por cliente y mes. El archivo real resulto venir
 * linea a linea, asi que hoy hay dos caminos:
 *
 * - archivo agregado  -> se guarda directamente aqui (`origen: 'importacion'`)
 * - archivo detallado -> se guardan `MovimientoVenta` y este total se DERIVA
 *   de ellos (`origen: 'movimientos'`)
 *
 * En ningun caso hay dos fuentes de verdad para el mismo cliente y periodo.
 */
export interface VentaMensual {
  readonly id: Id
  readonly clienteId: Id
  readonly periodo: Periodo
  valor: Pesos
  unidades?: number
  origen: OrigenVenta
  importacionId?: Id
  actualizadoEn: InstanteISO
}

/** Venta lista para guardar, sin los campos que asigna el repositorio. */
export type NuevaVenta = Omit<VentaMensual, 'id' | 'actualizadoEn'>
