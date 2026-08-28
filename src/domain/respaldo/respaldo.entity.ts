import type { AliasCliente, Cliente, NotaCliente } from '../cliente/cliente.entity'
import type { VentaMensual } from '../venta/venta.entity'
import type { Presupuesto } from '../presupuesto/presupuesto.entity'
import type { Importacion } from '../importacion/importacion.entity'
import type { Zona } from '../geografia/zona.entity'
import type { InstanteISO } from '../shared/types'

/**
 * Version del formato de respaldo.
 *
 * Se incrementa solo si un cambio del modelo hace ilegibles los archivos
 * anteriores. Un respaldo que no se puede restaurar no es un respaldo.
 */
export const VERSION_RESPALDO = 2

export interface ContenidoRespaldo {
  readonly clientes: readonly Cliente[]
  readonly aliases: readonly AliasCliente[]
  readonly notas: readonly NotaCliente[]
  readonly ventas: readonly VentaMensual[]
  readonly presupuestos: readonly Presupuesto[]
  readonly importaciones: readonly Importacion[]
  readonly zonas: readonly Zona[]
  readonly configuracion: readonly { clave: string; valor: unknown }[]
}

export interface Respaldo {
  readonly aplicacion: 'sgc-personal'
  readonly version: number
  readonly generadoEn: InstanteISO
  readonly datos: ContenidoRespaldo
}

/** Cuántos registros trae un respaldo, para poder mostrarlo antes de restaurar. */
export interface ResumenRespaldo {
  readonly clientes: number
  readonly ventas: number
  readonly presupuestos: number
  readonly notas: number
  readonly periodos: number
  readonly generadoEn: InstanteISO
}
