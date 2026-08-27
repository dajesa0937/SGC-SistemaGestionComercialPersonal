import type { Id, InstanteISO, Periodo } from '../shared/types'
import type { VentaMensual } from '../venta/venta.entity'

/**
 * Correspondencia entre las columnas del archivo y los campos del sistema.
 *
 * Las columnas se identifican por su letra o su encabezado, NUNCA por indice
 * posicional: es la mitigacion del riesgo R-01 (el formato del Excel cambia).
 */
export interface MapeoColumnas {
  hoja: string
  filaEncabezado: number
  colCodigo?: string
  colCliente: string
  colValor: string
  colPeriodo?: string
  colUnidades?: string
  colZona?: string
}

/** Registro de una importacion aplicada, con la informacion necesaria para revertirla. */
export interface Importacion {
  readonly id: Id
  readonly fecha: InstanteISO
  archivoNombre: string
  periodos: Periodo[]
  filasLeidas: number
  filasAplicadas: number
  filasConError: number
  clientesCreados: number
  mapeo: MapeoColumnas
  /** Estado previo de las ventas afectadas. Red de seguridad para deshacer. */
  snapshotAnterior: VentaMensual[]
  estado: 'aplicada' | 'revertida'
}

export type NuevaImportacion = Omit<Importacion, 'id' | 'fecha'>
