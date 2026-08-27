import type { ClienteRepository } from './cliente/cliente.repository'
import type { VentaRepository } from './venta/venta.repository'
import type { PresupuestoRepository } from './presupuesto/presupuesto.repository'
import type { ImportacionRepository } from './importacion/importacion.repository'
import type { ConfiguracionRepository } from './config/configuracion.repository'

/**
 * Conjunto de repositorios que la aplicacion necesita.
 *
 * Vive en el dominio a proposito: la capa de presentacion depende de este
 * contrato y nunca de las clases concretas de `infrastructure/`. Sustituir
 * Dexie por un cliente HTTP en la fase 4 se reduce a proveer otra
 * implementacion de esta interfaz.
 */
export interface Repositorios {
  readonly clientes: ClienteRepository
  readonly ventas: VentaRepository
  readonly presupuestos: PresupuestoRepository
  readonly importaciones: ImportacionRepository
  readonly configuracion: ConfiguracionRepository
}
