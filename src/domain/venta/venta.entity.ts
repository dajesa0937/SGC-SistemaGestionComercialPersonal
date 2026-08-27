import type { Id, InstanteISO, Periodo, Pesos } from '../shared/types'

/** Origen del registro de venta. */
export type OrigenVenta = 'importacion' | 'manual'

/**
 * Venta agregada de un cliente en un periodo.
 *
 * El grano es exactamente el del archivo que envia la empresa: cliente x mes.
 * Modelar un grano mas fino seria inventar datos que no existen.
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
