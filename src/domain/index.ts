/**
 * Punto de entrada publico de la capa de dominio.
 *
 * Esta capa no importa nada del exterior: ni React, ni Dexie, ni librerias de
 * terceros. Es la unica forma de garantizar que la logica de negocio pueda
 * migrar de IndexedDB a SQLite y luego a PostgreSQL sin reescribirse.
 */
export * from './shared/types'
export * from './shared/errores'
export * from './shared/periodo'
export * from './cliente/cliente.entity'
export type { ClienteRepository } from './cliente/cliente.repository'
export * from './venta/venta.entity'
export type { VentaRepository } from './venta/venta.repository'
export * from './presupuesto/presupuesto.entity'
export type { PresupuestoRepository } from './presupuesto/presupuesto.repository'
export * from './importacion/importacion.entity'
export type { ImportacionRepository } from './importacion/importacion.repository'
export * from './config/configuracion.entity'
export type { ConfiguracionRepository } from './config/configuracion.repository'
export type { Repositorios } from './repositorios'
