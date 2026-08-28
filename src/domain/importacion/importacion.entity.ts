import type { Id, InstanteISO, Periodo } from '../shared/types'
import type { VentaMensual } from '../venta/venta.entity'
import type { MovimientoVenta } from '../venta/movimiento.entity'

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
  /** Columnas del archivo detallado, una fila por linea de factura. */
  colFecha?: string
  colIdentificacion?: string
  colMunicipio?: string
  colCategoria?: string
  colProducto?: string
  colValorUnitario?: string
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
  /**
   * Estado previo de los periodos afectados. Red de seguridad para deshacer.
   *
   * Se guardan los DOS granos. Guardar solo los totales dejaba, al deshacer,
   * meses con cifra de venta y sin ninguna linea detras: el cumplimiento seguia
   * saliendo y la mezcla de producto desaparecia. Dos verdades que no encajan.
   */
  snapshotAnterior: VentaMensual[]
  snapshotMovimientos?: MovimientoVenta[]
  estado: 'aplicada' | 'revertida'
}

export type NuevaImportacion = Omit<Importacion, 'id' | 'fecha'>
