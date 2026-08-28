import type { ClienteRepository } from './cliente/cliente.repository'
import type { VentaRepository } from './venta/venta.repository'
import type { MovimientoRepository } from './venta/movimiento.repository'
import type { PresupuestoRepository } from './presupuesto/presupuesto.repository'
import type { ImportacionRepository } from './importacion/importacion.repository'
import type { ConfiguracionRepository } from './config/configuracion.repository'
import type { RespaldoRepository } from './respaldo/respaldo.repository'
import type { ZonaRepository } from './geografia/zona.repository'

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
  readonly movimientos: MovimientoRepository
  readonly presupuestos: PresupuestoRepository
  readonly importaciones: ImportacionRepository
  readonly zonas: ZonaRepository
  readonly configuracion: ConfiguracionRepository
  readonly respaldo: RespaldoRepository
}
