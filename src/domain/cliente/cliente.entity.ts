import type { FechaISO, Id, InstanteISO, Periodo, Pesos } from '../shared/types'
import type { CodigoMunicipio } from '../geografia/geografia'

/** Estado asignado a mano por el usuario. No confundir con `EstadoCliente`, que es derivado. */
export type EstadoManualCliente = 'prospecto' | 'cliente' | 'suspendido'

/**
 * Cliente del territorio.
 *
 * `identificacion` (NIT o cedula) es la clave de conciliacion con los archivos
 * de la empresa: los nombres cambian de un reporte a otro, el numero no. Es la
 * unica llave que resistio el cruce de los dos archivos reales.
 *
 * `codigo` queda como codigo interno opcional, para cuando el archivo trae uno
 * distinto de la identificacion.
 *
 * No hay campo `zona`: la zona se deduce del municipio a traves de las zonas
 * que el usuario define. Ver `domain/geografia/zona.entity.ts`.
 *
 * Los clientes nunca se eliminan, solo se archivan: borrarlos huerfanaria su
 * historico de ventas y corromperia todos los comparativos interanuales.
 */
export interface Cliente {
  readonly id: Id
  codigo: string
  nombre: string
  nombreComercial?: string
  /** NIT o cedula, solo digitos y sin digito de verificacion. Indice unico. */
  identificacion?: string
  /** Codigo DANE del municipio, cinco digitos. Ver `domain/geografia`. */
  municipio?: CodigoMunicipio
  direccion?: string
  telefono?: string
  email?: string
  contactoPrincipal?: string
  estadoManual: EstadoManualCliente
  archivado: boolean
  creadoEn: InstanteISO
  actualizadoEn: InstanteISO
}

/** Datos necesarios para dar de alta un cliente. */
export type NuevoCliente = Omit<Cliente, 'id' | 'creadoEn' | 'actualizadoEn' | 'archivado'> & {
  archivado?: boolean
}

/** Clasificacion por participacion en la facturacion (Pareto). Derivada, no persistida. */
export type ClasificacionABC = 'A' | 'B' | 'C' | 'SIN_HISTORIA'

/** Estado comercial derivado del comportamiento de compra. Derivado, no persistido. */
export type EstadoCliente = 'nuevo' | 'activo' | 'en_riesgo' | 'inactivo'

/**
 * Cliente con sus indicadores calculados.
 *
 * Los campos derivados NO se persisten: cambian con cada importacion y
 * guardarlos crearia dos fuentes de verdad que se desincronizan.
 */
export interface ClienteEnriquecido extends Cliente {
  /** Nombre del municipio, o el codigo si el catalogo no lo conoce. */
  readonly nombreMunicipio?: string
  readonly departamento?: string
  /** Zona a la que pertenece su municipio. `undefined` si ninguna lo cubre. */
  readonly zonaId?: Id
  readonly zona?: string
  readonly clasificacion: ClasificacionABC
  readonly estado: EstadoCliente
  readonly ventaPeriodo: Pesos
  readonly ventaAnio: Pesos
  readonly venta12Meses: Pesos
  readonly ultimaCompra?: Periodo
  readonly primeraCompra?: Periodo
  /** Variacion contra el periodo anterior. `0.15` significa +15 %. `null` si no hay base. */
  readonly variacionMesAnterior: number | null
  /** Variacion contra el mismo mes del ano anterior. `null` si no hay base. */
  readonly variacionAnioAnterior: number | null
  /** Serie de los ultimos 12 periodos, en orden cronologico. */
  readonly serie12Meses: readonly Pesos[]
}

/** Nota fechada asociada a un cliente. */
export interface NotaCliente {
  readonly id: Id
  readonly clienteId: Id
  fecha: FechaISO
  texto: string
  tipo: 'visita' | 'llamada' | 'general'
  creadoEn: InstanteISO
}

/**
 * Nombre alternativo con el que un cliente aparece en los archivos importados.
 *
 * Es la pieza que hace que el importador sobreviva al paso del tiempo: el
 * usuario resuelve un nombre desconocido una sola vez y queda resuelto siempre.
 */
export interface AliasCliente {
  readonly id: Id
  readonly clienteId: Id
  /** Texto normalizado con `normalizarParaConciliar`. */
  readonly textoOriginal: string
}
